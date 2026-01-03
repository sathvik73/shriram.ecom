const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'products.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(PUBLIC_DIR)); // Serve files from public directory

// Ensure images dir exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMAGES_DIR),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '_' + file.originalname.replace(/\s/g, '_'));
    }
});
const upload = multer({ storage });

// Helper: Read/Write Data
function getProducts() {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data file:', err);
        return [];
    }
}

function saveProducts(products) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

// --- API Endpoints ---

// Get All Products
app.get('/api/products', (req, res) => {
    res.json(getProducts());
});

// Add Product
app.post('/api/products', (req, res) => {
    const products = getProducts();
    const newProduct = req.body;
    newProduct.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    products.push(newProduct);
    saveProducts(products);
    res.json(newProduct);
});

// Update Product
app.put('/api/products/:id', (req, res) => {
    const products = getProducts();
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body, id }; // Ensure ID doesn't change
        saveProducts(products);
        res.json(products[index]);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// Delete Product
app.delete('/api/products/:id', (req, res) => {
    let products = getProducts();
    const id = parseInt(req.params.id);
    products = products.filter(p => p.id !== id);
    saveProducts(products);
    res.json({ success: true });
});

// Upload Image
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({ path: `images/${req.file.filename}` });
});

// Delete Image
app.post('/api/delete-image', (req, res) => {
    const { path: imagePath } = req.body;
    if (!imagePath || !imagePath.startsWith('images/')) {
        return res.status(400).json({ error: 'Invalid path' });
    }

    const fullPath = path.join(PUBLIC_DIR, imagePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`EXPRESS API READY at http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
});

// Handle Server Errors (e.g. Port in use)
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${PORT} is already in use.`);
        console.error('Please close the other terminal or run: npx kill-port 3000');
    } else {
        console.error('Server error:', e);
    }
});

// Prevent premature exit
setInterval(() => { }, 1000);

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
