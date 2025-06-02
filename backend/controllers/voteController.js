const sql = require('mssql');
const config = require('../db/sqlConfig');
const voteModel = require('../models/vote');
const cron = require('node-cron');

// Отримати збережені варіанти тегів для голосування
async function getVotingOptions(req, res) {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request()
      .query(`
        SELECT t.Id, t.Name, t.Type
        FROM MonthlyVotingOptions mvo
        JOIN Tags t ON mvo.TagId = t.Id
        ORDER BY mvo.MonthStart DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Помилка при отриманні тегів для голосування:', error);
    res.status(500).json({ error: 'Не вдалося отримати теги для голосування.' });
  }
}

// Прийняти голос користувача
async function submitVote(req, res) {
  const { tagId } = req.body;
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ error: 'Користувач не авторизований.' });
  if (!tagId) return res.status(400).json({ error: 'Не вказано ID тегу.' });

  try {
    console.log(`Голосує користувач ${userId} за тег ${tagId}`);
    await voteModel.submitVote(userId, tagId);
    res.json({ message: 'Голос успішно збережено.' });
  } catch (error) {
    console.error('Помилка під час голосування:', error);
    res.status(500).json({ error: 'Не вдалося зберегти голос.', details: error.message });
  }
}

// Генерувати 4 варіанти тегів для голосування
async function generateVotingOptions(req, res) {
  try {
    const tags = await voteModel.generateMonthlyVotingOptions();
    console.log(' Згенеровано теги для голосування:', tags.map(t => t.Name).join(', '));
    res.json({ message: 'Опції для голосування оновлено.', tags });
  } catch (error) {
    console.error(' Помилка при генерації опцій голосування:', error);
    res.status(500).json({ error: 'Не вдалося згенерувати опції.' });
  }
}

// Автоматичний запуск 1 числа кожного місяця о 00:01
cron.schedule('1 0 1 * *', async () => {
  try {
    await voteModel.generateMonthlyVotingOptions();
    console.log(' Щомісячні варіанти для голосування оновлено.');
  } catch (err) {
    console.error(' Помилка при щомісячному оновленні варіантів голосування:', err);
  }
});

module.exports = { getVotingOptions, submitVote, generateVotingOptions };
