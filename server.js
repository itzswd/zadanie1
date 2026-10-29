const express = require('express');
const path = require('node:path');
const db = require('./database.js');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/products', (req, res) => {
    res.json(db.getProducts());
});

app.post('/api/products', (req, res) => {
    const { title, price, category, image } = req.body;
    const id = title.toLowerCase().replace(/\s+/g, '-');
    const newProduct = db.addProduct({
        id,
        title,
        price: Number(price),
        category: category || 'Кофе',
        image: image || './images/coffee_cup.png'
    });
    res.json(newProduct);
});

app.delete('/api/products/:id', (req, res) => {
    db.deleteProduct(req.params.id);
    res.json({ success: true });
});

app.get('/api/articles', (req, res) => {
    res.json(db.getArticles());
});

app.post('/api/articles', (req, res) => {
    const { title, author, desc } = req.body;
    const date = new Date().toISOString().split('T')[0];
    const id = 'art-' + Date.now();
    const newArticle = db.addArticle({ id, title, author, date, desc });
    res.json(newArticle);
});

app.delete('/api/articles/:id', (req, res) => {
    db.deleteArticle(req.params.id);
    res.json({ success: true });
});

app.get('/api/orders', (req, res) => {
    res.json(db.getOrders());
});

app.post('/api/orders', (req, res) => {
    const newOrder = db.addOrder(req.body);
    res.json(newOrder);
});

app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    const existing = db.getUserByEmail(email);
    if (existing) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    const role = email.includes('admin') ? 'admin' : 'user';
    const user = db.createUser({ name, email, password, role });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Неверные данные' });
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

if (require.main === module) {
    app.listen(3000, () => {
        console.log('Server started on http://localhost:3000');
    });
}

module.exports = app;
