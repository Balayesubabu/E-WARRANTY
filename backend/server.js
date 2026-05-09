import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import http from "http";
import { logger, logDatabaseInfo } from "./services/logger.js";
import router from "./router/router.js";
import { startScheduler } from "./scheduler/index.js";
import { seedCanonicalRoles } from "./utils/seedRoles.js";
import seedSuperAdmin from "./prisma/seed/super-admin-seeder/index.js";
import { prisma } from "./prisma/db-models.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ═══════════════════════════════════════════════════════════════
// Security Middleware
// ═══════════════════════════════════════════════════════════════

// Helmet: Adds security headers (XSS protection, clickjacking prevention, etc.)
// Safe to use - only adds headers, doesn't modify business logic
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images/resources to load
    contentSecurityPolicy: false, // Disable CSP for now to avoid breaking frontend assets
}));

// CORS Configuration
// Supports both development (localhost) and production (custom domains)
const getAllowedOrigins = () => {
    // Default development origins
    // const devOrigins = [
    //     'http://localhost:3000',
    //     'http://localhost:5173',  // Vite default
    //     'http://localhost:5174',  // Vite alternate
    //     'http://localhost:5000',
    //     'http://127.0.0.1:3000',
    //     'http://127.0.0.1:5173',
    //     'http://127.0.0.1:5000',
    // ];
    
    const devOrigins = [ // optional, if you open the app with 127.0.0.1
            process.env.FRONTEND_URL,
      ];

    // Production origins from environment variable (comma-separated)
    // Example: ALLOWED_ORIGINS=https://ewarrantify.com,https://www.ewarrantify.com
    const prodOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : [];
    
    return [...devOrigins, ...prodOrigins];
};

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) {
            return callback(null, true);
        }
        
        // Check if origin is allowed
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // In development, allow all origins for easier testing
        if (process.env.NODE_ENV !== 'production') {
            logger.info(`CORS: Allowing unlisted origin in dev mode: ${origin}`);
            return callback(null, true);
        }
        
        // In production, reject unknown origins
        logger.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'franchise_id', 'is_staff', 'is_dealer', 'is_service_center'],
};

app.use(cors(corsOptions));

// In development, use a high limit so dashboard/notifications don't hit 429; in production keep strict
const rateLimitMax = process.env.NODE_ENV === "production" ? 200 : 2000;
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: rateLimitMax,
    message: { status: "error", message: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.use("/api/subscription/razorpay-webhook", express.raw({ type: "application/json" }), (req, res, next) => {
    req.rawBody = req.body.toString("utf8");
    try {
        req.body = JSON.parse(req.rawBody);
    } catch (e) {
        req.body = {};
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT;

// Log startup information
logger.info(`Starting server in ${process.env.NODE_ENV} mode`);
logger.info(`Server will run on port ${PORT}`);

// Log database information
logDatabaseInfo().catch(error => {
  logger.error('Failed to log database info:', error);
});

app.use("/api", router);

app.get("/", (req, res) => res.send("Hello World!"));

async function isAuthBootstrapSeeded() {
  try {
    const roleCount = await prisma.role.count({
      where: { is_deleted: false, code: { in: ["SUPER_ADMIN", "BUSINESS_OWNER", "CUSTOMER"] } },
    });
    if (roleCount < 3) return false;

    const subRoleCount = await prisma.subRole.count({
      where: { code: { in: ["DEALER", "STAFF", "SERVICE_CENTER"] } },
    });
    if (subRoleCount < 3) return false;

    const superAdmin = await prisma.user.findFirst({
      where: {
        user_type: "super_admin",
        is_deleted: false,
        is_active: true,
        is_blocked: false,
      },
      select: { id: true, role_id: true },
    });
    if (!superAdmin?.id) return false;
    if (!superAdmin.role_id) return false;

    return true;
  } catch (e) {
    logger.warn(`Seed check failed; will attempt seeding: ${e?.message || e}`);
    return false;
  }
}

(async () => {
  try {
    const alreadySeeded = await isAuthBootstrapSeeded();
    if (alreadySeeded) {
      logger.info("Auth bootstrap already seeded (roles/sub-roles/super-admin). Skipping.");
    } else {
      // Seed order: Role -> SubRole (inside seedCanonicalRoles) -> SuperAdmin
      await seedCanonicalRoles();
      try {
        logger.info("Seeding Super Admin...");
        await seedSuperAdmin();
      } catch (e) {
        logger.error(`Super Admin seed failed: ${e?.message || e}`);
      }
    }
    logger.info("Seeding completed");
  } catch (e) {
    logger.error(`Canonical role seed failed: ${e?.message || e}`);
  }

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server is running on port ${PORT}`);

    startScheduler().catch((error) => {
      logger.error(`Failed to start scheduler: ${error}`);
    });
  });
})();

export { app, server };
