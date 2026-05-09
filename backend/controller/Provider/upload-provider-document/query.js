import { Provider } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const uploadFile = async (provider_id, file_type, file_url) => {
    if (file_type === 'ADHAAR_CARD') {
        const provider = await Provider.update({
            where: {
                id: provider_id
            },
            data: {
                adhaar_card_image: file_url
            }
        })
        return provider;
    } else if (file_type === 'PAN_CARD') {
        const provider = await Provider.update({
            where: {
                id: provider_id
            },
            data: {
                pan_card_image: file_url
            }
        })
        return provider;
    } else if (file_type === 'SIGNATURE') {
        const provider = await Provider.update({
            where: {
                id: provider_id
            },
            data: {
                signature_image: file_url
            }
        })
        return provider;
    } else if (file_type === 'COVER_IMAGE') {
        const provider = await Provider.update({
            where: {
                id: provider_id
            },
            data: {
                cover_image: file_url
            }
        })
        return provider;
    } else if (file_type === 'COMPANY_LOGO') {
        const provider = await Provider.update({
            where: {
                id: provider_id
            },
            data: {
                company_logo: file_url
            }
        })
        return provider;
    } else if (file_type === 'QR_CODE') {
        const provider = await Provider.update({
            where: {
                id: provider_id
            },
            data: {
                qr_code_image: file_url
            }
        })
        return provider;
    } else {
        return null;
    }
}

export { getProviderByUserId, uploadFile };