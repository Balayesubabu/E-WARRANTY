import AWS from 'aws-sdk';
import { logger } from './logger.js';
import { StatusCodes } from 'http-status-codes';
import dotenv from 'dotenv';

dotenv.config();

// AWS.config.update({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: 'ap-south-1'
// });

const timestamp = Date.now();

AWS.config.update({
    accessKeyId: process.env.CloudFlare_Access_Key_ID,
    secretAccessKey: process.env.CloudFlare_Secret_Access_Key,
    endpoint: `https://${process.env.CloudFlare_Account_ID}.r2.cloudflarestorage.com`,
    region: 'auto',
    signatureVersion: 'v4',
});

const s3 = new AWS.S3();

const uploadSingleImage = async (file) => {
    logger.info(`uploadSingleImage`);

    // const params = {
    //     Bucket: 'sharyo-test',
    //     Key: `images/${file.originalname}${new Date()}`,
    //     Body: file.buffer,
    //     ContentType: file.mimetype,
    // };
    const cleanFileName = `${timestamp}-${file.originalname}`;
    const params = {
        Bucket: 'sharyo-test',
        Key: `files/${cleanFileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read', // not required in R2
    };

    try {
        logger.info(`--- Uploading Image with params ---`);
        const data = await s3.upload(params).promise();

        if (!data.Location) {
            logger.error(`--- Image upload failed ---`);
            throw new Error('Image upload failed');
        }

        logger.info(`--- Image uploaded successfully with location ${data.Location} ---`);
        const publicUrl = `https://pub-${process.env.cloudFlare_Public_key}.r2.dev/files/${cleanFileName}`;
        return publicUrl;
        // return data.Location;
    } catch (err) {
        logger.error(`--- Error uploading file: ${err} ---`);
        throw err;
    }
};

// const uploadPdfToS3 = async (pdfBuffer, fileName) => {
//     logger.info(`uploadPdfToS3`);

//     const params = {
//         Bucket: 'sharyo-test',
//         Key: `images/${fileName}-${Date.now()}`,
//         Body: pdfBuffer,
//         ContentType: 'application/pdf'
//     };

//     try {
//         logger.info(`--- Uploading PDF with params ${JSON.stringify(params)} ---`);
//         const data = await s3.upload(params).promise();

//         if (!data.Location) {
//             logger.error(`--- PDF upload failed ---`);
//             throw new Error('PDF upload failed');
//         }

//         logger.info(`--- PDF uploaded successfully with location ${data.Location} ---`);
//         return data.Location;
//     } catch (err) {
//         logger.error(`--- Error uploading file: ${err} ---`);
//         throw err;
//     }
// };
const uploadPdfToS3 = async (fileBuffer, fileName, fileType = 'pdf') => {
    logger.info(`uploadPdfToS3 - fileType: ${fileType}`);

    // Determine extension and content type based on fileType
    const extension = fileType === 'zip' ? 'zip' : 'pdf';
    const contentType = fileType === 'zip' ? 'application/zip' : 'application/pdf';
    const cleanFileName = `${timestamp}-${fileName}`;

    // const params = {
    //     Bucket: 'sharyo-test',
    //     Key: `files/${fileName}-${Date.now()}.${extension}`,
    //     Body: fileBuffer,
    //     ContentType: contentType
    // };
    const params = {
        Bucket: 'sharyo-test',
        Key: `files/${cleanFileName}`,
        Body: fileBuffer,
        ContentType: contentType,
        // ACL: 'public-read', // not required in R2
    };

    try {
        // logger.info(`--- Uploading ${fileType.toUpperCase()} with params ${JSON.stringify(params)} ---`);
        const data = await s3.upload(params).promise();

        if (!data.Location) {
            logger.error(`--- ${fileType.toUpperCase()} upload failed ---`);
            throw new Error(`${fileType.toUpperCase()} upload failed`);
        }

        logger.info(`--- ${fileType.toUpperCase()} uploaded successfully with location ${data.Location} ---`);
        const publicUrl = `https://pub-${process.env.cloudFlare_Public_key}.r2.dev/files/${cleanFileName}`;

        return publicUrl;
    } catch (err) {
        logger.error(`--- Error uploading file: ${err} ---`);
        throw err;
    }
};

export { uploadSingleImage, uploadPdfToS3 };