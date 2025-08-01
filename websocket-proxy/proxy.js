const WebSocket = require('ws');
const net = require('net');

const WS_PORT = process.env.WS_PORT || 8080; // WebSocket server port
const TCP_HOST = process.env.TCP_HOST || 'localhost'; // Default TCP target host
const TCP_PORT = process.env.TCP_PORT || 9000; // Default TCP target port

const wss = new WebSocket.Server({ 
    port: WS_PORT,
    host: '0.0.0.0' // Listen on all interfaces for deployment
});

console.log(` WebSocket proxy server started on ws://0.0.0.0:${WS_PORT}`);
console.log(` Default TCP target: ${TCP_HOST}:${TCP_PORT}`);

wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(` WebSocket client connected from ${clientIP}`);

    let tcpSocket = null;
    let isConnected = false;

    // Function to connect to TCP server
    const connectToTCP = (host = TCP_HOST, port = TCP_PORT) => {
        tcpSocket = new net.Socket();
        
        tcpSocket.connect(port, host, () => {
            isConnected = true;
            console.log(` Connected to TCP server: ${host}:${port}`);
            ws.send(` Connected to TCP server: ${host}:${port}\r\n`);
        });

        tcpSocket.on('data', data => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data.toString());
            }
        });

        tcpSocket.on('close', () => {
            isConnected = false;
            console.log(' TCP connection closed');
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(' TCP connection closed\r\n');
            }
        });

        tcpSocket.on('error', err => {
            isConnected = false;
            console.error(' TCP Error:', err.message);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(` TCP Error: ${err.message}\r\n`);
            }
        });

        tcpSocket.on('timeout', () => {
            isConnected = false;
            console.log(' TCP connection timeout');
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(' TCP connection timeout\r\n');
            }
            tcpSocket.destroy();
        });
    };

    // Initial connection
    connectToTCP();

    ws.on('message', message => {
        const messageStr = message.toString();
        console.log(' Received from WebSocket:', messageStr.trim());

        // Check for special commands
        if (messageStr.startsWith('/connect ')) {
            const parts = messageStr.split(' ');
            if (parts.length >= 3) {
                const newHost = parts[1];
                const newPort = parseInt(parts[2]);
                
                if (tcpSocket) {
                    tcpSocket.destroy();
                }
                
                ws.send(` Connecting to ${newHost}:${newPort}...\r\n`);
                connectToTCP(newHost, newPort);
                return;
            } else {
                ws.send(' Usage: /connect <host> <port>\r\n');
                return;
            }
        }

        if (messageStr.startsWith('/disconnect')) {
            if (tcpSocket) {
                tcpSocket.destroy();
                ws.send('🔌 Disconnected from TCP server\r\n');
            }
            return;
        }

        if (messageStr.startsWith('/status')) {
            const status = isConnected ? 'Connected' : 'Disconnected';
            ws.send(`Status: ${status}\r\n`);
            return;
        }

        if (messageStr.startsWith('/help')) {
            ws.send(' Available commands:\r\n');
            ws.send('  /connect <host> <port> - Connect to TCP server\r\n');
            ws.send('  /disconnect - Disconnect from TCP server\r\n');
            ws.send('  /status - Show connection status\r\n');
            ws.send('  /help - Show this help\r\n');
            return;
        }

        // Forward message to TCP server if connected
        if (isConnected && tcpSocket && tcpSocket.readyState === 'open') {
            tcpSocket.write(messageStr);
        } else {
            ws.send('Not connected to TCP server. Use /connect <host> <port>\r\n');
        }
    });

    ws.on('close', () => {
        console.log(`📱 WebSocket client disconnected from ${clientIP}`);
        if (tcpSocket) {
            tcpSocket.destroy();
        }
    });

    ws.on('error', err => {
        console.error('WebSocket Error:', err.message);
        if (tcpSocket) {
            tcpSocket.destroy();
        }
    });

    // Send welcome message
    ws.send('Custom Browser Console - WebSocket Proxy\r\n');
    ws.send('Type /help for available commands\r\n');
});

// Handle server errors
wss.on('error', err => {
    console.error('WebSocket Server Error:', err.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down WebSocket proxy server...');
    wss.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down...');
    wss.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

