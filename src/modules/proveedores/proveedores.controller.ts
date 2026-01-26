import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProveedores = async (req: Request, res: Response) => {
  try {
    const lista = await prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } });
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
};

export const createProveedor = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log("📥 CREANDO proveedor:", data); // <--- Chivato 1
    
    const nuevo = await prisma.proveedor.create({
      data: {
        nombre: data.nombre,
        pais: data.pais,
        ejecutivo: data.ejecutivo,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        ciudad: data.ciudad,
        website: data.website,
        notas: data.notas
      }
    });
    res.json(nuevo);
  } catch (error) {
    console.error("❌ Error creando:", error);
    res.status(500).json({ error: "Error al crear" });
  }
};

export const updateProveedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    console.log(`📝 EDITANDO id ${id}. Datos recibidos:`, data); // <--- Chivato 2 (Aquí deberías ver "Shanghai")

    const actualizado = await prisma.proveedor.update({
      where: { id: Number(id) },
      data: {
        nombre: data.nombre,
        pais: data.pais,
        ejecutivo: data.ejecutivo,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        ciudad: data.ciudad,
        website: data.website,
        notas: data.notas
      }
    });
    res.json(actualizado);
  } catch (error) {
    console.error("❌ Error editando:", error);
    res.status(500).json({ error: "Error al editar" });
  }
};

export const deleteProveedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.proveedor.delete({ where: { id: Number(id) } });
    res.json({ message: "Eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar" });
  }
};