-- Renames rather than recreating the columns, so the existing administrator
-- account and every audit entry keep their values.
ALTER TABLE "User" RENAME COLUMN "email" TO "username";
ALTER INDEX "User_email_key" RENAME TO "User_username_key";

ALTER TABLE "AuditLog" RENAME COLUMN "actorEmail" TO "actorName";
