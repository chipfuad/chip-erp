-- CreateTable
CREATE TABLE "ComexRegistro" (
    "id" SERIAL NOT NULL,
    "fechaCorte" TIMESTAMP(3),
    "cveArt" TEXT,
    "articulo" TEXT,
    "stockActual" INTEGER DEFAULT 0,
    "consumoPromedio" DOUBLE PRECISION DEFAULT 0,
    "mesesStockProy" DOUBLE PRECISION DEFAULT 0,
    "leadTime" INTEGER DEFAULT 45,
    "fechaVencimiento" TIMESTAMP(3),
    "fechaSugeridaPedido" TIMESTAMP(3),
    "fechaAgotamiento" TIMESTAMP(3),
    "cantidadSugerida" INTEGER DEFAULT 0,
    "alertaFechaPedir" TIMESTAMP(3),
    "mesesStockReal" DOUBLE PRECISION,
    "finalStockFisico" INTEGER,
    "fechaPedSug" TIMESTAMP(3),
    "pfFact" TEXT,
    "etd" TIMESTAMP(3),
    "unidadesTransito" DOUBLE PRECISION,
    "eta" TIMESTAMP(3),
    "finalStockTotal" TIMESTAMP(3),
    "boxNota" TEXT,
    "mesVentas" TEXT,
    "ventasMaquina" DOUBLE PRECISION,
    "ventasMayorista" DOUBLE PRECISION,
    "totalVentas" DOUBLE PRECISION,
    "porcentajeCumplimiento" DOUBLE PRECISION,
    "proveedorId" INTEGER,

    CONSTRAINT "ComexRegistro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioCosto" DOUBLE PRECISION,
    "precioVenta" DOUBLE PRECISION,
    "leadTime" INTEGER NOT NULL DEFAULT 45,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "proveedorId" INTEGER,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "ubicacion" TEXT,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenCompra" (
    "id" SERIAL NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "proveedorId" INTEGER NOT NULL,
    "fechaETA" TIMESTAMP(3),

    CONSTRAINT "OrdenCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleOrdenCompra" (
    "id" SERIAL NOT NULL,
    "ordenId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costoUnitario" DOUBLE PRECISION,

    CONSTRAINT "DetalleOrdenCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION,
    "cliente" TEXT,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Producto_sku_key" ON "Producto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_productoId_key" ON "Inventario"("productoId");

-- AddForeignKey
ALTER TABLE "ComexRegistro" ADD CONSTRAINT "ComexRegistro_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleOrdenCompra" ADD CONSTRAINT "DetalleOrdenCompra_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleOrdenCompra" ADD CONSTRAINT "DetalleOrdenCompra_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
