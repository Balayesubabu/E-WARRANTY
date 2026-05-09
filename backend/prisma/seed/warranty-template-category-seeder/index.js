const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'IT Products', slug: 'it-products' },
  { name: 'Appliances', slug: 'appliances' },
  { name: 'Auto Parts', slug: 'auto-parts' },
  { name: 'Industrial', slug: 'industrial' },
  { name: 'Furniture', slug: 'furniture' },
];

export default async function seedWarrantyTemplateCategories(prisma) {
  for (const cat of CATEGORIES) {
    await prisma.warrantyTemplateCategory.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug },
      update: { name: cat.name },
    });
  }
}
