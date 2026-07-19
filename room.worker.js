import { defineRoom } from '@parti/worker-sdk';

// 八条获胜连线（行、列、对角）。常量放模块顶层即可，不进入 state。
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function findWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a], line: [a, b, c] };
    }
  }
  return null;
}

export default defineRoom({
  meta: { name: '井字棋', minPlayers: 2, maxPlayers: 2 },

  initialState() {
    return {
      phase: 'waiting',            // waiting | playing | finished
      board: Array(9).fill(null),  // 每格 null | 'X' | 'O'
      players: {},                 // id -> { name, mark: 'X'|'O'|null }
      seats: { X: null, O: null }, // 座位 -> playerId
      turn: 'X',
      winner: null,                // null | 'X' | 'O' | 'draw'
      winLine: null,               // null | [a,b,c]
    };
  },

  onJoin(ctx, player) {
    let mark = null;
    if (!ctx.state.seats.X) {
      ctx.state.seats.X = player.id;
      mark = 'X';
    } else if (!ctx.state.seats.O) {
      ctx.state.seats.O = player.id;
      mark = 'O';
    }
    ctx.state.players[player.id] = { name: player.name, mark };

    // 只告诉该玩家自己执什么子
    ctx.send(player.id, 'seat:assigned', { mark });

    // 两个座位都坐满即开局
    if (ctx.state.seats.X && ctx.state.seats.O && ctx.state.phase === 'waiting') {
      ctx.state.phase = 'playing';
      ctx.state.turn = 'X';
      ctx.broadcast('game:start', {});
    }
  },

  onLeave(ctx, player) {
    const p = ctx.state.players[player.id];
    if (p && p.mark && ctx.state.seats[p.mark] === player.id) {
      ctx.state.seats[p.mark] = null;
    }
    delete ctx.state.players[player.id];
    if (ctx.state.phase === 'playing') {
      ctx.state.phase = 'waiting'; // 对手离开，回到等待
    }
  },

  actions: {
    // payload: { cell: 0..8 }
    mark(ctx, { player, payload }) {
      if (ctx.state.phase !== 'playing') return;
      const me = ctx.state.players[player.id];
      if (!me || !me.mark) return;            // 观众不能落子
      if (me.mark !== ctx.state.turn) return; // 不是你的回合

      const cell = Number(payload && payload.cell);
      if (!Number.isInteger(cell) || cell < 0 || cell > 8) return;
      if (ctx.state.board[cell] !== null) return; // 该格已被占

      ctx.state.board[cell] = me.mark;

      const win = findWinner(ctx.state.board);
      if (win) {
        ctx.state.phase = 'finished';
        ctx.state.winner = win.mark;
        ctx.state.winLine = win.line;
        ctx.broadcast('game:over', { winner: win.mark, line: win.line });
        return;
      }

      if (ctx.state.board.every((c) => c !== null)) {
        ctx.state.phase = 'finished';
        ctx.state.winner = 'draw';
        ctx.broadcast('game:over', { winner: 'draw' });
        return;
      }

      ctx.state.turn = ctx.state.turn === 'X' ? 'O' : 'X';
    },

    restart(ctx) {
      ctx.state.board = Array(9).fill(null);
      ctx.state.turn = 'X';
      ctx.state.winner = null;
      ctx.state.winLine = null;
      ctx.state.phase =
        ctx.state.seats.X && ctx.state.seats.O ? 'playing' : 'waiting';
      ctx.broadcast('game:reset', {});
    },
  },
});
