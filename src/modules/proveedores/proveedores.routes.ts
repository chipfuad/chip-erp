import { Router } from 'express';
import { createProveedor, getProveedores } from './proveedores.controller';

const router = Router();

router.post('/', createProveedor);
router.get('/', getProveedores);

export default router;