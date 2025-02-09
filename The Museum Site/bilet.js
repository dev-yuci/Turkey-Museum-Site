document.addEventListener('DOMContentLoaded', async function() {
    // Form elemanları
    const citySelect = document.getElementById('citySelect');
    const museumSelect = document.getElementById('museumSelect');
    const visitDate = document.getElementById('visitDate');
    const visitTime = document.getElementById('visitTime');
    const buyButton = document.getElementById('buyButton');

    // Bilet bilgi elemanları
    const ticketCity = document.getElementById('ticketCity');
    const ticketMuseum = document.getElementById('ticketMuseum');
    const ticketDate = document.getElementById('ticketDate');
    const ticketTime = document.getElementById('ticketTime');
    const ticketPrice = document.getElementById('ticketPrice');
    const ticketId = document.getElementById('ticketId');

    // Minimum tarih olarak bugünü ayarla
    const today = new Date().toISOString().split('T')[0];
    visitDate.min = today;

    // Cities.json'dan verileri al
    try {
        const response = await fetch('cities.json');
        const data = await response.json();
        
        // Şehirleri select'e ekle
        data.cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.name;
            option.textContent = city.name;
            citySelect.appendChild(option);
        });

        // Şehir seçildiğinde müzeleri güncelle
        citySelect.addEventListener('change', function() {
            const selectedCity = data.cities.find(city => city.name === this.value);
            museumSelect.innerHTML = '<option value="">Müze Seçin</option>';
            
            if (selectedCity) {
                selectedCity.museums.forEach(museum => {
                    const option = document.createElement('option');
                    option.value = museum;
                    option.textContent = museum;
                    museumSelect.appendChild(option);
                });
                museumSelect.disabled = false;
                ticketCity.textContent = this.value;
            } else {
                museumSelect.disabled = true;
                ticketCity.textContent = '-';
            }
            checkFormValidity();
        });
    } catch (error) {
        console.error('Veri yüklenirken hata oluştu:', error);
    }

    // Form değişikliklerini dinle
    [museumSelect, visitDate, visitTime].forEach(element => {
        element.addEventListener('change', updateTicket);
    });

    // Tarih seçildiğinde saat seçimini aktif et
    visitDate.addEventListener('change', function() {
        if (this.value) {
            visitTime.disabled = false;
        } else {
            visitTime.disabled = true;
        }
        checkFormValidity();
    });

    function checkFormValidity() {
        const isFormValid = citySelect.value && museumSelect.value && visitDate.value;
        visitTime.disabled = !isFormValid;
        updateTicket();
    }

    function updateTicket() {
        const isFormValid = citySelect.value && museumSelect.value && 
                          visitDate.value && visitTime.value;

        if (isFormValid) {
            ticketMuseum.textContent = museumSelect.value;
            ticketDate.textContent = formatDate(visitDate.value);
            ticketTime.textContent = visitTime.value;
            ticketPrice.textContent = '₺150,00';
            ticketId.textContent = generateTicketId();
            buyButton.disabled = false;
        } else {
            buyButton.disabled = true;
        }
    }

    function formatDate(dateString) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('tr-TR', options);
    }

    function generateTicketId() {
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `TMM-2024-${random}`;
    }

    buyButton.addEventListener('click', function() {
        alert('Ödeme sayfasına yönlendiriliyorsunuz...');
    });

    const paymentModal = document.getElementById('paymentModal');
    const successModal = document.getElementById('successModal');
    const closeModal = document.querySelector('.close-modal');
    const paymentForm = document.getElementById('paymentForm');
    const successButton = document.querySelector('.success-button');

    // Kart numarası formatlaması
    document.getElementById('cardNumber').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Kart son kullanma tarihi formatlaması
    document.getElementById('cardExpiry').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0,2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });

    // Modal açma/kapama
    buyButton.addEventListener('click', () => {
        paymentModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    // Ödeme formu gönderimi
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        paymentModal.style.display = 'none';
        successModal.style.display = 'block';
    });

    // Başarılı ödeme modalını kapatma
    successButton.addEventListener('click', () => {
        successModal.style.display = 'none';
        // Opsiyonel: Anasayfaya yönlendirme
        // window.location.href = 'index.html';
    });

    // Modal dışına tıklandığında kapatma
    window.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            paymentModal.style.display = 'none';
        }
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });
}); 