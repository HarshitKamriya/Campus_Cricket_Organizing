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
      socket.join(`match:${matchId}`);
      console.log(`${socket.id} joined match:${matchId}`);
    });

    // Leave a match room
    socket.on('match:leave', (matchId) => {
      socket.leave(`match:${matchId}`);
      console.log(`${socket.id} left match:${matchId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
