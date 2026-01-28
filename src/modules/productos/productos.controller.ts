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

// GET: Obtener todos los productos
export const getProductos = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        proveedor: true,          // Trae datos del proveedor
        ventasHistoricas: true,   // Trae historial para tendencias
        ordenesEnTransito: true   // <--- ¡ESTA ES LA LÍNEA QUE FALTA! 🔑
      }
    });
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo productos' });
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
          const keys = Object.keys(row);
          
          // 1. ACTUALIZAR STOCK ACTUAL (Lógica Inteligente)
          // Busca columnas como "Stock Actual", "Stock Fisico", etc.
          const keyStock = keys.find(k => {
            const limpia = k.toLowerCase().trim();
            return limpia === 'stock actual' || 
                   limpia === 'stock fisico' || 
                   limpia === 'stock físico' || 
                   limpia === 'stock';
          });

          if (keyStock) {
            const nuevoStock = limpiarNumero(row[keyStock]);
            // Solo mostramos log si encontramos stock para confirmar que funciona
            // console.log(`✅ SKU: ${sku} | Stock Leído: ${nuevoStock}`);
            await tx.producto.update({
              where: { id: producto.id },
              data: { stockActual: nuevoStock }
            });
          }

          // 2. RECOLECTAR VENTAS (Para análisis de 12 meses)
          let ventasValidas: { fecha: Date, cantidad: number }[] = [];

          for (const key of keys) {
            // Detectamos columnas de fecha (YYYY-MM o YYYY-M)
            if (/^\d{4}-\d{1,2}$/.test(key)) {
              const valorCelda = row[key];
              const cantidad = limpiarNumero(valorCelda);
              
              const parts = key.split('-');
              const year = parts[0];
              const month = parts[1].padStart(2, '0');
              const fechaDate = new Date(`${year}-${month}-01T00:00:00Z`);

              // Guardamos en historial (Base de Datos) SIEMPRE
              await tx.ventaHistorica.upsert({
                where: { productoId_fecha: { productoId: producto.id, fecha: fechaDate } },
                update: { cantidad: cantidad },
                create: { productoId: producto.id, fecha: fechaDate, cantidad: cantidad }
              });

              // Para el cálculo del promedio, solo consideramos si la celda tenía dato
              // Si la celda estaba vacía o era 0, asumimos quiebre de stock y no "ensuciamos" el promedio
              if (valorCelda !== undefined && valorCelda !== null && valorCelda !== '' && cantidad > 0) {
                ventasValidas.push({ fecha: fechaDate, cantidad });
              }
            }
          }

          // 3. CÁLCULO INTELIGENTE (Últimos 12 meses con datos)
          if (ventasValidas.length > 0) {
            // Ordenamos por fecha (del más reciente al más antiguo)
            ventasValidas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

            // Tomamos solo los últimos 12 meses que tengan venta
            const ultimos12Meses = ventasValidas.slice(0, 12);
            
            // Calculamos promedio
            const sumaTotal = ultimos12Meses.reduce((sum, v) => sum + v.cantidad, 0);
            const nuevoPromedio = Math.round(sumaTotal / ultimos12Meses.length);

            await tx.producto.update({
              where: { id: producto.id },
              data: { ventaMensual: nuevoPromedio }
            });
          }
        }
      }
    });

    console.log('🏁 Importación finalizada.');
    res.json({ message: 'Importación Exitosa (12 Meses Móviles)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error importando Excel' });
  }

};// --- FUNCIÓN PARA CREAR ORDEN EN TRÁNSITO ---
export const crearOrdenTransito = async (req: Request, res: Response) => {
  try {
    const { productoId, cantidad, fechaPedido, estado } = req.body;
    
    // Calculamos fecha llegada estimada (simple: +30 días por defecto)
    const llegada = new Date(fechaPedido);
    llegada.setDate(llegada.getDate() + 30); 

    const orden = await prisma.ordenEnTransito.create({
      data: {
        productoId: Number(productoId),
        cantidad: Number(cantidad),
        fechaPedido: new Date(fechaPedido),
        fechaLlegadaEst: llegada,
        estado: estado || 'PRODUCCION'
      }
    });
    res.json(orden);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando orden en tránsito' });
  }
};
// Actualizar una orden existente
export const updateOrdenTransito = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cantidad, estado } = req.body;

    const ordenActualizada = await prisma.ordenEnTransito.update({
      where: { id: Number(id) },
      data: {
        cantidad: Number(cantidad),
        estado: estado
      }
    });
    res.json(ordenActualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la orden' });
  }
};
export const deleteOrdenTransito = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.ordenEnTransito.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Orden eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la orden' });
  }
};