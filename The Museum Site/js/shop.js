// JSON verisini çekmek için API URL'sini belirtin
const apiUrl = 'http://localhost:3000/api/data';

// HTML'de ürünlerin ekleneceği konteyneri seçin
const productList = document.getElementById('product-list');
const searchInput = document.getElementById('searchInput');
const cartCountElement = document.getElementById('cart-count');

let allProducts = []; // Tüm ürünleri saklayacak dizi

// Sayfa yüklendiğinde ürünleri getir
document.addEventListener('DOMContentLoaded', async () => {
    // Stok güncelleme bayrağını kontrol et
    const stockUpdateNeeded = localStorage.getItem('stockUpdateNeeded');
    if (stockUpdateNeeded) {
        // Ürünleri yeniden yükle
        await fetchProducts();
        // Bayrağı temizle
        localStorage.removeItem('stockUpdateNeeded');
    }
    
    fetchProducts();
    
    // Stok güncelleme olayını dinle
    window.addEventListener('stockUpdated', async () => {
        try {
            const response = await fetch(apiUrl);
            if (response.ok) {
                allProducts = await response.json();
                displayProducts(allProducts);
            }
        } catch (error) {
            console.error('Stok güncelleme hatası:', error);
        }
    });
    
    // Arama inputu için event listener
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = allProducts.filter(product => 
            product.urunIsmi.toLowerCase().includes(searchTerm) ||
            product.urunAciklamasi.toLowerCase().includes(searchTerm)
        );
        displayProducts(filteredProducts);
    });
});

// Verileri fetch ile çek ve göster
async function fetchProducts() {
    try {
        const response = await fetch(apiUrl);
        allProducts = await response.json();
        displayProducts(allProducts);
        updateCartCount();
    } catch (error) {
        console.error('Ürünler yüklenirken bir hata oluştu:', error);
        productList.innerHTML = '<p class="error">Ürünler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>';
    }
}

// Ürünleri görüntüle
function displayProducts(products) {
    productList.innerHTML = '';
    
    products.forEach((product) => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        const isOutOfStock = product.stokAdedi <= 0;
        
        productCard.innerHTML = `
            <img src="${product.urunGorseli}" alt="${product.urunIsmi}">
            <div class="product-card-content">
                <div class="product-info">
                    <h2>${product.urunIsmi}</h2>
                    <div class="description">
                        ${product.urunAciklamasi}
                    </div>
                </div>
                <div class="product-actions">
                    <p class="price">${product.urunFiyati} ₺</p>
                    <p class="stock">Stok: ${product.stokAdedi} adet</p>
                    <button onclick="addToCart('${product._id}')" 
                            ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Stokta Yok' : 'Sepete Ekle'}
                    </button>
                </div>
            </div>
        `;

        productList.appendChild(productCard);
    });
}

// Sepet sayacını güncelle
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
}

// Sepete ürün ekleme fonksiyonu
async function addToCart(productId) {
    try {
        const product = allProducts.find(p => p._id === productId);
        if (!product || product.stokAdedi <= 0) return;

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item._id === productId);
        
        if (existingItem) {
            if (existingItem.quantity < product.stokAdedi) {
                const stockUpdateResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId, change: -1 })
                });

                if (stockUpdateResponse.ok) {
                    existingItem.quantity += 1;
                    localStorage.setItem('cart', JSON.stringify(cart));
                    await fetchProducts(); // Ürün listesini yenile
                    updateCartCount();
                    showToast('Ürün sepete eklendi');
                }
            } else {
                showToast('Yeterli stok bulunmuyor');
            }
        } else {
            const stockUpdateResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, change: -1 })
            });

            if (stockUpdateResponse.ok) {
                cart.push({
                    ...product,
                    quantity: 1
                });
                localStorage.setItem('cart', JSON.stringify(cart));
                await fetchProducts(); // Ürün listesini yenile
                updateCartCount();
                showToast('Ürün sepete eklendi');
            }
        }
    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        showToast('Ürün eklenirken bir hata oluştu');
    }
}

// Toast mesajı gösterme
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }, 100);
} 