-- DropIndex
DROP INDEX `Announcement_publishedAt_idx` ON `announcement`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `bio` VARCHAR(300) NULL,
    ADD COLUMN `linkedinUrl` VARCHAR(191) NULL,
    ADD COLUMN `workLocation` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Announcement_publishedAt_idx` ON `Announcement`(`publishedAt` DESC);
