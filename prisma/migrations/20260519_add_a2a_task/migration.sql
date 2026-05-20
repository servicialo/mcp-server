-- CreateTable
CREATE TABLE "servicialo"."A2ATask" (
    "id" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "intent" TEXT NOT NULL DEFAULT 'unknown',
    "userText" TEXT NOT NULL DEFAULT '',
    "agentText" TEXT NOT NULL DEFAULT '',
    "bookingDraft" JSONB,
    "artifact" JSONB,
    "errorMessage" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "A2ATask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "A2ATask_contextId_idx" ON "servicialo"."A2ATask"("contextId");

-- CreateIndex
CREATE INDEX "A2ATask_organizationId_createdAt_idx" ON "servicialo"."A2ATask"("organizationId", "createdAt");
