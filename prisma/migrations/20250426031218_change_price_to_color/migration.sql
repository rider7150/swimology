/*
  Warnings:

  - You are about to drop the column `price` on the `ClassLevel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClassLevel" DROP COLUMN "price",
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#3B82F6';
