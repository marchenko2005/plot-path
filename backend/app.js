const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { initSocket } = require('./socket');

// Cron jobs
require('./controllers/dailyRouteGenerator');
require('./controllers/monthlyRouteGenerator');
require('./controllers/clubBookChecker');

dotenv.config();

const app = express();

// Універсальний CORS
app.use(cors({
  origin: 'http://localhost:3001',
  methods: '*',
  allowedHeaders: '*',
  credentials: true,
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, 'uploads')));


//  API роутери
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/books', require('./routes/books'));
app.use('/api/tags', require('./routes/tag'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/vote', require('./routes/vote'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/clubs',         require('./routes/clubs'));
app.use('/api/notifications', require('./routes/notifications'));

// ❌ 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ⚠️ Обробка помилок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// 🚀 Старт
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
initSocket(server);
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
