import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import * as XLSX from 'xlsx';

// --- Función Auxiliar para Limpiar Números ---
const limpiarNumero = (valor: any): number => {
  if (valor === null || valor === undefined) return 0;
  
  if (typeof valor === 'number') return valor;
  
  if (typeof valor === 'string') {
    if (valor.trim() === '-') return 0;
    // Eliminar puntos de miles y comas
    const limpio = valor.replace(/\./g, '').replace(/,/g, '').replace(/\s/g, '');
    const numero = parseFloat(limpio);
    return isNaN(numero) ? 0 : numero;
  }
  
  return 0;
};

// --- CRUD BÁSICO ---

export const getProductos = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      include: { 
        proveedor: true,
        ventasHistoricas: {
          orderBy: { fecha: 'asc' }
        }
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

export const createProducto = async (req: Request, res: Response) => {
  try {
    const { sku, nombre, proveedorId, stockActual, precioFOB, leadTime } = req.body;
    
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: Number(proveedorId) }
    });

    if (!proveedor) {
      return res.status(400).json({ error: 'Proveedor no encontrado' });
    }

    const producto = await prisma.producto.create({
      data: {
        sku,
        nombre,
        proveedorId: Number(proveedorId),
        stockActual: Number(stockActual) || 0,
        ventaMensual: 0,
        precioFOB: Number(precioFOB) || 0,
        leadTime: Number(leadTime) || 0
      },
    });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

export const getProductoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const producto = await prisma.producto.findUnique({
      where: { id: Number(id) },
      include: {
        proveedor: true,
        ventasHistoricas: {
          orderBy: { fecha: 'asc' },
          take: 24
        }
      },
    });

    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// --- FUNCIONES EXTRA ---

export const updateProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sku, nombre, proveedorId, stockActual, precioFOB, leadTime } = req.body;

    const producto = await prisma.producto.update({
      where: { id: Number(id) },
      data: {
        sku,
        nombre,
        proveedorId: Number(proveedorId),
        stockActual: Number(stockActual),
        precioFOB: Number(precioFOB),
        leadTime: Number(leadTime)
      }
    });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando producto' });
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
    res.status(500).json({ error: 'Error eliminando producto' });
  }
};

export const addVentaHistorica = async (req: Request, res: Response) => {
  try {
    const { productoId, fecha, cantidad } = req.body;
    const fechaDate = new Date(fecha);

    const venta = await prisma.ventaHistorica.upsert({
      where: {
        productoId_fecha: {
          productoId: Number(productoId),
          fecha: fechaDate
        }
      },
      update: { cantidad: Number(cantidad) },
      create: {
        productoId: Number(productoId),
        fecha: fechaDate,
        cantidad: Number(cantidad)
      }
    });
    res.json(venta);
  } catch (error) {
    res.status(500).json({ error: 'Error agregando historial' });
  }
};

// --- IMPORTACIÓN MASIVA INTELIGENTE ---

export const descargarPlantilla = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      select: { sku: true, nombre: true, stockActual: true }
    });

    const data = productos.map((p: any) => ({
      SKU: p.sku,
      Nombre: p.nombre,
      "Stock Actual": p.stockActual || 0,
      "2024-01": 0,
      "2024-02": 0
    }));

    if (data.length === 0) {
      data.push({ 
        SKU: "EJEMPLO", 
        Nombre: "Test", 
        "Stock Actual": 1500,
        "2024-01": 100,
        "2024-02": 0
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Maestra");
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_maestra.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Error generando plantilla' });
  }
};

export const importarExcelVentas = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No hay archivo' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`📂 Procesando ${data.length} filas...`);

    await prisma.$transaction(async (tx: any) => {
      for (const row of data as any[]) {
        const sku = row['SKU'] || row['sku'];
        if (!sku) continue;

        const producto = await tx.producto.findUnique({ where: { sku: String(sku) } });
        
        if (producto) {
          // --- LÓGICA INTELIGENTE PARA ENCONTRAR STOCK ---
          const keys = Object.keys(row);
          
          // Busca cualquier columna que se parezca a "Stock" (ignora mayúsculas y espacios)
          const keyStock = keys.find(k => {
            const limpia = k.toLowerCase().trim();
            return limpia === 'stock actual' || 
                   limpia === 'stock fisico' || 
                   limpia === 'stock físico' || 
                   limpia === 'stock';
          });

          if (keyStock) {
            const valorOriginal = row[keyStock];
            const nuevoStock = limpiarNumero(valorOriginal);
            
            // Console log para ver si está funcionando
            console.log(`✅ SKU: ${sku} | Stock Leído: ${nuevoStock}`);

            await tx.producto.update({
              where: { id: producto.id },
              data: { stockActual: nuevoStock }
            });
          }
          // ---------------------------------------------

          let totalVentas = 0;
          let mesesContados = 0;

          for (const key of keys) {
            if (/^\d{4}-\d{1,2}$/.test(key)) {
              const cantidad = limpiarNumero(row[key]);
              const parts = key.split('-');
              const year = parts[0];
              const month = parts[1].padStart(2, '0');
              const fechaDate = new Date(`${year}-${month}-01T00:00:00Z`);

              await tx.ventaHistorica.upsert({
                where: { productoId_fecha: { productoId: producto.id, fecha: fechaDate } },
                update: { cantidad: cantidad },
                create: { productoId: producto.id, fecha: fechaDate, cantidad: cantidad }
              });

              if (cantidad > 0) {
                totalVentas += cantidad;
                mesesContados++;
              }
            }
          }

          if (mesesContados > 0) {
            const nuevoPromedio = Math.round(totalVentas / mesesContados);
            await tx.producto.update({
              where: { id: producto.id },
              data: { ventaMensual: nuevoPromedio }
            });
          }
        }
      }
    });

    console.log('🏁 Importación finalizada.');
    res.json({ message: 'Importación Exitosa (Ventas + Stock)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error importando Excel' });
  }
};