-- CreateTable
CREATE TABLE "InviteEmailTemplate" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "subject" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteEmailTemplate_pkey" PRIMARY KEY ("id")
);
