import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

// Configuraciones básicas
app.use(cors()); // Permite que React (puerto 5173) hable con Node (puerto 3000)
app.use(express.json());

// --- RUTAS (La parte que responde a las peticiones) ---

// 1. Ruta para probar que el servidor vive
app.get('/', (req, res) => {
  res.send('¡Hola! El servidor Chip ERP está funcionando 🚀');
});

// 2. Ruta para obtener los productos (la que usará tu tabla)
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await prisma.producto.findMany();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// 3. Ruta para crear un nuevo producto
app.post('/api/productos', async (req, res) => {
  try {
    const { sku, nombre, precioFOB, gramaje, paisOrigen, cantidadPorCaja } = req.body;
    const nuevoProducto = await prisma.producto.create({
      data: {
        sku,
        nombre,
        precioFOB: Number(precioFOB),
        gramaje,
        paisOrigen,
        cantidadPorCaja: Number(cantidadPorCaja),
      },
    });
    res.json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// 4. Ruta para eliminar un producto
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.producto.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// --- ENCENDER EL MOTOR ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});