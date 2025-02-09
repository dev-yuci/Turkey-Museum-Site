// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', async () => {
    // Şehirleri JSON dosyasından çek
    const fetchCities = async () => {
        const response = await fetch('cities.json');
        const data = await response.json();
        return data.cities;
    };

    // Şehir dropdown'unu doldur
    const populateCityDropdown = async () => {
        const cities = await fetchCities();
        const cityDropdown = document.getElementById('cityDropdown');
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.name;
            option.textContent = city.name;
            cityDropdown.appendChild(option);
        });
    };

    // Seçilen şehre göre müzeleri JSON dosyasından çek
    const fetchMuseums = async (city) => {
        const cities = await fetchCities();
        const selectedCity = cities.find(c => c.name === city);
        return selectedCity ? selectedCity.museums : [];
    };

    // Şehir seçimi yapıldığında müzeleri yükle
    document.getElementById('cityDropdown').addEventListener('change', async (event) => {
        const selectedCity = event.target.value;
        const museumDropdown = document.getElementById('museumDropdown');
        const showMuseumsButton = document.getElementById('showMuseumsButton');

        // Müze dropdown'unu sıfırla
        museumDropdown.innerHTML = '<option disabled selected>Hangi Müzeleri seversiniz?</option>';
        museumDropdown.disabled = true;
        showMuseumsButton.style.pointerEvents = 'none'; // Butonu devre dışı bırak

        if (selectedCity) {
            const museums = await fetchMuseums(selectedCity);
            museums.forEach(museum => {
                const option = document.createElement('option');
                option.value = museum;
                option.textContent = museum;
                museumDropdown.appendChild(option);
            });
            museumDropdown.disabled = false;
            showMuseumsButton.style.pointerEvents = 'auto'; // Butonu etkinleştir
        }
    });

    // Müze butonuna tıklandığında müze bilgilerini yeni sayfada göster
    document.getElementById('showMuseumsButton').addEventListener('click', async () => {
        const selectedMuseum = document.getElementById('museumDropdown').value;
        if (selectedMuseum) {
            // URL'ye yönlendirme
            window.location.href = `museum.html?museum=${encodeURIComponent(selectedMuseum)}`;
        }
    });

    // Sayfa yüklendiğinde dropdown'ları doldur
    await populateCityDropdown();

    const cityDropdown = document.getElementById('cityDropdown');
    const museumDropdown = document.getElementById('museumDropdown');
    museumDropdown.innerHTML = '<option disabled selected>Hangi Müzeleri seversiniz?</option>';
    museumDropdown.disabled = true;
    cityDropdown.selectedIndex = 0; // Şehir dropdown'unu sıfırla
});
