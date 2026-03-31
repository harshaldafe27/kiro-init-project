const jwt = require('jsonwebtoken');
const {
    JWT_ACCESS_SECRET
} = require('../config/env');

const initSocket = (io) => {
    io.on('connection', (socket) => {
        const auth = socket.handshake.auth || {};
        const query = socket.handshake.query || {};
        const token = auth.token || query.token;
        if (!token) return socket.disconnect(true);
        try {
            const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
            if (decoded.role === 'student') socket.join('student-room');
            else if (decoded.role === 'admin') socket.join('admin-' + decoded._id);
            else if (decoded.role === 'principal') socket.join('principal-room');
        } catch (_) {
            socket.disconnect(true);
        }
    });
};

const emitToRoom = (io, room, event, data) => io.to(room).emit(event, data);

module.exports = {
    initSocket,
    emitToRoom
};