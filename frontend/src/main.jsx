import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './workspace.css';
import './workspace-effects.css';
import './auth.css';
import './typography.css';
import './auth-motion.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
