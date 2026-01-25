import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

// Configuraciones básicas
app.use(cors()); 
app.use(express.json());

// --- RUTAS (La parte que responde a las peticiones) ---

// 1. Ruta para probar que el servidor vive
app.get('/', (req, res) => {
  res.send('¡Hola! El servidor Chip ERP está funcionando 🚀');
});

// --- PRODUCTOS ---

// Obtener productos
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { id: 'desc' } // Muestra los más nuevos primero
    });
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Crear producto
app.post('/api/productos', async (req, res) => {
  try {
    const { sku, nombre, precioFOB, gramaje, paisOrigen, cantidadPorCaja, cantidadPorDisplay, moneda, proveedorId } = req.body;
    
    const nuevoProducto = await prisma.producto.create({
      data: {
        sku,
        nombre,
        precioFOB: Number(precioFOB),
        gramaje,
        paisOrigen,
        cantidadPorCaja: Number(cantidadPorCaja),
        cantidadPorDisplay: Number(cantidadPorDisplay) || 0,
        moneda: moneda || 'USD',
        proveedorId: Number(proveedorId) || 0
      },
    });
    res.json(nuevoProducto);
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Editar producto
app.put('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, nombre, precioFOB, gramaje, paisOrigen, cantidadPorCaja, cantidadPorDisplay, moneda, proveedorId } = req.body;
    
    const productoActualizado = await prisma.producto.update({
      where: { id: Number(id) },
      data: {
        sku,
        nombre,
        precioFOB: Number(precioFOB),
        gramaje,
        paisOrigen,
        cantidadPorCaja: Number(cantidadPorCaja),
        cantidadPorDisplay: Number(cantidadPorDisplay) || 0,
        moneda: moneda || 'USD',
        proveedorId: Number(proveedorId) || 0
      },
    });
    res.json(productoActualizado);
  } catch (error) {
    console.error("Error al actualizar:", error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.producto.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar:", error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// --- PROVEEDORES (AHORA EN BASE DE DATOS REAL) ---

// Obtener proveedores
app.get('/api/proveedores', async (req, res) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json(proveedores);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Crear proveedor
app.post('/api/proveedores', async (req, res) => {
  try {
    const { nombre, pais, ejecutivo, email, telefono } = req.body;
    const nuevoProveedor = await prisma.proveedor.create({
      data: {
        nombre,
        pais,
        ejecutivo: ejecutivo || '',
        email: email || '',
        telefono: telefono || ''
      }
    });
    res.json(nuevoProveedor);
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    res.status(500).json({ error: 'Error al guardar proveedor' });
  }
});

// Editar proveedor
app.put('/api/proveedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, pais, ejecutivo, email, telefono } = req.body;
    const proveedorActualizado = await prisma.proveedor.update({
      where: { id: Number(id) },
      data: {
        nombre,
        pais,
        ejecutivo: ejecutivo || '',
        email: email || '',
        telefono: telefono || ''
      }
    });
    res.json(proveedorActualizado);
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

// Eliminar proveedor
app.delete('/api/proveedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.proveedor.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

// --- ENCENDER EL MOTOR ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor listo y escuchando en puerto ${PORT}`);
});