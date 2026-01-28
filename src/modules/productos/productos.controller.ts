import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import * as XLSX from 'xlsx';

const limpiarNumero = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const limpio = String(v).replace(/\./g, '').replace(/,/g, '').replace(/\s/g, '');
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
};

export const getProductos = async (req: Request, res: Response) => {
  try {
    const p = await prisma.producto.findMany({ include: { proveedor: true, ventasHistoricas: true, ordenesEnTransito: true } });
    res.json(p);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const createProducto = async (req: Request, res: Response) => {
  try {
    const { sku, nombre, proveedorId, stockActual, precioFOB, leadTime } = req.body;
    const prod = await prisma.producto.create({
      data: { sku, nombre, proveedorId: Number(proveedorId), stockActual: Number(stockActual) || 0, ventaMensual: 0, precioFOB: Number(precioFOB) || 0, leadTime: Number(leadTime) || 0 }
    });
    res.json(prod);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const updateProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const prod = await prisma.producto.update({ where: { id: Number(id) }, data });
    res.json(prod);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const deleteProducto = async (req: Request, res: Response) => {
  try {
    await prisma.producto.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'OK' });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const addVentaHistorica = async (req: Request, res: Response) => {
  try {
    const { productoId, fecha, cantidad } = req.body;
    const v = await prisma.ventaHistorica.upsert({
      where: { productoId_fecha: { productoId: Number(productoId), fecha: new Date(fecha) } },
      update: { cantidad: Number(cantidad) },
      create: { productoId: Number(productoId), fecha: new Date(fecha), cantidad: Number(cantidad) }
    });
    res.json(v);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const updateVentaParcial = async (req: Request, res: Response) => {
  try {
    const { ventaActual, diaDelMes } = req.body;
    const proyectada = Math.ceil((ventaActual / diaDelMes) * 30);
    await prisma.producto.update({ where: { id: Number(req.params.id) }, data: { ventaMensual: proyectada } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const descargarPlantilla = async (req: Request, res: Response) => {
  try {
    const p = await prisma.producto.findMany({ select: { sku: true, nombre: true, stockActual: true } });
    const ws = XLSX.utils.json_to_sheet(p);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla.xlsx"');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const importarExcelVentas = async (req: Request, res: Response) => {
  res.json({ message: "Importado" });
};

export const crearOrdenTransito = async (req: Request, res: Response) => {
  try {
    const { productoId, cantidad, fechaPedido } = req.body;
    const o = await prisma.ordenEnTransito.create({
      data: { productoId: Number(productoId), cantidad: Number(cantidad), fechaPedido: new Date(fechaPedido), fechaLlegadaEst: new Date(), estado: 'PRODUCCION' }
    });
    res.json(o);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const updateOrdenTransito = async (req: Request, res: Response) => {
  const o = await prisma.ordenEnTransito.update({ where: { id: Number(req.params.id) }, data: req.body });
  res.json(o);
};

export const deleteOrdenTransito = async (req: Request, res: Response) => {
  await prisma.ordenEnTransito.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: 'OK' });
};