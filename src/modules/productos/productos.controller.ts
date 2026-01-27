import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProductos = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        proveedor: true, 
      },
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

export const createProducto = async (req: Request, res: Response) => {
  try {
    const { 
        sku, 
        nombre, 
        precioFOB, 
        proveedorId,
        gramaje,
        paisOrigen,
        cantidadPorCaja,
        cantidadPorDisplay,
        moneda,
        duracion,
        ventaMensual // <--- DATO NUEVO
    } = req.body;

    const nuevoProducto = await prisma.producto.create({
      data: {
        sku,
        nombre,
        precioFOB: Number(precioFOB), 
        proveedorId: Number(proveedorId),
        gramaje,
        paisOrigen,
        cantidadPorCaja: Number(cantidadPorCaja) || 0,
        cantidadPorDisplay: Number(cantidadPorDisplay) || 0,
        moneda: moneda || "USD",
        duracion,
        ventaMensual: Number(ventaMensual) || 0 // <--- GUARDAMOS DATO NUEVO
      },
    });
    res.json(nuevoProducto);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// --- AGREGAMOS UPDATE TAMBIÉN AQUÍ ---
export const updateProducto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            sku, 
            nombre, 
            precioFOB, 
            proveedorId,
            gramaje,
            paisOrigen,
            cantidadPorCaja,
            cantidadPorDisplay,
            moneda,
            duracion,
            ventaMensual // <--- DATO NUEVO
        } = req.body;

        const productoActualizado = await prisma.producto.update({
            where: { id: Number(id) },
            data: {
                sku,
                nombre,
                precioFOB: Number(precioFOB),
                proveedorId: Number(proveedorId),
                gramaje,
                paisOrigen,
                cantidadPorCaja: Number(cantidadPorCaja) || 0,
                cantidadPorDisplay: Number(cantidadPorDisplay) || 0,
                moneda,
                duracion,
                ventaMensual: Number(ventaMensual) || 0
            }
        });

        res.json(productoActualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
};

export const deleteProducto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.producto.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
};