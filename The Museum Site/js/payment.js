// API URL tanımı
const apiUrl = 'http://localhost:3000/api/data';

// Cart count elementi
const cartCountElement = document.getElementById('cart-count');

// İl ve ilçe verileri
const cities = [
    { id: 1, name: "İstanbul" },
    { id: 2, name: "Ankara" },
    { id: 3, name: "İzmir" },
    { id: 4, name: "Bursa" },
    { id: 5, name: "Antalya" },
    { id: 6, name: "Adana" },
    { id: 7, name: "Konya" },
    { id: 8, name: "Gaziantep" }
];

const districts = {
    1: ["Beşiktaş", "Kadıköy", "Şişli", "Üsküdar", "Bakırköy"],
    2: ["Çankaya", "Keçiören", "Mamak", "Yenimahalle", "Etimesgut"],
    3: ["Konak", "Karşıyaka", "Bornova", "Buca", "Çiğli"],
    4: ["Nilüfer", "Osmangazi", "Yıldırım", "Mudanya", "Gemlik"],
    5: ["Muratpaşa", "Kepez", "Konyaaltı", "Manavgat", "Alanya"],
    6: ["Seyhan", "Çukurova", "Yüreğir", "Sarıçam", "Ceyhan"],
    7: ["Selçuklu", "Meram", "Karatay", "Ereğli", "Akşehir"],
    8: ["Şahinbey", "Şehitkamil", "Oğuzeli", "Nizip", "Islahiye"]
};

// Sepet sayacını güncelleme fonksiyonu
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// Toast mesajı gösterme fonksiyonu
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

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
    displayCartItems();
    loadCities();
    updateCartCount();
    
    // Kargo seçimi değiştiğinde özeti güncelle
    const cargoInputs = document.querySelectorAll('input[name="cargo"]');
    cargoInputs.forEach(input => {
        input.addEventListener('change', () => {
            calculateAndUpdateSummary();
        });
    });
});

// Sepet öğelerini görüntüleme ve toplam hesaplama
function displayCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Sepetiniz boş</p>';
        calculateAndUpdateSummary();
        return;
    }

    // Sepet öğelerini görüntüle
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.urunGorseli}" 
                 alt="${item.urunIsmi}" 
                 class="cart-item-image">
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.urunIsmi}</h3>
                <p class="cart-item-description">${item.urunAciklamasi}</p>
                <p class="cart-item-price">${item.urunFiyati} ₺</p>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button type="button" class="quantity-btn minus" onclick="updateQuantity('${item._id}', -1)">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button type="button" class="quantity-btn plus" onclick="updateQuantity('${item._id}', 1)">+</button>
                    </div>
                    <button type="button" class="remove-item" onclick="removeItem('${item._id}')">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    calculateAndUpdateSummary();
}

// Toplam tutarı hesaplama ve güncelleme
function calculateAndUpdateSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Ara toplam hesaplama
    const subtotal = cart.reduce((total, item) => {
        return total + (item.quantity * parseFloat(item.urunFiyati));
    }, 0);

    // KDV hesaplama
    const tax = subtotal * 0.18;
    
    // Kargo ücreti hesaplama
    let shippingCost = 0;
    const selectedCargo = document.querySelector('input[name="cargo"]:checked');
    if (selectedCargo) {
        switch(selectedCargo.value) {
            case 'yurtici': shippingCost = 25.00; break;
            case 'aras': shippingCost = 27.50; break;
            case 'mng': shippingCost = 29.90; break;
        }
    }
    
    // Genel toplam hesaplama
    const finalTotal = subtotal + tax + shippingCost;

    // Değerleri güncelle
    document.getElementById('subtotal').textContent = `${subtotal.toFixed(2)} ₺`;
    document.getElementById('tax').textContent = `${tax.toFixed(2)} ₺`;
    document.getElementById('shipping').textContent = `${shippingCost.toFixed(2)} ₺`;
    document.getElementById('total').textContent = `${finalTotal.toFixed(2)} ₺`;
}

