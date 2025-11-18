-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."LocalType" AS ENUM ('CLASSROOM', 'LABORATORY', 'BATHROOM', 'OFFICE', 'LIBRARY', 'CAFETERIA', 'AUDITORIUM', 'ENTRANCE', 'STAIRS', 'ELEVATOR', 'PARKING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."NodeType" AS ENUM ('WAYPOINT', 'ENTRANCE', 'STAIRS', 'ELEVATOR', 'INTERSECTION', 'DESTINATION');

-- CreateEnum
CREATE TYPE "public"."EdgeType" AS ENUM ('CORRIDOR', 'STAIRS', 'ELEVATOR', 'OUTDOOR', 'DOOR');

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maps" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 0,
    "building" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "type" "public"."LocalType" NOT NULL DEFAULT 'OTHER',
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION DEFAULT 0,
    "floor" INTEGER NOT NULL DEFAULT 0,
    "building" TEXT,
    "iconUrl" TEXT,
    "imageUrl" TEXT,
    "accessible" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mapId" INTEGER NOT NULL,

    CONSTRAINT "locals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."graph_nodes" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION DEFAULT 0,
    "floor" INTEGER NOT NULL DEFAULT 0,
    "building" TEXT,
    "type" "public"."NodeType" NOT NULL DEFAULT 'WAYPOINT',
    "localId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "graph_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."graph_edges" (
    "id" SERIAL NOT NULL,
    "fromNodeId" INTEGER NOT NULL,
    "toNodeId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "type" "public"."EdgeType" NOT NULL DEFAULT 'CORRIDOR',
    "accessible" BOOLEAN NOT NULL DEFAULT true,
    "bidirectional" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "public"."admins"("email");

-- CreateIndex
CREATE INDEX "admins_passwordResetToken_idx" ON "public"."admins"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "locals_code_key" ON "public"."locals"("code");

-- CreateIndex
CREATE INDEX "locals_mapId_idx" ON "public"."locals"("mapId");

-- CreateIndex
CREATE INDEX "locals_type_idx" ON "public"."locals"("type");

-- CreateIndex
CREATE INDEX "locals_code_idx" ON "public"."locals"("code");

-- CreateIndex
CREATE INDEX "locals_building_floor_idx" ON "public"."locals"("building", "floor");

-- CreateIndex
CREATE UNIQUE INDEX "graph_nodes_localId_key" ON "public"."graph_nodes"("localId");

-- CreateIndex
CREATE INDEX "graph_nodes_floor_building_idx" ON "public"."graph_nodes"("floor", "building");

-- CreateIndex
CREATE INDEX "graph_edges_fromNodeId_idx" ON "public"."graph_edges"("fromNodeId");

-- CreateIndex
CREATE INDEX "graph_edges_toNodeId_idx" ON "public"."graph_edges"("toNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "graph_edges_fromNodeId_toNodeId_key" ON "public"."graph_edges"("fromNodeId", "toNodeId");

-- AddForeignKey
ALTER TABLE "public"."locals" ADD CONSTRAINT "locals_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "public"."maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graph_edges" ADD CONSTRAINT "graph_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "public"."graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graph_edges" ADD CONSTRAINT "graph_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "public"."graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
