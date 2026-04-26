const sql = require('mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../db/sqlConfig');

// Генерація токену
const generateToken = (user) =>
  jwt.sign({ userId: user.Id, email: user.Email }, process.env.JWT_SECRET, { expiresIn: '15d' });

const generateRefreshToken = (user) =>
  jwt.sign({ userId: user.Id }, process.env.JWT_SECRET, { expiresIn: '7d' });

module.exports = {
  // Регістрація користувача
  register: async (req, res) => {
    const { email, password, name, tagIds = [] } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    try {
      const pool = await sql.connect(config);

      // Перевірка чи подібний email був раніше зареєстрований
      const emailCheck = await pool.request()
        .input('Email', sql.NVarChar, email)
        .query('SELECT * FROM Users WHERE Email = @Email');

      if (emailCheck.recordset.length > 0) {
        return res.status(409).json({ error: 'Email is already registered.' });
      }

      const usernameCheck = await pool.request()
        .input('Name', sql.NVarChar, name)
        .query('SELECT Id FROM Users WHERE Username = @Name');

      if (usernameCheck.recordset.length > 0) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Додавання користувача до бд
      const result = await pool.request()
        .input('Email', sql.NVarChar, email)
        .input('Name', sql.NVarChar, name)
        .input('PasswordHash', sql.NVarChar, hashedPassword)
        .query(`
          INSERT INTO Users (Id, Email, Username, PasswordHash, CreatedAt)
          OUTPUT INSERTED.Id
          VALUES (NEWID(), @Email, @Name, @PasswordHash, GETDATE())
        `);

      const userId = result.recordset[0].Id;
      console.log(' User inserted with Id:', userId);
      console.log(' Received tagIds:', tagIds);

      // Збереження тегів
      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          console.log(` Inserting preference: UserId = ${userId}, TagId = ${tagId}`);
          await pool.request()
            .input('UserId', sql.UniqueIdentifier, userId)
            .input('TagId', sql.UniqueIdentifier, tagId)
            .query('INSERT INTO UserTagPreferences (UserId, TagId) VALUES (@UserId, @TagId)');
        }
      } else {
        console.log(' No tagIds provided – skipping preference insertion');
      }

      res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
      console.error(' Registration error:', error);
      res.status(500).json({ error: 'Registration failed.', details: error.message });
    }
  },

  // Вхід в акаунт 
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const pool = await sql.connect(config);

      const result = await pool.request()
        .input('Email', sql.NVarChar, email)
        .query('SELECT * FROM Users WHERE Email = @Email');

      const user = result.recordset[0];

      if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      await pool.request()
        .input('UserId', sql.UniqueIdentifier, user.Id)
        .input('RefreshToken', sql.NVarChar, refreshToken)
        .query('UPDATE Users SET RefreshToken = @RefreshToken WHERE Id = @UserId');

      res.json({ accessToken, refreshToken });
    } catch (error) {
      console.error(' Login error:', error);
      res.status(500).json({ error: 'Login failed.', details: error.message });
    }
  },

  // Refresh токен 
  refreshToken: async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const pool = await sql.connect(config);

      const result = await pool.request()
        .input('UserId', sql.UniqueIdentifier, decoded.userId)
        .query('SELECT * FROM Users WHERE Id = @UserId');

      const user = result.recordset[0];

      if (!user || user.RefreshToken !== refreshToken) {
        return res.status(403).json({ error: 'Invalid refresh token.' });
      }

      const newAccessToken = generateToken(user);

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      console.error(' Refresh token error:', error);
      res.status(403).json({ error: 'Invalid refresh token.' });
    }
  }
};
