
// RESPONSİVE NAVBAR 

const navMenu = document.querySelector(".nav-menu");
const setting = document.querySelector(".setting");
const close = document.querySelector(".close");
const li = document.querySelector(".nav-menu ul li");


setting.classList.toggle("active");
// Hamburger menü ikonuna tıklandığında menüyü aç
setting.addEventListener("click", () => {
    setTimeout(() => {
        navMenu.classList.toggle("active-menu");
        close.classList.toggle("active");
        setting.classList.toggle("hidden"); // setting ikonunu gizle
    }, 100); // 0.1 saniye gecikme
});

// Close ikonuna tıklandığında menüyü kapat
close.addEventListener("click", () => {
    setTimeout(() => {
        navMenu.classList.remove("active-menu");
        close.classList.remove("active");
        setting.classList.remove("hidden"); // setting ikonunu geri getir
    }, 100); // 0.1 saniye gecikme
});

li.addEventListener("click", () => {
    setTimeout(() => {
        navMenu.classList.remove("active-menu");
        close.classList.remove("active");
        setting.classList.remove("hidden"); // setting ikonunu geri getir
    }, 100);
});



