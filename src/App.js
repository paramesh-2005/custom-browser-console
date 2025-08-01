import React from 'react';
import CustomConsole from './CustomConsole';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-green-400 mb-2">
          Custom Browser Console
        </h1>
        <p className="text-lg text-gray-300">
          A terminal-style TCP client over WebSocket
        </p>
      </header>

      <main className="w-full max-w-4xl">
        <CustomConsole />
      </main>

      <footer className="mt-10 text-sm text-gray-500 text-center">
        Built by Parameshwaran
      </footer>
    </div>
  );
}

export default App;