// Ürün miktarı değiştiğinde
async function updateQuantity(productId, change) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const itemIndex = cart.findIndex(item => item._id === productId);
        
        if (itemIndex === -1) return;

        const currentItem = cart[itemIndex];
        const newQuantity = currentItem.quantity + change;

        // Stok kontrolü ve güncelleme için API isteği
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                productId,
                change: -change
            })
        });

        if (response.ok) {
            if (newQuantity > 0) {
                cart[itemIndex].quantity = newQuantity;
                localStorage.setItem('cart', JSON.stringify(cart));
                displayCartItems();
                updateCartCount();
                
                // Stok değişikliğini shop.html'e bildir
                window.dispatchEvent(new CustomEvent('stockUpdated'));
                
                showToast(change > 0 ? 'Ürün miktarı arttırıldı' : 'Ürün miktarı azaltıldı');
            } else {
                await removeItem(productId);
            }
        } else {
            showToast('Stok güncellenirken hata oluştu');
        }
    } catch (error) {
        console.error('Miktar güncelleme hatası:', error);
        showToast('İşlem sırasında bir hata oluştu');
    }
}

// Ürünü sepetten silme
async function removeItem(productId) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const item = cart.find(item => item._id === productId);
        
        if (item) {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    productId, 
                    change: item.quantity
                })
            });

            if (response.ok) {
                cart = cart.filter(cartItem => cartItem._id !== productId);
                localStorage.setItem('cart', JSON.stringify(cart));
                displayCartItems();
                updateCartCount();
                
                // Stok değişikliğini shop.html'e bildir
                window.dispatchEvent(new CustomEvent('stockUpdated'));
                
                showToast('Ürün sepetten kaldırıldı');
            }
        }
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        showToast('Ürün silinirken bir hata oluştu');
    }
}

// Form gönderme işlemi
document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-form');
    const paymentForm = document.getElementById('paymentForm');
    
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
});

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    // Form validasyonu
    const requiredFields = ['fullName', 'phone', 'email', 'city', 'district', 'address'];
    const isValid = requiredFields.every(field => {
        const input = document.getElementById(field);
        return input && input.value.trim() !== '';
    });

    if (!isValid) {
        showToast('Lütfen tüm zorunlu alanları doldurun.');
        return;
    }

    // Ödeme modalını göster
    document.getElementById('paymentModal').style.display = 'block';
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        if (cart.length === 0) {
            showToast('Sepetiniz boş!');
            return;
        }

        // Her ürün için stok güncellemesi yap
        for (const item of cart) {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: item._id,
                    change: item.quantity
                })
            });

            if (!response.ok) {
                throw new Error('Stok güncellenirken hata oluştu');
            }
        }

        // Ödeme modalını kapat
        document.getElementById('paymentModal').style.display = 'none';
        
        // Sepeti temizle
        localStorage.removeItem('cart');
        
        // Stok güncellemesini shop.html'e bildir
        window.dispatchEvent(new CustomEvent('stockUpdated'));
        
        // Sepet görünümünü güncelle
        displayCartItems();
        updateCartCount();
        
        showToast('Siparişiniz başarıyla tamamlandı!');
        
        // Yönlendirmeden önce localStorage'a stok güncelleme bayrağı ekle
        localStorage.setItem('stockUpdateNeeded', 'true');
        
        setTimeout(() => {
            window.location.href = 'shop.html';
        }, 2000);

    } catch (error) {
        console.error('Ödeme hatası:', error);
        showToast('Ödeme işlemi sırasında bir hata oluştu');
    }
}

// İlleri yükleme fonksiyonu
function loadCities() {
    const citySelect = document.getElementById('city');
    const districtSelect = document.getElementById('district');
    
    // İlleri yükle
    citySelect.innerHTML = '<option value="">Seçiniz</option>';
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.name;
        citySelect.appendChild(option);
    });

    // İl değiştiğinde ilçeleri yükle
    citySelect.addEventListener('change', (e) => {
        loadDistricts(e.target.value);
    });

    // İlk yüklemede ilçe seçimini devre dışı bırak
    districtSelect.disabled = true;
}

// İlçeleri yükleme fonksiyonu
function loadDistricts(cityId) {
    const districtSelect = document.getElementById('district');
    districtSelect.innerHTML = '<option value="">Seçiniz</option>';
    
    if (cityId) {
        districts[cityId].forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
        districtSelect.disabled = false;
    } else {
        districtSelect.disabled = true;
    }
} 