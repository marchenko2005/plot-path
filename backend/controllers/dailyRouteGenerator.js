const sql = require('mssql');
const config = require('../db/sqlConfig');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

// Генерує маршрути для всіх користувачів із вподобаннями
async function generateDailyRoutes() {
  const pool = await sql.connect(config);

  // Отримуємо користувачів з уподобаннями
  const usersResult = await pool.request().query(`
    SELECT DISTINCT UserId FROM UserTagPreferences
  `);

  for (const { UserId } of usersResult.recordset) {
    await generateRoutesForUser(UserId, pool);
  }

  // Видаляємо сирітські маршрути без жодного користувача
  await pool.request().query(`
    DELETE FROM Routes
    WHERE IsMonthly = 0 AND Id NOT IN (
      SELECT RouteId FROM UserRoutes
    )
  `);
}

// Генерує 3 маршрути: жанровий, троповий, комбінований
async function generateRoutesForUser(userId, pool) {
  await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .query(`
      DELETE ur FROM UserRoutes ur
      JOIN Routes r ON ur.RouteId = r.Id
      WHERE ur.UserId = @UserId AND ur.Status = 'planned' AND r.IsMonthly = 0
    `);

  const genreResult = await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .query(`
      SELECT TOP 1 t.Id, t.Name FROM UserTagPreferences up
      JOIN Tags t ON up.TagId = t.Id
      WHERE t.Type = 'Genre' AND up.UserId = @UserId
      ORDER BY NEWID()
    `);

  const tropeResult = await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .query(`
      SELECT TOP 1 t.Id, t.Name FROM UserTagPreferences up
      JOIN Tags t ON up.TagId = t.Id
      WHERE t.Type = 'Trope' AND up.UserId = @UserId
      ORDER BY NEWID()
    `);

  const genre = genreResult.recordset[0];
  const trope = tropeResult.recordset[0];

  if (!genre && !trope) return;

  const today = new Date().toISOString().slice(0, 10);

  const selected = [
    { name: 'Top Genre Route',  tag: genre,  category: genre?.Name },
    { name: 'Top Trope Route',  tag: trope,  category: trope?.Name },
    { name: 'Combined Route',   tags: genre && trope ? [genre, trope] : null,
      category: genre && trope ? `${genre.Name} + ${trope.Name}`.slice(0, 50) : null },
  ];

  for (const entry of selected) {
    try {
      if (entry.tags) {
        const [g, t] = entry.tags;
        const booksResult = await pool.request()
          .input('GenreId', sql.UniqueIdentifier, g.Id)
          .input('TropeId', sql.UniqueIdentifier, t.Id)
          .query(`
            SELECT DISTINCT b.Id
            FROM BookTags bt
            JOIN Books b ON b.Id = bt.BookId
            WHERE bt.TagId = @GenreId OR bt.TagId = @TropeId
          `);
        if (booksResult.recordset.length === 0) { console.log(`[Generator] No books for combined ${g.Name}+${t.Name}, skipping`); continue; }
        const books = getRandomBooks(booksResult.recordset, 3, 6);
        await createRouteAndAssign(userId, uuidv4(), `${entry.name} - ${today}`, entry.category, books, pool);
        console.log(`[Generator] Created combined route for user ${userId}`);
      } else if (entry.tag) {
        const booksResult = await pool.request()
          .input('TagId', sql.UniqueIdentifier, entry.tag.Id)
          .query(`
            SELECT DISTINCT b.Id
            FROM BookTags bt
            JOIN Books b ON bt.BookId = b.Id
            WHERE bt.TagId = @TagId
          `);
        if (booksResult.recordset.length === 0) { console.log(`[Generator] No books for tag ${entry.tag.Name}, skipping`); continue; }
        const books = getRandomBooks(booksResult.recordset, 3, 6);
        await createRouteAndAssign(userId, uuidv4(), `${entry.name} - ${today}`, entry.category, books, pool);
        console.log(`[Generator] Created ${entry.name} for user ${userId}`);
      }
    } catch (err) {
      console.error(`[Generator] Failed to create "${entry.name}" for user ${userId}:`, err.message);
    }
  }
}

// Обирає випадкові 3–6 книг
function getRandomBooks(books, min, max) {
  const count = Math.min(Math.max(min, Math.floor(Math.random() * (max - min + 1) + min)), books.length);
  const shuffled = books.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Створює маршрут та додає книги та зв’язок з користувачем
async function createRouteAndAssign(userId, routeId, name, category, books, pool) {
  await pool.request()
    .input('Id', sql.UniqueIdentifier, routeId)
    .input('Name', sql.NVarChar, name)
    .input('Category', sql.NVarChar, category)
    .input('IsMonthly', sql.Bit, 0)
    .input('CreatedAt', sql.DateTime, new Date())
    .query(`
      INSERT INTO Routes (Id, Name, Category, IsMonthly, CreatedAt)
      VALUES (@Id, @Name, @Category, @IsMonthly, @CreatedAt)
    `);

  for (let i = 0; i < books.length; i++) {
    await pool.request()
      .input('RouteId', sql.UniqueIdentifier, routeId)
      .input('BookId', sql.UniqueIdentifier, books[i].Id)
      .input('Position', sql.Int, i + 1)
      .query(`
        INSERT INTO RouteBooks (RouteId, BookId, Position)
        VALUES (@RouteId, @BookId, @Position)
      `);
  }

  await pool.request()
    .input('UserId', sql.UniqueIdentifier, userId)
    .input('RouteId', sql.UniqueIdentifier, routeId)
    .input('Status', sql.NVarChar, 'planned')
    .input('StartedAt', sql.DateTime, null)
    .query(`
      INSERT INTO UserRoutes (UserId, RouteId, Status, StartedAt)
      VALUES (@UserId, @RouteId, @Status, @StartedAt)
    `);
}

// Запуск щоденно о 01:00
cron.schedule('0 1 * * *', generateDailyRoutes);

module.exports = { generateDailyRoutes };
