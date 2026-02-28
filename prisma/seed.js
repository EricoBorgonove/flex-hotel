require("dotenv").config();
const prisma = require("../src/lib/prisma");
const { hashPassword } = require("../src/lib/hash");

async function main() {
  const roleNames = ["SUPER_ADMIN", "ADMIN", "RECEPTION", "FINANCE", "HOUSEKEEPING", "MANAGER"];

  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Cria um hotel demo
  const hotel = await prisma.hotel.upsert({
    where: { id: "demo-hotel-id" },
    update: {},
    create: { id: "demo-hotel-id", name: "Hotel Demo", city: "Manaus" },
  });

  // Cria usuário admin demo
  const email = "admin@demo.com";
  const passwordHash = await hashPassword("123456");

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Admin Demo", email, passwordHash, hotelId: hotel.id },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });

  // Categoria e quartos demo para testes de disponibilidade/reservas
  const category = await prisma.roomCategory.upsert({
    where: { hotelId_name: { hotelId: hotel.id, name: "Standard" } },
    update: { capacity: 2, basePrice: 200.0 },
    create: {
      hotelId: hotel.id,
      name: "Standard",
      capacity: 2,
      basePrice: 200.0,
    },
  });

  await prisma.room.upsert({
    where: { hotelId_number: { hotelId: hotel.id, number: "101" } },
    update: { floor: "1", status: "available", roomCategoryId: category.id },
    create: {
      hotelId: hotel.id,
      roomCategoryId: category.id,
      number: "101",
      floor: "1",
      status: "available",
    },
  });

  await prisma.room.upsert({
    where: { hotelId_number: { hotelId: hotel.id, number: "102" } },
    update: { floor: "1", status: "available", roomCategoryId: category.id },
    create: {
      hotelId: hotel.id,
      roomCategoryId: category.id,
      number: "102",
      floor: "1",
      status: "available",
    },
  });

  console.log("Seed OK: admin@demo.com / 123456 | quartos demo: 101, 102");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

