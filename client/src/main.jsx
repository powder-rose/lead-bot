import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { BrowserRouter } from 'react-router-dom';

import './index.css';

import App from './App.jsx';
import { SessionGate } from './components/Session/SessionGate.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionGate>
        <App />
      </SessionGate>
    </BrowserRouter>
  </StrictMode>,
);
