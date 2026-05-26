/**
 * Sets up Socket.IO event handlers.
 * Actual event emission happens from controllers via req.app.get('io').
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 */
module.exports = function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a match room for real-time score updates
    socket.on('match:join', (matchId) => {
      const room = `match:${matchId}`;
      socket.join(room);
      console.log(`${socket.id} joined ${room}`);
      // Acknowledge the join so the client knows it succeeded
      socket.emit('match:joined', { matchId, room });
    });

    // Leave a match room
    socket.on('match:leave', (matchId) => {
      const room = `match:${matchId}`;
      socket.leave(room);
      console.log(`${socket.id} left ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
