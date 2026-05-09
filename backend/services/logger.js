import winston from "winston";
import { PrismaClient } from "@prisma/client";

let prisma = null;

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: "error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: "combined.log",
      format: winston.format.combine(
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    }),
  ],
});

const initializePrisma = async () => {
  if (!prisma) {
    try {
      prisma = new PrismaClient({
        datasources: {
          db: {
            // Use the real DATABASE_URL as-is. Rewriting the protocol breaks auth.
            url: process.env.DATABASE_URL,
          },
        },
      });
      // Test the connection
      await prisma.$connect();
      logger.info("Successfully connected to database");
    } catch (error) {
      logger.error("Failed to initialize Prisma client:", error);
      throw error;
    }
  }
  return prisma;
};

export const logDatabaseInfo = async () => {
  try {
    const client = await initializePrisma();
    const dbInfo =
      await client.$queryRaw`SELECT current_database() as db_name, current_user as db_user, version() as db_version`;
    logger.info(`Database Connection Info:
    Environment: ${process.env.NODE_ENV}
    Database: ${dbInfo[0].db_name}
    User: ${dbInfo[0].db_user}
    Version: ${dbInfo[0].db_version}`);
  } catch (error) {
    logger.error("Failed to get database info:", error);
  }
};

export const returnResponse = (res, status, message, data) => {
  res.status(status).json({
    status: status,
    message: message,
    data: data,
  });
};

export const returnError = (res, status, message, data) => {
  res.status(status).json({
    status: status,
    message: message,
    data: data,
  });
};
