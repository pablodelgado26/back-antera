import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Criar empresa padrão
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Empresa Padrão",
      description: "Empresa padrão para publicação de vagas",
      location: "Brasil",
      industry: "Tecnologia",
    },
  });

  console.log("Empresa criada:", company);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
