const dropzone = document.getElementById('cupDropzone');
const stickers = document.querySelectorAll('.sticker');
const resetBtn = document.getElementById('resetStickers');

stickers.forEach(sticker => {
    sticker.addEventListener('dragstart', (e) => {
        const text = sticker.getAttribute('data-sticker');
        e.dataTransfer.setData('text/plain', text);
    });
});

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over'); 
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); 
    dropzone.classList.remove('drag-over');

    const text = e.dataTransfer.getData('text/plain');

    const rect = dropzone.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const minX = rect.width * 0.28;
    const maxX = rect.width * 0.72;
    const minY = rect.height * 0.28 ;
    const maxY = rect.height * 0.80;

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

    const newSticker = document.createElement('div');
    newSticker.className = 'dropped-sticker';
    newSticker.textContent = text;

    newSticker.style.left = `${x}px`;
    newSticker.style.top = `${y}px`;

    const randomRotate = (Math.random() * 24 - 12).toFixed(1);
    newSticker.style.setProperty('--rot', `${randomRotate}deg`);

    dropzone.appendChild(newSticker);
});

resetBtn.addEventListener('click', () => {
    const droppedStickers = dropzone.querySelectorAll('.dropped-sticker');
    droppedStickers.forEach(s => s.remove());
});

async function renderCatalog() {
    const container = document.getElementById('menuItemsContainer');
    if (!container) return;

    const res = await fetch('/api/products');
    const products = await res.json();

    container.innerHTML = '';
    products.forEach(p => {
        const article = document.createElement('article');
        article.className = 'menu-item';
        article.innerHTML = `
            <div class="item-image">
                <img src="${p.image}" alt="${p.title}">
            </div>
            <h3 class="item-title">${p.title}</h3>
            <div class="item-footer">
                <span class="item-price">${p.price} ₽</span>
                <button class="btn-add-cart" type="button" title="Добавить в корзину">+</button>
            </div>
        `;
        container.appendChild(article);
    });
}

async function renderBlog() {
    const container = document.getElementById('blogItemsContainer');
    if (!container) return;

    const res = await fetch('/api/articles');
    const articles = await res.json();

    container.innerHTML = '';
    articles.forEach(a => {
        const article = document.createElement('article');
        article.className = 'blog-item';
        article.innerHTML = `
            <div class="blog-meta">
                <time datetime="${a.date}" class="blog-date">${a.date}</time>
                <span class="blog-author">${a.author}</span>
            </div>
            <h3 class="blog-item-title">${a.title}</h3>
            <p>${a.desc}</p>
            <a href="#" class="blog-link">Читать статью →</a>
        `;
        container.appendChild(article);
    });
}

const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartOpenBtn = document.querySelector('.btn-cart');
const cartCloseBtn = document.getElementById('cartClose');

function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden'; 
}

function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

cartOpenBtn.addEventListener('click', openCart);
cartCloseBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer.classList.contains('open')) {
        closeCart();
    }
});

let cart = JSON.parse(localStorage.getItem('nasty_cart')) || [];

const menuContainer = document.getElementById('menuItemsContainer');
if (menuContainer) {
    menuContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-add-cart');
        if (!button) return;

        const card = button.closest('.menu-item');
        const title = card.querySelector('.item-title').textContent.trim();
        const priceText = card.querySelector('.item-price').textContent.trim();
        const price = parseInt(priceText.replace(/\D/g, ''));
        const id = title.toLowerCase().replace(/\s+/g, '-');

        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.count += 1;
        } else {
            cart.push({
                id: id,
                title: title,
                price: price,
                count: 1
            });
        }
        renderCart();
        openCart(); 
    });
}

const cartItemsContainer = document.getElementById('cartItems');
const cartCountBadge = document.querySelector('.cart-count');
const cartTotalPrice = document.getElementById('cartTotalPrice');

function renderCart() {
    localStorage.setItem('nasty_cart', JSON.stringify(cart));
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
        cartCountBadge.textContent = '0';
        cartTotalPrice.textContent = '0 ₽';
        return;
    }

    let totalCount = 0;
    let totalPrice = 0;

    cart.forEach(item => {
        totalCount += item.count;
        totalPrice += item.price * item.count;

        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-title">${item.title}</span>
                <span class="cart-item-price-unit">${item.price} ₽</span>
            </div>
            <div class="cart-item-controls">
                <button class="btn-qty btn-minus" data-id="${item.id}" type="button">–</button>
                <span class="cart-item-qty">${item.count}</span>
                <button class="btn-qty btn-plus" data-id="${item.id}" type="button">+</button>
            </div>
            <span class="cart-item-total">${item.price * item.count} ₽</span>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartCountBadge.textContent = totalCount;
    cartTotalPrice.textContent = `${totalPrice} ₽`;
}

cartItemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-plus')) {
        const id = e.target.getAttribute('data-id');
        const item = cart.find(i => i.id === id);
        if (item) {
            item.count += 1;
            renderCart(); 
        }
    }

    if (e.target.classList.contains('btn-minus')) {
        const id = e.target.getAttribute('data-id');
        const item = cart.find(i => i.id === id);
        if (item) {
            item.count -= 1;
            if (item.count <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            renderCart();
        }
    }
});

