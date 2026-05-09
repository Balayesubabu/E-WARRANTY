/**
 * Standalone Coin Seeder Script
 * Run with: node seed-coins.js
 * 
 * PRICING: 1 coin = 10¢ | Warranty: 3mo=1, 6mo=2, 1yr=4 coins | Profile bonus: 20 coins
 */

import { prisma } from "./prisma/db-models.js";

const seedCoinPricing = async () => {
    console.log("Seeding coin pricing...");
    console.log("📋 1 coin = 10¢ | Warranty: 3mo=1, 6mo=2, 1yr=4 coins\n");

    const pricing = [
        { action: "CREATE_DEALER", cost: 0, description: "Create dealer (FREE)" },
        { action: "ADD_PRODUCT", cost: 0, description: "Add product (FREE)" },
        { action: "GENERATE_WARRANTY_CODE", cost: 4, description: "Warranty code (1-4 coins by duration)" },
        { action: "GENERATE_QR_BATCH", cost: 4, description: "QR batch (1-4 coins per code)" },
        { action: "SEND_SMS", cost: 0, description: "Send an SMS notification (FREE)" },
        { action: "SEND_EMAIL", cost: 0, description: "Send an email notification (FREE)" },
        { action: "DOWNLOAD_REPORT", cost: 0, description: "Download a report (FREE)" },
        { action: "CREATE_STAFF", cost: 0, description: "Create a new staff member (FREE)" }
    ];

    for (const price of pricing) {
        await prisma.coinPricing.upsert({
            where: { action: price.action },
            create: { ...price, is_active: true },
            update: { cost: price.cost, description: price.description }
        });
        const status = price.cost === 0 ? "FREE" : `${price.cost} coins`;
        console.log(`  ✓ ${price.action}: ${status}`);
    }

    console.log("\n✅ Coin pricing seeded successfully!\n");
};

const seedWarrantyCostConfig = async () => {
    console.log("Seeding warranty cost config...");
    const configs = [
        { duration_months: 3, cost: 1 },
        { duration_months: 6, cost: 2 },
        { duration_months: 12, cost: 4 },
    ];
    for (const cfg of configs) {
        await prisma.warrantyCostConfig.upsert({
            where: { duration_months: cfg.duration_months },
            create: cfg,
            update: { cost: cfg.cost }
        });
        console.log(`  ✓ ${cfg.duration_months} months: ${cfg.cost} coins`);
    }
    console.log("\n✅ Warranty cost config seeded successfully!\n");
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

const main = async () => {
    console.log("\n" + "═".repeat(50));
    console.log("SEEDING SIMPLIFIED COIN SYSTEM");
    console.log("═".repeat(50));
    console.log("\n💰 1 coin = 10¢");
    console.log("🎫 Warranty: 3mo=1, 6mo=2, 1yr=4 coins");
    console.log("🎁 Profile bonus: 20 coins\n");

    try {
        await seedCoinPricing();
        await seedWarrantyCostConfig();
        await seedCoinPackages();

        console.log("═".repeat(50));
        console.log("COIN SYSTEM SEEDING COMPLETE");
        console.log("═".repeat(50) + "\n");
    } catch (error) {
        console.error("Error seeding coins:", error);
    } finally {
        await prisma.$disconnect();
    }
};

main();
