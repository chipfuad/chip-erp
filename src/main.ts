import express from 'express';
import cors from 'cors';
import productosRoutes from './modules/productos/productos.routes';
import proveedoresRoutes from './modules/proveedores/proveedores.routes';

const app = express();

app.use(cors());
app.use(express.json());

// --- Rutas ---
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes); // ¡Nueva ruta!

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor COMEX listo en http://localhost:${PORT}`);
  console.log(`📡 Rutas activas: /api/productos y /api/proveedores`);
});