-- CreateTable
CREATE TABLE "plantas_obra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantas_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anotacoes_planta" (
    "id" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "etapaId" TEXT,
    "imprevistoId" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anotacoes_planta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anotacoes_planta_plantaId_idx" ON "anotacoes_planta"("plantaId");

-- AddForeignKey
ALTER TABLE "anotacoes_planta" ADD CONSTRAINT "anotacoes_planta_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "plantas_obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes_planta" ADD CONSTRAINT "anotacoes_planta_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes_planta" ADD CONSTRAINT "anotacoes_planta_imprevistoId_fkey" FOREIGN KEY ("imprevistoId") REFERENCES "imprevistos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes_planta" ADD CONSTRAINT "anotacoes_planta_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
