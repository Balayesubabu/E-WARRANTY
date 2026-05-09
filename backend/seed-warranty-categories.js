import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'IT Products', slug: 'it-products' },
  { name: 'Appliances', slug: 'appliances' },
  { name: 'Auto Parts', slug: 'auto-parts' },
  { name: 'Industrial', slug: 'industrial' },
  { name: 'Furniture', slug: 'furniture' },
];

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.warrantyTemplateCategory.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug },
      update: { name: cat.name },
    });
  }
  console.log('Warranty template categories seeded successfully.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
