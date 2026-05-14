const sql = require('mssql');
const config = require('../db/sqlConfig');
const cron = require('node-cron');
const friendshipModel = require('../models/friendship');

// In-memory cache: Map<userId, suggestions[]>
const suggestionsCache = new Map();

async function generateAllSuggestions() {
  console.log('[SuggestionGenerator] Generating daily friend suggestions...');
  try {
    const pool = await sql.connect(config);
    const usersResult = await pool.request()
      .query('SELECT DISTINCT UserId FROM UserTagPreferences');

    suggestionsCache.clear();

    for (const { UserId } of usersResult.recordset) {
      try {
        const suggestions = await friendshipModel.getSuggestions(UserId, 3);
        suggestionsCache.set(UserId, suggestions);
      } catch (err) {
        console.error(`[SuggestionGenerator] Failed for user ${UserId}:`, err.message);
      }
    }

    console.log(`[SuggestionGenerator] Done — cached for ${suggestionsCache.size} users`);
  } catch (err) {
    console.error('[SuggestionGenerator] Error:', err.message);
  }
}

function getCachedSuggestions(userId) {
  return suggestionsCache.get(userId) ?? null;
}

// Щодня о 06:00
cron.schedule('0 6 * * *', generateAllSuggestions);

module.exports = { generateAllSuggestions, getCachedSuggestions };
