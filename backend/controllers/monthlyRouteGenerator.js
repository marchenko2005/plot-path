const sql = require('mssql');
const config = require('../db/sqlConfig');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

async function generateMonthlyRoute() {
  const pool = await sql.connect(config);

  // Видалити старий маршрут місяця повністю
  const oldRoutes = await pool.request().query(`SELECT Id FROM Routes WHERE IsMonthly = 1`);
  for (const row of oldRoutes.recordset) {
    const routeId = row.Id;

    await pool.request().input('RouteId', sql.UniqueIdentifier, routeId)
      .query('DELETE FROM UserRoutes WHERE RouteId = @RouteId');

    await pool.request().input('RouteId', sql.UniqueIdentifier, routeId)
      .query('DELETE FROM RouteBooks WHERE RouteId = @RouteId');

    await pool.request().input('RouteId', sql.UniqueIdentifier, routeId)
      .query('DELETE FROM Routes WHERE Id = @RouteId');
  }

  // Обрати тег-переможець за кількістю голосів
  const voteResult = await pool.request().query(`
    SELECT TOP 1 TagId, COUNT(*) AS Votes
    FROM MonthlyRouteVotes
    GROUP BY TagId
    ORDER BY Votes DESC
  `);

  if (!voteResult.recordset.length) {
    console.log('❌ Немає голосів для формування маршруту місяця');
    return;
  }

  const tagId = voteResult.recordset[0].TagId;

  const tagInfo = await pool.request()
    .input('TagId', sql.UniqueIdentifier, tagId)
    .query('SELECT Name FROM Tags WHERE Id = @TagId');

  if (!tagInfo.recordset.length) return;

  const tagName = tagInfo.recordset[0].Name;

  // Отримати книги за тегом
  const books = await pool.request()
    .input('TagId', sql.UniqueIdentifier, tagId)
    .query(`
      SELECT TOP 5 b.Id
      FROM BookTags bt
      JOIN Books b ON bt.BookId = b.Id
      WHERE bt.TagId = @TagId
      ORDER BY NEWID()
    `);

  if (!books.recordset.length) {
    console.log('❌ Недостатньо книг для тегу-переможця');
    return;
  }

  const routeId = uuidv4();
  const name = `Monthly Challenge - ${new Date().toISOString().slice(0, 7)}`;
  const description = `A special route for the month based on ${tagName}`;

  // Створити маршрут
  await pool.request()
    .input('Id', sql.UniqueIdentifier, routeId)
    .input('Name', name)
    .input('Description', description)
    .input('Category', tagName)
    .input('IsMonthly', sql.Bit, 1)
    .input('CreatedAt', sql.DateTime, new Date())
    .query(`
      INSERT INTO Routes (Id, Name, Description, Category, IsMonthly, CreatedAt)
      VALUES (@Id, @Name, @Description, @Category, @IsMonthly, @CreatedAt)
    `);

  // Додати книги
  for (let i = 0; i < books.recordset.length; i++) {
    await pool.request()
      .input('RouteId', sql.UniqueIdentifier, routeId)
      .input('BookId', sql.UniqueIdentifier, books.recordset[i].Id)
      .input('Position', sql.Int, i + 1)
      .query(`
        INSERT INTO RouteBooks (RouteId, BookId, Position)
        VALUES (@RouteId, @BookId, @Position)
      `);
  }

  console.log(`✅ Created monthly route based on votes: ${tagName}`);
}

// Запуск 1-го числа о 01:00
cron.schedule('0 1 1 * *', generateMonthlyRoute);

module.exports = { generateMonthlyRoute };
