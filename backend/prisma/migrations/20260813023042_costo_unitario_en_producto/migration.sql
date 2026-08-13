/*
  Warnings:

  - Added the required column `costoUnitario` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "costoUnitario" DOUBLE PRECISION NOT NULL;
