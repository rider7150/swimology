/*
  Warnings:

  - A unique constraint covering the columns `[skillId,enrollmentId]` on the table `SkillProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SkillProgress_skillId_enrollmentId_key" ON "SkillProgress"("skillId", "enrollmentId");
