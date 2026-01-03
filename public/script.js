// --- State ---
// shop details are now in data.js
let cart = [];

// Initialize Products from API - populated in init
let PRODUCTS = [];
let customerName = "";
let customerAddress = "";

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Populate Shop Details
    document.getElementById('shop-name-nav').textContent = SHOP_DETAILS.name;
    document.getElementById('shop-phone').innerHTML = SHOP_DETAILS.phoneDisplay.replace(" & ", "<br/>");
    document.getElementById('shop-address').textContent = SHOP_DETAILS.address;

    // Load Data
    try {
        PRODUCTS = await getProducts();
        if (!PRODUCTS || PRODUCTS.length === 0) {
            console.warn('No products found or API returned empty array');
        }
    } catch (e) {
        console.error('Data load failed', e);
    }

    // Render UPI Image if available
    if (SHOP_DETAILS.upiImage) {
        const qrFrame = document.querySelector('.qr-frame');
        if (qrFrame) {
            qrFrame.innerHTML = `
                <img src="${SHOP_DETAILS.upiImage}" 
                     alt="UPI QR Code" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     onerror="this.parentElement.innerHTML='<div class=\\'qr-inner\\'><div class=\\'qr-border\\'><div class=\\'qr-center\\'><div class=\\'qr-center-box\\'>SCAN<br/>PAY</div></div></div></div>'"/>
            `;
        }
    }

    // Footer Details
    document.getElementById('footer-name').textContent = SHOP_DETAILS.name;
    document.getElementById('footer-developer').textContent = SHOP_DETAILS.developer;
    document.getElementById('footer-developer-mail').textContent = SHOP_DETAILS.developerMail;
    document.getElementById('year').textContent = new Date().getFullYear();
    document.getElementById('copyright-name').textContent = SHOP_DETAILS.name;

    renderProducts();
    updateCartUI();
    setupEventListeners();
});

function setupEventListeners() {
    // Cart Toggles
    document.getElementById('nav-cart-btn')?.addEventListener('click', toggleCart);
    document.getElementById('drawer-close-btn')?.addEventListener('click', toggleCart);
    document.getElementById('cart-backdrop')?.addEventListener('click', toggleCart);

    // Modal Close
    const closeModalFunc = () => document.getElementById('modal-overlay').classList.remove('open');
    document.getElementById('modal-close-btn')?.addEventListener('click', closeModalFunc);
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-overlay')) closeModalFunc();
    });

    // Checkout
    document.getElementById('checkout-btn')?.addEventListener('click', handleCheckout);

    // Event Delegation for Product Grid (Add +, Open Modal)
    document.getElementById('product-grid').addEventListener('click', (e) => {
        const target = e.target;

        // Handle "Add +" Button
        const addBtn = target.closest('.btn-add-action');
        if (addBtn) {
            e.stopPropagation(); // Prevent opening modal
            const id = parseInt(addBtn.dataset.id);
            addToCart(id);
            return;
        }

        // Handle Product Card Click (Open Modal)
        const card = target.closest('.product-card');
        // Ensure we didn't click inside the button (handled above, but safety check)
        if (card && !target.closest('.btn-group button')) {
            const id = parseInt(card.dataset.id);
            openModal(id);
        }
    });

    // Event Delegation for Cart Items (Remove)
    document.getElementById('cart-items-container').addEventListener('click', (e) => {
        const removeBtn = target = e.target.closest('.btn-remove-cart');
        if (removeBtn) {
            const id = parseInt(removeBtn.dataset.id);
            removeFromCart(id);
        }
    });

    // Modal Actions (Add to Cart from Modal)
    document.getElementById('modal-content').addEventListener('click', (e) => {
        const addBtn = e.target.closest('.btn-modal-add');
        if (addBtn) {
            const id = parseInt(addBtn.dataset.id);
            addToCart(id);
            document.getElementById('modal-overlay').classList.remove('open');
        }
    });

    // Customer Input Listeners
    document.getElementById('cart-items-container').addEventListener('input', (e) => {
        if (e.target.id === 'cust-name') customerName = e.target.value;
        if (e.target.id === 'cust-address') customerAddress = e.target.value;
    });
}

// --- Render Functions ---

