import React from 'react';
import CustomConsole from './CustomConsole';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-3xl font-bold mb-4">Custom Browser Console</h1>
        <p className="text-lg mb-6">TCP Web Client Console</p>
      </header>
      <main>
        <CustomConsole />
      </main>
    </div>
  );
}

export default App;

