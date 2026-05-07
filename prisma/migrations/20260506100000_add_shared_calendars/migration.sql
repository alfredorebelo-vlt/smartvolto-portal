CREATE TABLE `SharedCalendar` (
  `id`         VARCHAR(191) NOT NULL,
  `name`       VARCHAR(191) NOT NULL,
  `calendarId` VARCHAR(191) NOT NULL,
  `color`      VARCHAR(191) NOT NULL DEFAULT '#2e3c8f',
  `isActive`   BOOLEAN     NOT NULL DEFAULT TRUE,
  `order`      INT         NOT NULL DEFAULT 0,
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3) NOT NULL,
  CONSTRAINT `SharedCalendar_pkey` PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `SharedCalendar_calendarId_key` ON `SharedCalendar`(`calendarId`);
CREATE INDEX `SharedCalendar_isActive_order_idx` ON `SharedCalendar`(`isActive`, `order`);
