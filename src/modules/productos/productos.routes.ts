import { Router } from 'express';
import { createProduct, getProducts } from './productos.controller';

const router = Router();

// POST: Crear producto
router.post('/', createProduct);

// GET: Obtener lista de productos
router.get('/', getProducts);

export default router;