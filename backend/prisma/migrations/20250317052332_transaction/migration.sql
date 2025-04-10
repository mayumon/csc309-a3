-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "spent" REAL,
    "earned" INTEGER,
    "sender" TEXT,
    "recipient" TEXT,
    "processedBy" TEXT,
    "redeemed" TEXT,
    "amount" INTEGER NOT NULL,
    "awarded" INTEGER,
    "remark" TEXT NOT NULL DEFAULT '',
    "relatedId" INTEGER,
    "suspicious" BOOLEAN,
    "createdBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PromotionsToTransactions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PromotionsToTransactions_A_fkey" FOREIGN KEY ("A") REFERENCES "Promotion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PromotionsToTransactions_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_PromotionsToTransactions_AB_unique" ON "_PromotionsToTransactions"("A", "B");

-- CreateIndex
CREATE INDEX "_PromotionsToTransactions_B_index" ON "_PromotionsToTransactions"("B");
