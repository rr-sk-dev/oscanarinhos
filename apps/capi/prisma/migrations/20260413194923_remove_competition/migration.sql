/*
  Warnings:

  - You are about to drop the column `competition` on the `Standing` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[season,teamName]` on the table `Standing` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[season,position]` on the table `Standing` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Standing_season_competition_idx";

-- DropIndex
DROP INDEX "Standing_season_competition_position_key";

-- DropIndex
DROP INDEX "Standing_season_competition_teamName_key";

-- AlterTable
ALTER TABLE "Standing" DROP COLUMN "competition";

-- CreateTable
CREATE TABLE "Scorer" (
    "id" UUID NOT NULL,
    "season" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scorer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scorer_season_idx" ON "Scorer"("season");

-- CreateIndex
CREATE INDEX "Scorer_playerName_idx" ON "Scorer"("playerName");

-- CreateIndex
CREATE UNIQUE INDEX "Scorer_season_playerName_teamName_key" ON "Scorer"("season", "playerName", "teamName");

-- CreateIndex
CREATE INDEX "Standing_season_idx" ON "Standing"("season");

-- CreateIndex
CREATE UNIQUE INDEX "Standing_season_teamName_key" ON "Standing"("season", "teamName");

-- CreateIndex
CREATE UNIQUE INDEX "Standing_season_position_key" ON "Standing"("season", "position");
