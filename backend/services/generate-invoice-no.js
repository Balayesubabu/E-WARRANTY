import { Provider } from '../prisma/db-models.js'
import { logger } from './logger.js'

export const generatePrefixFromCompanyName = (companyName) => {
    const words = companyName.trim().split(/\s+/);

    if (words.length === 1) {
        return words[0].substring(0, 3).toUpperCase();
    } else if (words.length === 2) {
        return (words[0].substring(0, 2) + words[1].substring(0, 1)).toUpperCase();
    } else {
        return (words[0].substring(0, 1) + words[1].substring(0, 1) + words[2].substring(0, 1)).toUpperCase();
    }
};

const generateInvoiceNo = async (provider_id, invoice_type) => {
    try {
        logger.info(`generateInvoiceNo`);

        const provider = await Provider.findFirst({
            where: {
                id: provider_id
            }
        });

        if (!provider) {
            throw new Error("Provider not found");
        }

        let invoiceNo = '';
        let currentNumber = 0;
        let prefix = '';

        switch (invoice_type) {
            case 'Sales':
                currentNumber = provider.sales_invoice_number;
                break;
            case 'Booking':
                currentNumber = provider.booking_invoice_number;
                break;
            case 'Quotation':
                currentNumber = provider.quotation_invoice_number;
                break;
            case 'Credit_Note':
                currentNumber = provider.credit_note_invoice_number;
                break;
            case 'Delivery_Challan':
                currentNumber = provider.delivery_challan_invoice_number;
                break;
            case 'Sales_Return':
                currentNumber = provider.sales_return_invoice_number;
                break;
            case 'Proforma_Invoice':
                currentNumber = provider.proforma_invoice_number;
                break;
            case 'Purchase':
                currentNumber = provider.purchase_invoice_number || 0;
                break;
            case 'Purchase_Order':
                currentNumber = provider.purchase_order_invoice_number || 0;
                break;
            case 'Purchase_Return':
                currentNumber = provider.purchase_return_invoice_number || 0;
                break;
            case 'Debit_Note':
                currentNumber = provider.debit_note_invoice_number || 0;
                break;
            default:
                throw new Error("Invalid invoice type");
        }

        currentNumber++;

        if (provider.invoice_prefix) {
            prefix = provider.invoice_prefix;
        } else {
            prefix = generatePrefixFromCompanyName(provider.company_name);
        }

        invoiceNo = `${prefix}${currentNumber.toString().padStart(5, '0')}`;

        const updateData = {};
        switch (invoice_type) {
            case 'Sales':
                updateData.sales_invoice_number = currentNumber;
                break;
            case 'Booking':
                updateData.booking_invoice_number = currentNumber;
                break;
            case 'Quotation':
                updateData.quotation_invoice_number = currentNumber;
                break;
            case 'Credit_Note':
                updateData.credit_note_invoice_number = currentNumber;
                break;
            case 'Delivery_Challan':
                updateData.delivery_challan_invoice_number = currentNumber;
                break;
            case 'Sales_Return':
                updateData.sales_return_invoice_number = currentNumber;
                break;
            case 'Proforma_Invoice':
                updateData.proforma_invoice_number = currentNumber;
                break;
            case 'Purchase':
                updateData.purchase_invoice_number = currentNumber;
                break;
            case 'Purchase_Order':
                updateData.purchase_order_invoice_number = currentNumber;
                break;
            case 'Purchase_Return':
                updateData.purchase_return_invoice_number = currentNumber;
                break;
            case 'Debit_Note':
                updateData.debit_note_invoice_number = currentNumber;
                break;
        }

        try {
            await Provider.update({
                where: { id: provider_id },
                data: updateData
            });
        } catch (error) {
            // If the fields don't exist yet, just log the error but don't fail
            logger.warn(`Could not update provider invoice numbers: ${error.message}`);
        }

        logger.info(`Invoice number generated: ${invoiceNo}`);

        return invoiceNo;
    } catch (error) {
        throw new Error(error);
    }
};

export default generateInvoiceNo;