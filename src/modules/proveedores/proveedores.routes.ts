import { Router } from 'express';
import { getProveedores, createProveedor, updateProveedor, deleteProveedor } from './proveedores.controller';

const router = Router();

// Rutas
router.get('/', getProveedores);        // Obtener lista
router.post('/', createProveedor);      // Crear nuevo
router.put('/:id', updateProveedor);    // <--- ¡ESTA ES LA VITAL PARA EDITAR!
router.delete('/:id', deleteProveedor); // Eliminar

export default router;