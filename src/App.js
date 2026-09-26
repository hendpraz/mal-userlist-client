import React from "react";
import { Link } from "react-router-dom";
import "./App.css";
import Routes from "./Routes";

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <Link className="app-logo" to="/"><span>✦</span> ANIMATCH</Link>
        <nav aria-label="Main navigation">
          <a href="/#compare">Compare</a>
          <a href="/#how-it-works">How it works</a>
        </nav>
        <a className="header-cta" href="/#compare">Start matching <span>↗</span></a>
      </header>
      <Routes />
    </div>
  );
}

export default App;
