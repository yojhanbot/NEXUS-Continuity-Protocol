const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Estado global para persistencia
let currentNexusState = {
    url: null,
    time: 0,
    type: 'video',
    playing: false
};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('NEXUS: Dispositivo vinculado ->', socket.id);

    if (currentNexusState.url) {
        socket.emit('receive-flick', currentNexusState);
    }

    socket.on('flick-data', (payload) => {
        currentNexusState = { ...payload, playing: true };
        socket.broadcast.emit('receive-flick', payload);
    });

    socket.on('video-control', (data) => {
        if (data.time !== undefined) currentNexusState.time = data.time;
        socket.broadcast.emit('sync-control', data);
    });

    socket.on('disconnect', () => {
        console.log('NEXUS: Dispositivo desconectado');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXUS ACTIVO en puerto ${PORT}`);
});