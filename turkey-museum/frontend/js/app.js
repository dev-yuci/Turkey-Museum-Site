// JSON verisini çekmek için API URL'sini belirtin
const apiUrl = 'http://localhost:3000/api/data';

// HTML'de ürünlerin ekleneceği konteyneri seçin
const productList = document.getElementById('product-list');
const searchInput = document.getElementById('searchInput');
const cartCountElement = document.getElementById('cart-count');

let allProducts = []; // Tüm ürünleri saklayacak dizi

// Verileri fetch ile çek ve göster
async function fetchProducts() {
  try {
    const response = await fetch(apiUrl);
    allProducts = await response.json();
    displayProducts(allProducts);
    updateCartCount();
  } catch (error) {
    console.error('Ürünler yüklenirken bir hata oluştu:', error);
  }
}

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

async function addToCart(productId) {
    try {
        const product = allProducts.find(p => p._id === productId);
        if (!product || product.stokAdedi <= 0) return;

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item._id === productId);
        
        if (existingItem) {
            if (existingItem.quantity < product.stokAdedi) {
                // API yolunu data endpoint'ine yönlendir
                const stockUpdateResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId, change: -1 })
                });

                if (stockUpdateResponse.ok) {
                    existingItem.quantity += 1;
                    localStorage.setItem('cart', JSON.stringify(cart));
                    await fetchProducts();
                    updateCartCount();
                }
            }
        } else {
            // API yolunu data endpoint'ine yönlendir
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
                await fetchProducts();
                updateCartCount();
            }
        }
    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
    }
}

async function updateStock(productId, change) {
    try {
        const response = await fetch(`${apiUrl}/update-stock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId,
                change
            })
        });
        
        if (response.ok) {
            const updatedProduct = await response.json();
            // Yerel ürün listesini güncelle
            const index = allProducts.findIndex(p => p._id === productId);
            if (index !== -1) {
                allProducts[index].stokAdedi = updatedProduct.stokAdedi;
                displayProducts(allProducts);
            }
        }
    } catch (error) {
        console.error('Stok güncellenirken hata:', error);
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = allProducts.filter(product => 
        product.urunIsmi.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
});

fetchProducts();
