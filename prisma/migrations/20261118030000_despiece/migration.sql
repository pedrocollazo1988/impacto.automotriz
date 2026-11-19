-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "connectorImage" TEXT,
ADD COLUMN     "packQty" INTEGER,
ADD COLUMN     "systemId" INTEGER;

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'Eléctrico',
    "year" INTEGER,
    "voltage" TEXT,
    "power" TEXT,
    "payload" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "heroImage" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartSystem" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'wrench',
    "blurb" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDiagram" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "systemId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VehicleDiagram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagramPin" (
    "id" SERIAL NOT NULL,
    "diagramId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "svgId" TEXT,
    "label" TEXT,

    CONSTRAINT "DiagramPin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCompatibility" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "ProductCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_brand_model_version_key" ON "Vehicle"("brand", "model", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PartSystem_slug_key" ON "PartSystem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleDiagram_vehicleId_systemId_key" ON "VehicleDiagram"("vehicleId", "systemId");

-- CreateIndex
CREATE INDEX "DiagramPin_productId_idx" ON "DiagramPin"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagramPin_diagramId_number_key" ON "DiagramPin"("diagramId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "DiagramPin_diagramId_productId_key" ON "DiagramPin"("diagramId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCompatibility_productId_targetId_key" ON "ProductCompatibility"("productId", "targetId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "PartSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDiagram" ADD CONSTRAINT "VehicleDiagram_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDiagram" ADD CONSTRAINT "VehicleDiagram_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "PartSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagramPin" ADD CONSTRAINT "DiagramPin_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "VehicleDiagram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagramPin" ADD CONSTRAINT "DiagramPin_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

