-- CreateTable
CREATE TABLE "NdaDocument" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdaDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdaSignature" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "ndaDocumentId" TEXT NOT NULL,
    "signerUserId" TEXT,
    "signerEmail" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfPath" TEXT,
    "pdfHash" TEXT,

    CONSTRAINT "NdaSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NdaDocument_filename_key" ON "NdaDocument"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "NdaSignature_orgId_key" ON "NdaSignature"("orgId");

-- AddForeignKey
ALTER TABLE "NdaSignature" ADD CONSTRAINT "NdaSignature_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdaSignature" ADD CONSTRAINT "NdaSignature_ndaDocumentId_fkey" FOREIGN KEY ("ndaDocumentId") REFERENCES "NdaDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
