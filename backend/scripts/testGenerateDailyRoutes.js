const { generateDailyRoutes } = require('../controllers/dailyRouteGenerator');
require('dotenv').config();

(async () => {
  try {
    console.log('>> DB_SERVER:', process.env.DB_SERVER);
    await generateDailyRoutes(); // ← Явний виклик
    console.log('✅ Маршрути згенеровано');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
