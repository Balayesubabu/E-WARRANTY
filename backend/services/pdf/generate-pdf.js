import { logger } from "../logger.js";
import classicInvoiceTemplate from "./templates/classic-template.js";
import modernInvoiceTemplate from "./templates/modern-template.js";

const generatePdf = async (data, template_name) => {
    logger.info("---generatePdf---");

    switch (template_name) {
        case "classic":
            logger.info(`--- Generating classic invoice for invoice with data: ${JSON.stringify(data)} ---`);
            return await classicInvoiceTemplate(data);
        case "modern":
            logger.info(`--- Generating modern invoice for invoice with data: ${JSON.stringify(data)} ---`);
            return await modernInvoiceTemplate(data);
        default:
            throw new Error(`Template ${template_name} not found`);
    }
}

export { generatePdf };