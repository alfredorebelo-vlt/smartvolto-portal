-- AlterTable Announcement
ALTER TABLE `Announcement` ADD COLUMN IF NOT EXISTS `category` VARCHAR(191) NULL;
ALTER TABLE `Announcement` ADD COLUMN IF NOT EXISTS `isPinned` BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS `Announcement_isPinned_publishedAt_idx` ON `Announcement`(`isPinned`, `publishedAt` DESC);

-- CreateTable AnnouncementReaction
CREATE TABLE IF NOT EXISTS `announcementreaction` (
    `id` VARCHAR(191) NOT NULL,
    `announcementId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `emoji` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `announcementreaction_announcementId_userId_emoji_key`(`announcementId`, `userId`, `emoji`),
    INDEX `announcementreaction_announcementId_idx`(`announcementId`),
    CONSTRAINT `fk_reaction_announcement` FOREIGN KEY (`announcementId`) REFERENCES `Announcement`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reaction_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable AnnouncementComment
CREATE TABLE IF NOT EXISTS `announcementcomment` (
    `id` VARCHAR(191) NOT NULL,
    `announcementId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `announcementcomment_announcementId_createdAt_idx`(`announcementId`, `createdAt`),
    CONSTRAINT `fk_comment_announcement` FOREIGN KEY (`announcementId`) REFERENCES `Announcement`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comment_author` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
