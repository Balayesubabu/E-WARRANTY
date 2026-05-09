import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "superadmin@gmail.com";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "@Superadmin123";
const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE || "0000000000";

export default async function seedSuperAdmin() {
    if (!SUPER_ADMIN_PASSWORD || SUPER_ADMIN_PASSWORD.length < 6) {
        throw new Error(
            "SUPER_ADMIN_PASSWORD must be set in .env and be at least 6 characters. " +
            "Example: SUPER_ADMIN_EMAIL=admin@yourcompany.com SUPER_ADMIN_PASSWORD=YourSecurePass123"
        );
    }
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    // Link this user to canonical Role (Role.code = SUPER_ADMIN) when available
    let superAdminRoleId = null;
    try {
        const role = await prisma.role.findFirst({
            where: { code: "SUPER_ADMIN" },
            select: { id: true },
        });
        superAdminRoleId = role?.id ?? null;
    } catch {
        // If Role model/table/column isn't available yet, keep legacy behavior
        superAdminRoleId = null;
    }

    const existing = await prisma.user.findFirst({
        where: { user_type: "super_admin" },
    });
    if (existing) {
        await prisma.user.update({
            where: { id: existing.id },
            data: {
                password: hashedPassword,
                is_active: true,
                is_blocked: false,
                is_deleted: false,
                email: SUPER_ADMIN_EMAIL,
                ...(superAdminRoleId ? { role_id: superAdminRoleId } : {}),
            },
        });
        console.log("Super Admin password reset from env:", existing.email);
        await prisma.$disconnect();
        return existing;
    }

    const user = await prisma.user.create({
        data: {
            email: SUPER_ADMIN_EMAIL,
            phone_number: SUPER_ADMIN_PHONE,
            password: hashedPassword,
            user_type: "super_admin",
            first_name: "Super",
            last_name: "Admin",
            is_active: true,
            is_blocked: false,
            is_phone_verified: true,
            is_email_verified: true,
            ...(superAdminRoleId ? { role_id: superAdminRoleId } : {}),
        },
    });

    console.log("Super Admin created/updated:", user.email, "| Password set from env or default");
    await prisma.$disconnect();
    return user;
}
