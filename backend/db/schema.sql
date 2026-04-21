-- Plot Path database schema
-- Run against your SQL Server database to set up all tables

CREATE TABLE Users (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email         NVARCHAR(255)    NOT NULL UNIQUE,
    Username      NVARCHAR(255)    NOT NULL,
    PasswordHash  NVARCHAR(512)    NOT NULL,
    RefreshToken  NVARCHAR(512)    NULL,
    AvatarUrl     NVARCHAR(512)    NULL,
    Age           INT              NULL,
    CreatedAt     DATETIME         NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Tags (
    Id    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name  NVARCHAR(255)    NOT NULL,
    Type  NVARCHAR(50)     NOT NULL  -- 'Genre' or 'Trope'
);

CREATE TABLE UserTagPreferences (
    UserId  UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    TagId   UNIQUEIDENTIFIER NOT NULL REFERENCES Tags(Id),
    PRIMARY KEY (UserId, TagId)
);

CREATE TABLE Books (
    Id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title        NVARCHAR(255)    NOT NULL,
    Author       NVARCHAR(255)    NOT NULL,
    Description  NVARCHAR(MAX)    NULL,
    CoverUrl     NVARCHAR(512)    NULL
);

CREATE TABLE BookTags (
    BookId  UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    TagId   UNIQUEIDENTIFIER NOT NULL REFERENCES Tags(Id),
    PRIMARY KEY (BookId, TagId)
);

CREATE TABLE Routes (
    Id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name         NVARCHAR(255)    NOT NULL,
    Description  NVARCHAR(MAX)    NULL,
    Category     NVARCHAR(255)    NULL,
    ImageUrl     NVARCHAR(512)    NULL,
    IsMonthly    BIT              NOT NULL DEFAULT 0,
    CreatedAt    DATETIME         NOT NULL DEFAULT GETDATE()
);

CREATE TABLE RouteBooks (
    RouteId   UNIQUEIDENTIFIER NOT NULL REFERENCES Routes(Id),
    BookId    UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    Position  INT              NOT NULL,
    PRIMARY KEY (RouteId, BookId)
);

CREATE TABLE UserRoutes (
    UserId       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    RouteId      UNIQUEIDENTIFIER NOT NULL REFERENCES Routes(Id),
    Status       NVARCHAR(50)     NOT NULL,  -- 'in_progress', 'completed', 'planned'
    StartedAt    DATETIME         NULL,
    CompletedAt  DATETIME         NULL,
    PRIMARY KEY (UserId, RouteId)
);

CREATE TABLE UserBookProgress (
    UserId   UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    BookId   UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    RouteId  UNIQUEIDENTIFIER NOT NULL REFERENCES Routes(Id),
    IsRead   BIT              NOT NULL DEFAULT 0,
    ReadAt   DATETIME         NULL,
    PRIMARY KEY (UserId, BookId, RouteId)
);

CREATE TABLE BookReviews (
    Id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId      UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    BookId      UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    Rating      INT              NOT NULL,
    ReviewText  NVARCHAR(MAX)    NULL,
    CreatedAt   DATETIME         NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Badges (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name            NVARCHAR(255)    NOT NULL,
    Description     NVARCHAR(MAX)    NULL,
    IconUrl         NVARCHAR(512)    NULL,
    Type            NVARCHAR(50)     NOT NULL,  -- 'count', 'genre_unique', 'time_limit'
    RequiredValue   INT              NOT NULL,
    TimeLimitHours  INT              NULL
);

CREATE TABLE UserBadges (
    UserId     UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    BadgeId    UNIQUEIDENTIFIER NOT NULL REFERENCES Badges(Id),
    AwardedAt  DATETIME         NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (UserId, BadgeId)
);

CREATE TABLE UserAchievementsProgress (
    Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId         UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    BadgeId        UNIQUEIDENTIFIER NOT NULL REFERENCES Badges(Id),
    ProgressValue  INT              NOT NULL DEFAULT 0,
    LastUpdated    DATETIME         NOT NULL DEFAULT GETDATE()
);

CREATE TABLE MonthlyVotingOptions (
    Id          UNIQUEIDENTIFIER PRIMARY KEY,
    TagId       UNIQUEIDENTIFIER NOT NULL REFERENCES Tags(Id),
    MonthStart  DATETIME         NOT NULL
);

CREATE TABLE MonthlyRouteVotes (
    UserId   UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    TagId    UNIQUEIDENTIFIER NOT NULL REFERENCES Tags(Id),
    VotedAt  DATETIME         NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (UserId, TagId)
);
