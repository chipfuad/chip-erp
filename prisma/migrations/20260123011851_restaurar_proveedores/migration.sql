-- CreateTable
CREATE TABLE "Proveedor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "ejecutivo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);
