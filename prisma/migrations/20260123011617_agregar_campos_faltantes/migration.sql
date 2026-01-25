/*
  Warnings:

  - You are about to alter the column `precioFOB` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the `Proveedor` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `proveedorId` on table `Producto` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cantidadPorCaja` on table `Producto` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cantidadPorDisplay` on table `Producto` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gramaje` on table `Producto` required. This step will fail if there are existing NULL values in that column.
  - Made the column `paisOrigen` on table `Producto` required. This step will fail if there are existing NULL values in that column.
  - Made the column `precioFOB` on table `Producto` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_proveedorId_fkey";

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'USD',
ALTER COLUMN "proveedorId" SET NOT NULL,
ALTER COLUMN "proveedorId" SET DEFAULT 0,
ALTER COLUMN "cantidadPorCaja" SET NOT NULL,
ALTER COLUMN "cantidadPorDisplay" SET NOT NULL,
ALTER COLUMN "cantidadPorDisplay" SET DEFAULT 0,
ALTER COLUMN "gramaje" SET NOT NULL,
ALTER COLUMN "paisOrigen" SET NOT NULL,
ALTER COLUMN "precioFOB" SET NOT NULL,
ALTER COLUMN "precioFOB" SET DATA TYPE DECIMAL(65,30);

-- DropTable
DROP TABLE "Proveedor";