const authModal = document.getElementById('authModal');
const authClose = document.getElementById('authClose');
const btnLogin = document.getElementById('btnLogin');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

btnLogin.addEventListener('click', () => {
    const currentUser = JSON.parse(localStorage.getItem('nasty_current_user'));
    if (currentUser) {
        localStorage.removeItem('nasty_current_user');
        updateAuthUI();
    } else {
        authModal.classList.add('open');
    }
});

authClose.addEventListener('click', () => {
    authModal.classList.remove('open');
});

authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.classList.remove('open');
    }
});

tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

function updateAuthUI() {
    const currentUser = JSON.parse(localStorage.getItem('nasty_current_user'));
    const navAdminLink = document.getElementById('navAdminLink');

    if (currentUser) {
        btnLogin.textContent = 'выйти';
        btnLogin.title = `Вы вошли как ${currentUser.name} (клик для выхода)`;
        if (navAdminLink) {
            navAdminLink.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
        }
    } else {
        btnLogin.textContent = 'войти';
        btnLogin.title = '';
        if (navAdminLink) {
            navAdminLink.style.display = 'none';
        }
    }
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;

    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
        alert(data.error);
        return;
    }
    localStorage.setItem('nasty_current_user', JSON.stringify(data));
    registerForm.reset();
    authModal.classList.remove('open');
    updateAuthUI();
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
        alert(data.error);
        return;
    }
    localStorage.setItem('nasty_current_user', JSON.stringify(data));
    loginForm.reset();
    authModal.classList.remove('open');
    updateAuthUI();
});

const checkoutBtn = document.getElementById('checkoutBtn');
const receiptModal = document.getElementById('receiptModal');
const receiptClose = document.getElementById('receiptClose');
const receiptItemsList = document.getElementById('receiptItemsList');
const receiptOrderNum = document.getElementById('receiptOrderNum');
const receiptDateTime = document.getElementById('receiptDateTime');
const receiptCustomer = document.getElementById('receiptCustomer');
const receiptTotalSum = document.getElementById('receiptTotalSum');
const btnPrintReceipt = document.getElementById('btnPrintReceipt');

checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Корзина пуста! Выберите кофе или десерт в меню.');
        return;
    }

    const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
    receiptOrderNum.textContent = `КАССОВЫЙ ЧЕК #NST-${randomOrderNum}`;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('ru-RU') + ' • ' + now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    receiptDateTime.textContent = formattedDate;

    const currentUser = JSON.parse(localStorage.getItem('nasty_current_user'));
    receiptCustomer.textContent = currentUser ? `Покупатель: ${currentUser.name}` : 'Покупатель: Гость';

    receiptItemsList.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemSum = item.price * item.count;
        total += itemSum;

        const row = document.createElement('div');
        row.className = 'receipt-line-item';
        row.innerHTML = `
            <span>${item.count}x ${item.title}</span>
            <span>${itemSum}.00 ₽</span>
        `;
        receiptItemsList.appendChild(row);
    });

    const droppedStickers = document.querySelectorAll('#cupDropzone .dropped-sticker');
    if (droppedStickers.length > 0) {
        const stickerNames = Array.from(droppedStickers).map(s => s.textContent).join(', ');
        const stickerRow = document.createElement('div');
        stickerRow.className = 'receipt-stickers-line';
        stickerRow.innerHTML = `
            <span>Кастом-стикеры (${droppedStickers.length} шт.: ${stickerNames})</span>
            <span>0.00 ₽</span>
        `;
        receiptItemsList.appendChild(stickerRow);
    }

    receiptTotalSum.textContent = `${total}.00 ₽`;

    closeCart();
    receiptModal.classList.add('open');

    const orderData = {
        id: `NST-${randomOrderNum}`,
        date: formattedDate,
        customer: currentUser ? currentUser.name : 'Гость',
        items: [...cart],
        total: total,
        timestamp: Date.now()
    };

    await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });

    cart = [];
    renderCart();
});

receiptClose.addEventListener('click', () => {
    receiptModal.classList.remove('open');
});

receiptModal.addEventListener('click', (e) => {
    if (e.target === receiptModal) {
        receiptModal.classList.remove('open');
    }
});

btnPrintReceipt.addEventListener('click', () => {
    window.print();
});

renderCatalog();
renderBlog();
updateAuthUI();
renderCart();
