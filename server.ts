import express from 'express';
import cors from 'cors';
import multer from 'multer'; // Librería para manejar archivos

// Importamos los "expertos" (Controladores)
import * as productosController from './src/modules/productos/productos.controller';
import * as proveedoresController from './src/modules/proveedores/proveedores.controller';

const app = express();
const PORT = 3000;

// --- CONFIGURACIÓN DE MULTER (Para subir archivos) ---
// Guardamos el archivo en la memoria RAM temporalmente para procesarlo rápido
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('✅ API Chip ERP v2.0 - Sistema Online y Listo');
});

// ==========================================
// 📦 RUTAS DE PRODUCTOS
// ==========================================
// CRUD Básico
app.get('/api/productos', productosController.getProductos);
app.post('/api/productos', productosController.createProducto);
app.put('/api/productos/:id', productosController.updateProducto);
app.delete('/api/productos/:id', productosController.deleteProducto);

// 📊 Inteligencia de Negocios
app.post('/api/productos/historial', productosController.addVentaHistorica);

// 📥 EXCEL: Descargar Plantilla (NUEVO 🌟)
app.get('/api/productos/plantilla', productosController.descargarPlantilla);

// 📤 EXCEL: Importar Ventas (Lo usaremos en el siguiente paso)
// 'archivo' es el nombre del campo que enviaremos desde el Frontend
app.post('/api/productos/importar', upload.single('archivo'), productosController.importarExcelVentas);


// ==========================================
// 🚛 RUTAS DE PROVEEDORES
// ==========================================
app.get('/api/proveedores', proveedoresController.getProveedores);
app.post('/api/proveedores', proveedoresController.createProveedor);
app.put('/api/proveedores/:id', proveedoresController.updateProveedor);
app.delete('/api/proveedores/:id', proveedoresController.deleteProveedor);


// --- ENCENDER EL MOTOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor Profesional corriendo en http://localhost:${PORT}`);
});