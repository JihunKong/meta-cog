/*
  Warnings:

  - Added the required column `timeSlot` to the `StudyPlan` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "target" REAL NOT NULL,
    "achievement" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudyPlan" ("achievement", "content", "createdAt", "date", "id", "subject", "target", "updatedAt", "userId") SELECT "achievement", "content", "createdAt", "date", "id", "subject", "target", "updatedAt", "userId" FROM "StudyPlan";
DROP TABLE "StudyPlan";
ALTER TABLE "new_StudyPlan" RENAME TO "StudyPlan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
