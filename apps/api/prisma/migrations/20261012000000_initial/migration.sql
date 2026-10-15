CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubMembership" (
    "userId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClubMembership_pkey" PRIMARY KEY ("userId", "clubId")
);

CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "lead" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "relatedEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FloorPlan" (
    "id" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL DEFAULT 'assets/map.webp',
    "mapWidth" INTEGER NOT NULL DEFAULT 1382,
    "mapHeight" INTEGER NOT NULL DEFAULT 2576,
    CONSTRAINT "FloorPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '',
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "block" TEXT NOT NULL,
    "floor" INTEGER,
    "row" TEXT,
    "floorPlanId" TEXT,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "locationId" TEXT,
    "locationDescription" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Event_capacity_soldCount_check" CHECK ("capacity" >= 0 AND "soldCount" >= 0 AND "soldCount" <= "capacity"),
    CONSTRAINT "Event_price_check" CHECK ("price" >= 0)
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "ClubMembership_clubId_idx" ON "ClubMembership"("clubId");
CREATE INDEX "News_publishedAt_idx" ON "News"("publishedAt");
CREATE UNIQUE INDEX "FloorPlan_block_floor_key" ON "FloorPlan"("block", "floor");
CREATE INDEX "Location_category_idx" ON "Location"("category");
CREATE INDEX "Location_floorPlanId_idx" ON "Location"("floorPlanId");
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
CREATE INDEX "Event_clubId_idx" ON "Event"("clubId");

ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_clubId_fkey"
    FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_floorPlanId_fkey"
    FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_clubId_fkey"
    FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
