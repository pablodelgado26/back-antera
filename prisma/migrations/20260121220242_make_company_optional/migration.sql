-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "workplaceType" TEXT NOT NULL,
    "salaryRange" TEXT,
    "requirements" TEXT,
    "benefits" TEXT,
    "externalApplicationUrl" TEXT,
    "companyId" INTEGER,
    "postedById" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicantsCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME,
    CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "jobs_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_jobs" ("applicantsCount", "benefits", "companyId", "createdAt", "description", "expiresAt", "externalApplicationUrl", "id", "isActive", "jobType", "location", "postedById", "requirements", "salaryRange", "title", "updatedAt", "viewsCount", "workplaceType") SELECT "applicantsCount", "benefits", "companyId", "createdAt", "description", "expiresAt", "externalApplicationUrl", "id", "isActive", "jobType", "location", "postedById", "requirements", "salaryRange", "title", "updatedAt", "viewsCount", "workplaceType" FROM "jobs";
DROP TABLE "jobs";
ALTER TABLE "new_jobs" RENAME TO "jobs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
