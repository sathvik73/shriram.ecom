const API_URL = '/api';

/**
 * Retrieves products from Server
 */
async function getProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        return await res.json();
    } catch (e) {
        console.error('Failed to fetch products', e);
        return [];
    }
}

/**
 * Saves products -> Not used directly anymore, we specific API calls now
 * kept for compatibility if needed but implementation warns
 */
function saveProducts(products) {
    console.warn('saveProducts() is deprecated in frontend. Use API calls.');
}

const SHOP_DETAILS = {
    name: "shriram.ecom",
    developer: "Gaddala Sathvik",
    phoneDisplay: "+91 63765 12366 & +91 90010 34892",
    phone: "+91 6376512366",
    developerMail: "gsathvik999@gmail.com",
    address: "डिस्क वाले, भगवान भल्ले वाले के पास, पुरानी अनाज मंडी, खेरली 321606",
    upiImage: "images/upi.jpeg",
    upiId: "6376512366@upi"
};
