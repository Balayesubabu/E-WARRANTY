import { returnResponse, logger, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getUserById, getCustomerWarranties } from "./query.js";

/**
 * GET /e-warranty/warranty-customer/my-warranties
 * Middleware: verifyCustomerToken
 * 
 * Returns all warranty registrations for the logged-in customer.
 * Matches by phone_number and/or email from the User table
 * against the ProviderWarrantyCustomer table.
 */
const myWarrantiesEndpoint = async (req, res) => {
    try {
        logger.info(`myWarrantiesEndpoint`);
        
        const user_id = req.user_id;
        logger.info(`--- Fetching user with id: ${user_id} ---`);
        
        const user = await getUserById(user_id);
        if (!user) {
            logger.error(`--- User not found with id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User not found");
        }
        
        logger.info(`--- User found: ${user.phone_number}, ${user.email} ---`);
        
        // Fetch warranties by phone number and/or email
        const warranties = await getCustomerWarranties(user.phone_number, user.email);
        
        logger.info(`--- Found ${warranties.length} warranties for customer ---`);
        
        // Transform the data for the frontend
        const transformedWarranties = warranties.map(w => {
            // Calculate warranty expiry from warranty code data
            let warrantyFrom = w.date_of_installation ? new Date(w.date_of_installation) : null;
            let warrantyTo = null;
            let warrantyDays = null;
            
            if (w.provider_warranty_code) {
                warrantyDays = w.provider_warranty_code.warranty_days;
                if (warrantyFrom && warrantyDays) {
                    warrantyTo = new Date(warrantyFrom);
                    warrantyTo.setDate(warrantyFrom.getDate() + warrantyDays);
                }
                // Fallback to warranty code's own dates
                if (!warrantyTo && w.provider_warranty_code.warranty_to) {
                    warrantyTo = new Date(w.provider_warranty_code.warranty_to);
                }
                if (!warrantyFrom && w.provider_warranty_code.warranty_from) {
                    warrantyFrom = new Date(w.provider_warranty_code.warranty_from);
                }
            }
            
            // Determine warranty status based on warranty_code_status and expiry
            const now = new Date();
            const warrantyCodeStatus = w.provider_warranty_code?.warranty_code_status;
            let status = 'active';
            
            // Check warranty code status first
            if (warrantyCodeStatus === 'Cancelled') {
                status = 'cancelled';
            }
            else if (warrantyCodeStatus === 'Pending') {
                status = 'pending';
            }
            // Check expiry-based status for active warranties
            else if (warrantyTo) {
                if (warrantyTo < now) {
                    status = 'expired';
                } else {
                    // Check if expiring within 30 days
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                    if (warrantyTo <= thirtyDaysFromNow) {
                        status = 'expiring';
                    }
                }
            }
            
            // Get provider/dealer name
            let dealerName = '';
            let companyName = '';
            if (w.is_provider && w.provider) {
                companyName = w.provider.company_name || '';
                dealerName = w.provider.company_name || '';
            } else if ((w.is_dealer || w.is_customer) && w.dealer) {
                dealerName = w.dealer.name || '';
                companyName = w.dealer.provider?.company_name || '';
            }
            
            // Resolve the provider_id for the contact support feature
            let resolvedProviderId = w.provider_id || '';
            if (!resolvedProviderId && w.dealer?.provider_id) {
                resolvedProviderId = w.dealer.provider_id;
            }
            if (!resolvedProviderId && w.dealer?.provider?.id) {
                resolvedProviderId = w.dealer.provider.id;
            }

            return {
                id: w.id,
                provider_id: resolvedProviderId,
                product_name: w.product_name || w.provider_warranty_code?.product_name || 'Unknown Product',
                warranty_code: w.warranty_code,
                serial_number: w.serial_number || w.provider_warranty_code?.serial_no || '',
                invoice_number: w.invoice_number || '',
                purchase_date: warrantyFrom ? warrantyFrom.toISOString() : null,
                expiry_date: warrantyTo ? warrantyTo.toISOString() : null,
                warranty_days: warrantyDays,
                status: status,
                is_active: w.is_active,
                dealer_name: dealerName,
                company_name: companyName,
                customer_name: `${w.first_name || ''} ${w.last_name || ''}`.trim(),
                phone: w.phone,
                email: w.email,
                address: w.address,
                city: w.city || '',
                state: w.state || '',
                country: w.country || '',
                product_id: w.product_id || w.provider_warranty_code?.product_id || '',
                service_id: w.service_id || w.provider_warranty_code?.service_id || '',
                date_of_installation: w.date_of_installation,
                warranty_images: w.warranty_images || [],
                warranty_type: w.provider_warranty_code?.warranty_period_readable || (warrantyDays ? `${warrantyDays} Days` : ''),
                vehicle_number: w.vehicle_number || '',
                vehicle_chassis_number: w.vehicle_chassis_number || '',
                provider_warranty_code_id: w.provider_warranty_code_id || '',
                claims: (w.WarrantyClaim || []).map(c => ({
                    id: c.id,
                    status: c.status,
                    issue_description: c.issue_description,
                    issue_category: c.issue_category,
                    priority: c.priority,
                    claim_images: c.claim_images || [],
                    resolution_notes: c.resolution_notes,
                    rejection_reason: c.rejection_reason,
                    created_at: c.created_at,
                    closed_at: c.closed_at,
                    assigned_service_center: c.assigned_service_center ? {
                        id: c.assigned_service_center.id,
                        name: c.assigned_service_center.name,
                        address: c.assigned_service_center.address,
                        phone: c.assigned_service_center.phone,
                        email: c.assigned_service_center.email
                    } : null,
                    history: (c.claim_history || []).map(h => ({
                        status: h.new_status,
                        message: h.message,
                        date: h.created_at
                    }))
                })),
                created_at: w.created_at
            };
        });
        
        return returnResponse(res, StatusCodes.OK, "Warranties fetched successfully", {
            warranties: transformedWarranties
        });
        
    } catch (error) {
        logger.error(`myWarrantiesEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch warranties");
    }
};

export { myWarrantiesEndpoint };
