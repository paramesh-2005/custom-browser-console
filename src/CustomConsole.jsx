import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

export default function CustomConsole() {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const socket = useRef(null);
  const [connected, setConnected] = useState(false);
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("8080");

  useEffect(() => {
    term.current = new Terminal();
    term.current.open(terminalRef.current);
    term.current.writeln("🔌 Custom Browser Console");
  }, []);

  const connect = () => {
    socket.current = new WebSocket(`ws://${host}:${port}`);

    socket.current.onopen = () => {
      setConnected(true);
      term.current.writeln("\r\n Connected to WebSocket Proxy");
    };

    socket.current.onmessage = (e) => {
      term.current.write(e.data);
    };

    socket.current.onerror = (e) => {
      term.current.writeln("\r\n WebSocket Error");
    };

    socket.current.onclose = () => {
      setConnected(false);
      term.current.writeln("\r\n Connection closed");
    };

    term.current.onData((data) => {
      if (connected && socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(data);
      }
    });
  };

  return (
    <div className="p-4">
      <div className="mb-2 flex gap-2">
        <input value={host} onChange={(e) => setHost(e.target.value)} className="border p-1" placeholder="Host" />
        <input value={port} onChange={(e) => setPort(e.target.value)} className="border p-1" placeholder="Port" />
        <button onClick={connect} className="bg-green-500 text-white px-4 py-1 rounded">Connect</button>
      </div>
      <div ref={terminalRef} style={{ height: "400px", width: "100%", background: "#000" }} />
    </div>
  );
}

