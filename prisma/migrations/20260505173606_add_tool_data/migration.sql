-- DropForeignKey
ALTER TABLE `manualarticleversion` DROP FOREIGN KEY `ManualArticleVersion_articleId_fkey`;

-- DropIndex
DROP INDEX `Announcement_publishedAt_idx` ON `announcement`;

-- DropIndex
DROP INDEX `AuditLog_createdAt_idx` ON `auditlog`;

-- DropIndex
DROP INDEX `ManualArticleVersion_articleId_createdAt_idx` ON `manualarticleversion`;

-- CreateTable
CREATE TABLE `ToolData` (
    `id` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL DEFAULT 'state',
    `data` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ToolData_toolId_idx`(`toolId`),
    UNIQUE INDEX `ToolData_toolId_key_key`(`toolId`, `key`),
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

-- AddForeignKey
ALTER TABLE `ToolData` ADD CONSTRAINT `ToolData_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `Tool`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
