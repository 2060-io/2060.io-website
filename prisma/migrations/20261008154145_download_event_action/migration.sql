-- AlterTable
ALTER TABLE "DownloadEvent" ADD COLUMN     "action" TEXT NOT NULL DEFAULT 'download';

-- Backfill: URL entries have always been followed ("open"), never downloaded.
UPDATE "DownloadEvent" SET "action" = 'open'
WHERE "documentId" IN (SELECT "id" FROM "Document" WHERE "kind" = 'url');
