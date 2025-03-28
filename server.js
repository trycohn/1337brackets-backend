// server.js

// Загружаем переменные окружения из файла .env
require('dotenv').config({ path: __dirname + '/.env' });

// Логируем JWT_SECRET для отладки
console.log("🔍 Загруженный JWT_SECRET:", process.env.JWT_SECRET);

// Импортируем необходимые модули
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const http = require('http');
const { initializeSocket } = require('./notifications');
const tournamentsRouter = require('./routes/tournaments');

// Создаём Express-приложение
const app = express();

// Создаём HTTP-сервер на основе Express-приложения
const server = http.createServer(app);

// Инициализация Socket.IO через модуль notifications
initializeSocket(server);

// Middleware для Express
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://1337brackets-frontend.vercel.app'
    : ['http://localhost:3001', 'http://127.0.0.1:5500'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Тестовый маршрут для проверки подключения к базе данных
app.get('/testdb', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'success', time: result.rows[0].now });
  } catch (err) {
    console.error('❌ Ошибка подключения к базе:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Обработка запросов к /favicon.ico и /favicon.png
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // Возвращаем пустой ответ (No Content)
});

app.get('/favicon.png', (req, res) => {
  res.status(204).end(); // Возвращаем пустой ответ (No Content)
});

// API-маршруты
app.use('/api/users', require('./routes/users'));
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/teams', require('./routes/teams'));
app.use('/api/tournamentPlayers', require('./routes/tournamentPlayers'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/notifications', require('./routes/notifications'));

// Общий обработчик 404 для /api (после всех маршрутов)
app.use('/api', (req, res) => {
  console.log(`404 для пути: ${req.path}`);
  res.status(404).json({ error: 'API маршрут не найден' });
});

// Общий обработчик 404 для всех остальных путей
app.use((req, res) => {
  console.log(`404 для пути: ${req.path}`);
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Успешное подключение к базе данных');
  } catch (err) {
    console.error('❌ Ошибка подключения к базе данных:', err.message);
  }
});