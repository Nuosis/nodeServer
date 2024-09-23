const WebSocket = require('ws');

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            console.log('Received:', message);
            // Broadcast message to all connected clients
            wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
            });
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
}

module.exports = setupWebSocketServer;
