import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProveedores = async (req: Request, res: Response) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      include: {
        productos: true 
      }
    });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

export const createProveedor = async (req: Request, res: Response) => {
  try {
    // 1. Recibimos los datos (incluyendo el nuevo leadTime)
    const { 
      nombre, 
      pais, 
      ejecutivo, 
      email, 
      telefono,
      direccion,
      ciudad,
      website,
      notas,
      leadTime 
    } = req.body;

    // 2. Guardamos en la base de datos
    const nuevoProveedor = await prisma.proveedor.create({
      data: {
        nombre,
        pais,
        ejecutivo,
        email,
        telefono,
        direccion,
        ciudad,
        website,
        notas,
        // Convertimos a número por seguridad, si no viene ponemos 0
        leadTime: Number(leadTime) || 0 
      },
    });
    
    res.json(nuevoProveedor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

// --- AGREGAMOS LA FUNCIÓN DE UPDATE QUE FALTABA ---
export const updateProveedor = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { 
        nombre, 
        pais, 
        ejecutivo, 
        email, 
        telefono,
        direccion,
        ciudad,
        website,
        notas,
        leadTime // <--- Nuevo dato
      } = req.body;
  
      const proveedorActualizado = await prisma.proveedor.update({
        where: { id: Number(id) },
        data: {
          nombre,
          pais,
          ejecutivo,
          email,
          telefono,
          direccion,
          ciudad,
          website,
          notas,
          leadTime: Number(leadTime) || 0
        },
      });
  
      res.json(proveedorActualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
  };

export const deleteProveedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.proveedor.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};