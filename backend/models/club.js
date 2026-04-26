const sql = require('mssql');
const config = require('../db/sqlConfig');
const { v4: uuidv4 } = require('uuid');

function generateInviteCode() {
  return uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
}

const club = {
  async create({ name, description, avatarUrl, isPublic, tagIds, creatorId }) {
    const pool = await sql.connect(config);
    const id = uuidv4();
    const inviteCode = generateInviteCode();

    await pool.request()
      .input('Id',          sql.UniqueIdentifier, id)
      .input('Name',        sql.NVarChar(150),    name)
      .input('Description', sql.NVarChar(1000),   description || null)
      .input('CreatedBy',   sql.UniqueIdentifier, creatorId)
      .input('InviteCode',  sql.NVarChar(100),    inviteCode)
      .input('IsPublic',    sql.Bit,              isPublic ? 1 : 0)
      .input('AvatarUrl',   sql.NVarChar(500),    avatarUrl || null)
      .query(`
        INSERT INTO Clubs (Id, Name, Description, CreatedBy, CreatedAt, InviteCode, IsActive, IsPublic, AvatarUrl)
        VALUES (@Id, @Name, @Description, @CreatedBy, GETDATE(), @InviteCode, 1, @IsPublic, @AvatarUrl)
      `);

    await pool.request()
      .input('ClubId', sql.UniqueIdentifier, id)
      .input('UserId', sql.UniqueIdentifier, creatorId)
      .query(`
        INSERT INTO ClubMembers (ClubId, UserId, Role, JoinedAt)
        VALUES (@ClubId, @UserId, 'admin', GETDATE())
      `);

    for (const tagId of (tagIds || [])) {
      await pool.request()
        .input('ClubId', sql.UniqueIdentifier, id)
        .input('TagId',  sql.UniqueIdentifier, tagId)
        .query('INSERT INTO ClubTags (ClubId, TagId) VALUES (@ClubId, @TagId)');
    }

    return { id, inviteCode };
  },

  async getById(clubId) {
    const pool = await sql.connect(config);

    const clubResult = await pool.request()
      .input('Id', sql.UniqueIdentifier, clubId)
      .query(`
        SELECT c.Id, c.Name, c.Description, c.AvatarUrl, c.InviteCode,
               c.IsPublic, c.CreatedBy, c.CreatedAt,
               (SELECT COUNT(*) FROM ClubMembers WHERE ClubId = c.Id) AS MemberCount
        FROM Clubs c
        WHERE c.Id = @Id AND c.IsActive = 1
      `);

    if (clubResult.recordset.length === 0) return null;

    const [tagsResult, membersResult, currentBookResult] = await Promise.all([
      pool.request()
        .input('ClubId', sql.UniqueIdentifier, clubId)
        .query(`
          SELECT t.Id, t.Name, t.Type
          FROM ClubTags ct JOIN Tags t ON t.Id = ct.TagId
          WHERE ct.ClubId = @ClubId
        `),
      pool.request()
        .input('ClubId', sql.UniqueIdentifier, clubId)
        .query(`
          SELECT u.Id, u.Username, u.AvatarUrl, cm.Role, cm.JoinedAt
          FROM ClubMembers cm JOIN Users u ON u.Id = cm.UserId
          WHERE cm.ClubId = @ClubId
          ORDER BY CASE cm.Role WHEN 'admin' THEN 0 ELSE 1 END, cm.JoinedAt
        `),
      pool.request()
        .input('ClubId', sql.UniqueIdentifier, clubId)
        .query(`
          SELECT cb.Id AS ClubBookId, cb.StartDate, cb.EndDate, cb.Status,
                 b.Id AS BookId, b.Title, b.Author, b.CoverUrl,
                 DATEDIFF(day, GETDATE(), cb.EndDate) AS DaysLeft,
                 (SELECT AVG(CAST(Rating AS FLOAT)) FROM ClubRatings WHERE ClubBookId = cb.Id) AS AverageRating,
                 (SELECT COUNT(*)                   FROM ClubRatings WHERE ClubBookId = cb.Id) AS RatingsCount
          FROM ClubBooks cb
          JOIN Books b ON b.Id = cb.BookId
          WHERE cb.ClubId = @ClubId AND cb.Status = 'active'
        `),
    ]);

    return {
      ...clubResult.recordset[0],
      tags:        tagsResult.recordset,
      members:     membersResult.recordset,
      currentBook: currentBookResult.recordset[0] || null,
    };
  },

  async search(query, page = 1, pageSize = 10) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('Query',    sql.NVarChar, `%${query || ''}%`)
      .input('Offset',   sql.Int, (page - 1) * pageSize)
      .input('PageSize', sql.Int, pageSize)
      .query(`
        SELECT c.Id, c.Name, c.Description, c.AvatarUrl,
               (SELECT COUNT(*) FROM ClubMembers WHERE ClubId = c.Id) AS MemberCount
        FROM Clubs c
        WHERE c.IsPublic = 1 AND c.IsActive = 1
          AND (c.Name LIKE @Query OR c.Description LIKE @Query)
        ORDER BY MemberCount DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
      `);
    return result.recordset;
  },

  async getMyClubs(userId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT c.Id, c.Name, c.AvatarUrl, c.IsPublic, cm.Role,
               (SELECT COUNT(*) FROM ClubMembers WHERE ClubId = c.Id) AS MemberCount
        FROM ClubMembers cm
        JOIN Clubs c ON c.Id = cm.ClubId
        WHERE cm.UserId = @UserId AND c.IsActive = 1
      `);
    return result.recordset;
  },

  async getMemberRole(clubId, userId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .input('UserId', sql.UniqueIdentifier, userId)
      .query('SELECT Role FROM ClubMembers WHERE ClubId = @ClubId AND UserId = @UserId');
    return result.recordset[0]?.Role || null;
  },

  async joinByCode(inviteCode, userId) {
    const pool = await sql.connect(config);

    const clubResult = await pool.request()
      .input('Code', sql.NVarChar, inviteCode)
      .query('SELECT Id FROM Clubs WHERE InviteCode = @Code AND IsActive = 1');

    if (clubResult.recordset.length === 0) return null;
    const clubId = clubResult.recordset[0].Id;

    const existing = await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .input('UserId', sql.UniqueIdentifier, userId)
      .query('SELECT 1 FROM ClubMembers WHERE ClubId = @ClubId AND UserId = @UserId');

    if (existing.recordset.length > 0) return { clubId, alreadyMember: true };

    await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .input('UserId', sql.UniqueIdentifier, userId)
      .query(`
        INSERT INTO ClubMembers (ClubId, UserId, Role, JoinedAt)
        VALUES (@ClubId, @UserId, 'member', GETDATE())
      `);

    return { clubId, alreadyMember: false };
  },

  async leave(clubId, userId) {
    const pool = await sql.connect(config);

    const role = await this.getMemberRole(clubId, userId);
    if (role === 'admin') {
      const adminCount = await pool.request()
        .input('ClubId', sql.UniqueIdentifier, clubId)
        .query(`SELECT COUNT(*) AS Cnt FROM ClubMembers WHERE ClubId = @ClubId AND Role = 'admin'`);
      if (adminCount.recordset[0].Cnt <= 1) return { error: 'last_admin' };
    }

    await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .input('UserId', sql.UniqueIdentifier, userId)
      .query('DELETE FROM ClubMembers WHERE ClubId = @ClubId AND UserId = @UserId');

    return { success: true };
  },

  async setMemberRole(clubId, targetUserId, role) {
    const pool = await sql.connect(config);
    await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .input('UserId', sql.UniqueIdentifier, targetUserId)
      .input('Role',   sql.NVarChar, role)
      .query('UPDATE ClubMembers SET Role = @Role WHERE ClubId = @ClubId AND UserId = @UserId');
  },

  // ─── Current book ────────────────────────────────────────────────────────────

  async setCurrentBook(clubId, bookId, startDate, endDate) {
    const pool = await sql.connect(config);

    // Complete any active book first
    const active = await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .query(`SELECT Id FROM ClubBooks WHERE ClubId = @ClubId AND Status = 'active'`);

    if (active.recordset.length > 0) {
      await this.completeCurrentBook(clubId);
    }

    const id = uuidv4();
    await pool.request()
      .input('Id',        sql.UniqueIdentifier, id)
      .input('ClubId',    sql.UniqueIdentifier, clubId)
      .input('BookId',    sql.UniqueIdentifier, bookId)
      .input('StartDate', sql.DateTime, new Date(startDate))
      .input('EndDate',   sql.DateTime, new Date(endDate))
      .query(`
        INSERT INTO ClubBooks (Id, ClubId, BookId, StartDate, EndDate, Status)
        VALUES (@Id, @ClubId, @BookId, @StartDate, @EndDate, 'active')
      `);

    return id;
  },

  async completeCurrentBook(clubId) {
    const pool = await sql.connect(config);

    const active = await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .query(`
        SELECT cb.Id, cb.BookId, cb.StartDate, cb.EndDate,
               AVG(CAST(cr.Rating AS FLOAT)) AS AvgRating
        FROM ClubBooks cb
        LEFT JOIN ClubRatings cr ON cr.ClubBookId = cb.Id
        WHERE cb.ClubId = @ClubId AND cb.Status = 'active'
        GROUP BY cb.Id, cb.BookId, cb.StartDate, cb.EndDate
      `);

    if (active.recordset.length === 0) return null;
    const book = active.recordset[0];

    await pool.request()
      .input('Id', sql.UniqueIdentifier, book.Id)
      .query(`UPDATE ClubBooks SET Status = 'completed' WHERE Id = @Id`);

    await pool.request()
      .input('Id',            sql.UniqueIdentifier, uuidv4())
      .input('ClubId',        sql.UniqueIdentifier, clubId)
      .input('BookId',        sql.UniqueIdentifier, book.BookId)
      .input('StartDate',     sql.DateTime,         book.StartDate)
      .input('EndDate',       sql.DateTime,         book.EndDate)
      .input('AverageRating', sql.Decimal(3, 2),    book.AvgRating || null)
      .query(`
        INSERT INTO ClubHistory (Id, ClubId, BookId, StartDate, EndDate, AverageRating, CompletedAt)
        VALUES (@Id, @ClubId, @BookId, @StartDate, @EndDate, @AverageRating, GETDATE())
      `);

    return book;
  },

  // ─── Ratings ────────────────────────────────────────────────────────────────

  async rateBook(clubId, clubBookId, userId, rating) {
    const pool = await sql.connect(config);

    await pool.request()
      .input('Id',          sql.UniqueIdentifier, uuidv4())
      .input('ClubId',      sql.UniqueIdentifier, clubId)
      .input('ClubBookId',  sql.UniqueIdentifier, clubBookId)
      .input('UserId',      sql.UniqueIdentifier, userId)
      .input('Rating',      sql.Int, rating)
      .query(`
        MERGE ClubRatings AS target
        USING (SELECT @ClubBookId AS ClubBookId, @UserId AS UserId) AS source
        ON target.ClubBookId = source.ClubBookId AND target.UserId = source.UserId
        WHEN MATCHED THEN
          UPDATE SET Rating = @Rating, CreatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (Id, ClubId, ClubBookId, UserId, Rating, CreatedAt)
          VALUES (@Id, @ClubId, @ClubBookId, @UserId, @Rating, GETDATE());
      `);

    const [memberCount, ratingCount] = await Promise.all([
      pool.request()
        .input('ClubId', sql.UniqueIdentifier, clubId)
        .query('SELECT COUNT(*) AS Cnt FROM ClubMembers WHERE ClubId = @ClubId'),
      pool.request()
        .input('ClubBookId', sql.UniqueIdentifier, clubBookId)
        .query('SELECT COUNT(*) AS Cnt FROM ClubRatings WHERE ClubBookId = @ClubBookId'),
    ]);

    const allRated = ratingCount.recordset[0].Cnt >= memberCount.recordset[0].Cnt;
    if (allRated) await this.completeCurrentBook(clubId);

    return { allRated };
  },

  async getUserRating(clubBookId, userId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('ClubBookId', sql.UniqueIdentifier, clubBookId)
      .input('UserId',     sql.UniqueIdentifier, userId)
      .query('SELECT Rating FROM ClubRatings WHERE ClubBookId = @ClubBookId AND UserId = @UserId');
    return result.recordset[0]?.Rating || null;
  },

  // ─── History ─────────────────────────────────────────────────────────────────

  async getHistory(clubId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .query(`
        SELECT ch.Id, ch.StartDate, ch.EndDate, ch.AverageRating, ch.CompletedAt,
               b.Id AS BookId, b.Title, b.Author, b.CoverUrl
        FROM ClubHistory ch
        JOIN Books b ON b.Id = ch.BookId
        WHERE ch.ClubId = @ClubId
        ORDER BY ch.CompletedAt DESC
      `);
    return result.recordset;
  },

  // ─── Messages ────────────────────────────────────────────────────────────────

  async getMessages(clubId, limit = 50) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .input('Limit',  sql.Int, limit)
      .query(`
        SELECT TOP (@Limit)
          cm.Id, cm.UserId, cm.MessageText, cm.CreatedAt,
          u.Username, u.AvatarUrl
        FROM ClubMessages cm
        JOIN Users u ON u.Id = cm.UserId
        WHERE cm.ClubId = @ClubId
        ORDER BY cm.CreatedAt DESC
      `);
    return result.recordset.reverse();
  },

  async saveClubMessage(clubId, userId, text) {
    const pool = await sql.connect(config);
    const id = uuidv4();

    await pool.request()
      .input('Id',          sql.UniqueIdentifier,   id)
      .input('ClubId',      sql.UniqueIdentifier,   clubId)
      .input('UserId',      sql.UniqueIdentifier,   userId)
      .input('MessageText', sql.NVarChar(sql.MAX),  text)
      .query(`
        INSERT INTO ClubMessages (Id, ClubId, UserId, MessageText, CreatedAt)
        VALUES (@Id, @ClubId, @UserId, @MessageText, GETDATE())
      `);

    const result = await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .query(`
        SELECT cm.Id, cm.UserId, cm.MessageText, cm.CreatedAt,
               u.Username, u.AvatarUrl
        FROM ClubMessages cm JOIN Users u ON u.Id = cm.UserId
        WHERE cm.Id = @Id
      `);
    return result.recordset[0];
  },

  async getUserClubIds(userId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .query('SELECT ClubId FROM ClubMembers WHERE UserId = @UserId');
    return result.recordset.map(r => r.ClubId);
  },

  // ─── Recommendations (Content-Based Filtering: tags 70% + authors 30%) ──────

  async getRecommendations(clubId, limit = 8) {
    const pool = await sql.connect(config);

    // Tag weights from all rated history books
    const tagWeightResult = await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .query(`
        SELECT bt.TagId, SUM(ch.AverageRating) AS Weight
        FROM ClubHistory ch
        JOIN BookTags bt ON bt.BookId = ch.BookId
        WHERE ch.ClubId = @ClubId AND ch.AverageRating IS NOT NULL
        GROUP BY bt.TagId
      `);

    // Authors from books rated >= 3.5
    const goodAuthorsResult = await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .query(`
        SELECT DISTINCT ba.AuthorId
        FROM ClubHistory ch
        JOIN BookAuthors ba ON ba.BookId = ch.BookId
        WHERE ch.ClubId = @ClubId AND ch.AverageRating >= 3.5
      `);

    // Candidate books (not yet read by club) with their tags and authors
    const candidatesResult = await pool.request()
      .input('ClubId', sql.UniqueIdentifier, clubId)
      .query(`
        SELECT TOP 200
          b.Id, b.Title, b.Author, b.CoverUrl,
          bt.TagId,
          ba.AuthorId
        FROM Books b
        LEFT JOIN BookTags    bt ON bt.BookId = b.Id
        LEFT JOIN BookAuthors ba ON ba.BookId = b.Id
        WHERE b.Id NOT IN (
          SELECT BookId FROM ClubHistory WHERE ClubId = @ClubId
          UNION
          SELECT BookId FROM ClubBooks    WHERE ClubId = @ClubId
        )
        ORDER BY NEWID()
      `);

    // No history yet — return random candidates
    if (tagWeightResult.recordset.length === 0) {
      const unique = {};
      for (const row of candidatesResult.recordset) {
        if (!unique[row.Id]) {
          unique[row.Id] = { Id: row.Id, Title: row.Title, Author: row.Author, CoverUrl: row.CoverUrl, Score: 0 };
        }
      }
      return Object.values(unique).slice(0, limit);
    }

    const tagWeights = {};
    for (const { TagId, Weight } of tagWeightResult.recordset) tagWeights[TagId] = Weight;
    const totalTagWeight = Object.values(tagWeights).reduce((a, b) => a + b, 0) || 1;
    const goodAuthors = new Set(goodAuthorsResult.recordset.map(r => r.AuthorId));

    // Group rows by book and accumulate scores
    const books = {};
    for (const row of candidatesResult.recordset) {
      if (!books[row.Id]) {
        books[row.Id] = { Id: row.Id, Title: row.Title, Author: row.Author, CoverUrl: row.CoverUrl, tagScore: 0, hasGoodAuthor: false };
      }
      if (row.TagId && tagWeights[row.TagId]) books[row.Id].tagScore += tagWeights[row.TagId];
      if (row.AuthorId && goodAuthors.has(row.AuthorId)) books[row.Id].hasGoodAuthor = true;
    }

    return Object.values(books)
      .map(b => ({
        Id: b.Id, Title: b.Title, Author: b.Author, CoverUrl: b.CoverUrl,
        Score: Math.round((b.tagScore / totalTagWeight * 0.7 + (b.hasGoodAuthor ? 0.3 : 0)) * 100),
      }))
      .filter(b => b.Score > 0)
      .sort((a, b) => b.Score - a.Score)
      .slice(0, limit);
  },
};

module.exports = club;
