-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GESTOR', 'CAMPO');

-- CreateEnum
CREATE TYPE "StatusAtividade" AS ENUM ('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'PARCIAL', 'NAO_REALIZADO');

-- CreateEnum
CREATE TYPE "StatusPendencia" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "OrigemPendencia" AS ENUM ('VISITA', 'DIARIO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO');

-- CreateEnum
CREATE TYPE "StatusRegraOuro" AS ENUM ('RASCUNHO', 'LIBERADA', 'BLOQUEADA');

-- CreateEnum
CREATE TYPE "Gravidade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "NecessidadeImprevisto" AS ENUM ('MATERIAL', 'DECISAO', 'MAO_DE_OBRA', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "OrigemMovimento" AS ENUM ('COMPRA_PLANEJAMENTO', 'USO_DIARIO', 'AJUSTE_MANUAL');

-- CreateEnum
CREATE TYPE "TipoMidia" AS ENUM ('FOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "TipoRelatorio" AS ENUM ('PARCIAL', 'COMPLETO');

-- CreateEnum
CREATE TYPE "FormatoRelatorio" AS ENUM ('PDF', 'DOCX', 'XLSX');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isEngenheiro" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semanas_planejamento" (
    "id" TEXT NOT NULL,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "preenchidoPorId" TEXT NOT NULL,
    "dataPreenchimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricaoAtividadePrincipal" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semanas_planejamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapas" (
    "id" TEXT NOT NULL,
    "semanaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapa_dias_planejados" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "atividadePlanejada" TEXT NOT NULL,
    "responsavel" TEXT,
    "preRequisito" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etapa_dias_planejados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_etapas" (
    "id" TEXT NOT NULL,
    "etapaDiaPlanejadoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sub_etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapa_riscos" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "risco" TEXT NOT NULL,
    "probabilidade" TEXT NOT NULL,
    "impacto" TEXT NOT NULL,
    "acaoPreventiva" TEXT NOT NULL,

    CONSTRAINT "etapa_riscos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_tecnicas" (
    "id" TEXT NOT NULL,
    "semanaId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "hora" TIME NOT NULL,
    "motivo" TEXT NOT NULL,
    "problemasEncontrados" TEXT,
    "solicitacoesFeitas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitas_tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correcoes_pendencias" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "dataIdentificacao" DATE NOT NULL,
    "origemTipo" "OrigemPendencia" NOT NULL,
    "visitaId" TEXT,
    "diarioAtividadeId" TEXT,
    "etapaId" TEXT,
    "problemaOuSolicitacao" TEXT NOT NULL,
    "correcaoAprovada" TEXT,
    "dependeDeId" TEXT,
    "status" "StatusPendencia" NOT NULL DEFAULT 'ABERTA',
    "dataConclusao" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correcoes_pendencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais_planejados" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "qtdPlanejada" DECIMAL(12,3) NOT NULL,
    "ondeUsado" TEXT NOT NULL,
    "memorialCalculo" TEXT,
    "valorUnitario" DECIMAL(12,2) NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "fornecedor" TEXT,
    "dataCompraPrevista" DATE,
    "dataEntregaPrevista" DATE,
    "qtdComprada" DECIMAL(12,3),
    "qtdSobra" DECIMAL(12,3),
    "sobraParaEtapaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiais_planejados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mao_de_obra" (
    "id" TEXT NOT NULL,
    "semanaId" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "equipeOuEmpreiteiro" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "valorAcordado" DECIMAL(12,2) NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "dataPagamentoPrevista" DATE,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mao_de_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_ouro" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "atividade" TEXT NOT NULL,
    "escopoDetalhado" TEXT NOT NULL,
    "tempoEstimado" TEXT NOT NULL,
    "valorFechado" DECIMAL(12,2) NOT NULL,
    "condicaoMeta" TEXT NOT NULL,
    "dataLiberacao" DATE,
    "metodoConstrutivo" TEXT,
    "aprovadoPorNome" TEXT,
    "aprovadoPorData" DATE,
    "status" "StatusRegraOuro" NOT NULL DEFAULT 'RASCUNHO',
    "criadoPorId" TEXT NOT NULL,
    "aprovadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_ouro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regra_ouro_materiais" (
    "id" TEXT NOT NULL,
    "regraOuroId" TEXT NOT NULL,
    "materialPlanejadoId" TEXT NOT NULL,

    CONSTRAINT "regra_ouro_materiais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diarios_obra" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "preenchidoPorId" TEXT NOT NULL,
    "avaliacaoNota" INTEGER,
    "avaliacaoAderencia" TEXT,
    "avaliacaoQualidade" TEXT,
    "avaliacaoOrganizacao" TEXT,
    "avaliacaoSeguranca" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diarios_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diario_atividades" (
    "id" TEXT NOT NULL,
    "diarioObraId" TEXT NOT NULL,
    "etapaDiaPlanejadoId" TEXT NOT NULL,
    "status" "StatusAtividade" NOT NULL DEFAULT 'NAO_INICIADO',
    "oQueFoiFeito" TEXT,
    "motivoImpacto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diario_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "midias" (
    "id" TEXT NOT NULL,
    "diarioAtividadeId" TEXT NOT NULL,
    "tipo" "TipoMidia" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legenda" TEXT,

    CONSTRAINT "midias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais_uso_diario" (
    "id" TEXT NOT NULL,
    "diarioObraId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materiais_uso_diario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imprevistos" (
    "id" TEXT NOT NULL,
    "diarioObraId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fotoStoragePath" TEXT,
    "descricao" TEXT NOT NULL,
    "gravidade" "Gravidade" NOT NULL,
    "oQuePrecisa" "NecessidadeImprevisto" NOT NULL,
    "urgencia" "Gravidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imprevistos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_estoque" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origemTipo" "OrigemMovimento" NOT NULL,
    "origemCompraId" TEXT,
    "origemUsoDiarioId" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios" (
    "id" TEXT NOT NULL,
    "tipo" "TipoRelatorio" NOT NULL,
    "formato" "FormatoRelatorio" NOT NULL,
    "diarioObraId" TEXT,
    "semanaId" TEXT,
    "geradoPorId" TEXT NOT NULL,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storagePath" TEXT NOT NULL,

    CONSTRAINT "relatorios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "semanas_planejamento_dataInicio_idx" ON "semanas_planejamento"("dataInicio");

-- CreateIndex
CREATE INDEX "etapas_semanaId_idx" ON "etapas"("semanaId");

-- CreateIndex
CREATE INDEX "etapa_dias_planejados_etapaId_data_idx" ON "etapa_dias_planejados"("etapaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "correcoes_pendencias_numero_key" ON "correcoes_pendencias"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "materiais_nome_key" ON "materiais"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "regras_ouro_etapaId_key" ON "regras_ouro"("etapaId");

-- CreateIndex
CREATE UNIQUE INDEX "regra_ouro_materiais_regraOuroId_materialPlanejadoId_key" ON "regra_ouro_materiais"("regraOuroId", "materialPlanejadoId");

-- CreateIndex
CREATE UNIQUE INDEX "diarios_obra_data_key" ON "diarios_obra"("data");

-- CreateIndex
CREATE INDEX "diarios_obra_data_idx" ON "diarios_obra"("data");

-- CreateIndex
CREATE UNIQUE INDEX "diario_atividades_diarioObraId_etapaDiaPlanejadoId_key" ON "diario_atividades"("diarioObraId", "etapaDiaPlanejadoId");

-- CreateIndex
CREATE INDEX "imprevistos_diarioObraId_idx" ON "imprevistos"("diarioObraId");

-- CreateIndex
CREATE UNIQUE INDEX "movimentos_estoque_origemCompraId_key" ON "movimentos_estoque"("origemCompraId");

-- CreateIndex
CREATE UNIQUE INDEX "movimentos_estoque_origemUsoDiarioId_key" ON "movimentos_estoque"("origemUsoDiarioId");

-- CreateIndex
CREATE INDEX "movimentos_estoque_materialId_data_idx" ON "movimentos_estoque"("materialId", "data");

-- AddForeignKey
ALTER TABLE "semanas_planejamento" ADD CONSTRAINT "semanas_planejamento_preenchidoPorId_fkey" FOREIGN KEY ("preenchidoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapas" ADD CONSTRAINT "etapas_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "semanas_planejamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_dias_planejados" ADD CONSTRAINT "etapa_dias_planejados_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_etapas" ADD CONSTRAINT "sub_etapas_etapaDiaPlanejadoId_fkey" FOREIGN KEY ("etapaDiaPlanejadoId") REFERENCES "etapa_dias_planejados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_riscos" ADD CONSTRAINT "etapa_riscos_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_tecnicas" ADD CONSTRAINT "visitas_tecnicas_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "semanas_planejamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correcoes_pendencias" ADD CONSTRAINT "correcoes_pendencias_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "visitas_tecnicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correcoes_pendencias" ADD CONSTRAINT "correcoes_pendencias_diarioAtividadeId_fkey" FOREIGN KEY ("diarioAtividadeId") REFERENCES "diario_atividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correcoes_pendencias" ADD CONSTRAINT "correcoes_pendencias_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correcoes_pendencias" ADD CONSTRAINT "correcoes_pendencias_dependeDeId_fkey" FOREIGN KEY ("dependeDeId") REFERENCES "correcoes_pendencias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais_planejados" ADD CONSTRAINT "materiais_planejados_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais_planejados" ADD CONSTRAINT "materiais_planejados_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais_planejados" ADD CONSTRAINT "materiais_planejados_sobraParaEtapaId_fkey" FOREIGN KEY ("sobraParaEtapaId") REFERENCES "etapas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mao_de_obra" ADD CONSTRAINT "mao_de_obra_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "semanas_planejamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mao_de_obra" ADD CONSTRAINT "mao_de_obra_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_ouro" ADD CONSTRAINT "regras_ouro_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_ouro" ADD CONSTRAINT "regras_ouro_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_ouro" ADD CONSTRAINT "regras_ouro_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regra_ouro_materiais" ADD CONSTRAINT "regra_ouro_materiais_regraOuroId_fkey" FOREIGN KEY ("regraOuroId") REFERENCES "regras_ouro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regra_ouro_materiais" ADD CONSTRAINT "regra_ouro_materiais_materialPlanejadoId_fkey" FOREIGN KEY ("materialPlanejadoId") REFERENCES "materiais_planejados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diarios_obra" ADD CONSTRAINT "diarios_obra_preenchidoPorId_fkey" FOREIGN KEY ("preenchidoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diario_atividades" ADD CONSTRAINT "diario_atividades_diarioObraId_fkey" FOREIGN KEY ("diarioObraId") REFERENCES "diarios_obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diario_atividades" ADD CONSTRAINT "diario_atividades_etapaDiaPlanejadoId_fkey" FOREIGN KEY ("etapaDiaPlanejadoId") REFERENCES "etapa_dias_planejados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "midias" ADD CONSTRAINT "midias_diarioAtividadeId_fkey" FOREIGN KEY ("diarioAtividadeId") REFERENCES "diario_atividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais_uso_diario" ADD CONSTRAINT "materiais_uso_diario_diarioObraId_fkey" FOREIGN KEY ("diarioObraId") REFERENCES "diarios_obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais_uso_diario" ADD CONSTRAINT "materiais_uso_diario_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imprevistos" ADD CONSTRAINT "imprevistos_diarioObraId_fkey" FOREIGN KEY ("diarioObraId") REFERENCES "diarios_obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_origemCompraId_fkey" FOREIGN KEY ("origemCompraId") REFERENCES "materiais_planejados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_origemUsoDiarioId_fkey" FOREIGN KEY ("origemUsoDiarioId") REFERENCES "materiais_uso_diario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_diarioObraId_fkey" FOREIGN KEY ("diarioObraId") REFERENCES "diarios_obra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_geradoPorId_fkey" FOREIGN KEY ("geradoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

