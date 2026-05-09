import { customAlphabet } from "nanoid";
import { logger } from "./logger.js";

const generateNanoId = (type, length) => {
    try {
        logger.info(`generateNanoId`);

        let characters = "";
        if (type === "Numeric") {
            characters = "0123456789";
        } else if (type === "Alphabetic") {
            characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        } else if (type === "AlphaNumeric") {
            characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        }

        logger.info(`--- Generating nano id with length: ${length} ---`);
        const nanoid = customAlphabet(characters, length);
        const id = nanoid().toString().toUpperCase();
        logger.info(`--- Nano id generated: ${id} ---`);
        return id;
    } catch (error) {
        logger.error(`generateNanoId error: ${error}`);
        throw error;
    }
}

export { generateNanoId };