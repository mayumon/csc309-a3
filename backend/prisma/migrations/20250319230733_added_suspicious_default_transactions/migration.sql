-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "spent" REAL,
    "sender" TEXT,
    "recipient" TEXT,
    "processedBy" TEXT,
    "redeemed" TEXT,
    "amount" INTEGER,
    "awarded" INTEGER,
    "remark" TEXT NOT NULL DEFAULT '',
    "relatedId" INTEGER,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL
);
INSERT INTO "new_Transaction" ("amount", "awarded", "createdBy", "id", "processedBy", "recipient", "redeemed", "relatedId", "remark", "sender", "spent", "suspicious", "type", "utorid") SELECT "amount", "awarded", "createdBy", "id", "processedBy", "recipient", "redeemed", "relatedId", "remark", "sender", "spent", coalesce("suspicious", false) AS "suspicious", "type", "utorid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
