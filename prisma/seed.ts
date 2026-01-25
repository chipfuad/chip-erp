import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Empezando la siembra de datos...')

  // 1. Borrar datos antiguos para no duplicar (Limpieza)
  await prisma.producto.deleteMany({})
  await prisma.proveedor.deleteMany({})

  // 2. Crear PROVEEDOR 1
  const proveedor1 = await prisma.proveedor.create({
    data: {
      nombre: 'Shenzhen Tech Ltd',
      pais: 'China',
      ejecutivo: 'Mr. Liu',
      email: 'liu@shenzhen-tech.com',
      telefono: '+86 139 0000 1111',
    },
  })

  // 3. Crear PROVEEDOR 2
  const proveedor2 = await prisma.proveedor.create({
    data: {
      nombre: 'Global Imports USA',
      pais: 'USA',
      ejecutivo: 'Sarah Connor',
      email: 'sarah@globalimports.us',
      telefono: '+1 555 999 8888',
    },
  })

  // 4. Crear PRODUCTOS vinculados al Proveedor 1
  await prisma.producto.create({
    data: {
      sku: 'AUD-BT-001',
      nombre: 'Audífonos Bluetooth Pro',
      precioFOB: 12.50,
      gramaje: '250g',
      paisOrigen: 'China',
      cantidadPorCaja: 40,
      cantidadPorDisplay: 0,
      moneda: 'USD',
      proveedorId: proveedor1.id, // Aquí hacemos el vínculo automático
    },
  })

  await prisma.producto.create({
    data: {
      sku: 'CARG-USBC-20W',
      nombre: 'Cargador Rápido USB-C',
      precioFOB: 3.20,
      gramaje: '100g',
      paisOrigen: 'China',
      cantidadPorCaja: 100,
      cantidadPorDisplay: 10,
      moneda: 'USD',
      proveedorId: proveedor1.id,
    },
  })

  console.log('✅ ¡Siembra terminada! Datos cargados correctamente.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })