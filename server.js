// Asegúrate de tener instalado: npm install multer path express socket.io
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // Permite archivos de hasta 100MB
});

// Configuración de almacenamiento con nombres normalizados
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.static('public'));

// Estado Global de NEXUS (Single Source of Truth)
let nexusCoreState = {
    resource: null, // URL del archivo
    mimetype: null, // Tipo real (image/png, application/pdf, etc)
    timestamp: 0,
    senderId: null
};

// Endpoint de Carga Universal
app.post('/upload', upload.single('archivo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    
    // Normalización de la respuesta
    const data = {
        url: `/uploads/${req.file.filename}`,
        mimetype: req.file.mimetype
    };
    res.json(data);
});

io.on('connection', (socket) => {
    // Sincronización inmediata al conectar
    if (nexusCoreState.resource) {
        socket.emit('nexus-sync', nexusCoreState);
    }

    socket.on('nexus-dispatch', (payload) => {
        nexusCoreState = {
            resource: payload.url,
            mimetype: payload.mimetype,
            timestamp: payload.time || 0,
            senderId: socket.id
        };
        // Difusión total incluyendo al emisor para confirmar estado
        io.emit('nexus-sync', nexusCoreState);
    });

    socket.on('ping', (cb) => { if(cb) cb(); });
});

server.listen(3000, '0.0.0.0', () => {
    console.log("NEXUS CORE: Protocolo de Continuidad iniciado en puerto 3000");
});