-- DropForeignKey
ALTER TABLE `manualarticleversion` DROP FOREIGN KEY `ManualArticleVersion_articleId_fkey`;

-- DropIndex
DROP INDEX `Announcement_publishedAt_idx` ON `announcement`;

-- DropIndex
DROP INDEX `AuditLog_createdAt_idx` ON `auditlog`;

-- DropIndex
DROP INDEX `ManualArticleVersion_articleId_createdAt_idx` ON `manualarticleversion`;

-- AlterTable
ALTER TABLE `manualarticle` ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `Announcement_publishedAt_idx` ON `Announcement`(`publishedAt` DESC);

-- CreateIndex
CREATE INDEX `AuditLog_createdAt_idx` ON `AuditLog`(`createdAt` DESC);

-- CreateIndex
CREATE INDEX `ManualArticle_categoryId_order_idx` ON `ManualArticle`(`categoryId`, `order`);

-- CreateIndex
CREATE INDEX `ManualArticleVersion_articleId_createdAt_idx` ON `ManualArticleVersion`(`articleId`, `createdAt` DESC);

-- AddForeignKey
ALTER TABLE `ManualArticleVersion` ADD CONSTRAINT `ManualArticleVersion_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `ManualArticle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
