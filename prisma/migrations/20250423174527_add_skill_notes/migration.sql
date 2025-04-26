/*
  Warnings:

  - You are about to drop the column `notes` on the `SkillProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SkillProgress" DROP COLUMN "notes",
ADD COLUMN     "improvementNotes" TEXT,
ADD COLUMN     "strengthNotes" TEXT;
