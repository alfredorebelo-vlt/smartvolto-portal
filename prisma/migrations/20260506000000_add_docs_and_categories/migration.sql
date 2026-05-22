-- CreateTable: DocArea
CREATE TABLE IF NOT EXISTS `DocArea` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#2e3c8f',
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `roleIds` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DocArea_name_key`(`name`),
    UNIQUE INDEX `DocArea_slug_key`(`slug`),
    INDEX `DocArea_isActive_order_idx`(`isActive`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: DocEntry
CREATE TABLE IF NOT EXISTS `DocEntry` (
    `id` VARCHAR(191) NOT NULL,
    `areaId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `driveFileId` VARCHAR(191) NULL,
    `driveUrl` VARCHAR(2048) NOT NULL,
    `embedType` VARCHAR(191) NOT NULL DEFAULT 'none',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `roleIds` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DocEntry_areaId_idx`(`areaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: AnnouncementCategory
CREATE TABLE IF NOT EXISTS `AnnouncementCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#2e3c8f',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AnnouncementCategory_name_key`(`name`),
    UNIQUE INDEX `AnnouncementCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocEntry` ADD CONSTRAINT `DocEntry_areaId_fkey`
    FOREIGN KEY (`areaId`) REFERENCES `DocArea`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
