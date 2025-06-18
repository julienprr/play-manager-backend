-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "spotifyAccessToken" TEXT,
    "spotifyAccessTokenTimestamp" TIMESTAMP(3),
    "spotifyRefreshToken" TEXT,
    "autoSortPlaylists" TEXT[],
    "favoritePlaylists" TEXT[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_spotifyUserId_key" ON "User"("spotifyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_spotifyAccessToken_key" ON "User"("spotifyAccessToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_spotifyRefreshToken_key" ON "User"("spotifyRefreshToken");
