// URL'den müze adını al
const urlParams = new URLSearchParams(window.location.search);
const museumName = urlParams.get('museum');

// API'den müze bilgilerini al
const fetchMuseumInfo = async (museum) => {
    try {
        const response = await fetch(`https://tr.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&explaintext&exlimit=1&titles=${encodeURIComponent(museum)}&format=json&pithumbsize=1000&origin=*`);
        const data = await response.json();
        const page = data.query.pages[Object.keys(data.query.pages)[0]];

        if (page && page.title) {
            document.getElementById('museumTitle').textContent = page.title;
            document.getElementById('museumDescription').textContent = page.extract || 'Açıklama bulunamadı.';
            const museumImage = document.getElementById('museumImage');
            if (page.thumbnail) {
                museumImage.src = page.thumbnail.source; // Resmi orijinal boyutunda al
                museumImage.style.display = 'block'; // Resmi görünür yap
            } else {
                museumImage.style.display = 'none'; // Resim yoksa gizle
            }
        } else {
            document.getElementById('museumTitle').textContent = 'Müze Bulunamadı';
            document.getElementById('museumDescription').textContent = 'Aradığınız müze bulunamadı.';
        }
    } catch (error) {
        console.error("Hata oluştu:", error);
        document.getElementById('museumTitle').textContent = 'Hata';
        document.getElementById('museumDescription').textContent = 'Müze bilgileri yüklenemedi.';
    }
};

// Müze bilgilerini yükle
if (museumName) {
    fetchMuseumInfo(museumName);
} else {
    document.getElementById('museumTitle').textContent = 'Geçersiz Müze Seçimi';
}

// Yorumları yükle
const loadComments = async (museumId) => {
    try {
        const response = await fetch('comments.json');
        const data = await response.json();
        return data.comments.filter(comment => comment.museumId === museumId);
    } catch (error) {
        console.error('Yorumlar yüklenirken hata oluştu:', error);
        return [];
    }
};

// Yorumları görüntüle
const displayComments = (comments) => {
    const commentsContainer = document.querySelector('.comments-container');
    commentsContainer.innerHTML = ''; // Mevcut yorumları temizle

    comments.forEach(comment => {
        const date = new Date(comment.date).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const commentHTML = `
            <div class="comment-card" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="user-info">
                        <div class="user-avatar">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                        </div>
                        <div class="user-details">
                            <h3>${comment.userName}</h3>
                            <span class="comment-date">${date}</span>
                        </div>
                    </div>
                </div>
                <div class="comment-content">
                    <p>${comment.content}</p>
                </div>
                <div class="comment-actions">
                    <button class="action-button like-button" onclick="handleLike(${comment.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>${comment.likes} Beğeni</span>
                    </button>
                    <button class="action-button reply-button">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                        <span>Yanıtla</span>
                    </button>
                </div>
            </div>
        `;
        commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
    });
};

// Yeni yorum ekle
const handleSubmitComment = async (event) => {
    event.preventDefault();
    const form = event.target;
    const userName = form.querySelector('#userName').value;
    const content = form.querySelector('#userComment').value;

    const newComment = {
        id: Date.now(), // Geçici ID
        museumId: getCurrentMuseumId(), // URL'den müze ID'sini al
        userName,
        date: new Date().toISOString().split('T')[0],
        content,
        likes: 0
    };

    // Normalde burada bir API çağrısı yapılır
    // Şimdilik local storage'a kaydedelim
    const comments = JSON.parse(localStorage.getItem('comments') || '[]');
    comments.push(newComment);
    localStorage.setItem('comments', JSON.stringify(comments));

    // Formu temizle ve yorumları yeniden yükle
    form.reset();
    const allComments = await loadComments(getCurrentMuseumId());
    displayComments(allComments);
};

// Beğeni işleme
const handleLike = async (commentId) => {
    // Normalde burada bir API çağrısı yapılır
    const comments = JSON.parse(localStorage.getItem('comments') || '[]');
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
        comments[commentIndex].likes += 1;
        localStorage.setItem('comments', JSON.stringify(comments));
        const allComments = await loadComments(getCurrentMuseumId());
        displayComments(allComments);
    }
};

// Müze ID'sini URL'den al
const getCurrentMuseumId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('museum');
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    const museumId = getCurrentMuseumId();
    if (museumId) {
        const comments = await loadComments(museumId);
        displayComments(comments);
    }

    // Yorum formunu dinle
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', handleSubmitComment);
    }
});