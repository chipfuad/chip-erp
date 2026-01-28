import { Router } from 'express';
// CORRECCIÓN: Usamos los nombres en ESPAÑOL (Producto/s)
import { createProducto, getProductos, crearOrdenTransito } from './productos.controller';

const router = Router();

// POST: Crear producto (Nombre corregido: createProducto)
router.post('/', createProducto);

// POST: Crear orden en tránsito
router.post('/transito', crearOrdenTransito);

// GET: Obtener lista de productos (Nombre corregido: getProductos)
router.get('/', getProductos);

export default router;