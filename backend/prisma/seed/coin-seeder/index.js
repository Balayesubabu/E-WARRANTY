/**
 * Coin System Seeder
 * 
 * PRICING MODEL (USD):
 * - 1 coin = 10 cents ($0.10)
 * - Warranty: 3mo=1 coin, 6mo=2 coins, 1yr=4 coins per product
 * - Profile completion bonus: 20 coins
 */

import { prisma } from "../../db-models.js";

const seedCoinPricing = async () => {
    console.log("Seeding coin pricing...");
    console.log("📋 1 coin = 10¢ | Warranty: 3mo=1, 6mo=2, 1yr=4 coins\n");

    const pricing = [
        {
            action: "CREATE_DEALER",
            cost: 0,
            description: "Create a new dealer account (FREE)"
        },
        {
            action: "ADD_PRODUCT",
            cost: 0,
            description: "Add a new product to catalog (FREE)"
        },
        {
            action: "GENERATE_WARRANTY_CODE",
            cost: 4,
            description: "Generate warranty code (1-4 coins by duration: 3mo=1, 6mo=2, 1yr=4)"
        },
        {
            action: "GENERATE_QR_BATCH",
            cost: 4,
            description: "Generate QR batch (1-4 coins per code by duration)"
        },
        {
            action: "SEND_SMS",
            cost: 0,
            description: "Send an SMS notification (FREE)"
        },
        {
            action: "SEND_EMAIL",
            cost: 0,
            description: "Send an email notification (FREE)"
        },
        {
            action: "DOWNLOAD_REPORT",
            cost: 0,
            description: "Download a report (FREE)"
        },
        {
            action: "CREATE_STAFF",
            cost: 0,
            description: "Create a new staff member (FREE)"
        }
    ];

    for (const price of pricing) {
        await prisma.coinPricing.upsert({
            where: { action: price.action },
            create: {
                ...price,
                is_active: true
            },
            update: {
                cost: price.cost,
                description: price.description
            }
        });
        const status = price.cost === 0 ? "FREE" : `${price.cost} coins`;
        console.log(`  ✓ ${price.action}: ${status}`);
    }

    console.log("\n✅ Coin pricing seeded successfully!\n");
};

const seedCoinPackages = async () => {
    console.log("Seeding coin packages...");
    // Mark existing packages as deleted (cleanup old tiers)
    await prisma.coinPackage.updateMany({
        where: { is_deleted: false },
        data: { is_deleted: true },
    });
    const packages = [
        { name: "100", coins: 100, bonus_coins: 0, price: 10, currency: "USD", is_popular: false, sort_order: 0 },
        { name: "500", coins: 500, bonus_coins: 0, price: 50, currency: "USD", is_popular: false, sort_order: 1 },
        { name: "1000", coins: 1000, bonus_coins: 0, price: 100, currency: "USD", is_popular: false, sort_order: 2 },
        { name: "2000", coins: 2000, bonus_coins: 0, price: 200, currency: "USD", is_popular: false, sort_order: 3 },
    ];

    for (const pkg of packages) {
        const existing = await prisma.coinPackage.findFirst({ where: { name: pkg.name } });
        const data = {
            name: pkg.name,
            coins: pkg.coins,
            bonus_coins: pkg.bonus_coins,
            price: pkg.price,
            currency: pkg.currency,
            is_popular: pkg.is_popular,
            sort_order: pkg.sort_order,
            is_active: true,
            is_deleted: false,
        };
        if (existing) {
            await prisma.coinPackage.update({ where: { id: existing.id }, data });
        } else {
            await prisma.coinPackage.create({ data });
        }
        const sym = pkg.currency === "USD" ? "$" : "₹";
        console.log(`  ✓ ${pkg.name}: ${sym}${pkg.price} (${pkg.coins} coins)`);
    }
    console.log("\n✅ Coin packages seeded successfully!\n");
};

const seedCoins = async () => {
    console.log("\n" + "═".repeat(50));
    console.log("SEEDING SIMPLIFIED COIN SYSTEM");
    console.log("═".repeat(50));
    console.log("\n💰 1 coin = 10¢ (USD)");
    console.log("🎫 Warranty: 3mo=1, 6mo=2, 1yr=4 coins per product");
    console.log("🎁 Profile bonus: 20 coins\n");

    await seedCoinPricing();
    await seedCoinPackages();

    console.log("═".repeat(50));
    console.log("COIN SYSTEM SEEDING COMPLETE");
    console.log("═".repeat(50) + "\n");
};

export { seedCoins, seedCoinPricing, seedCoinPackages };
