const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync(path.join(__dirname, 'coffee.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
    );
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT,
        price INTEGER,
        category TEXT,
        image TEXT
    );
    CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT,
        author TEXT,
        date TEXT,
        desc TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_date TEXT,
        customer_name TEXT,
        items_json TEXT,
        total_price INTEGER,
        created_at INTEGER
    );
`);

module.exports = {
    getProducts: () => db.prepare('SELECT * FROM products').all(),
    addProduct: (p) => {
        db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?)').run(p.id, p.title, p.price, p.category, p.image);
        return p;
    },
    deleteProduct: (id) => db.prepare('DELETE FROM products WHERE id = ?').run(id),

    getArticles: () => db.prepare('SELECT * FROM articles ORDER BY date DESC').all(),
    addArticle: (a) => {
        db.prepare('INSERT INTO articles VALUES (?, ?, ?, ?, ?)').run(a.id, a.title, a.author, a.date, a.desc);
        return a;
    },
    deleteArticle: (id) => db.prepare('DELETE FROM articles WHERE id = ?').run(id),

    getOrders: () => {
        return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all().map(r => ({
            id: r.id,
            date: r.order_date,
            customer: r.customer_name,
            items: JSON.parse(r.items_json),
            total: r.total_price,
            timestamp: r.created_at
        }));
    },
    addOrder: (o) => {
        db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)')
            .run(o.id, o.date, o.customer, JSON.stringify(o.items), o.total, o.timestamp);
        return o;
    },
    deleteOrder: (id) => db.prepare('DELETE FROM orders WHERE id = ?').run(id),

    getUserByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
    createUser: (u) => {
        const res = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(u.name, u.email, u.password, u.role);
        return { id: res.lastInsertRowid, ...u };
    },
    deleteUser: (id) => db.prepare('DELETE FROM users WHERE id = ?').run(id)
};
