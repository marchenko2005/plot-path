-- Plot Path — повна схема БД (BookRoutes)
-- Microsoft SQL Server

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE Users (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Username      NVARCHAR(50)     NOT NULL,
    Email         NVARCHAR(100)    NOT NULL UNIQUE,
    PasswordHash  NVARCHAR(MAX)    NOT NULL,
    RefreshToken  NVARCHAR(MAX)    NULL,
    AvatarUrl     NVARCHAR(500)    NULL,
    Age           INT              NULL,
    Role          NVARCHAR(20)     NULL,
    IsVerified    BIT              NULL,
    LastLoginAt   DATETIME         NULL,
    CreatedAt     DATETIME         NULL DEFAULT GETDATE()
);

-- ─── Tags ────────────────────────────────────────────────────────────────────

CREATE TABLE Tags (
    Id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name      NVARCHAR(100)    NULL,
    Type      NVARCHAR(20)     NULL,  -- 'Genre' | 'Trope'
    ImageUrl  NVARCHAR(500)    NULL
);

CREATE TABLE UserTagPreferences (
    UserId  UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    TagId   UNIQUEIDENTIFIER NOT NULL REFERENCES Tags(Id),
    PRIMARY KEY (UserId, TagId)
);

-- ─── Authors & Books ─────────────────────────────────────────────────────────

CREATE TABLE Authors (
    Id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name      NVARCHAR(100)    NULL,
    ImageUrl  NVARCHAR(500)    NULL
);

CREATE TABLE Books (
    Id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title        NVARCHAR(255)    NOT NULL,
    Author       NVARCHAR(100)    NULL,   -- legacy text field
    Description  NVARCHAR(MAX)    NULL,
    CoverUrl     NVARCHAR(500)    NULL,
    ImageUrl     NVARCHAR(500)    NULL
);

CREATE TABLE BookAuthors (
    BookId    UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    AuthorId  UNIQUEIDENTIFIER NOT NULL REFERENCES Authors(Id),
    PRIMARY KEY (BookId, AuthorId)
);

CREATE TABLE BookTags (
    BookId  UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    TagId   UNIQUEIDENTIFIER NOT NULL REFERENCES Tags(Id),
    PRIMARY KEY (BookId, TagId)
);

CREATE TABLE BookReviews (
    Id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId      UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    BookId      UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    Rating      INT              NOT NULL,
    ReviewText  NVARCHAR(MAX)    NULL,
    CreatedAt   DATETIME         NULL DEFAULT GETDATE()
);

-- ─── Reading Routes ───────────────────────────────────────────────────────────

CREATE TABLE Routes (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name            NVARCHAR(100)    NOT NULL,
    Description     NVARCHAR(MAX)    NULL,
    Category        NVARCHAR(50)     NULL,
    IsMonthly       BIT              NULL DEFAULT 0,
    IsPersonalized  BIT              NULL DEFAULT 0,
    ImageUrl        NVARCHAR(500)    NULL,
    CreatedAt       DATETIME         NULL DEFAULT GETDATE()
);

CREATE TABLE RouteBooks (
    RouteId   UNIQUEIDENTIFIER NOT NULL REFERENCES Routes(Id),
    BookId    UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    Position  INT              NULL,
    PRIMARY KEY (RouteId, BookId)
);

CREATE TABLE UserRoutes (
    UserId       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    RouteId      UNIQUEIDENTIFIER NOT NULL REFERENCES Routes(Id),
    Status       NVARCHAR(20)     NULL,  -- 'in_progress' | 'completed' | 'planned'
    StartedAt    DATETIME         NULL,
    CompletedAt  DATETIME         NULL,
    PRIMARY KEY (UserId, RouteId)
);

CREATE TABLE UserBookProgress (
    UserId   UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    BookId   UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    RouteId  UNIQUEIDENTIFIER NOT NULL REFERENCES Routes(Id),
    IsRead   BIT              NULL DEFAULT 0,
    ReadAt   DATETIME         NULL,
    PRIMARY KEY (UserId, BookId, RouteId)
);

-- ─── Gamification ─────────────────────────────────────────────────────────────

CREATE TABLE Badges (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name            NVARCHAR(50)     NULL,
    Description     NVARCHAR(MAX)    NULL,
    IconUrl         NVARCHAR(500)    NULL,
    ImageUrl        NVARCHAR(500)    NULL,
    Type            NVARCHAR(50)     NULL,  -- 'count' | 'genre_unique' | 'time_limit'
    RequiredValue   INT              NULL,
    TimeLimitHours  INT              NULL
);

CREATE TABLE UserBadges (
    UserId     UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    BadgeId    UNIQUEIDENTIFIER NOT NULL REFERENCES Badges(Id),
    AwardedAt  DATETIME         NULL DEFAULT GETDATE(),
    PRIMARY KEY (UserId, BadgeId)
);

CREATE TABLE UserAchievementsProgress (
    Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId         UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    BadgeId        UNIQUEIDENTIFIER NOT NULL REFERENCES Badges(Id),
    ProgressValue  INT              NULL DEFAULT 0,
    IsCompleted    BIT              NULL DEFAULT 0,
    LastUpdated    DATETIME         NULL DEFAULT GETDATE()
);

