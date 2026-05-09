import nodemailer from "nodemailer";
import { logger } from "./logger.js";

// Track email configuration status
let emailConfigValid = null;

/** Default strict TLS. Set SMTP_TLS_REJECT_UNAUTHORIZED=false only behind a trusted SSL-inspecting proxy (security tradeoff). */
const smtpTlsRejectUnauthorized = () => {
    const v = (process.env.SMTP_TLS_REJECT_UNAUTHORIZED ?? "true").toLowerCase();
    return v !== "false" && v !== "0";
};

const createTransporter = () => {
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: smtpTlsRejectUnauthorized(),
        },
    });
};

// Verify SMTP credentials once at startup
const verifyEmailConfig = async () => {
    if (emailConfigValid !== null) return emailConfigValid;
    try {
        const transporter = createTransporter();
        await transporter.verify();
        emailConfigValid = true;
        console.log(`\n[EMAIL] SMTP connection verified successfully (${process.env.SMTP_USER})\n`);
        return true;
    } catch (error) {
        emailConfigValid = false;
        const msg = String(error?.message || error);
        const looksLikeTls =
            /certificate|self-signed|TLS|SSL|UNABLE_TO_VERIFY|cert/i.test(msg);
        console.log(`\n========================================`);
        console.log(`  [EMAIL WARNING] SMTP verification failed`);
        console.log(`  Host: ${process.env.SMTP_HOST}`);
        console.log(`  User: ${process.env.SMTP_USER}`);
        console.log(`  Error: ${msg}`);
        console.log(`  `);
        console.log(`  Emails will NOT be delivered until this is fixed.`);
        console.log(`  OTP codes are logged in the console when applicable.`);
        console.log(`  `);
        if (looksLikeTls) {
            console.log(`  TLS: add your proxy CA via NODE_EXTRA_CA_CERTS, or set`);
            console.log(`  SMTP_TLS_REJECT_UNAUTHORIZED=false (trusted networks only).`);
        } else {
            console.log(`  Auth: confirm SMTP_USER / SMTP_PASS (e.g. Gmail App Password).`);
        }
        console.log(`========================================\n`);
        return false;
    }
};

// Run verification on module load
verifyEmailConfig();

/**
 * Send an email.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text or HTML)
 * @param {{ html?: boolean }} options - Optional: { html: true } to send body as HTML (renders tags)
 */
const sendEmail = async (to, subject, body, options = {}) => {
    try {
        logger.info(`sendEmail`);
        
        // Check if email config is known to be invalid
        if (emailConfigValid === false) {
            const msg = `Email not sent to ${to} (SMTP verification failed at startup — see server logs).`;
            logger.warn(msg);
            console.log(`[EMAIL SKIPPED] ${msg}`);
            return { skipped: true, message: msg };
        }

        const transporter = createTransporter();

        const mailOptions = {
            from: {
                name: process.env.FROM_NAME,
                address: process.env.FROM_EMAIL
            },
            to,
            subject,
            ...(options.html ? { html: body } : { text: body })
        };

        logger.info(`--- Sending email to ${to} ---`);
        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    logger.error(`Error sending email: ${error}`);
                    // Mark config as invalid for future calls
                    if (error.message && error.message.includes('Username and Password not accepted')) {
                        emailConfigValid = false;
                    }
                    reject(error);
                } else {
                    logger.info(`--- Data received from email service: ${info} ---`);
                    logger.info(`--- Email sent: ${info.messageId} ---`);
                    resolve(info);
                }
            });
        });
    } catch (error) {
        logger.error(`Error sending email: ${error}`);
        throw error;
    }
}

const sendEmailWithAttachment = async (to, subject, text, finalString) => {
    try {
        logger.info(`sendEmailWithAttachment`);
        const transporter = createTransporter();

        const mailOptions = {
            from: {
                name: process.env.FROM_NAME,
                address: process.env.FROM_EMAIL
            },
            to,
            subject,
            html: text,
            attachments: [
                {
                    filename: 'warranty.pdf',
                    content: finalString,
                    encoding: 'base64'
                }
            ]
        };

        logger.info(`--- Sending email to ${to} ---`);
        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    logger.error(`Error sending email: ${error}`);
                    reject(error);
                } else {
                    logger.info(`--- Data received from email service: ${info} ---`);
                    logger.info(`--- Email sent: ${info.messageId} ---`);
                    resolve(info);
                }
            });
        });
    } catch (error) {
        logger.error(`Error sending email with attachment: ${error}`);
        throw error;
    }
}

const sendEmailWithCertificateAttachment = async (to, subject, text, finalString,fileName) => {
    try {
        logger.info(`sendEmailWithCertificateAttachment`);
        const transporter = createTransporter();

        const mailOptions = {
            from: {
                name: process.env.FROM_NAME,
                address: process.env.FROM_EMAIL
            },
            to,
            subject,
            html: text,
            attachments: [
                {
                    filename: fileName,
                    content: finalString,
                    encoding: 'base64'
                }
            ]
        };

        logger.info(`--- Sending email to ${to} ---`);
        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    logger.error(`Error sending email: ${error}`);
                    reject(error);
                } else {
                    logger.info(`--- Data received from email service: ${info} ---`);
                    logger.info(`--- Email sent: ${info.messageId} ---`);
                    resolve(info);
                }
            });
        });
    } catch (error) {
        logger.error(`Error sending email with attachment: ${error}`);
        throw error;
    }
}


export { sendEmail, sendEmailWithAttachment,sendEmailWithCertificateAttachment };