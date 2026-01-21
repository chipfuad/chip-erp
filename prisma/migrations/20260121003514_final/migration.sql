-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "cantidadPorCaja" INTEGER,
ADD COLUMN     "cantidadPorDisplay" INTEGER,
ADD COLUMN     "gramaje" TEXT,
ADD COLUMN     "paisOrigen" TEXT,
ADD COLUMN     "precioFOB" DOUBLE PRECISION;
