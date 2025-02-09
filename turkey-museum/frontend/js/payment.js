document.addEventListener('DOMContentLoaded', () => {
    displayCartItems();
    setupEventListeners();
    loadCities();
    
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: 3000
    };

    // Form submit olayını dinle
    document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);
    document.getElementById('paymentForm').addEventListener('submit', handlePaymentSubmit);

    // Modal kapatma butonunu dinle
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('paymentModal').style.display = 'none';
    });

    // Kart numarası formatlaması
    document.getElementById('cardNumber').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = '';
        for(let i = 0; i < value.length; i++) {
            if(i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        e.target.value = formattedValue;
    });

    // Son kullanma tarihi formatlaması
    document.getElementById('expiryDate').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0,2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });
});

function displayCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Sepetiniz boş</p>
            </div>
        `;
        return;
    }

    let cartHTML = '';
    cart.forEach(item => {
        total += item.quantity * parseFloat(item.urunFiyati);
        
        cartHTML += `
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
        `;
    });

    cartHTML += `
        <div class="cart-total">
            <span>Toplam:</span>
            <span>${total.toFixed(2)} ₺</span>
        </div>
    `;

    cartItemsContainer.innerHTML = cartHTML;

    document.getElementById('subtotal').textContent = `${total.toFixed(2)} ₺`;
    const shippingCost = 29.90;
    document.getElementById('total-amount').textContent = `${(total + shippingCost).toFixed(2)} ₺`;
}

async function updateQuantity(productId, change) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const itemIndex = cart.findIndex(item => item._id === productId);
        
        if (itemIndex === -1) return;

        const currentItem = cart[itemIndex];
        const newQuantity = currentItem.quantity + change;

        // Stok kontrolü ve güncelleme için API isteği
        const response = await fetch('http://localhost:3000/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                productId,
                change: change * -1 // Stoktan düşülecek miktar (artış için eksi, azalış için artı)
            })
        });

        if (response.ok) {
            if (newQuantity > 0) {
                // Sepeti güncelle
                cart[itemIndex].quantity = newQuantity;
                localStorage.setItem('cart', JSON.stringify(cart));
                displayCartItems();
                
                // Başarılı mesajı
                if (change > 0) {
                    toastr.success('Ürün miktarı arttırıldı.');
                } else {
                    toastr.success('Ürün miktarı azaltıldı.');
                }
            } else {
                await removeItem(productId);
            }
        } else {
            const errorData = await response.json();
            toastr.error(errorData.message || 'İşlem sırasında bir hata oluştu.');
        }
    } catch (error) {
        console.error('Miktar güncelleme hatası:', error);
        toastr.error('İşlem sırasında bir hata oluştu.');
    }
}

async function removeItem(productId) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const item = cart.find(item => item._id === productId);
        
        if (item) {
            // Stok güncelleme isteği - Silinen ürünün stoğunu geri ekle
            const response = await fetch('http://localhost:3000/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    productId, 
                    change: item.quantity // Stoğa geri eklenecek miktar (pozitif değer)
                })
            });

            if (response.ok) {
                cart = cart.filter(cartItem => cartItem._id !== productId);
                localStorage.setItem('cart', JSON.stringify(cart));
                displayCartItems();
                toastr.success('Ürün sepetten kaldırıldı.');
            } else {
                const errorData = await response.json();
                toastr.error(errorData.message || 'Ürün silinirken bir hata oluştu.');
            }
        }
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        toastr.error('Ürün silinirken bir hata oluştu.');
    }
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    // Form validasyonu
    const requiredFields = ['fullName', 'phone', 'email', 'city', 'district', 'address'];
    const isValid = requiredFields.every(field => {
        const input = document.getElementById(field);
        return input && input.value.trim() !== '';
    });

    if (!isValid) {
        toastr.error('Lütfen tüm zorunlu alanları doldurun.');
        return;
    }

    // Ödeme modalını göster
    document.getElementById('paymentModal').style.display = 'block';
}

function handlePaymentSubmit(e) {
    e.preventDefault();
    
    // Ödeme formu validasyonu
    const paymentFields = ['cardName', 'cardNumber', 'expiryDate', 'cvv'];
    const isValid = paymentFields.every(field => {
        const input = document.getElementById(field);
        return input && input.value.trim() !== '';
    });

    if (!isValid) {
        toastr.error('Lütfen tüm ödeme bilgilerini doldurun.');
        return;
    }

    // Ödeme modalını kapat
    document.getElementById('paymentModal').style.display = 'none';
    
    // Başarılı sipariş modalını göster
    document.getElementById('successModal').style.display = 'block';
    
    // Sepeti temizle
    localStorage.removeItem('cart');
    
    // 3 saniye sonra ana sayfaya yönlendir
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 3000);
}

// Modal dışına tıklandığında kapatma
window.onclick = function(event) {
    const paymentModal = document.getElementById('paymentModal');
    const successModal = document.getElementById('successModal');
    if (event.target === paymentModal) {
        paymentModal.style.display = 'none';
    }
    if (event.target === successModal) {
        successModal.style.display = 'none';
    }
}

function calculateTotal(cart) {
    return cart.reduce((total, item) => total + (item.quantity * parseFloat(item.urunFiyati)), 0);
}

// İl ve ilçe verilerini yükle
async function loadCities() {
    const citySelect = document.getElementById('city');
    const cities = [
        "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya",
        // ... diğer iller
    ];
    
    cities.sort().forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// İlçeleri yükle (örnek)
function loadDistricts(city) {
    const districtSelect = document.getElementById('district');
    districtSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    districtSelect.disabled = false;

    const districts = {
        "İstanbul": ["Kadıköy", "Beşiktaş", "Üsküdar", "Şişli"],
        "Ankara": ["Çankaya", "Keçiören", "Mamak", "Yenimahalle"],
        // ... diğer ilçeler
    };

    if (districts[city]) {
        districts[city].forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
    }
}

function validateAddress(address) {
    // Basit adres doğrulama
    const required = ['mahalle', 'sokak', 'no'];
    const lowercaseAddress = address.toLowerCase();
    return required.every(term => lowercaseAddress.includes(term));
}

function setupEventListeners() {
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }

    // Telefon numarası formatı
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            e.target.value = value;
        });
    }

    // İl değişikliğini dinle
    const citySelect = document.getElementById('city');
    citySelect.addEventListener('change', (e) => {
        loadDistricts(e.target.value);
    });

    // Adres doğrulama
    const addressInput = document.getElementById('address');
    addressInput.addEventListener('blur', (e) => {
        if (!validateAddress(e.target.value)) {
            toastr.warning('Lütfen geçerli bir adres giriniz (Mahalle, Sokak ve Numara bilgilerini içermeli)');
        }
    });

    // KVKK link tıklama
    const kvkkLink = document.querySelector('.kvkk-link');
    if (kvkkLink) {
        kvkkLink.addEventListener('click', (e) => {
            e.preventDefault();
            toastr.info('KVKK Aydınlatma Metni modal penceresi açılacak.');
            // Burada KVKK modal penceresini açabilirsiniz
        });
    }
} 