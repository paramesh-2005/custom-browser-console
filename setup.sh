#!/bin/bash

# Custom Browser Console Setup Script

echo "🔌 Setting up Custom Browser Console..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

echo "Node.js and npm are installed."

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "Frontend dependencies installed successfully."
else
    echo "Failed to install frontend dependencies."
    exit 1
fi

# Create proxy directory
echo "Creating WebSocket proxy directory..."
mkdir -p websocket-proxy
cd websocket-proxy

# Initialize proxy project
echo "Initializing WebSocket proxy project..."
npm init -y

# Install proxy dependencies
echo "Installing proxy dependencies..."
npm install ws net

if [ $? -eq 0 ]; then
    echo "Proxy dependencies installed successfully."
else
    echo "Failed to install proxy dependencies."
    exit 1
fi

# Create proxy.js file
echo "Creating proxy.js file..."
cat > proxy.js << 'EOF'
const WebSocket = require('ws');
const net = require('net');

const WS_PORT = 8080; // WebSocket server port
const TCP_HOST = 'localhost'; // Default TCP target host
const TCP_PORT = 9000; // Default TCP target port

const wss = new WebSocket.Server({ port: WS_PORT });

console.log(`WebSocket proxy server started on ws://localhost:${WS_PORT}`);

wss.on('connection', ws => {
    console.log('WebSocket client connected');

    let tcpSocket = new net.Socket();

    tcpSocket.connect(TCP_PORT, TCP_HOST, () => {
        console.log(`Connected to TCP server: ${TCP_HOST}:${TCP_PORT}`);
        ws.send('Connected to TCP server.\r\n');
    });

    tcpSocket.on('data', data => {
        ws.send(data.toString());
    });

    tcpSocket.on('close', () => {
        console.log('TCP connection closed');
        ws.send('TCP connection closed.\r\n');
        ws.close();
    });

    tcpSocket.on('error', err => {
        console.error('TCP Error:', err.message);
        ws.send(`TCP Error: ${err.message}\r\n`);
        ws.close();
    });

    ws.on('message', message => {
        console.log('Received from WebSocket:', message.toString());
        tcpSocket.write(message.toString());
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        tcpSocket.destroy(); // Close TCP connection when WebSocket closes
    });

    ws.on('error', err => {
        console.error('WebSocket Error:', err.message);
        tcpSocket.destroy();
    });
});
EOF

cd ..

echo "Setup completed successfully!"
echo ""
echo "To run the project:"
echo "1. Start the WebSocket proxy: cd websocket-proxy && node proxy.js"
echo "2. In another terminal, start the frontend: npm start"
echo "3. Test with netcat: netcat -l -p 9000"
echo ""
echo "The frontend will be available at http://localhost:3000"
echo "The WebSocket proxy will be running on ws://localhost:8080"

