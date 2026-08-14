-- CreateEnum
CREATE TYPE "RecurrenceRule" AS ENUM ('daily', 'weekly', 'monthly');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "recurrence" "RecurrenceRule";
