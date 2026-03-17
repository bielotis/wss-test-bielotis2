const WebSocket = require('ws');

// Render asigna el puerto mediante la variable de entorno PORT
const port = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port }, () => {
    console.log(`Servidor WebSocket corriendo en el puerto ${port}`);
});

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');
    
    ws.on('message', (message) => {
        console.log(`Recibido: ${message}`);
        ws.send(`Hola, recibí tu mensaje: ${message}`);
    });

    ws.send('¡Conectado exitosamente al servidor de Render!');
});
