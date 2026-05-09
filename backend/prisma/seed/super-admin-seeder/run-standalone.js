import "dotenv/config";
import seedSuperAdmin from "./index.js";

seedSuperAdmin()
    .then((user) => {
        console.log("\n✓ Super Admin ready.");
        console.log("  Email:", user?.email || "superadmin@ewarrantyfy.com");
        console.log("  Password: (use .env SUPER_ADMIN_PASSWORD or change via dashboard)\n");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Super Admin seed failed:", err?.message || err);
        process.exit(1);
    });
