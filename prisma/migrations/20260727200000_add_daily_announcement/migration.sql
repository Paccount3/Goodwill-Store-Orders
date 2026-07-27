-- CreateTable
CREATE TABLE "DailyAnnouncement" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAnnouncement_pkey" PRIMARY KEY ("id")
);

-- Seed default announcement
INSERT INTO "DailyAnnouncement" ("id", "title", "body", "isEnabled", "updatedAt")
VALUES (
    1,
    'Are You Hiring?',
    E'Goodwill''s mission to support our participants depends on partnerships with our stores.\n\nWhen your store has hiring needs, please contact your region''s Business Engagement Specialist first. We can help connect you with participants in your area for open positions and coordinate valuable trial work evaluations.\n\n**North Region Business Engagement Specialist**\nShawn Hillmann\nShillmann@gwct.org\n203-610-0382\n\n**West Region Business Engagement Specialist**\nEd Majersky\nEmajersky@gwct.org\n203-610-9705',
    true,
    CURRENT_TIMESTAMP
);
