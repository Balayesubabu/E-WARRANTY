These folders were the previous incremental-only migrations (ALTER TABLE without a baseline).
They are archived because a fresh empty database could not apply them (e.g. "users" did not exist).

Use the single migration prisma/migrations/20240101000000_init_schema/ instead, generated from schema.prisma.

To recreate the init SQL after schema changes:
  npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
