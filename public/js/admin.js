const currentUser = JSON.parse(localStorage.getItem('nasty_current_user'));

if (!currentUser || currentUser.role !== 'admin') {
    if (confirm('Доступ в панель управления открыт только для администратора. Авторизоваться как Администратор сейчас?')) {
        const adminUser = { id: 1, name: 'Администратор', email: 'admin@nasty.coffee', role: 'admin' };
        localStorage.setItem('nasty_current_user', JSON.stringify(adminUser));
        location.reload();
    } else {
        window.location.href = 'index.html';
    }
}

const adminGreeting = document.getElementById('adminGreeting');
if (adminGreeting && currentUser) {
    adminGreeting.textContent = currentUser.name;
}

const btnAdminLogout = document.getElementById('btnAdminLogout');
if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', () => {
        localStorage.removeItem('nasty_current_user');
        window.location.href = 'index.html';
    });
}

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
});

async function calculateAnalytics() {
    const res = await fetch('/api/orders');
    const orders = await res.json();

    let totalRevenue = 0;
    let totalItems = 0;
    
    orders.forEach(order => {
        totalRevenue += Number(order.total) || 0;
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                totalItems += Number(item.count) || 1;
            });
        }
    });

    const totalOrders = orders.length;
    const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    document.getElementById('kpiRevenue').textContent = `${totalRevenue.toLocaleString('ru-RU')} ₽`;
    document.getElementById('kpiOrdersCount').textContent = totalOrders;
    document.getElementById('kpiAvgCheck').textContent = `${avgCheck.toLocaleString('ru-RU')} ₽`;
    document.getElementById('kpiItemsSold').textContent = `${totalItems} шт.`;

    renderCharts(orders);
    renderRecentOrders(orders);
    renderAllOrders(orders);
}

let salesChartInstance = null;
let categoryChartInstance = null;

function renderCharts(orders) {
    const datesMap = {};
    const itemsMap = {};

    orders.forEach(order => {
        const rawDate = order.date ? order.date.split('•')[0].trim() : 'Сегодня';
        datesMap[rawDate] = (datesMap[rawDate] || 0) + Number(order.total);

        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const name = item.title || 'Кофе';
                itemsMap[name] = (itemsMap[name] || 0) + Number(item.count);
            });
        }
    });

    const dateLabels = Object.keys(datesMap);
    const dateValues = Object.values(datesMap);

    const salesCtx = document.getElementById('salesChart').getContext('2d');
    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [{
                label: 'Выручка (₽)',
                data: dateValues,
                borderColor: '#6495ed',
                backgroundColor: 'rgba(100, 149, 237, 0.15)',
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#6495ed',
                pointRadius: 5,
                fill: true,
                tension: 0.35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'rgba(255, 255, 255, 0.8)', font: { family: 'Unbounded' } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { family: 'Unbounded', size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { family: 'Unbounded', size: 10 } }
                }
            }
        }
    });

    const itemLabels = Object.keys(itemsMap);
    const itemValues = Object.values(itemsMap);

    const catCtx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: itemLabels,
            datasets: [{
                data: itemValues,
                backgroundColor: [
                    '#6495ed',
                    '#e09f58',
                    '#4ade80',
                    '#f43f5e',
                    '#a855f7',
                    '#38bdf8'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'rgba(255, 255, 255, 0.8)', font: { family: 'Unbounded', size: 10 } }
                }
            }
        }
    });
}

function renderRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersTableBody');
    tbody.innerHTML = '';

    const recent = [...orders].reverse().slice(0, 5);

    recent.forEach(order => {
        const itemsList = order.items && Array.isArray(order.items)
            ? order.items.map(i => `${i.count}x ${i.title}`).join(', ')
            : 'Товары';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; color: #e09f58;">${order.id}</td>
            <td>${order.date}</td>
            <td>${order.customer}</td>
            <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${itemsList}</td>
            <td style="font-weight: 700;">${order.total} ₽</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAllOrders(orders) {
    const tbody = document.getElementById('allOrdersTableBody');
    tbody.innerHTML = '';

    const sorted = [...orders].reverse();

    sorted.forEach(order => {
        const itemsList = order.items && Array.isArray(order.items)
            ? order.items.map(i => `${i.count}x ${i.title}`).join(', ')
            : 'Товары';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; color: #e09f58;">${order.id}</td>
            <td>${order.date}</td>
            <td>${order.customer}</td>
            <td>${itemsList}</td>
            <td style="font-weight: 700;">${order.total} ₽</td>
        `;
        tbody.appendChild(tr);
    });
}

async function renderProductsTable() {
    const res = await fetch('/api/products');
    const products = await res.json();

    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.image}" alt="${p.title}" class="table-thumb"></td>
            <td style="font-weight: 600;">${p.title}</td>
            <td><span class="badge-role">${p.category}</span></td>
            <td style="font-weight: 700; color: #e09f58;">${p.price} ₽</td>
            <td>
                <button class="btn-action-delete" data-del-product="${p.id}" type="button">Удалить</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function renderArticlesTable() {
    const res = await fetch('/api/articles');
    const articles = await res.json();

    const tbody = document.getElementById('articlesTableBody');
    tbody.innerHTML = '';

    articles.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${a.title}</td>
            <td>${a.author}</td>
            <td>${a.date}</td>
            <td>
                <button class="btn-action-delete" data-del-article="${a.id}" type="button">Удалить</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

const productModal = document.getElementById('productModal');
const btnOpenAddProduct = document.getElementById('btnOpenAddProduct');
const closeProductModal = document.getElementById('closeProductModal');
const addProductForm = document.getElementById('addProductForm');

btnOpenAddProduct.addEventListener('click', () => {
    productModal.classList.add('open');
});

closeProductModal.addEventListener('click', () => {
    productModal.classList.remove('open');
});

addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('prodTitle').value.trim();
    const category = document.getElementById('prodCategory').selectedOptions[0].text;
    const price = Number(document.getElementById('prodPrice').value);
    const image = document.getElementById('prodImage').value;

    await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, price, category, image })
    });

    addProductForm.reset();
    productModal.classList.remove('open');
    renderProductsTable();
});

document.getElementById('productsTableBody').addEventListener('click', async (e) => {
    const delId = e.target.getAttribute('data-del-product');
    if (delId) {
        if (confirm('Удалить эту позицию из меню?')) {
            await fetch(`/api/products/${delId}`, { method: 'DELETE' });
            renderProductsTable();
        }
    }
});

const articleModal = document.getElementById('articleModal');
const btnOpenAddArticle = document.getElementById('btnOpenAddArticle');
const closeArticleModal = document.getElementById('closeArticleModal');
const addArticleForm = document.getElementById('addArticleForm');

btnOpenAddArticle.addEventListener('click', () => {
    articleModal.classList.add('open');
});

closeArticleModal.addEventListener('click', () => {
    articleModal.classList.remove('open');
});

addArticleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('artTitle').value.trim();
    const author = document.getElementById('artAuthor').value.trim();
    const desc = document.getElementById('artDesc').value.trim();

    await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, desc })
    });

    addArticleForm.reset();
    articleModal.classList.remove('open');
    renderArticlesTable();
});

document.getElementById('articlesTableBody').addEventListener('click', async (e) => {
    const delId = e.target.getAttribute('data-del-article');
    if (delId) {
        if (confirm('Удалить эту статью из блога?')) {
            await fetch(`/api/articles/${delId}`, { method: 'DELETE' });
            renderArticlesTable();
        }
    }
});

calculateAnalytics();
renderProductsTable();
renderArticlesTable();
