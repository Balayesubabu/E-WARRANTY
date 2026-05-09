import { fileURLToPath } from 'url';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedVehicleTypes = async (tx) => {
  const csvPath = path.join(__dirname, 'car_type.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csvParse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  for (const record of records) {
    await tx.vehicleType.create({
      data: {
        name: record.name,
        created_at: new Date(record.created_at),
        updated_at: new Date(record.updated_at),
      },
    });
  }
};

export default seedVehicleTypes; 