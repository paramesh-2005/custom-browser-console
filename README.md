# Custom Browser Console using TCP Web Clients

##  Objective
To develop a browser-based console that enables real-time communication with backend systems via TCP using a WebSocket-to-TCP proxy. This console provides a terminal-like interface within the browser, tailored for developers, admins, or network operators.



##  Target Audience
- DevOps engineers and system administrators
- Network engineers and penetration testers
- Developers managing TCP services
- IoT device integrators



##  System Architecture

```
+---------------------+      WebSocket      +---------------------+     TCP/IP     +------------------------+
|     Web Browser     |<------------------->|  WebSocket Proxy    |<------------->|    TCP Server / Device  |
|  (React + xterm.js) |                    | (Node.js or Go)     |               |                        |
+---------------------+                    +---------------------+               +------------------------+
```

- **Frontend Console UI**: A terminal-like interface built with xterm.js and React.
- **WebSocket Proxy**: Listens for WebSocket messages and forwards them as raw TCP packets to backend servers.
- **TCP Backends**: Can be any TCP-compatible services (e.g., Telnet-like echo server, Redis, IoT devices).



##  Components and Modules

### A. Frontend (Browser)
- **xterm.js**: Terminal emulation
- **React**: UI structure and state management
- **WebSocket client**: To send/receive TCP data

**Features:**
- Command input
- Output logging with timestamps
- Connection management (host, port)
- Theme customization (dark/light)
- Command history & shortcuts

### B. WebSocket-to-TCP Proxy (Middleware)
- Written in Node.js or Go
- Accepts WebSocket connections
- Opens TCP connections to target hosts/ports
- Pipes messages bidirectionally
- Handles timeout, connection errors, and malformed data

### C. TCP Server / Services
- Test with:
  - Echo server (netcat -l -p 9000)
  - Custom TCP protocol services



##  Security Considerations
- WebSocket authentication (JWT or session tokens)
- CORS enforcement on WebSocket proxy
- TLS encryption between browser ↔ proxy
- Whitelist of allowable TCP hosts/ports
- Rate limiting and input sanitization



##  Technologies Used

| Layer           | Technology               |
|-----------------|--------------------------|
| UI              | React, Tailwind CSS      |
| Terminal        | xterm.js                 |
| WebSocket Proxy | Node.js / Go             |
| Protocol        | JSON or raw strings      |
| Deployment      | Docker, Nginx, PM2       |



##  Performance Enhancements
- Stream buffering for large data over TCP
- Connection pooling and reuse
- Message batching and compression
- Lazy-loading logs in terminal



##  Data Flow
- User opens browser console and connects to the proxy
- WebSocket session opens and initiates a TCP connection
- Commands entered in terminal → JSON frame → WebSocket
- Proxy forwards the message to TCP server
- TCP server response → WebSocket → terminal output



##  Testing Plan
- Simulate TCP servers using netcat
- Use Wireshark to monitor frame translation
- Unit tests for proxy (e.g., broken pipes, reconnections)
- UI tests with Cypress or Playwright



##  Future Enhancements
- Multi-tab TCP sessions
- SFTP-like file browsing over TCP
- Logs archive/download
- Syntax-aware commands with plugins



##  How to Use It

### Frontend Setup

1.  **Navigate to the project directory:**
    ```bash
    cd custom-browser-console
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the React development server:**
    ```bash
    npm start
    ```
    This will open the Custom Browser Console in your default web browser (usually at `http://localhost:3000`).

### WebSocket-to-TCP Proxy Setup (Node.js Example)

Since the original prompt mentioned Node.js or Go for the proxy, here's a basic Node.js example. You'll need to create a separate project for this.

1.  **Create a new directory for the proxy and navigate into it:**
    ```bash
    mkdir websocket-proxy
    cd websocket-proxy
    ```

2.  **Initialize a new Node.js project:**
    ```bash
    npm init -y
    ```

3.  **Install necessary packages:**
    ```bash
    npm install ws net
    ```

4.  **Create a file named `proxy.js` (or similar) and add the following code:**
    ```javascript
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
    ```

5.  **Run the proxy server:**
    ```bash
    node proxy.js
    ```

    **Note:** Ensure the `host` and `port` in `CustomConsole.jsx` match the `TCP_HOST` and `TCP_PORT` in your `proxy.js` (or the actual TCP server you intend to connect to). The `ws://localhost:9000` in `CustomConsole.jsx` refers to the WebSocket proxy, not the final TCP server. You might need to adjust the `ws://${host}:${port}` in `CustomConsole.jsx` to point to your proxy's WebSocket port (e.g., `ws://localhost:8080`).

