/*
  Warnings:

  - You are about to drop the column `order` on the `ClassLevel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClassLevel" DROP COLUMN "order",
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
