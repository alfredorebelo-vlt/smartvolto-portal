-- DropForeignKey
ALTER TABLE `manualarticleversion` DROP FOREIGN KEY `ManualArticleVersion_articleId_fkey`;

-- DropIndex
DROP INDEX `Announcement_publishedAt_idx` ON `announcement`;

-- DropIndex
DROP INDEX `AuditLog_createdAt_idx` ON `auditlog`;

-- DropIndex
DROP INDEX `ManualArticleVersion_articleId_createdAt_idx` ON `manualarticleversion`;

-- CreateTable
CREATE TABLE `DashboardWidget` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `config` JSON NOT NULL,
    `col` INTEGER NOT NULL DEFAULT 1,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `roleIds` JSON NOT NULL,
    `cacheTtl` INTEGER NOT NULL DEFAULT 300,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DashboardWidget_isActive_col_order_idx`(`isActive`, `col`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Announcement_publishedAt_idx` ON `Announcement`(`publishedAt` DESC);

-- CreateIndex
CREATE INDEX `AuditLog_createdAt_idx` ON `AuditLog`(`createdAt` DESC);

-- CreateIndex
CREATE INDEX `ManualArticleVersion_articleId_createdAt_idx` ON `ManualArticleVersion`(`articleId`, `createdAt` DESC);

-- AddForeignKey
ALTER TABLE `ManualArticleVersion` ADD CONSTRAINT `ManualArticleVersion_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `ManualArticle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
