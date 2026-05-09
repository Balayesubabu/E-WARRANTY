import https from "https";

/**
 * Fetch image from URL and return as Buffer (for use in PDF templates).
 * @param {string} url
 * @returns {Promise<Buffer|null>}
 */
export function fetchImage(url) {
    if (!url || typeof url !== "string") return Promise.resolve(null);
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const buffers = [];
                response.on("data", (chunk) => buffers.push(chunk));
                response.on("end", () => resolve(Buffer.concat(buffers)));
            } else {
                resolve(null);
            }
        }).on("error", () => resolve(null));
    });
}
