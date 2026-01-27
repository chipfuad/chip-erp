import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'        // Ahora son vecinos, ruta corta
import './index.css'           // Ahora son vecinos, ruta corta

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)