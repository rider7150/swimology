-- Revert all changes from the previous migration
ALTER TABLE "Lesson" 
ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "startTime" SET DATA TYPE TIMESTAMP USING "startTime"::timestamp,
ALTER COLUMN "endTime" SET DATA TYPE TIMESTAMP USING "endTime"::timestamp; 