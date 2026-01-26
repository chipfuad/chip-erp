-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "ejecutivo" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "telefono" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
