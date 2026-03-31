const http = require('http');
const app = require('./app');
const {
    initFirebase
} = require('./config/firebase');
const {
    PORT,
    CLIENT_URL
} = require('./config/env');
const {
    setIO
} = require('./sockets/index');
const {
    initSocket
} = require('./sockets/socket.handler');

// Initialize Firebase Firestore (replaces MongoDB)
initFirebase();

const server = http.createServer(app);

const io = require('socket.io')(server, {
    cors: {
        origin: CLIENT_URL,
        credentials: true
    },
});

setIO(io);
initSocket(io);

server.listen(PORT, () => console.log('Server running on port ' + PORT));