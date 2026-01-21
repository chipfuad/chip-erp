import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Crear producto
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { 
      sku, nombre, gramaje, cantidadPorCaja, 
      cantidadPorDisplay, precioFOB, paisOrigen, proveedorId 
    } = req.body;

    if (!sku || !nombre) {
      return res.status(400).json({ error: "Faltan datos obligatorios (SKU o Nombre)" });
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        sku,
        nombre,
        gramaje,
        paisOrigen,
        cantidadPorCaja: cantidadPorCaja ? Number(cantidadPorCaja) : null,
        cantidadPorDisplay: cantidadPorDisplay ? Number(cantidadPorDisplay) : null,
        precioFOB: precioFOB ? Number(precioFOB) : null,
        proveedorId: proveedorId ? Number(proveedorId) : null,
      }
    });

    return res.json({ message: "Producto creado exitosamente", producto: nuevoProducto });

  } catch (error) {
    console.error("Error creando producto:", error);
    if ((error as any).code === 'P2002') {
        return res.status(400).json({ error: "Ese SKU ya existe" });
    }
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 2. Obtener TODOS los productos (con su proveedor)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        proveedor: true // ¡Esto es magia! Trae los datos del proveedor automáticamente
      },
      orderBy: { id: 'desc' } // Los más nuevos primero
    });
    return res.json(productos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error obteniendo productos" });
  }
};