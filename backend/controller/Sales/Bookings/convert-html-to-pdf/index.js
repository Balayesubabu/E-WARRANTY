import {logger, returnError, returnResponse} from "../../../../services/logger.js";
import {StatusCodes} from "http-status-codes";
import puppeteer from "puppeteer";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const convertHtmlToPdfEndpoint = async (req, res) => {
    try {
        logger.info(`convertHtmlToPdfEndpoint`);
        const {htmlContent,booking_id} = req.body;
        let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const franchise_id = req.franchise_id;
        const html = htmlContent;
        const booking_id_local = booking_id;

        // Simulate PDF conversion (replace with actual conversion logic)
        const browser = await puppeteer.launch({ headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
        });

        await browser.close();
        console.log(booking_id_local, " booking_id_local");
        const fileName = `invoice_${booking_id_local}_provider_${franchise_id}`;
        const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');


        return returnResponse(res, StatusCodes.OK, `PDF generated successfully`, s3Url);
    } catch (error) {
        logger.error(`Error in convertHtmlToPdfEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in convertHtmlToPdfEndpoint`);
    }
};

export {convertHtmlToPdfEndpoint};