/*
  Warnings:

  - You are about to drop the column `improvementNotes` on the `SkillProgress` table. All the data in the column will be lost.
  - You are about to drop the column `strengthNotes` on the `SkillProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "improvementNotes" TEXT,
ADD COLUMN     "strengthNotes" TEXT;

-- AlterTable
ALTER TABLE "SkillProgress" DROP COLUMN "improvementNotes",
DROP COLUMN "strengthNotes";
