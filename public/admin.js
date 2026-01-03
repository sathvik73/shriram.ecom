// --- Admin Logic ---
let products = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in (simple session check)
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        showDashboard();
    }

    setupAdminEventListeners();
});

function setupAdminEventListeners() {
    // Login
    document.getElementById('login-btn')?.addEventListener('click', checkPassword);
    document.getElementById('admin-password')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });

    // Dashboard Actions
    document.getElementById('add-product-btn')?.addEventListener('click', () => openProductModal());

    // Product Modal Actions
    const closeModalFunc = () => closeProductModal();
    document.getElementById('modal-close-x')?.addEventListener('click', closeModalFunc);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModalFunc);

    // Form Submit
    document.getElementById('product-form')?.addEventListener('submit', handleSaveProduct);

    // Image Type Toggle
    const radioInputs = document.querySelectorAll('input[name="img-type"]');
    radioInputs.forEach(radio => {
        radio.addEventListener('change', toggleImgInput);
    });

    // Event Delegation for Product Table (Edit/Delete)
    document.getElementById('admin-product-list')?.addEventListener('click', (e) => {
        // Edit Button
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const id = parseInt(editBtn.dataset.id);
            editProduct(id);
            return;
        }

        // Delete Button
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            deleteProduct(id);
        }
    });

    // Close modal on outside click (optional but good UX)
    document.getElementById('product-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'product-modal') closeProductModal();
    });
}

function checkPassword() {
    const pwd = document.getElementById('admin-password').value;
    const error = document.getElementById('login-error');

    // Hardcoded password for "Gateway"
    if (pwd === 'admin') {
        sessionStorage.setItem('admin_logged_in', 'true');
        showDashboard();
        error.classList.add('hidden');
    } else {
        error.classList.remove('hidden');
    }
}

function showDashboard() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('admin-dashboard').classList.remove('hidden');
    loadProducts();
}

async function loadProducts() {
    products = await getProducts(); // From data.js (which now fetches from API)
    const tbody = document.getElementById('admin-product-list');

    tbody.innerHTML = products.map(p => `
        <tr>
            <td>
                <img src="${p.image}" class="product-thumb" onerror="this.src='https://placehold.co/40?text=?'">
            </td>
            <td class="font-medium">${p.name}</td>
            <td>₹${p.price}</td>
            <td class="text-sm text-gray-500 max-w-xs truncate">${p.description}</td>
            <td>
                <button class="action-btn btn-edit" title="Edit" data-id="${p.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="action-btn btn-delete" title="Delete" data-id="${p.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// ... Modal & Form Logic ...

function toggleImgInput() {
    const type = document.querySelector('input[name="img-type"]:checked').value;
    if (type === 'upload') {
        document.getElementById('input-upload').classList.remove('hidden');
        document.getElementById('input-url').classList.add('hidden');
    } else {
        document.getElementById('input-upload').classList.add('hidden');
        document.getElementById('input-url').classList.remove('hidden');
    }
}

function openProductModal(id = null) {
    const modal = document.getElementById('product-modal');
    modal.classList.add('open');

    const form = document.getElementById('product-form');
    form.reset();

    // Default to Upload
    document.querySelector('input[name="img-type"][value="upload"]').checked = true;
    toggleImgInput();

    if (id) {
        // Edit Mode
        const p = products.find(x => x.id === id);
        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('edit-id').value = p.id;
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-desc').value = p.description;

        // Handle Image Pre-fill (Tricky for files, easy for URL)
        if (p.image && p.image.startsWith('images/') && !p.image.startsWith('http')) {
            document.querySelector('input[name="img-type"][value="url"]').checked = true;
            toggleImgInput();
            document.getElementById('p-image-url').value = p.image;
        } else {
            document.querySelector('input[name="img-type"][value="url"]').checked = true;
            toggleImgInput();
            document.getElementById('p-image-url').value = p.image || '';
        }
    } else {
        // Add Mode
        document.getElementById('modal-title').textContent = 'Add Product';
        document.getElementById('edit-id').value = '';
    }
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('open');
}

async function handleSaveProduct(e) {
    e.preventDefault();

    const idVal = document.getElementById('edit-id').value;
    const name = document.getElementById('p-name').value;
    const price = Number(document.getElementById('p-price').value);
    const desc = document.getElementById('p-desc').value;

    // Determine Image
    let imagePath = '';
    const type = document.querySelector('input[name="img-type"]:checked').value;

    if (type === 'upload') {
        const fileInput = document.getElementById('p-image-file');
        if (fileInput.files.length > 0) {
            // Upload File
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);

            try {
                // Use new API route
                const res = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.path) {
                    imagePath = data.path;

                    // Delete old image if editing
                    if (idVal) {
                        const oldP = products.find(p => p.id == idVal);
                        if (oldP && oldP.image && oldP.image !== imagePath) {
                            deleteImageFile(oldP.image);
                        }
                    }
                } else {
                    alert('Upload failed: ' + (data.error || 'Unknown error'));
                    return;
                }
            } catch (err) {
                console.error(err);
                alert('Server error. Ensure server is running.');
                return;
            }
        } else {
            // No new file
            if (idVal) {
                const oldP = products.find(p => p.id == idVal);
                imagePath = oldP.image;
            } else {
                alert('Please select an image');
                return;
            }
        }
    } else {
        // URL Mode
        imagePath = document.getElementById('p-image-url').value;
        if (!imagePath) {
            alert('Please enter an image URL');
            return;
        }
    }

    const payload = {
        name,
        price,
        image: imagePath,
        description: desc
    };

    try {
        if (idVal) {
            // Update PUT
            await fetch(`${API_URL}/products/${idVal}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Create POST
            await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        loadProducts(); // Refresh Table
        closeProductModal();
    } catch (error) {
        console.error('Save failed', error);
        alert('Failed to save product');
    }
}

async function deleteImageFile(path) {
    if (!path.startsWith('images/')) return;
    try {
        await fetch(`${API_URL}/delete-image`, {
            method: 'POST', // Changed from DELETE to match server.js routes (or keep DELETE if server supports it, server.js supports POST for this)
            body: JSON.stringify({ path }),
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error('Failed delete image', e);
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const p = products.find(x => x.id === id);
        if (p && p.image) {
            deleteImageFile(p.image);
        }

        try {
            await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            loadProducts();
        } catch (error) {
            console.error('Delete failed', error);
        }
    }
}

function editProduct(id) {
    openProductModal(id);
}
