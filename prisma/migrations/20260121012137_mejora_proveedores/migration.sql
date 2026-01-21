/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Proveedor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "ejecutivo" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "pais" TEXT,
ADD COLUMN     "telefono" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");
