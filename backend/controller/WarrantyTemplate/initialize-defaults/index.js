import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId, getCategories } from '../query.js';
import { WarrantyTemplate, WarrantyTemplateField } from '../../../prisma/db-models.js';

const DEFAULT_FIELDS = [
  { name: 'product_name', label: 'Product Name', field_type: 'text', required: true, field_order: 0 },
  { name: 'serial_number', label: 'Serial Number', field_type: 'text', required: true, field_order: 1 },
  { name: 'purchase_date', label: 'Purchase Date', field_type: 'date', required: true, field_order: 2 },
  { name: 'warranty_duration', label: 'Warranty Duration', field_type: 'dropdown', required: false, field_order: 3, options: { choices: ['6 months', '12 months', '24 months', '36 months'] } },
  { name: 'notes', label: 'Notes', field_type: 'textarea', required: false, field_order: 4 },
];

// Standard templates per category: { categorySlug: [{ name, warrantyMonths, description }] }
const STANDARD_TEMPLATES = {
  electronics: [
    { name: 'Electronics - Standard', warrantyMonths: 12, description: 'Standard warranty for phones, laptops, and gadgets.' },
  ],
  'it-products': [
    { name: 'IT Products - Standard', warrantyMonths: 12, description: 'Coverage for computers and peripherals.' },
  ],
  appliances: [
    { name: 'Appliances - Basic', warrantyMonths: 6, description: 'Basic coverage for home appliances.' },
    { name: 'Appliances - Extended', warrantyMonths: 24, description: 'Extended coverage for major appliances.' },
  ],
  'auto-parts': [
    { name: 'Automotive - Standard', warrantyMonths: 12, description: 'Warranty for automotive parts and accessories.' },
  ],
  industrial: [
    { name: 'Industrial - Standard', warrantyMonths: 12, description: 'Coverage for industrial equipment.' },
  ],
  furniture: [
    { name: 'Furniture - Premium', warrantyMonths: 24, description: 'Premium warranty for furniture and furnishings.' },
  ],
};

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, 'Provider not found');
    return await handler(req, res, provider.id);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const initializeDefaultsEndpoint = withProvider(async (req, res, providerId) => {
  const existing = await WarrantyTemplate.count({ where: { provider_id: providerId, is_deleted: false } });
  if (existing > 0) {
    return returnResponse(res, StatusCodes.OK, 'Templates already exist', { created: 0 });
  }
  const categories = await getCategories();
  let created = 0;
  for (const cat of categories) {
    const variants = STANDARD_TEMPLATES[cat.slug] || [{ name: `${cat.name} - Standard`, warrantyMonths: 12, description: `Standard warranty for ${cat.name.toLowerCase()}.` }];
    for (const v of variants) {
      const template = await WarrantyTemplate.create({
        data: {
          category_id: cat.id,
          provider_id: providerId,
          name: v.name,
          layout_type: 'two_column',
        },
      });
      for (const f of DEFAULT_FIELDS) {
        await WarrantyTemplateField.create({
          data: {
            template_id: template.id,
            name: f.name,
            label: f.label,
            field_type: f.field_type,
            required: f.required,
            section: 'default',
            field_order: f.field_order,
            options: f.options || null,
          },
        });
      }
      created++;
    }
  }
  const templates = await WarrantyTemplate.findMany({
    where: { provider_id: providerId, is_deleted: false },
    include: { category: { select: { id: true, name: true } }, fields: { orderBy: { field_order: 'asc' } } },
  });
  return returnResponse(res, StatusCodes.CREATED, `Created ${created} templates`, templates);
});
