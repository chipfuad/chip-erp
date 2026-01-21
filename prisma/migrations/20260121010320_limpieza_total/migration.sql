/*
  Warnings:

  - You are about to drop the column `descripcion` on the `Producto` table. All the data in the column will be lost.
  - You are about to drop the column `leadTime` on the `Producto` table. All the data in the column will be lost.
  - You are about to drop the column `precioCosto` on the `Producto` table. All the data in the column will be lost.
  - You are about to drop the column `precioVenta` on the `Producto` table. All the data in the column will be lost.
  - You are about to drop the column `stockMinimo` on the `Producto` table. All the data in the column will be lost.
  - You are about to drop the column `contacto` on the `Proveedor` table. All the data in the column will be lost.
  - You are about to drop the column `direccion` on the `Proveedor` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Proveedor` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Proveedor` table. All the data in the column will be lost.
  - You are about to drop the `ComexRegistro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DetalleOrdenCompra` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Inventario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrdenCompra` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Venta` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ComexRegistro" DROP CONSTRAINT "ComexRegistro_proveedorId_fkey";

-- DropForeignKey
ALTER TABLE "DetalleOrdenCompra" DROP CONSTRAINT "DetalleOrdenCompra_ordenId_fkey";

-- DropForeignKey
ALTER TABLE "DetalleOrdenCompra" DROP CONSTRAINT "DetalleOrdenCompra_productoId_fkey";

-- DropForeignKey
ALTER TABLE "Inventario" DROP CONSTRAINT "Inventario_productoId_fkey";

-- DropForeignKey
ALTER TABLE "OrdenCompra" DROP CONSTRAINT "OrdenCompra_proveedorId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_productoId_fkey";

-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "descripcion",
DROP COLUMN "leadTime",
DROP COLUMN "precioCosto",
DROP COLUMN "precioVenta",
DROP COLUMN "stockMinimo";

-- AlterTable
ALTER TABLE "Proveedor" DROP COLUMN "contacto",
DROP COLUMN "direccion",
DROP COLUMN "email",
DROP COLUMN "telefono";

-- DropTable
DROP TABLE "ComexRegistro";

-- DropTable
DROP TABLE "DetalleOrdenCompra";

-- DropTable
DROP TABLE "Inventario";

-- DropTable
DROP TABLE "OrdenCompra";

-- DropTable
DROP TABLE "Venta";
