const test = require('node:test');
const assert = require('node:assert');
const db = require('./database.js');
const app = require('./server.js');

test('База данных: добавление, чтение и удаление товара', () => {
    const id = 'test-item-' + Date.now();
    const item = { id, title: 'Тестовый кофе', price: 290, category: 'Кофе', image: './images/coffee_cup.png' };
    db.addProduct(item);

    const items = db.getProducts();
    const found = items.find(p => p.id === id);
    assert.ok(found);
    assert.strictEqual(found.price, 290);

    db.deleteProduct(id);
    const afterDelete = db.getProducts();
    assert.ok(!afterDelete.some(p => p.id === id));
});

test('База данных: добавление, чтение и удаление статьи блога', () => {
    const id = 'test-art-' + Date.now();
    const article = { id, title: 'Тестовый заголовок', author: 'Бариста', date: '2026-10-25', desc: 'Тестовый текст' };
    db.addArticle(article);

    const articles = db.getArticles();
    const found = articles.find(a => a.id === id);
    assert.ok(found);
    assert.strictEqual(found.title, 'Тестовый заголовок');

    db.deleteArticle(id);
    const afterDelete = db.getArticles();
    assert.ok(!afterDelete.some(a => a.id === id));
});

test('База данных: сохранение и чтение заказа', () => {
    const id = 'NST-TEST-' + Date.now();
    const order = {
        id,
        date: '25.10.2026, 12:00:00',
        customer: 'Тестовый Клиент',
        items: [{ title: 'Латте', price: 280, count: 2 }],
        total: 560,
        timestamp: Date.now()
    };
    db.addOrder(order);

    const orders = db.getOrders();
    const found = orders.find(o => o.id === id);
    assert.ok(found);
    assert.strictEqual(found.total, 560);
    assert.strictEqual(found.items.length, 1);
    assert.strictEqual(found.items[0].count, 2);

    db.deleteOrder(id);
});

test('База данных: создание и поиск пользователя', () => {
    const email = 'user_' + Date.now() + '@test.ru';
    const user = db.createUser({ name: 'Тестовый Пользователь', email, password: 'password123', role: 'user' });
    assert.ok(user.id);

    const found = db.getUserByEmail(email);
    assert.ok(found);
    assert.strictEqual(found.name, 'Тестовый Пользователь');
    assert.strictEqual(found.password, 'password123');

    db.deleteUser(user.id);
});

test('API: эндпоинт GET /api/products возвращает статус 200 и массив', async (t) => {
    const server = app.listen(0);
    t.after(() => server.close());
    const port = server.address().port;
    const res = await fetch(`http://localhost:${port}/api/products`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
});

test('API: эндпоинт GET /api/articles возвращает статус 200 и массив', async (t) => {
    const server = app.listen(0);
    t.after(() => server.close());
    const port = server.address().port;
    const res = await fetch(`http://localhost:${port}/api/articles`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
});

test('API: эндпоинт POST /api/auth/login отклоняет неверный пароль со статусом 401', async (t) => {
    const server = app.listen(0);
    t.after(() => server.close());
    const port = server.address().port;
    const res = await fetch(`http://localhost:${port}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@test.com', password: 'wrong' })
    });
    assert.strictEqual(res.status, 401);
});