-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnalyticsEventType" ADD VALUE 'SEARCH';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'CHECKOUT_STARTED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'ORDER_CREATED';

-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN     "pageTitle" TEXT;

-- AlterTable
ALTER TABLE "visitor_sessions" ADD COLUMN     "converted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- AlterTable
ALTER TABLE "visitors" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "sessionsCount" INTEGER NOT NULL DEFAULT 0;
