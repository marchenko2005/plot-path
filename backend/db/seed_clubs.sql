-- ─── Seed: Book Clubs ─────────────────────────────────────────────────────────
-- Run after Users, Books, Tags are already populated.
-- Books are selected by matching genre tag names to each club theme.

SET NOCOUNT ON;

-- ── 1. Users ──────────────────────────────────────────────────────────────────
DECLARE @User1 UNIQUEIDENTIFIER = (SELECT Id FROM (SELECT Id, ROW_NUMBER() OVER (ORDER BY CreatedAt) AS rn FROM Users) t WHERE rn = 1);
DECLARE @User2 UNIQUEIDENTIFIER = (SELECT Id FROM (SELECT Id, ROW_NUMBER() OVER (ORDER BY CreatedAt) AS rn FROM Users) t WHERE rn = 2);
DECLARE @User3 UNIQUEIDENTIFIER = (SELECT Id FROM (SELECT Id, ROW_NUMBER() OVER (ORDER BY CreatedAt) AS rn FROM Users) t WHERE rn = 3);
DECLARE @User4 UNIQUEIDENTIFIER = (SELECT Id FROM (SELECT Id, ROW_NUMBER() OVER (ORDER BY CreatedAt) AS rn FROM Users) t WHERE rn = 4);

IF @User2 IS NULL SET @User2 = @User1;
IF @User3 IS NULL SET @User3 = @User1;
IF @User4 IS NULL SET @User4 = @User1;

-- ── 2. Genre tags by theme ────────────────────────────────────────────────────
DECLARE @TagFantasy   UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM Tags WHERE Type = 'Genre' AND Name LIKE '%Fantasy%');
DECLARE @TagMystery   UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM Tags WHERE Type = 'Genre' AND Name LIKE '%Mystery%' OR Name LIKE '%Thriller%' OR Name LIKE '%Detective%');
DECLARE @TagClassics  UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM Tags WHERE Type = 'Genre' AND Name LIKE '%Classic%');

-- Fallback: first available genre tag
DECLARE @AnyTag UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM Tags WHERE Type = 'Genre' ORDER BY Name);
IF @TagFantasy  IS NULL SET @TagFantasy  = @AnyTag;
IF @TagMystery  IS NULL SET @TagMystery  = @AnyTag;
IF @TagClassics IS NULL SET @TagClassics = @AnyTag;

-- ── 3. Books matched to club theme via BookTags ───────────────────────────────

-- Fantasy book: first book tagged with the Fantasy genre tag
DECLARE @BookFantasy1 UNIQUEIDENTIFIER = (
  SELECT TOP 1 b.Id FROM Books b
  JOIN BookTags bt ON bt.BookId = b.Id
  WHERE bt.TagId = @TagFantasy
  ORDER BY b.Title
);
-- Second fantasy book (for ClubHistory)
DECLARE @BookFantasy2 UNIQUEIDENTIFIER = (
  SELECT TOP 1 b.Id FROM Books b
  JOIN BookTags bt ON bt.BookId = b.Id
  WHERE bt.TagId = @TagFantasy AND b.Id <> ISNULL(@BookFantasy1, '00000000-0000-0000-0000-000000000000')
  ORDER BY b.Title
);

-- Mystery book
DECLARE @BookMystery UNIQUEIDENTIFIER = (
  SELECT TOP 1 b.Id FROM Books b
  JOIN BookTags bt ON bt.BookId = b.Id
  WHERE bt.TagId = @TagMystery
  ORDER BY b.Title
);

-- Fallback to any book if no tagged match found
DECLARE @AnyBook UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM Books ORDER BY Title);
IF @BookFantasy1 IS NULL SET @BookFantasy1 = @AnyBook;
IF @BookFantasy2 IS NULL SET @BookFantasy2 = @AnyBook;
IF @BookMystery  IS NULL SET @BookMystery  = @AnyBook;

-- ── 4. Club and ClubBook IDs ──────────────────────────────────────────────────
DECLARE @Club1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Club2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Club3Id UNIQUEIDENTIFIER = NEWID();

DECLARE @ClubBook1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @ClubBook2Id UNIQUEIDENTIFIER = NEWID();

-- ── 5. Create clubs ───────────────────────────────────────────────────────────
INSERT INTO Clubs (Id, Name, Description, CreatedBy, CreatedAt, InviteCode, IsActive, IsPublic, AvatarUrl)
VALUES
  (@Club1Id,
   N'Fantasy Readers Club',
   N'We read the best fantasy fiction — from timeless classics to the latest releases. Members vote on the next book and meet monthly to discuss.',
   @User1, DATEADD(DAY, -60, GETDATE()), 'FANTASY001AA', 1, 1, NULL),

  (@Club2Id,
   N'Mystery & Thriller Circle',
   N'A club for fans of crime, mystery, and suspense. We pick a new thriller each month and try to solve the puzzle before the last chapter.',
   @User2, DATEADD(DAY, -30, GETDATE()), 'MYSTERY002BB', 1, 1, NULL),

  (@Club3Id,
   N'Great Books Society',
   N'A private club dedicated to literary classics that have stood the test of time. We read slowly, discuss deeply.',
   @User3, DATEADD(DAY, -14, GETDATE()), 'CLASSICS03CC', 1, 0, NULL);

-- ── 6. Members ────────────────────────────────────────────────────────────────

