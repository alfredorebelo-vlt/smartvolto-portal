-- DropForeignKey
ALTER TABLE `manualarticleversion` DROP FOREIGN KEY `ManualArticleVersion_articleId_fkey`;

-- DropIndex
DROP INDEX `Announcement_publishedAt_idx` ON `announcement`;

-- DropIndex
DROP INDEX `AuditLog_createdAt_idx` ON `auditlog`;

-- DropIndex
DROP INDEX `ManualArticleVersion_articleId_createdAt_idx` ON `manualarticleversion`;

-- CreateTable
CREATE TABLE `Tool` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `content` LONGTEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `roleIds` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tool_slug_key`(`slug`),
    INDEX `Tool_isActive_order_idx`(`isActive`, `order`),
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
