# 🧠 CONTEXTO MAESTRO Y REGLAS DE TRABAJO: CHIP ERP

## 1. ROL Y COMPORTAMIENTO (¡CRÍTICO!)
Actúa como un **Senior Full Stack Developer** pragmático y eficiente.
* **CERO SNIPPETS:** Nunca me des pedazos de código sueltos (ej: "agrega esto en la línea 50").
* **REEMPLAZO TOTAL:** Cuando pida una modificación en un archivo, dame siempre el **CÓDIGO COMPLETO E INTEGRAL** del archivo. Mi flujo es "Borrar Todo -> Pegar lo Nuevo".
* **AUTONOMÍA:** No sugieras, **hazlo**. Si pido un botón, dame el código con el botón ya funcionando.

## 2. LA VISIÓN: CHIP ERP
Estamos construyendo un ERP moderno para gestión de inventarios y COMEX.
* **Estilo Visual:** "Dark Mode Professional". Fondo `#1a1a2e`, Paneles `#16213e`, Acentos `#4cc9f0` (Cyan) y `#e94560` (Rosa).
* **UX:** Dashboards visuales, KPIs claros, Tablas limpias y Modales para formularios.

## 3. STACK TECNOLÓGICO (ARQUITECTURA)
El sistema es **Full Stack** corriendo en dos terminales separadas:

### 🎨 Frontend (Puerto 5173)
* **Framework:** React + Vite + TypeScript (`.tsx`).
* **Estilos:** CSS Inline (objetos JS) para mantener todo en un solo archivo.
* **Gráficos:** `chart.js` y `react-chartjs-2`.
* **Archivo Principal:** `App.tsx` (Contiene Dashboard, Tabla, Modal y Lógica UI).

### 🧠 Backend (Puerto 3000)
* **Runtime:** Node.js + Express + TypeScript (`.ts`).
* **Base de Datos:** SQLite (archivo local).
* **ORM:** Prisma.
* **Archivo Principal:** `server.ts`.
* **Comunicación:** API REST (Rutas `/api/...`). CORS habilitado.

## 4. ESTADO TÉCNICO ACTUAL
* **Full Stack:** Conectado y funcionando.
* **Base de Datos:** Tabla `Producto` creada y migrada.
* **Backend:** Rutas GET y POST (`/api/productos`) funcionando correctamente.
* **Frontend:**
    * Dashboard con KPIs automáticos y Gráficos.
    * Tabla de inventario conectada a DB.
    * Funcionalidad "Crear Producto" (Modal) operativa.

## 5. MODELO DE DATOS (TABLA: PRODUCTO)
Respeta estrictamente estos campos y tipos al generar código:
* `id`: Int (Autoincremental)
* `sku`: String (Único)
* `nombre`: String
* `precioFOB`: Decimal/Float (¡Ojo! Convertir siempre con `Number()` al recibir del frontend)
* `gramaje`: String
* `paisOrigen`: String
* `cantidadPorCaja`: Int

## 6. INSTRUCCIONES DE RESPUESTA
1.  **Frontend (`App.tsx`):** Mantén siempre los imports de `chart.js`, los estilos oscuros y la estructura completa.
2.  **Backend (`server.ts`):** Si agregas rutas, recuérdame reiniciar la terminal (`Ctrl+C` -> `npx ts-node server.ts`).
3.  **Prevención de Errores:** Evita cortar los bloques de código para no generar errores de "Unterminated string".

## 7. 🤖 AUTOMATIZACIÓN DE ENTORNO (Tasks)
Si el usuario pide "configurar inicio" o menciona que las terminales no tienen nombre/color:
* Genera un archivo `.vscode/tasks.json` que cree automáticamente:
    1.  Terminal **'🧠 BACKEND'** (`npx ts-node server.ts`).
    2.  Terminal **'🎨 FRONTEND'** (`npx vite`).
    3.  Una tarea compuesta **'🚀 INICIAR PROYECTO'** que lance ambas.
* Asegura usar `isBackground: true` y `problemMatcher` para evitar bloqueos.

## 8. 📝 BITÁCORA Y PRÓXIMOS PASOS (¡ACTUALIZAR SIEMPRE!)
*La IA debe leer esto para saber dónde retomar.*

**✅ LO ÚLTIMO QUE HICIMOS:**
- Backend: Endpoint POST `/api/productos` creado y probado.
- Frontend: Modal de creación de productos integrado y funcionando.
- Contexto: Archivo `GEMINI.md` creado para mantener la memoria del proyecto.

**🚀 LO QUE TOCA HACER AHORA (SIGUIENTE PASO):**
- [ ] Agregar validaciones al formulario (campos obligatorios).
- [ ] Implementar botón de "Eliminar Producto" en la tabla.
- [ ] Automatizar el inicio de terminales con `tasks.json`.