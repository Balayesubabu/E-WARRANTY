import { returnResponse, logger, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderById, getProviderByUserIdField, getProviderWarrantySettings } from "../get-provider-warranty-settings/query.js";
import { renderWarrantyCertificate, attachCompanyLogo } from "../../../../services/pdf/warranty-templates/index.js";

/**
 * Preview warranty certificate with sample data for the selected template.
 * Owner can view and print before saving settings.
 * Accepts any template ID; renderWarrantyCertificate resolves to classic/modern/minimal/premium.
 */
const previewCertificateTemplateEndpoint = async (req, res) => {
    try {
        logger.info("previewCertificateTemplateEndpoint");

        const provider_id_from_req = req.provider_id;
        const user_id = req.user_id;

        let provider;
        if (provider_id_from_req) {
            provider = await getProviderById(provider_id_from_req);
        } else if (user_id) {
            provider = await getProviderByUserIdField(user_id);
        }

        if (!provider) {
            logger.error(`--- Provider not found (user_id: ${user_id}) ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }

        const templateId = (req.body?.templateId || req.body?.template_id || "classic")
            .toString()
            .trim();

        const settings = await getProviderWarrantySettings(provider.id);
        const companyName = provider.company_name || "Your Company";
        const companyLogo = provider.company_logo || null;
        const customField1 = settings?.custom_field1 || "";
        const customField2 = settings?.custom_field2 || "";

        const today = new Date();
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 12);
        const warrantyStartDate = today.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
        const warrantyEndDate = endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

        const certificateData = {
            customerName: "John Doe",
            productName: "Sample Product XYZ",
            itemCode: "ITEM-001",
            serialNo: "SN-2024-001234",
            warrantyCode: "WRR-PREVIEW-001",
            warrantyStartDate,
            warrantyEndDate,
            sellerName: companyName,
            dopInstallation: warrantyStartDate,
            instNameDealer: companyName,
            vehicleNumber: "",
            vehicleChassisNumber: "",
            custom_field_name1: customField1 || "Model",
            custom_field_value1: "Demo Model",
            custom_field_name2: customField2 || "Invoice",
            custom_field_value2: "INV-2024-001",
            phone: "+91 98765 43210",
            invoiceNumber: "INV-2024-001234",
            companyName,
            companyLogoUrl: companyLogo || "",
            signatureImageUrl: provider.signature_image || "",
            qrCodeImageUrl: provider.qr_code_image || "",
            company_website: provider.company_website || "",
            terms_and_conditions: "This is a sample warranty certificate for preview purposes.",
            terms_and_conditions_link: "",
        };

        await attachCompanyLogo(certificateData);
        const pdfBase64 = await renderWarrantyCertificate(templateId, certificateData);

        return returnResponse(res, StatusCodes.OK, "Preview generated successfully", {
            data: pdfBase64,
            templateId,
        });
    } catch (error) {
        logger.error(`previewCertificateTemplateEndpoint error: ${error?.message || error}`);
        if (error?.stack) logger.error(error.stack);
        const msg = error?.response?.data?.message || error?.message || "Failed to generate preview";
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, msg);
    }
};

export default previewCertificateTemplateEndpoint;
