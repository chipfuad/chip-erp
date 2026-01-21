import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear proveedor
export const createProveedor = async (req: Request, res: Response) => {
  try {
    const { nombre, pais, direccion, ejecutivo, email, telefono } = req.body;
    const nuevo = await prisma.proveedor.create({
      data: { nombre, pais, direccion, ejecutivo, email, telefono }
    });
    res.json({ message: "Proveedor registrado", proveedor: nuevo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear proveedor" });
  }
};

// Listar proveedores (para el formulario de productos)
export const getProveedores = async (req: Request, res: Response) => {
  try {
    const lista = await prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } });
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
};