-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "vertical" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "discoverable" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" DATETIME,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mcpUrl" TEXT NOT NULL DEFAULT '',
    "restUrl" TEXT NOT NULL DEFAULT '',
    "healthUrl" TEXT NOT NULL DEFAULT '',
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "trustLevel" TEXT NOT NULL DEFAULT 'unverified',
    "lastSeen" DATETIME,
    "registeredAt" DATETIME
);
INSERT INTO "new_Organization" ("claimedAt", "contactEmail", "country", "createdAt", "description", "discoverable", "id", "location", "name", "slug", "updatedAt", "verifiedAt", "vertical") SELECT "claimedAt", "contactEmail", "country", "createdAt", "description", "discoverable", "id", "location", "name", "slug", "updatedAt", "verifiedAt", "vertical" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_country_slug_idx" ON "Organization"("country", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