CREATE TABLE MonthlyVotingOptions (
    Id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TagId       UNIQUEIDENTIFIER NOT NULL REFERENCES Tags(Id),
    MonthStart  DATE             NOT NULL
);

CREATE TABLE MonthlyRouteVotes (
    Id       UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId   UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    TagId    UNIQUEIDENTIFIER NOT NULL REFERENCES Tags(Id),
    VotedAt  DATETIME         NOT NULL DEFAULT GETDATE()
);

-- ─── Clubs ───────────────────────────────────────────────────────────────────

CREATE TABLE Clubs (
    Id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name         NVARCHAR(150)    NOT NULL,
    Description  NVARCHAR(1000)   NULL,
    CreatedBy    UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CreatedAt    DATETIME         NOT NULL DEFAULT GETDATE(),
    InviteCode   NVARCHAR(100)    NOT NULL UNIQUE,
    IsActive     BIT              NOT NULL DEFAULT 1,
    IsPublic     BIT              NOT NULL DEFAULT 1,  -- міграція: ALTER TABLE Clubs ADD IsPublic BIT NOT NULL DEFAULT 1
    AvatarUrl    NVARCHAR(500)    NULL
);

CREATE TABLE ClubTags (  -- міграція: CREATE TABLE ClubTags (...)
    ClubId  UNIQUEIDENTIFIER NOT NULL REFERENCES Clubs(Id),
    TagId   UNIQUEIDENTIFIER NOT NULL REFERENCES Tags(Id),
    PRIMARY KEY (ClubId, TagId)
);

CREATE TABLE ClubMembers (
    ClubId    UNIQUEIDENTIFIER NOT NULL REFERENCES Clubs(Id),
    UserId    UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Role      NVARCHAR(20)     NOT NULL,  -- 'admin' | 'member'
    JoinedAt  DATETIME         NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (ClubId, UserId)
);

CREATE TABLE ClubBooks (
    Id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClubId     UNIQUEIDENTIFIER NOT NULL REFERENCES Clubs(Id),
    BookId     UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    StartDate  DATETIME         NOT NULL,
    EndDate    DATETIME         NULL,
    Status     NVARCHAR(20)     NOT NULL  -- 'active' | 'completed'
);

CREATE TABLE ClubHistory (
    Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClubId         UNIQUEIDENTIFIER NOT NULL REFERENCES Clubs(Id),
    BookId         UNIQUEIDENTIFIER NOT NULL REFERENCES Books(Id),
    StartDate      DATETIME         NOT NULL,
    EndDate        DATETIME         NULL,
    AverageRating  DECIMAL(3,2)     NULL,
    CompletedAt    DATETIME         NOT NULL DEFAULT GETDATE()
);

CREATE TABLE ClubMessages (
    Id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClubId       UNIQUEIDENTIFIER NOT NULL REFERENCES Clubs(Id),
    ClubBookId   UNIQUEIDENTIFIER NULL REFERENCES ClubBooks(Id),
    UserId       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    MessageText  NVARCHAR(MAX)    NOT NULL,
    CreatedAt    DATETIME         NOT NULL DEFAULT GETDATE()
);

CREATE TABLE ClubRatings (
    Id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClubId       UNIQUEIDENTIFIER NOT NULL REFERENCES Clubs(Id),
    ClubBookId   UNIQUEIDENTIFIER NOT NULL REFERENCES ClubBooks(Id),
    UserId       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Rating       INT              NOT NULL,
    CreatedAt    DATETIME         NOT NULL DEFAULT GETDATE()
);

-- ─── Social ───────────────────────────────────────────────────────────────────

CREATE TABLE FriendRequests (
    Id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SenderId     UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    ReceiverId   UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Status       NVARCHAR(20)     NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected'
    CreatedAt    DATETIME         NOT NULL DEFAULT GETDATE(),
    RespondedAt  DATETIME         NULL
);

CREATE TABLE Friendships (
    Id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId1   UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    UserId2   UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CreatedAt DATETIME         NOT NULL DEFAULT GETDATE()
);

-- ─── Messaging ───────────────────────────────────────────────────────────────

CREATE TABLE PrivateChats (
    Id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId1   UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    UserId2   UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CreatedAt DATETIME         NOT NULL DEFAULT GETDATE()
);

CREATE TABLE PrivateMessages (
    Id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ChatId       UNIQUEIDENTIFIER NOT NULL REFERENCES PrivateChats(Id),
    SenderId     UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    MessageText  NVARCHAR(MAX)    NOT NULL,
    CreatedAt    DATETIME         NOT NULL DEFAULT GETDATE(),
    IsRead       BIT              NOT NULL DEFAULT 0
);

-- ─── Notifications ────────────────────────────────────────────────────────────

CREATE TABLE Notifications (
    Id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId    UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Type      NVARCHAR(50)     NOT NULL,  -- 'friend_request' | 'friend_accepted'
    Data      NVARCHAR(MAX)    NULL,      -- JSON payload
    IsRead    BIT              NOT NULL DEFAULT 0,
    CreatedAt DATETIME         NOT NULL DEFAULT GETDATE()
);