-- Club 1: User1 (admin) + User2 + User3
IF NOT EXISTS (SELECT 1 FROM ClubMembers WHERE ClubId = @Club1Id AND UserId = @User1)
  INSERT INTO ClubMembers VALUES (@Club1Id, @User1, 'admin',  DATEADD(DAY, -60, GETDATE()));
IF @User2 <> @User1 AND NOT EXISTS (SELECT 1 FROM ClubMembers WHERE ClubId = @Club1Id AND UserId = @User2)
  INSERT INTO ClubMembers VALUES (@Club1Id, @User2, 'member', DATEADD(DAY, -55, GETDATE()));
IF @User3 <> @User1 AND @User3 <> @User2 AND NOT EXISTS (SELECT 1 FROM ClubMembers WHERE ClubId = @Club1Id AND UserId = @User3)
  INSERT INTO ClubMembers VALUES (@Club1Id, @User3, 'member', DATEADD(DAY, -50, GETDATE()));

-- Club 2: User2 (admin) + User4
IF NOT EXISTS (SELECT 1 FROM ClubMembers WHERE ClubId = @Club2Id AND UserId = @User2)
  INSERT INTO ClubMembers VALUES (@Club2Id, @User2, 'admin',  DATEADD(DAY, -30, GETDATE()));
IF @User4 <> @User2 AND NOT EXISTS (SELECT 1 FROM ClubMembers WHERE ClubId = @Club2Id AND UserId = @User4)
  INSERT INTO ClubMembers VALUES (@Club2Id, @User4, 'member', DATEADD(DAY, -25, GETDATE()));

-- Club 3: User3 (admin) + User1
IF NOT EXISTS (SELECT 1 FROM ClubMembers WHERE ClubId = @Club3Id AND UserId = @User3)
  INSERT INTO ClubMembers VALUES (@Club3Id, @User3, 'admin',  DATEADD(DAY, -14, GETDATE()));
IF @User1 <> @User3 AND NOT EXISTS (SELECT 1 FROM ClubMembers WHERE ClubId = @Club3Id AND UserId = @User1)
  INSERT INTO ClubMembers VALUES (@Club3Id, @User1, 'member', DATEADD(DAY, -10, GETDATE()));

-- ── 7. Club genre tags ────────────────────────────────────────────────────────
INSERT INTO ClubTags (ClubId, TagId) VALUES (@Club1Id, @TagFantasy);
INSERT INTO ClubTags (ClubId, TagId) VALUES (@Club2Id, @TagMystery);
INSERT INTO ClubTags (ClubId, TagId) VALUES (@Club3Id, @TagClassics);

-- ── 8. Current book of the month (clubs 1 and 2) ─────────────────────────────
INSERT INTO ClubBooks (Id, ClubId, BookId, StartDate, EndDate, Status) VALUES
  (@ClubBook1Id, @Club1Id, @BookFantasy1,
   DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, 20, GETDATE()), 'active'),

  (@ClubBook2Id, @Club2Id, @BookMystery,
   DATEADD(DAY, -5,  GETDATE()), DATEADD(DAY, 25, GETDATE()), 'active');

-- ── 9. Completed book in ClubHistory (club 1) ────────────────────────────────
INSERT INTO ClubHistory (Id, ClubId, BookId, StartDate, EndDate, AverageRating, CompletedAt) VALUES
  (NEWID(), @Club1Id, @BookFantasy2,
   DATEADD(DAY, -60, GETDATE()), DATEADD(DAY, -15, GETDATE()), 4.50,
   DATEADD(DAY, -15, GETDATE()));

-- ── 10. Chat messages (club 1) ────────────────────────────────────────────────
INSERT INTO ClubMessages (Id, ClubId, ClubBookId, UserId, MessageText, CreatedAt) VALUES
  (NEWID(), @Club1Id, @ClubBook1Id, @User1,
   N'Hey everyone! We are starting our new book — share your first impressions here.',
   DATEADD(DAY, -10, GETDATE())),

  (NEWID(), @Club1Id, @ClubBook1Id, @User2,
   N'Already finished the first three chapters — absolutely hooked! The world-building is incredible.',
   DATEADD(DAY, -8, GETDATE())),

  (NEWID(), @Club1Id, @ClubBook1Id, @User3,
   N'Agreed, the atmosphere is something else. Cannot wait for our discussion session!',
   DATEADD(DAY, -7, GETDATE()));

-- ── Result ────────────────────────────────────────────────────────────────────
SELECT 'Clubs'        AS [Table], COUNT(*) AS Inserted FROM Clubs        WHERE Id     IN (@Club1Id, @Club2Id, @Club3Id)
UNION ALL
SELECT 'ClubMembers',              COUNT(*)             FROM ClubMembers  WHERE ClubId IN (@Club1Id, @Club2Id, @Club3Id)
UNION ALL
SELECT 'ClubBooks',                COUNT(*)             FROM ClubBooks    WHERE ClubId IN (@Club1Id, @Club2Id, @Club3Id)
UNION ALL
SELECT 'ClubHistory',              COUNT(*)             FROM ClubHistory  WHERE ClubId IN (@Club1Id, @Club2Id, @Club3Id)
UNION ALL
SELECT 'ClubMessages',             COUNT(*)             FROM ClubMessages WHERE ClubId IN (@Club1Id, @Club2Id, @Club3Id);
