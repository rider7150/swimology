/*
  Warnings:

  - Changed the type of `startTime` on the `Lesson` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `Lesson` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_classLevelId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_instructorId_fkey";

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#3B82F6';

-- Safely handle time columns
ALTER TABLE "Lesson" RENAME COLUMN "startTime" TO "startTime_old";
ALTER TABLE "Lesson" RENAME COLUMN "endTime" TO "endTime_old";
ALTER TABLE "Lesson" ADD COLUMN "startTime" TIMESTAMP(3);
ALTER TABLE "Lesson" ADD COLUMN "endTime" TIMESTAMP(3);

-- Copy data with type conversion using current_date to create a full timestamp
UPDATE "Lesson" SET 
  "startTime" = (current_date + "startTime_old")::timestamp,
  "endTime" = (current_date + "endTime_old")::timestamp;

-- Make columns required after data migration
ALTER TABLE "Lesson" ALTER COLUMN "startTime" SET NOT NULL;
ALTER TABLE "Lesson" ALTER COLUMN "endTime" SET NOT NULL;

-- Drop old columns
ALTER TABLE "Lesson" DROP COLUMN "startTime_old";
ALTER TABLE "Lesson" DROP COLUMN "endTime_old";

-- CreateTable
CREATE TABLE "_LessonToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LessonToSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LessonToSkill_B_index" ON "_LessonToSkill"("B");

-- CreateIndex
CREATE INDEX "Lesson_classLevelId_idx" ON "Lesson"("classLevelId");

-- CreateIndex
CREATE INDEX "Lesson_instructorId_idx" ON "Lesson"("instructorId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classLevelId_fkey" FOREIGN KEY ("classLevelId") REFERENCES "ClassLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonToSkill" ADD CONSTRAINT "_LessonToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonToSkill" ADD CONSTRAINT "_LessonToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
