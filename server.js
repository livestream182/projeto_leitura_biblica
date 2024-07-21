const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'supersecretkey';

app.use(bodyParser.json());
app.use(express.static('public'));

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao conectar no banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        // Crie as tabelas se não existirem
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                livro TEXT,
                capitulo TEXT,
                versiculo TEXT,
                lido BOOLEAN,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);
    }
});

// Rota de registro de usuário
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
        if (err) {
            return res.status(400).send({ message: 'Erro ao registrar usuário.' });
        }
        const token = jwt.sign({ id: this.lastID }, SECRET_KEY, { expiresIn: '1h' });
        res.status(201).send({ auth: true, token: token });
    });
});

// Rota de login de usuário
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) {
            return res.status(500).send({ message: 'Erro no servidor.' });
        }
        if (!user) {
            return res.status(404).send({ message: 'Usuário não encontrado.' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).send({ auth: false, token: null });
        }

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).send({ auth: true, token: token });
    });
});

// Middleware para verificar o token JWT
function verifyToken(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(403).send({ auth: false, message: 'Nenhum token fornecido.' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Falha ao autenticar o token.' });
        }
        req.userId = decoded.id;
        next();
    });
}

// Rota para obter o progresso de leitura do usuário
app.get('/progress', verifyToken, (req, res) => {
    db.all(`SELECT * FROM progress WHERE user_id = ?`, [req.userId], (err, rows) => {
        if (err) {
            return res.status(500).send({ message: 'Erro no servidor.' });
        }
        res.status(200).send(rows);
    });
});

// Rota para salvar o progresso de leitura do usuário
app.post('/progress', verifyToken, (req, res) => {
    const { chapterId, verseId, isChecked } = req.body;
    const [livro, capitulo] = chapterId.split('-');
    const versiculo = verseId.split('-')[2];
    const lido = isChecked;

    db.run(`
        INSERT INTO progress (user_id, livro, capitulo, versiculo, lido)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, livro, capitulo, versiculo)
        DO UPDATE SET lido=excluded.lido
    `, [req.userId, livro, capitulo, versiculo, lido], (err) => {
        if (err) {
            return res.status(500).send({ message: 'Erro ao salvar o progresso.' });
        }
        res.status(200).send({ message: 'Progresso salvo com sucesso.' });
    });
});

// Rota para servir a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para servir a página de login
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota para servir a página de registro
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
