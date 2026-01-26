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
      orderBy: { id: 'desc' }
    });
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// CREAR PRODUCTO
app.post('/api/productos', async (req, res) => {
  try {
    // Agregamos 'duracion' a la lista de cosas que recibimos
    const { sku, nombre, precioFOB, gramaje, paisOrigen, cantidadPorCaja, cantidadPorDisplay, moneda, proveedorId, duracion } = req.body;
    
    const nuevo = await prisma.producto.create({
      data: {
        sku,
        nombre,
        precioFOB,
        gramaje,
        paisOrigen,
        cantidadPorCaja: Number(cantidadPorCaja),
        cantidadPorDisplay: Number(cantidadPorDisplay),
        moneda,
        duracion, // <--- ¡AQUÍ SE GUARDA!
        proveedorId: Number(proveedorId)
      }
    });
    res.json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando producto' });
  }
});

// EDITAR PRODUCTO
app.put('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Aquí también agregamos 'duracion'
    const { sku, nombre, precioFOB, gramaje, paisOrigen, cantidadPorCaja, cantidadPorDisplay, moneda, proveedorId, duracion } = req.body;

    const actualizado = await prisma.producto.update({
      where: { id: Number(id) },
      data: {
        sku,
        nombre,
        precioFOB,
        gramaje,
        paisOrigen,
        cantidadPorCaja: Number(cantidadPorCaja),
        cantidadPorDisplay: Number(cantidadPorDisplay),
        moneda,
        duracion, // <--- ¡AQUÍ SE ACTUALIZA!
        proveedorId: Number(proveedorId)
      }
    });
    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando producto' });
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

// --- PROVEEDORES (ACTUALIZADO CON NUEVOS CAMPOS) ---

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
    // AQUÍ AGREGAMOS LOS NUEVOS CAMPOS
    const { nombre, pais, ejecutivo, email, telefono, direccion, ciudad, website, notas } = req.body;
    
    const nuevoProveedor = await prisma.proveedor.create({
      data: {
        nombre,
        pais,
        ejecutivo: ejecutivo || '',
        email: email || '',
        telefono: telefono || '',
        // Campos nuevos
        direccion: direccion || '',
        ciudad: ciudad || '',
        website: website || '',
        notas: notas || ''
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
    // AQUÍ AGREGAMOS LOS NUEVOS CAMPOS PARA QUE SE GUARDEN AL EDITAR
    const { nombre, pais, ejecutivo, email, telefono, direccion, ciudad, website, notas } = req.body;
    
    const proveedorActualizado = await prisma.proveedor.update({
      where: { id: Number(id) },
      data: {
        nombre,
        pais,
        ejecutivo: ejecutivo || '',
        email: email || '',
        telefono: telefono || '',
        // Campos nuevos
        direccion: direccion || '',
        ciudad: ciudad || '',
        website: website || '',
        notas: notas || ''
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