const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const mysql = require('mysql2/promise');
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://127.0.0.1:5500', // Twój frontend origin, zmień jeśli trzeba
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: 'tajny_klucz',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dni
    httpOnly: true,
    secure: false // w produkcji: true + HTTPS
  }
}));

async function sendVerificationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "janowska.michalina208@gmail.com",   // Twój email
      pass: "barl igyd lulp yfoi"                  // Hasło do aplikacji Gmail (app password)
    }
  });

  const link = `http://localhost:3000/verify-email?token=${token}`;

  const mailOptions = {
    from: "twoj.email@gmail.com",
    to: email,
    subject: "Potwierdzenie rejestracji",
    html: `<h3>Dziękujemy za rejestrację!</h3><p>Kliknij w link, aby potwierdzić konto:</p><a href="${link}">${link}</a>`
  };

  await transporter.sendMail(mailOptions);
}

async function main() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Maryja2208.',
    database: 'rephael_db'
  });

  // Tworzenie tabel jeśli nie istnieją
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      email_verified BOOLEAN DEFAULT false,
      email_token VARCHAR(255)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      price DECIMAL(10, 2)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      course_id INT,
      purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);


  // Rejestracja użytkownika
  app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Wypełnij wszystkie pola" });
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      const token = crypto.randomBytes(32).toString("hex");

      await db.execute(
        'INSERT INTO users (username, email, password, email_token) VALUES (?, ?, ?, ?)',
        [username, email, hash, token]
      );

      await sendVerificationEmail(email, token);

      res.json({ message: 'Zarejestrowano. Sprawdź email, aby potwierdzić konto.' });
    } catch (err) {
      console.error("Błąd rejestracji:", err);
      res.status(500).json({ message: 'Błąd rejestracji: email może już istnieć' });
    }
  });

  // Weryfikacja emaila
  app.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Brak tokenu w zapytaniu');

    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email_token = ?', [token]);
      if (rows.length === 0) {
        return res.status(400).send('Nieprawidłowy lub wygasły link');
      }

      await db.execute('UPDATE users SET email_verified = true, email_token = NULL WHERE email_token = ?', [token]);
      res.send('Email został potwierdzony! Możesz się teraz zalogować.');
    } catch (err) {
      console.error("Błąd potwierdzenia emaila:", err);
      res.status(500).send('Błąd serwera');
    }
  });

 // Logowanie
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Wypełnij wszystkie pola' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) return res.status(400).json({ message: 'Niepoprawny email' });
    if (!user.email_verified) return res.status(403).json({ message: 'Najpierw potwierdź swój email' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Niepoprawne hasło' });

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res.json({
      message: 'Zalogowano pomyślnie',
      success: true,
      loggedIn: true,
      user: req.session.user
    });
  } catch (err) {
    console.error("Błąd logowania:", err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});



  // Status zalogowania
  app.get('/me', (req, res) => {
    if (req.session && req.session.user) {
      res.json({ loggedIn: true, user: req.session.user });
    } else {
      res.json({ loggedIn: false });
    }
  });

  // Wylogowanie
  app.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: 'Błąd podczas wylogowywania' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Wylogowano' });
    });
  });

  // Pobierz listę kursów
  app.get('/courses', async (req, res) => {
    try {
      const [courses] = await db.execute('SELECT * FROM courses');
      res.json(courses);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Błąd serwera' });
    }
  });

  // Zakup kursu
  app.post('/buy', async (req, res) => {
    const { courseId } = req.body;
    const userId = req.session.user?.id;

    if (!userId) return res.status(401).json({ message: 'Musisz być zalogowany' });
    if (!courseId) return res.status(400).json({ message: 'Brak ID kursu' });

    try {
      const [existing] = await db.execute('SELECT * FROM purchases WHERE user_id = ? AND course_id = ?', [userId, courseId]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Już kupiłeś ten kurs' });
      }

      await db.execute('INSERT INTO purchases (user_id, course_id) VALUES (?, ?)', [userId, courseId]);
      res.json({ message: 'Kurs kupiony!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Błąd serwera' });
    }
  });

  // Moje kursy
  app.get('/my-courses', async (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) return res.status(401).json({ message: 'Musisz być zalogowany' });

    try {
      const [rows] = await db.execute(`
        SELECT courses.* FROM courses
        JOIN purchases ON courses.id = purchases.course_id
        WHERE purchases.user_id = ?
      `, [userId]);

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Błąd serwera' });
    }
  });

  // Root
  app.get('/', (req, res) => {
    res.send('Backend działa!');
  });

  app.listen(3000, '127.0.0.1', () => {
  console.log('Server running on http://127.0.0.1:3000');
});

}

main().catch(err => {
  console.error("Błąd startu serwera:", err);
});
