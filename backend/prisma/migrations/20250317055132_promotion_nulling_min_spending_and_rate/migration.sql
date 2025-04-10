-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "minSpending" REAL,
    "rate" REAL,
    "points" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Promotion" ("description", "endTime", "id", "minSpending", "name", "points", "rate", "startTime", "type") SELECT "description", "endTime", "id", "minSpending", "name", "points", "rate", "startTime", "type" FROM "Promotion";
DROP TABLE "Promotion";
ALTER TABLE "new_Promotion" RENAME TO "Promotion";
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "spent" REAL,
    "earned" INTEGER,
    "sender" TEXT,
    "recipient" TEXT,
    "processedBy" TEXT,
    "redeemed" TEXT,
    "amount" INTEGER,
    "awarded" INTEGER,
    "remark" TEXT NOT NULL DEFAULT '',
    "relatedId" INTEGER,
    "suspicious" BOOLEAN,
    "createdBy" TEXT NOT NULL
);
INSERT INTO "new_Transaction" ("amount", "awarded", "createdBy", "earned", "id", "processedBy", "recipient", "redeemed", "relatedId", "remark", "sender", "spent", "suspicious", "type", "utorid") SELECT "amount", "awarded", "createdBy", "earned", "id", "processedBy", "recipient", "redeemed", "relatedId", "remark", "sender", "spent", "suspicious", "type", "utorid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
