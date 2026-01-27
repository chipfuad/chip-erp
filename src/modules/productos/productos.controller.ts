import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx'; // Importamos librería para leer Excel

const prisma = new PrismaClient();

// 1. OBTENER PRODUCTOS
export const getProductos = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        proveedor: true,
        ventasHistoricas: { orderBy: { fecha: 'asc' } }
      },
      orderBy: { id: 'desc' }
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// 2. CREAR PRODUCTO
export const createProducto = async (req: Request, res: Response) => {
  try {
    const { sku, nombre, precioFOB, proveedorId, gramaje, paisOrigen, cantidadPorCaja, cantidadPorDisplay, moneda, duracion, ventaMensual, stockActual } = req.body;

    const nuevoProducto = await prisma.producto.create({
      data: {
        sku, nombre, precioFOB: Number(precioFOB), proveedorId: Number(proveedorId),
        gramaje, paisOrigen, cantidadPorCaja: Number(cantidadPorCaja) || 0,
        cantidadPorDisplay: Number(cantidadPorDisplay) || 0, moneda: moneda || "USD",
        duracion, ventaMensual: Number(ventaMensual) || 0, stockActual: Number(stockActual) || 0
      },
    });
    res.json(nuevoProducto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// 3. ACTUALIZAR PRODUCTO
export const updateProducto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const productoActualizado = await prisma.producto.update({
            where: { id: Number(id) },
            data: {
                sku: data.sku, nombre: data.nombre, precioFOB: Number(data.precioFOB),
                proveedorId: Number(data.proveedorId), gramaje: data.gramaje, paisOrigen: data.paisOrigen,
                cantidadPorCaja: Number(data.cantidadPorCaja), cantidadPorDisplay: Number(data.cantidadPorDisplay),
                moneda: data.moneda, duracion: data.duracion, ventaMensual: Number(data.ventaMensual),
                stockActual: Number(data.stockActual)
            }
        });
        res.json(productoActualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
};

// 4. ELIMINAR PRODUCTO
export const deleteProducto = async (req: Request, res: Response) => {
    try {
        await prisma.producto.delete({ where: { id: Number(req.params.id) } });
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
};

// 5. AGREGAR HISTORIAL (MANUAL)
export const addVentaHistorica = async (req: Request, res: Response) => {
    try {
        const { productoId, fecha, cantidad } = req.body;
        await prisma.ventaHistorica.create({
            data: { productoId: Number(productoId), fecha: new Date(fecha), cantidad: Number(cantidad) }
        });
        
        // Recalcular promedio
        const historial = await prisma.ventaHistorica.findMany({ where: { productoId: Number(productoId) } });
        if (historial.length > 0) {
            const total = historial.reduce((acc, curr) => acc + curr.cantidad, 0);
            const promedio = Math.round(total / historial.length);
            await prisma.producto.update({ where: { id: Number(productoId) }, data: { ventaMensual: promedio } });
        }
        res.json({ message: 'Historial actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar historial' });
    }
};

// 6. GENERAR Y DESCARGAR PLANTILLA EXCEL
export const descargarPlantilla = async (req: Request, res: Response) => {
    try {
        const productos = await prisma.producto.findMany({
            select: { sku: true, nombre: true },
            orderBy: { nombre: 'asc' }
        });

        const fechaHoy = new Date();
        const columnasMeses: any = {};
        
        // Generamos columnas de ejemplo vacías (últimos 6 meses)
        for (let i = 0; i < 6; i++) {
            const mes = fechaHoy.getMonth() + 1; 
            const anio = fechaHoy.getFullYear();
            const key = `${anio}-${mes.toString().padStart(2, '0')}`;
            columnasMeses[key] = ""; 
        }

        const datosExcel = productos.map(prod => ({
            "SKU": prod.sku,         
            "Producto": prod.nombre, 
            ...columnasMeses         
        }));

        const libro = XLSX.utils.book_new();
        const hoja = XLSX.utils.json_to_sheet(datosExcel);
        hoja['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 10 }];

        XLSX.utils.book_append_sheet(libro, hoja, "Plantilla Ventas");

        const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="Plantilla_Ventas.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generando la plantilla' });
    }
};

// 7. IMPORTAR EXCEL (LÓGICA REAL ACTIVADA 🚀)
export const importarExcelVentas = async (req: Request, res: Response) => {
    try {
        // A. Validaciones iniciales
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo.' });
        }

        // B. Leer el archivo desde la memoria
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Leer la primera hoja
        const sheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const datos = XLSX.utils.sheet_to_json(sheet);

        let productosProcesados = 0;
        let ventasRegistradas = 0;

        // C. Recorrer cada fila del Excel
        for (const fila of datos as any[]) {
            const sku = fila['SKU']?.toString().trim(); // Limpiamos espacios
            if (!sku) continue; // Si no hay SKU, saltamos

            // 1. Buscar producto en BD
            const producto = await prisma.producto.findUnique({ where: { sku } });
            if (!producto) continue; // Si el SKU no existe en nuestro sistema, saltamos

            // 2. Buscar columnas que sean fechas (Formato AAAA-MM, ej: "2024-01")
            const llaves = Object.keys(fila);
            let huboCambios = false;

            for (const key of llaves) {
                // Regex: Busca 4 dígitos, guion, 2 dígitos (ej: 2024-01)
                if (/^\d{4}-\d{2}$/.test(key)) {
                    const cantidad = Number(fila[key]);

                    // Si la cantidad es válida y mayor o igual a 0
                    if (!isNaN(cantidad) && cantidad >= 0) {
                        // Construimos fecha ISO (Dia 1 del mes, forzando hora UTC para evitar cambios de dia)
                        const fechaISO = `${key}-01T00:00:00.000Z`;
                        
                        // Buscamos si ya existe ese registro para NO duplicar
                        const ventaExistente = await prisma.ventaHistorica.findFirst({
                            where: {
                                productoId: producto.id,
                                fecha: new Date(fechaISO)
                            }
                        });

                        if (ventaExistente) {
                            // ACTUALIZAR
                            await prisma.ventaHistorica.update({
                                where: { id: ventaExistente.id },
                                data: { cantidad }
                            });
                        } else {
                            // CREAR NUEVO
                            await prisma.ventaHistorica.create({
                                data: {
                                    productoId: producto.id,
                                    fecha: new Date(fechaISO),
                                    cantidad
                                }
                            });
                        }
                        ventasRegistradas++;
                        huboCambios = true;
                    }
                }
            }

            // 3. Recalcular Promedio Mensual del Producto (Solo si tocamos sus ventas)
            if (huboCambios) {
                const historial = await prisma.ventaHistorica.findMany({
                    where: { productoId: producto.id }
                });

                if (historial.length > 0) {
                    const total = historial.reduce((sum, item) => sum + item.cantidad, 0);
                    const promedio = Math.round(total / historial.length);

                    await prisma.producto.update({
                        where: { id: producto.id },
                        data: { ventaMensual: promedio }
                    });
                }
                productosProcesados++;
            }
        }

        res.json({ 
            message: 'Importación completada con éxito', 
            detalles: `Se actualizaron ${productosProcesados} productos y se procesaron ${ventasRegistradas} registros históricos.` 
        });

    } catch (error) {
        console.error("Error crítico en importación:", error);
        res.status(500).json({ error: 'Ocurrió un error al procesar el archivo Excel.' });
    }
};