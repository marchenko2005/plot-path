const { generateMonthlyRoute } = require('../controllers/monthlyRouteGenerator');
require('dotenv').config();

(async () => {
  try {
    console.log('>> DB_SERVER:', process.env.DB_SERVER);
    await generateMonthlyRoute(); // Виклик ручної генерації маршруту місяця
    console.log('✅ Маршрут місяця згенеровано успішно');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
