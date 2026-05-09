import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedCustomerVehicles = async (tx) => {
  try {
    logger.info('Starting to seed customer vehicles...');
    
    const csvContent = readFileSync(path.join(__dirname, 'customer-vehicle.csv'), 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    logger.info(`Found ${records.length} customer vehicles in CSV`);

    for (const record of records) {
      try {
        const vehicleInsuranceDetails = JSON.parse(record.vehicle_insurance_details);
        
        const customerVehicle = await tx.providerCustomerVehicle.create({
          data: {
            id: record.id,
            provider_customer_id: record.provider_customer_id,
            vehicle_number: record.vehicle_number,
            vehicle_type: record.vehicle_type,
            vehicle_model: record.vehicle_model,
            vehicle_color: record.vehicle_color,
            vehicle_fuel_type: record.vehicle_fuel_type,
            vehicle_transmission: record.vehicle_transmission,
            vehicle_variant: record.vehicle_variant,
            vehicle_make_year: parseInt(record.vehicle_make_year),
            vehicle_mileage: parseInt(record.vehicle_mileage),
            vehicle_insurance_details: JSON.stringify(vehicleInsuranceDetails),
            vehicle_engine_number: record.vehicle_engine_number,
            vehicle_chassis_number: record.vehicle_chassis_number,
            vehicle_registration_number: record.vehicle_registration_number,
            is_deleted: record.is_deleted === 'true',
            created_at: new Date(record.created_at)
          }
        });

        logger.info(`Created customer vehicle with ID: ${customerVehicle.id}`);
      } catch (error) {
        logger.error(`Error creating customer vehicle record: ${error.message}`);
        throw error;
      }
    }

    logger.info('Successfully seeded customer vehicles');
  } catch (error) {
    logger.error(`Error seeding customer vehicles: ${error.message}`);
    throw error;
  }
} 

export default seedCustomerVehicles;