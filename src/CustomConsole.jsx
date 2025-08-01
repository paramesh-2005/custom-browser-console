import React, { useEffect, useRef, useState } from 'react';

const CustomConsole = () => {
  const terminalRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [wsUrl, setWsUrl] = useState('ws://localhost:8080');
  const [tcpHost, setTcpHost] = useState('localhost');
  const [tcpPort, setTcpPort] = useState('9000');
  const [output, setOutput] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [ws, setWs] = useState(null);
  const outputEndRef = useRef(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const addToOutput = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, { text, type, timestamp }]);
  };

  const reconnectTCP = () => {
    if (!ws) return;
    
    addToOutput(` Reconnecting to ${tcpHost}:${tcpPort}...`, 'info');
    
    // Send new TCP connection request
    const connectMsg = JSON.stringify({
      action: 'reconnect',
      host: tcpHost,
      port: parseInt(tcpPort)
    });
    ws.send(connectMsg);
  };

  const connectWebSocket = () => {
    if (ws) {
      ws.close();
    }

    try {
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        setIsConnected(true);
        addToOutput(' Connected to WebSocket Proxy', 'success');
        setWs(websocket);
        
        // Send TCP connection request
        const connectMsg = JSON.stringify({
          action: 'connect',
          host: tcpHost,
          port: parseInt(tcpPort)
        });
        websocket.send(connectMsg);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            addToOutput(` Connected to TCP server: ${tcpHost}:${tcpPort}`, 'success');
          } else if (data.type === 'data') {
            addToOutput(data.message, 'response');
          } else if (data.type === 'error') {
            addToOutput(` TCP Error: ${data.message}`, 'error');
          } else if (data.type === 'closed') {
            addToOutput(' TCP connection closed', 'warning');
          }
        } catch (e) {
          // If not JSON, treat as plain text response
          addToOutput(event.data, 'response');
        }
      };

      websocket.onerror = (error) => {
        addToOutput(` WebSocket Error: ${error.message || 'Connection failed'}`, 'error');
        setIsConnected(false);
      };

      websocket.onclose = () => {
        addToOutput(' Connection closed', 'warning');
        setIsConnected(false);
        setWs(null);
      };

    } catch (error) {
      addToOutput(` Connection Error: ${error.message}`, 'error');
    }
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
    }
    setIsConnected(false);
    setWs(null);
  };

  const sendCommand = () => {
    if (!ws || !currentInput.trim()) return;

    // Add command to output
    addToOutput(`> ${currentInput}`, 'command');

    // Handle special commands
    if (currentInput.trim() === '/help') {
      addToOutput(` Available commands:
- /help - Show this help
- /clear - Clear terminal
- /disconnect - Disconnect from server
- /reconnect - Reconnect to current host:port
- /connect <host> <port> - Switch to different server
- Any other text will be sent to the TCP server`, 'info');
    } else if (currentInput.trim() === '/clear') {
      setOutput([]);
            } else if (currentInput.trim() === '/reconnect') {
          reconnectTCP();
        } else if (currentInput.startsWith('/connect ')) {
          const parts = currentInput.trim().split(' ');
          if (parts.length === 3) {
            const [, newHost, newPort] = parts;
            setTcpHost(newHost);
            setTcpPort(newPort);
            addToOutput(` Switching to ${newHost}:${newPort}...`, 'info');
            setTimeout(() => reconnectTCP(), 100);
          } else {
            addToOutput('Usage: /connect <host> <port>', 'error');
          }
        } else if (currentInput.trim() === '/disconnect') {
      disconnect();
    } else {
      // Send to TCP server via WebSocket
      try {
        const message = JSON.stringify({
          action: 'send',
          data: currentInput
        });
        ws.send(message);
      } catch (error) {
        addToOutput(` Send Error: ${error.message}`, 'error');
      }
    }

    setCurrentInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendCommand();
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'command': return 'text-blue-400';
      case 'response': return 'text-white';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
      {/* Connection Controls */}
      <div className="bg-gray-700 p-4 border-b border-gray-600">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">WebSocket URL:</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              disabled={isConnected}
              className="px-3 py-1 bg-gray-600 text-white rounded border focus:outline-none focus:border-green-400 disabled:opacity-50"
              placeholder="ws://localhost:8080"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">TCP Host:</label>
            <input
              type="text"
              value={tcpHost}
              onChange={(e) => setTcpHost(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && isConnected && reconnectTCP()}
              className="px-3 py-1 bg-gray-600 text-white rounded border focus:outline-none focus:border-green-400 w-32"
              placeholder="localhost"
              title={isConnected ? "Press Enter to reconnect with new host" : "Enter TCP host"}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Port:</label>
            <input
              type="text"
              value={tcpPort}
              onChange={(e) => setTcpPort(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && isConnected && reconnectTCP()}
              className="px-3 py-1 bg-gray-600 text-white rounded border focus:outline-none focus:border-green-400 w-20"
              placeholder="9000"
              title={isConnected ? "Press Enter to reconnect with new port" : "Enter TCP port"}
            />
          </div>
          
          <button
            onClick={isConnected ? disconnect : connectWebSocket}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              isConnected
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
          
          {isConnected && (
            <button
              onClick={reconnectTCP}
              className="px-4 py-2 rounded font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              title="Reconnect to TCP server with current host/port"
            >
              Reconnect
            </button>
          )}
          
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="bg-black p-4 h-80 overflow-y-auto font-mono text-sm"
        style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
      >
        {/* Welcome Message */}
        {output.length === 0 && (
          <div className="text-green-400 mb-2">
            <div> Custom Browser Console</div>
            <div className="text-gray-400">Type /help for available commands</div>
          </div>
        )}

        {/* Output Lines */}
        {output.map((line, index) => (
          <div key={index} className={`mb-1 ${getTypeColor(line.type)}`}>
            <span className="text-gray-500 text-xs mr-2">[{line.timestamp}]</span>
            <span className="whitespace-pre-wrap">{line.text}</span>
          </div>
        ))}

        {/* Input Line */}
        {isConnected && (
          <div className="flex items-center mt-2">
            <span className="text-green-400 mr-2">{'>'}</span>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent text-white outline-none font-mono"
              placeholder="Enter command..."
              autoFocus
            />
          </div>
        )}

        <div ref={outputEndRef} />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-700 px-4 py-2 text-xs text-gray-400 border-t border-gray-600">
        <div className="flex justify-between items-center">
          <span>Terminal ready • Press Enter to send commands</span>
          <span>{output.length} lines</span>
        </div>
      </div>
    </div>
  );
};

  export default CustomConsole;
