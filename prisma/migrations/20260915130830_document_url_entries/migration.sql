-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'file',
ADD COLUMN     "url" TEXT;