### Testing with an Echo Server

To test the setup, you can use `netcat` as a simple TCP echo server:

1.  **Open a new terminal and run:**
    ```bash
    netcat -l -p 9000
    ```
    This will start an echo server on port 9000. Ensure this port matches the `TCP_PORT` in your `proxy.js`.

Now, when you type in the browser console, the data will go through the WebSocket proxy to the `netcat` server, which will echo it back to the console.



##  Docker Deployment

### Using Docker Compose (Recommended)

1.  **Build and start all services:**
    ```bash
    docker-compose up --build
    ```

2.  **Access the application:**
    - Frontend: http://localhost:3000
    - WebSocket Proxy: ws://localhost:8080
    - Echo Server (for testing): localhost:9000

3.  **Stop all services:**
    ```bash
    docker-compose down
    ```

### Manual Docker Build

#### Frontend
```bash
docker build -t custom-browser-console-frontend .
docker run -p 3000:3000 custom-browser-console-frontend
```

#### WebSocket Proxy
```bash
cd websocket-proxy
docker build -t websocket-tcp-proxy .
docker run -p 8080:8080 websocket-tcp-proxy
```


##  Prerequisites

### For Local Development
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### For Docker Deployment
- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)

### For Testing
- **netcat** (for creating test TCP servers)
  - Linux/macOS: Usually pre-installed
  - Windows: Use WSL or install via package manager


##  Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Clone or extract the project
cd custom-browser-console

# Run the setup script
./setup.sh

# Start the proxy (in one terminal)
cd websocket-proxy && npm start

# Start the frontend (in another terminal)
npm start

# Test with echo server (in a third terminal)
netcat -l -p 9000
```

### Option 2: Docker (Easiest)
```bash
# Clone or extract the project
cd custom-browser-console

# Start everything with Docker
docker-compose up --build
```

### Option 3: Manual Setup
```bash
# Frontend setup
npm install
npm start

# Proxy setup (in another terminal)
cd websocket-proxy
npm install
npm start

# Test server (in a third terminal)
netcat -l -p 9000
```


##  Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Ensure the WebSocket proxy is running on port 8080
- Check if the host and port in the frontend match the proxy settings
- Verify firewall settings allow connections on port 8080

#### TCP Connection Failed
- Ensure the target TCP server is running and accessible
- Check if the TCP host and port are correct
- Use `/connect <host> <port>` command to connect to different servers

#### Frontend Not Loading
- Ensure Node.js and npm are installed
- Run `npm install` to install dependencies
- Check if port 3000 is available

#### Permission Denied on setup.sh
```bash
chmod +x setup.sh
```

### Debug Commands

#### Check if services are running
```bash
# Check if proxy is running
netstat -an | grep 8080

# Check if frontend is running
netstat -an | grep 3000

# Check if test server is running
netstat -an | grep 9000
```

#### Test WebSocket connection manually
```bash
# Install wscat for testing
npm install -g wscat

# Test WebSocket connection
wscat -c ws://localhost:8080
```


##  Project Structure

```
custom-browser-console/
├── src/                          # React frontend source
│   ├── CustomConsole.jsx         # Main console component
│   ├── App.js                    # Main App component
│   ├── App.css                   # App styles
│   ├── index.js                  # React entry point
│   └── index.css                 # Global styles
├── public/                       # Public assets
│   └── index.html                # HTML template
├── websocket-proxy/              # WebSocket-to-TCP proxy
│   ├── proxy.js                  # Main proxy server
│   ├── package.json              # Proxy dependencies
│   ├── Dockerfile                # Proxy Docker config
│   └── README.md                 # Proxy documentation
├── package.json                  # Frontend dependencies
├── tailwind.config.js            # Tailwind CSS config
├── Dockerfile                    # Frontend Docker config
├── docker-compose.yml            # Multi-service Docker config
├── setup.sh                      # Automated setup script
├── frontend-requirements.txt     # Frontend dependencies list
└── README.md                     # This file
```


##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the LICENSE file for details.

##  Acknowledgments

- [xterm.js](https://xtermjs.org/) for the terminal emulation
- [React](https://reactjs.org/) for the frontend framework
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) for real-time communication
- [Node.js](https://nodejs.org/) for the proxy server

---

**Happy coding!**

