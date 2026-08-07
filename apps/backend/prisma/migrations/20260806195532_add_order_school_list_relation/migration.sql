-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "schoolListId" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_schoolListId_fkey" FOREIGN KEY ("schoolListId") REFERENCES "school_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
