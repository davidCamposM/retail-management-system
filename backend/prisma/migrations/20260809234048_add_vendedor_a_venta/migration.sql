/*
  Warnings:

  - Added the required column `vendedorId` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "vendedorId" INTEGER NOT NULL,
ALTER COLUMN "orderIdOriginal" DROP NOT NULL,
ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "calificacionCliente" DROP NOT NULL,
ALTER COLUMN "diasEntrega" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
