# WebSocket-to-TCP Proxy

This is the WebSocket-to-TCP proxy server for the Custom Browser Console project.

## Features

- WebSocket to TCP connection bridging
- Dynamic TCP server connection via commands
- Connection status monitoring
- Error handling and reconnection
- Support for multiple concurrent WebSocket clients
- Built-in command system

## Available Commands

- `/connect <host> <port>` - Connect to a specific TCP server
- `/disconnect` - Disconnect from current TCP server
- `/status` - Show current connection status
- `/help` - Show available commands

## Environment Variables

- `WS_PORT` - WebSocket server port (default: 8080)
- `TCP_HOST` - Default TCP target host (default: localhost)
- `TCP_PORT` - Default TCP target port (default: 9000)

## Installation

```bash
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### With custom settings
```bash
WS_PORT=8080 TCP_HOST=192.168.1.100 TCP_PORT=23 npm start
```

## Testing

You can test the proxy with a simple TCP echo server:

```bash
# Terminal 1: Start echo server
netcat -l -p 9000

# Terminal 2: Start proxy
npm start

# Terminal 3: Test with WebSocket client or use the browser console
```

