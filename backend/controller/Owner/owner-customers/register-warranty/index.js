import { StatusCodes } from "http-status-codes";
import { returnError, returnResponse, logger } from "../../../../services/logger.js";
import { createAuditLog } from "../../../../services/auditLogService.js";
import { sendEmail, sendEmailWithCertificateAttachment } from "../../../../services/email.js";
import { renderWarrantyCertificate, attachCompanyLogo } from "../../../../services/pdf/warranty-templates/index.js";
import { getProviderByUserId } from "../query.js";
import {
  checkWarrantyCodeWithProviderById,
  getWarrantyCodeByAllfields,
  checkIfWarrantyCodeIsRegistered,
  updateWarrantyCode,
  updateCustomFields,
  createWarrantyCustomerFromProvider,
  getProviderById,
  getSettingsByProviderId,
} from "../../../E-Warranty/Warranty-Customer/register-customer/query.js";
import { findOrCreateCustomerAccount } from "../../../E-Warranty/Warranty-Customer/register-customer/index.js";

/**
 * POST /owner/customers/register-warranty
 * Owner registers a warranty for a customer (direct, no dealer).
 * Creates ProviderWarrantyCustomer with dealer_id = null and finds/creates User so customer can log in.
 */
const registerWarrantyEndpoint = async (req, res) => {
  try {
    logger.info("registerWarrantyEndpoint");

    const provider = await getProviderByUserId(req.user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const {
      warranty_code,
      first_name,
      last_name,
      phone,
      email,
      date_of_installation,
      invoice_number,
      address,
      city,
      state,
      country,
      vehicle_number,
      vehicle_chassis_number,
      custom_field_values: bodyCustomFieldValues,
    } = req.body;

    if (!warranty_code || !first_name || !last_name || !phone || !email || !date_of_installation) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "warranty_code, first_name, last_name, phone, email, and date_of_installation are required"
      );
    }

    const checkWithProvider = await checkWarrantyCodeWithProviderById(provider.id, warranty_code);
    if (!checkWithProvider) {
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        "This warranty code does not belong to your account. Please enter a valid code."
      );
    }

    const warranty_code_data = await getWarrantyCodeByAllfields(warranty_code, null, null, null);
    if (!warranty_code_data) {
      return returnError(res, StatusCodes.NOT_FOUND, "Warranty code not found");
    }

    const isRegistered = await checkIfWarrantyCodeIsRegistered(warranty_code, null, null, null);
    if (isRegistered) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Warranty code is already registered");
    }

    if (warranty_code_data.warranty_code_status === "Active") {
      return returnError(res, StatusCodes.BAD_REQUEST, "Warranty code is already active");
    }
    if (warranty_code_data.warranty_code_status !== "Inactive") {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Warranty code cannot be used (status: ${warranty_code_data.warranty_code_status})`
      );
    }

    const warranty_days = warranty_code_data.warranty_days ?? 0;
    const new_warranty_from = new Date(date_of_installation);
    if (isNaN(new_warranty_from.getTime())) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Invalid date_of_installation");
    }
    const date_of_installation_iso = new_warranty_from.toISOString();
    const new_warranty_to = new Date(
      new_warranty_from.getTime() + warranty_days * 24 * 60 * 60 * 1000
    );

    if (
      bodyCustomFieldValues &&
      typeof bodyCustomFieldValues === "object" &&
      Object.keys(bodyCustomFieldValues).length > 0
    ) {
      await updateCustomFields(
        warranty_code,
        undefined,
        undefined,
        bodyCustomFieldValues
      );
    }

    const providerSettingsForTemplate = await getSettingsByProviderId(provider.id);
    const certificateTemplate = (providerSettingsForTemplate?.certificate_template || "classic").toString().trim();

    const created_warranty_customer = await createWarrantyCustomerFromProvider(
      provider.id,
      warranty_code_data.id,
      true,
      false,
      false,
      (first_name || "").trim(),
      (last_name || "").trim(),
      (phone || "").trim(),
      (email || "").trim(),
      address || "",
      city || null,
      state || null,
      country || null,
      invoice_number || null,
      warranty_code_data,
      warranty_code_data?.service_id ?? null,
      vehicle_number || null,
      vehicle_chassis_number || null,
      warranty_code,
      date_of_installation_iso,
      true,
      [],
      certificateTemplate
    );

    if (!created_warranty_customer) {
      return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create warranty customer");
    }

    const updated_code = await updateWarrantyCode(
      warranty_code,
      new_warranty_from,
      new_warranty_to,
      "Active"
    );
    if (!updated_code) {
      logger.warn("registerWarrantyEndpoint: updateWarrantyCode failed after creating customer");
    }

    const accountResult = await findOrCreateCustomerAccount({
      first_name: (first_name || "").trim(),
      last_name: (last_name || "").trim(),
      phone: (phone || "").trim(),
      email: (email || "").trim(),
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
    });
    const customerUser = accountResult?.user;
    const isNewAccount = accountResult?.isNewAccount ?? false;

    const expirydate = new_warranty_to.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const providerData = await getProviderById(provider.id);
    const comapanyName = providerData?.company_name || "";
    const companyLogo = providerData?.company_logo;
    const providerSettings = await getSettingsByProviderId(provider.id);
    let custom_field_name1 = "";
    let custom_field_name2 = "";
    if (providerSettings) {
      custom_field_name1 = providerSettings.custom_field1 || "";
      custom_field_name2 = providerSettings.custom_field2 || "";
    }
    const custom_field_value1 = warranty_code_data.custom_value1 || "";
    const custom_field_value2 = warranty_code_data.custom_value2 || "";
    const warrantyStartDateFormatted = new_warranty_from.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const nameParts = [first_name, last_name].filter(Boolean).map((s) => String(s).trim());
    const customerName =
      nameParts.length === 2 && nameParts[0] === nameParts[1] ? nameParts[0] : nameParts.join(" ");
    const certificateData = {
      customerName,
      productName: warranty_code_data?.product_name || "",
      itemCode: warranty_code_data?.product_id || warranty_code_data?.service_id || "",
      warrantyStartDate: warrantyStartDateFormatted,
      warrantyEndDate: expirydate,
      sellerName: comapanyName || "N/A",
      dopInstallation: warrantyStartDateFormatted,
      instNameDealer: comapanyName || "N/A",
      vehicleNumber: vehicle_number || "",
      vehicleChassisNumber: vehicle_chassis_number || "",
      custom_field_name1,
      custom_field_value1,
      custom_field_name2,
      custom_field_value2,
      phone: phone || "",
      serialNo: warranty_code_data?.serial_no || "",
      warrantyCode: warranty_code || "",
      invoiceNumber: invoice_number || "",
      companyName: comapanyName || "",
      companyLogoUrl: companyLogo || "",
      signatureImageUrl: providerData?.signature_image || "",
      qrCodeImageUrl: providerData?.qr_code_image || "",
      company_website: providerData?.company_website || "",
      terms_and_conditions: Array.isArray(warranty_code_data?.terms_and_conditions)
        ? warranty_code_data.terms_and_conditions.join("\n")
        : warranty_code_data?.terms_and_conditions || "",
      terms_and_conditions_link:
        warranty_code_data?.terms_and_conditions_link || warranty_code_data?.terms_url || "",
    };
    await attachCompanyLogo(certificateData);
    // Use ONLY provider settings (Warranty Settings) so selected template is always used
    const rawTemplate = (providerSettings?.certificate_template || "classic").toString().trim();
    const templateId = (rawTemplate || "classic").toLowerCase();
    const finalString = await renderWarrantyCertificate(templateId, certificateData);
    const message = `Welcome!<br><br>Your ${comapanyName} E-Warranty number-${warranty_code}, is valid Until ${expirydate}.<br><br>Thank you!<br>Powered by GVCC Solutions Private Limited.`;
    const fileName = `${first_name} ${last_name} ${comapanyName} - Warranty.pdf`;
    sendEmailWithCertificateAttachment(email, "Warranty Document", message, finalString, fileName).catch(
      (err) => logger.warn(`Owner register-warranty email failed: ${err.message}`)
    );

    if (isNewAccount && email) {
      const welcomeMessage = `
        <h2>Welcome to ${comapanyName}!</h2>
        <p>Your warranty has been registered successfully.</p>
        <p><strong>Warranty Code:</strong> ${warranty_code}</p>
        <p><strong>Product:</strong> ${warranty_code_data?.product_name || "N/A"}</p>
        <p><strong>Valid Until:</strong> ${expirydate}</p>
        <br>
        <p><strong>Good news!</strong> Your account has been created automatically.</p>
        <p>You can log in to your dashboard with your phone number or email using OTP to view warranties, file claims, and more.</p>
        <br>
        <p>Thank you for choosing ${comapanyName}!</p>
        <p>Powered by GVCC Solutions Private Limited.</p>
      `;
      sendEmail(email, `Welcome to ${comapanyName} - Your Account is Ready!`, welcomeMessage, {
        html: true,
      }).catch((err) => logger.warn(`Welcome email failed: ${err.message}`));
    }

    createAuditLog({
      entity_type: "WarrantyRegistration",
      entity_id: created_warranty_customer.id,
      action: "REGISTER",
      performed_by: `owner:${req.user_id}`,
      old_values: null,
      new_values: { warranty_code, product_name: warranty_code_data?.product_name, status: "Active" },
      ip_address: req.ip || req.headers?.["x-forwarded-for"] || null,
      user_agent: req.headers?.["user-agent"] || null,
    }).catch((err) => logger.warn(`Audit log failed: ${err.message}`));

    return returnResponse(res, StatusCodes.OK, "Warranty registered successfully", {
      created_warranty_customer: {
        id: created_warranty_customer.id,
        warranty_code: created_warranty_customer.warranty_code,
        first_name: created_warranty_customer.first_name,
        last_name: created_warranty_customer.last_name,
        phone: created_warranty_customer.phone,
        email: created_warranty_customer.email,
        warranty_to: new_warranty_to,
      },
      account_created: isNewAccount,
      has_account: !!customerUser,
      can_access_dashboard: !!customerUser,
    });
  } catch (error) {
    logger.error(`registerWarrantyEndpoint error: ${error.message}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to register warranty for customer"
    );
  }
};

export { registerWarrantyEndpoint };