function renderProducts() {
    const grid = document.getElementById('product-grid');

    if (!PRODUCTS || PRODUCTS.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #fee2e2; border-radius: 8px; color: #991b1b;">
                <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">No Products Found</h3>
                <p>Could not load products from the server.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = PRODUCTS.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="card-image-container">
                <img 
                    src="${product.image}" 
                    alt="${product.name}" 
                    class="card-image"
                    onerror="this.src='https://placehold.co/400x300?text=No+Image'"
                />
                <div class="price-tag">
                    ₹${product.price}
                </div>
            </div>
            <div class="card-body">
                <h3 class="card-title">
                    ${product.name}
                </h3>
                <p class="card-desc">${product.description}</p>
                <div class="btn-group">
                    <button class="btn btn-primary btn-add-${product.id} btn-add-action" data-id="${product.id}">
                        Add +
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const footer = document.getElementById('cart-footer');

    if (cart.length === 0) {
        footer.classList.add('hidden');
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-gray-400 space-y-4" style="text-align: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.2;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <p>Your cart is empty</p>
                <button id="empty-cart-start-btn" class="text-blue-600 font-medium hover:underline" style="border: none; background: none; cursor: pointer;">Start Shopping</button>
            </div>
        `;
        // Re-attach start shopping listener dynamically since this block is recreated
        document.getElementById('empty-cart-start-btn')?.addEventListener('click', toggleCart);
    } else {
        footer.classList.remove('hidden');

        const itemsHtml = cart.map(item => `
            <div class="cart-item">
                <img 
                    src="${item.image}" 
                    alt="${item.name}" 
                    onerror="this.src='https://placehold.co/100?text=Prod'"
                />
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    <div class="flex justify-between items-start gap-2">
                        <h4 class="font-medium text-sm text-gray-900 line-clamp-1" style="margin: 0;">${item.name}</h4>
                        <button class="btn-remove-cart" data-id="${item.id}" style="color: #9ca3af; border: none; background: none; cursor: pointer; transition: color 0.2s;" onmouseenter="this.style.color='#ef4444'" onmouseleave="this.style.color='#9ca3af'">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                    <div class="flex justify-between items-end">
                        <div class="font-bold text-gray-900">₹${item.price}</div>
                    </div>
                </div>
            </div>
        `).join('');

        // Append Form (Note: Inputs handled by delegation on container `input` event)
        const formHtml = `
            <div class="mt-8 pt-6 border-t border-gray-200" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
                <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Delivery Details
                </h3>
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Your Name</label>
                        <input type="text" id="cust-name" value="${customerName}" placeholder= " " class="input-field">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Delivery Address</label>
                        <textarea id="cust-address" placeholder="Full address with landmark..." rows="2" class="input-field" style="resize: none;">${customerAddress}</textarea>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = `<div class="space-y-3">${itemsHtml}</div>${formHtml}`;
    }
}

// --- Logic Functions ---

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);

    if (!existing) {
        cart.push({ ...product });
    }

    updateCartUI();

    const drawer = document.getElementById('cart-drawer');
    if (!drawer.classList.contains('open')) {
        toggleCart();
    }

    // Update Button State
    const btns = document.querySelectorAll(`.btn-add-${productId}`);
    btns.forEach(btn => {
        btn.textContent = "Added";
        btn.style.backgroundColor = "#ffffff";
        btn.style.color = "var(--secondary)";
        btn.style.border = "1px solid var(--secondary)";
        btn.disabled = true;
    });
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();

    // Revert Button State
    const btns = document.querySelectorAll(`.btn-add-${id}`);
    btns.forEach(btn => {
        if (btn.classList.contains('w-max')) { // Modal button check
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                Add to Cart
            `;
        } else {
            btn.textContent = "Add +";
        }
        btn.style.backgroundColor = "";
        btn.style.color = "";
        btn.style.border = "";
        btn.disabled = false;
    });
}

function updateCartUI() {
    const totalCount = cart.length;
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

    const badge = document.getElementById('cart-badge');
    const headerCount = document.getElementById('cart-count-header');

    badge.textContent = totalCount;
    headerCount.textContent = totalCount;

    if (totalCount > 0) {
        badge.classList.remove('hidden');
        headerCount.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
        headerCount.classList.add('hidden');
    }

    document.getElementById('cart-total').textContent = `₹${totalPrice}`;
    renderCartItems();
}

function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    drawer.classList.toggle('open');
    backdrop.classList.toggle('open');
}

function openModal(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');

    content.innerHTML = `
        <div class="sm:w-1/2 bg-gray-100 h-auto sm:h-auto relative group flex items-center justify-center p-4">
            <img 
                src="${product.image}" 
                alt="${product.name}" 
                class="w-full h-auto max-h-80vh object-contain transition-transform duration-700 group-hover:scale-105"
                onerror="this.src='https://placehold.co/400x300?text=No+Image'"
            />
        </div>
        <div class="p-8 sm:w-1/2 flex flex-col items-start justify-center">
            <h2 class="text-3xl font-bold text-gray-900 mb-2 leading-tight">${product.name}</h2>
            <div class="text-2xl font-bold text-primary mb-6">₹${product.price}</div>
            
            <p class="text-gray-600 mb-8 leading-relaxed text-base">
                ${product.description}
            </p>
            
            <div class="mt-auto w-full">
                ${cart.find(item => item.id === product.id) ? `
                    <button 
                        disabled
                        class="btn btn-primary px-8 py-3 text-base font-semibold rounded-full shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2 w-max btn-add-${product.id}"
                        style="background-color: #ffffff; color: var(--secondary); border: 1px solid var(--secondary);"
                    >
                        Added
                    </button>
                ` : `
                    <button 
                        class="btn btn-primary px-8 py-3 text-base font-semibold rounded-full shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2 w-max btn-add-${product.id} btn-modal-add"
                        data-id="${product.id}"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                        Add to Cart
                    </button>
                `}
            </div>
        </div>
    `;

    overlay.classList.add('open');
}

function handleCheckout() {
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

    if (!customerName || !customerAddress) {
        alert("Please enter your name and address to place an order.");
        return;
    }

    let message = `*New Order from ${SHOP_DETAILS.name}*\n\n`;
    message += `*Customer:* ${customerName}\n`;
    message += `*Address:* ${customerAddress}\n\n`;
    message += `*Order Details:*\n`;

    cart.forEach(item => {
        message += `▫️ ${item.name} - ₹${item.price}\n`;
    });

    message += `\n*Total Amount: ₹${totalPrice}*\n`;
    message += `------------------------\nPlease confirm my order.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SHOP_DETAILS.phone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
}