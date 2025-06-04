const sql = require('mssql');
const config = require('../db/sqlConfig');

async function processBadge(userId, badgeName, eventPayload = {}) {
  const pool = await sql.connect(config);
  const badgeQuery = await pool.request()
    .input('Name', sql.NVarChar, badgeName)
    .query('SELECT * FROM Badges WHERE Name = @Name');

  if (!badgeQuery.recordset.length) {
    console.warn(`Badge '${badgeName}' not found.`);
    return null;
  }

  const badge = badgeQuery.recordset[0];
  const awarded = await processBadgeInternal(userId, badge.Id, eventPayload);
  return awarded;
}

async function processBadgeInternal(userId, badgeId, eventPayload = {}) {
  const pool = await sql.connect(config);
  const result = await pool.request()
    .input('BadgeId', sql.UniqueIdentifier, badgeId)
    .query('SELECT * FROM Badges WHERE Id = @BadgeId');

  if (!result.recordset.length) return null;
  const badge = result.recordset[0];

  switch (badge.Type) {
    case 'count':
      return await handleCountBadge(pool, userId, badge);
    case 'genre_unique':
      return await handleGenreBadge(pool, userId, badge);
    case 'time_limit':
      return await handleTimeBadge(pool, userId, badge, eventPayload);
    default:
      console.warn(`Невідомий тип нагороди: ${badge.Type}`);
      return null;
  }
}

async function awardBadge(pool, userId, badgeId) {
  const exists = await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .input('BadgeId', sql.UniqueIdentifier, badgeId)
    .query('SELECT * FROM UserBadges WHERE UserId = @UserId AND BadgeId = @BadgeId');

  if (!exists.recordset.length) {
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .input('BadgeId', sql.UniqueIdentifier, badgeId)
      .query('INSERT INTO UserBadges (UserId, BadgeId, AwardedAt) VALUES (@UserId, @BadgeId, GETDATE())');

    const badgeInfo = await pool.request()
      .input('BadgeId', sql.UniqueIdentifier, badgeId)
      .query('SELECT * FROM Badges WHERE Id = @BadgeId');

    return badgeInfo.recordset[0]; // 🟢 Повертаємо повний об'єкт нагороди
  }

  return null;
}

async function handleCountBadge(pool, userId, badge) {
  const progress = await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .input('BadgeId', sql.UniqueIdentifier, badge.Id)
    .query('SELECT * FROM UserAchievementsProgress WHERE UserId = @UserId AND BadgeId = @BadgeId');

  let current = progress.recordset[0]?.ProgressValue || 0;
  current += 1;

  if (progress.recordset.length > 0) {
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .input('BadgeId', sql.UniqueIdentifier, badge.Id)
      .input('ProgressValue', sql.Int, current)
      .query(`
        UPDATE UserAchievementsProgress 
        SET ProgressValue = @ProgressValue, LastUpdated = GETDATE() 
        WHERE UserId = @UserId AND BadgeId = @BadgeId
      `);
  } else {
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .input('BadgeId', sql.UniqueIdentifier, badge.Id)
      .input('ProgressValue', sql.Int, current)
      .query(`
        INSERT INTO UserAchievementsProgress (Id, UserId, BadgeId, ProgressValue) 
        VALUES (NEWID(), @UserId, @BadgeId, @ProgressValue)
      `);
  }

  if (current >= badge.RequiredValue) {
    return await awardBadge(pool, userId, badge.Id);
  }

  return null;
}

async function handleGenreBadge(pool, userId, badge) {
  const books = await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .query(`
      SELECT DISTINCT ubp.BookId
      FROM UserBookProgress ubp
      JOIN UserRoutes ur ON ubp.RouteId = ur.RouteId AND ubp.UserId = ur.UserId
      WHERE ubp.UserId = @UserId AND ubp.IsRead = 1 AND ur.Status = 'completed'
    `);

  if (!books.recordset.length) return null;

  const bookIds = books.recordset.map(r => `'${r.BookId}'`).join(',');
  if (!bookIds) return null;

  const genres = await pool.request().query(`
    SELECT DISTINCT TagId 
    FROM BookTags 
    WHERE BookId IN (${bookIds})
  `);

  const uniqueGenresCount = genres.recordset.length;

  const progress = await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .input('BadgeId', sql.UniqueIdentifier, badge.Id)
    .query('SELECT * FROM UserAchievementsProgress WHERE UserId = @UserId AND BadgeId = @BadgeId');

  if (progress.recordset.length > 0) {
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .input('BadgeId', sql.UniqueIdentifier, badge.Id)
      .input('ProgressValue', sql.Int, uniqueGenresCount)
      .query(`
        UPDATE UserAchievementsProgress 
        SET ProgressValue = @ProgressValue, LastUpdated = GETDATE() 
        WHERE UserId = @UserId AND BadgeId = @BadgeId
      `);
  } else {
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .input('BadgeId', sql.UniqueIdentifier, badge.Id)
      .input('ProgressValue', sql.Int, uniqueGenresCount)
      .query(`
        INSERT INTO UserAchievementsProgress (Id, UserId, BadgeId, ProgressValue) 
        VALUES (NEWID(), @UserId, @BadgeId, @ProgressValue)
      `);
  }

  if (uniqueGenresCount >= badge.RequiredValue) {
    return await awardBadge(pool, userId, badge.Id);
  }

  return null;
}

async function handleTimeBadge(pool, userId, badge, eventPayload) {
  const { routeId } = eventPayload;
  if (!routeId) return null;

  const route = await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .input('RouteId', sql.UniqueIdentifier, routeId)
    .query('SELECT StartedAt, CompletedAt FROM UserRoutes WHERE UserId = @UserId AND RouteId = @RouteId');

  const record = route.recordset[0];
  if (!record || !record.StartedAt || !record.CompletedAt) return null;

  const started = new Date(record.StartedAt);
  const completed = new Date(record.CompletedAt);
  const hoursTaken = (completed - started) / (1000 * 60 * 60);

  if (hoursTaken > badge.TimeLimitHours) return null;

  const progress = await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .input('BadgeId', sql.UniqueIdentifier, badge.Id)
    .query('SELECT * FROM UserAchievementsProgress WHERE UserId = @UserId AND BadgeId = @BadgeId');

  if (progress.recordset.length > 0) {
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .input('BadgeId', sql.UniqueIdentifier, badge.Id)
      .input('ProgressValue', sql.Int, 1)
      .query(`
        UPDATE UserAchievementsProgress 
        SET ProgressValue = @ProgressValue, LastUpdated = GETDATE() 
        WHERE UserId = @UserId AND BadgeId = @BadgeId
      `);
  } else {
    await pool.request()
      .input('UserId', sql.UniqueIdentifier, userId)
      .input('BadgeId', sql.UniqueIdentifier, badge.Id)
      .input('ProgressValue', sql.Int, 1)
      .query(`
        INSERT INTO UserAchievementsProgress (Id, UserId, BadgeId, ProgressValue) 
        VALUES (NEWID(), @UserId, @BadgeId, @ProgressValue)
      `);
  }

  return await awardBadge(pool, userId, badge.Id);
}

module.exports = { processBadge };
