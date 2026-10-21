// ========== ОБЩИЕ ПЕРЕМЕННЫЕ ==========
let currentPhotoList = [];
let currentPhotoIndex = 0;

const backgroundCache = {};

function debounce(fn, wait) {
    let t = null;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

// ========== РАБОТА С ДАТАМИ ==========
function parseDate(dateStr) {
    if (!dateStr) return null;

    const str = String(dateStr).trim();
    if (!str) return null;

    const dotParts = str.split('.');
    if (dotParts.length === 3) {
        const day = parseInt(dotParts[0]);
        const month = parseInt(dotParts[1]);
        const year = parseInt(dotParts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const fullYear = year < 100 ? 2000 + year : year;
            return new Date(fullYear, month - 1, day);
        }
    }

    const isoParts = str.split('-');
    if (isoParts.length === 3) {
        const year = parseInt(isoParts[0]);
        const month = parseInt(isoParts[1]);
        const day = parseInt(isoParts[2]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month - 1, day);
        }
    }

    const date = new Date(str);
    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
}

function formatDate(dateString) {
    const date = parseDate(dateString);
    if (!date) return dateString || 'Н/Д';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}

function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    const date = parseDate(dateString);
    if (!date) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function calculateExpiry(issueDate) {
    const date = parseDate(issueDate);
    if (!date) return '';

    const expiryDate = new Date(date);
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const day = String(expiryDate.getDate()).padStart(2, '0');
    const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const year = expiryDate.getFullYear();

    return `${day}.${month}.${year}`;
}

function splitUrls(urlString) {
    if (!urlString) return [];

    return String(urlString)
        .split(';')
        .map(url => url.trim())
        .filter(url => url.length > 0);
}

// ========== ЗАГРУЗКА ИЗОБРАЖЕНИЙ ==========
function loadImage(src) {
    return new Promise((resolve, reject) => {
        if (backgroundCache[src]) {
            resolve(backgroundCache[src]);
            return;
        }

        const img = new Image();
        img.onload = () => {
            backgroundCache[src] = img;
            resolve(img);
        };
        img.onerror = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1654;
            canvas.height = 2339;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ФОН НЕ НАЙДЕН', canvas.width / 2, canvas.height / 2);
            const fallbackImg = new Image();
            fallbackImg.src = canvas.toDataURL();
            backgroundCache[src] = fallbackImg;
            resolve(fallbackImg);
        };
        img.src = src;
    });
}

// ========== МОДАЛЬНОЕ ОКНО С ЗУМОМ ==========
let photoZoom = 1;
let photoPanX = 0;
let photoPanY = 0;
let photoPanning = false;
let photoPanStartX = 0;
let photoPanStartY = 0;
let photoPanOrigX = 0;
let photoPanOrigY = 0;

const PHOTO_ZOOM_MIN = 1;
const PHOTO_ZOOM_MAX = 6;
const PHOTO_ZOOM_STEP = 1.25;

function openPhotoGallery(photoList, startIndex) {
    currentPhotoList = photoList;
    currentPhotoIndex = startIndex;
    resetPhotoZoom();
    updateModalImage();
    const modal = document.getElementById('photoModal');
    if (modal) modal.style.display = 'block';
    bindPhotoZoomOnce();
}

function updateModalImage() {
    if (currentPhotoList.length === 0) return;

    const modalImage = document.getElementById('modalImage');
    const modalCounter = document.getElementById('modalCounter');
    if (!modalImage || !modalCounter) return;

    resetPhotoZoom();
    modalImage.src = currentPhotoList[currentPhotoIndex];
    modalCounter.textContent = `${currentPhotoIndex + 1} / ${currentPhotoList.length}`;

    const prevBtn = document.querySelector('.eis-modal-prev');
    const nextBtn = document.querySelector('.eis-modal-next');
    if (!prevBtn || !nextBtn) return;

    const multi = currentPhotoList.length > 1;
    prevBtn.style.display = multi ? 'flex' : 'none';
    nextBtn.style.display = multi ? 'flex' : 'none';

    updateZoomUI();
}

function prevPhoto() {
    if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
        updateModalImage();
    }
}

function nextPhoto() {
    if (currentPhotoIndex < currentPhotoList.length - 1) {
        currentPhotoIndex++;
        updateModalImage();
    }
}

function closeModal() {
    const modal = document.getElementById('photoModal');
    if (modal) modal.style.display = 'none';
    resetPhotoZoom();
}

// ---------- ЗУМ ----------
function resetPhotoZoom() {
    photoZoom = 1;
    photoPanX = 0;
    photoPanY = 0;
    applyPhotoTransform();
}

function applyPhotoTransform() {
    const img = document.getElementById('modalImage');
    if (!img) return;

    img.style.transform = `translate(${photoPanX}px, ${photoPanY}px) scale(${photoZoom})`;

    const content = document.querySelector('.eis-modal-content');
    if (content) {
        content.classList.toggle('zoomed', photoZoom > 1);
    }

    updateZoomUI();
}

function updateZoomUI() {
    const valueEl = document.getElementById('zoomValue');
    if (valueEl) valueEl.textContent = Math.round(photoZoom * 100) + '%';

    const minus = document.getElementById('zoomOutBtn');
    const plus = document.getElementById('zoomInBtn');
    const reset = document.getElementById('zoomResetBtn');

    if (minus) minus.disabled = photoZoom <= PHOTO_ZOOM_MIN + 0.001;
    if (plus) plus.disabled = photoZoom >= PHOTO_ZOOM_MAX - 0.001;
    if (reset) reset.disabled = photoZoom === 1 && photoPanX === 0 && photoPanY === 0;
}

function zoomPhotoIn() {
    if (photoZoom >= PHOTO_ZOOM_MAX) return;
    photoZoom = Math.min(PHOTO_ZOOM_MAX, photoZoom * PHOTO_ZOOM_STEP);
    applyPhotoTransform();
}

function zoomPhotoOut() {
    if (photoZoom <= PHOTO_ZOOM_MIN) return;
    photoZoom = Math.max(PHOTO_ZOOM_MIN, photoZoom / PHOTO_ZOOM_STEP);
    if (photoZoom === PHOTO_ZOOM_MIN) {
        photoPanX = 0;
        photoPanY = 0;
    }
    applyPhotoTransform();
}

function zoomPhotoReset() {
    resetPhotoZoom();
}

function zoomPhotoAt(e, delta) {
    if (photoZoom <= PHOTO_ZOOM_MIN && delta < 0) return;

    const img = document.getElementById('modalImage');
    if (!img) return;

    const oldZoom = photoZoom;
    const newZoom = Math.max(PHOTO_ZOOM_MIN, Math.min(PHOTO_ZOOM_MAX, photoZoom * delta));
    if (newZoom === oldZoom) return;

    const rect = img.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;

    const factor = newZoom / oldZoom;
    photoPanX -= offsetX * (factor - 1);
    photoPanY -= offsetY * (factor - 1);
    photoZoom = newZoom;

    if (photoZoom === PHOTO_ZOOM_MIN) {
        photoPanX = 0;
        photoPanY = 0;
    }

    applyPhotoTransform();
}

// ---------- ПРИВЯЗКА ОБРАБОТЧИКОВ ----------
function bindPhotoZoomOnce() {
    if (bindPhotoZoomOnce._done) return;
    bindPhotoZoomOnce._done = true;

    const modal = document.getElementById('photoModal');
    if (!modal) return;

    const content = modal.querySelector('.eis-modal-content');

    // Инжектим контролы зума, если их ещё нет
    if (content && !document.getElementById('eisModalZoom')) {
        const zoomBar = document.createElement('div');
        zoomBar.className = 'eis-modal-zoom';
        zoomBar.id = 'eisModalZoom';
        zoomBar.innerHTML = `
            <button type="button" id="zoomOutBtn" title="Уменьшить">−</button>
            <span class="eis-modal-zoom-value" id="zoomValue">100%</span>
            <button type="button" id="zoomInBtn" title="Увеличить">+</button>
            <button type="button" id="zoomResetBtn" title="Сбросить" style="font-size:14px;">⤾</button>
        `;
        content.appendChild(zoomBar);

        document.getElementById('zoomInBtn').onclick = (e) => { e.stopPropagation(); zoomPhotoIn(); };
        document.getElementById('zoomOutBtn').onclick = (e) => { e.stopPropagation(); zoomPhotoOut(); };
        document.getElementById('zoomResetBtn').onclick = (e) => { e.stopPropagation(); zoomPhotoReset(); };
    }

    // Колесо мыши
    modal.addEventListener('wheel', (e) => {
        if (modal.style.display !== 'block') return;
        e.preventDefault();
        const delta = e.deltaY < 0 ? PHOTO_ZOOM_STEP : 1 / PHOTO_ZOOM_STEP;
        zoomPhotoAt(e, delta);
    }, { passive: false });

    // Двойной клик — зум ×2 / сброс
    modal.addEventListener('dblclick', (e) => {
        if (e.target.id !== 'modalImage') return;
        if (photoZoom > 1) resetPhotoZoom();
        else zoomPhotoAt(e, 2);
    });

    // Перетаскивание мышью
    modal.addEventListener('mousedown', (e) => {
        if (e.target.id !== 'modalImage') return;
        if (photoZoom <= 1) return;
        e.preventDefault();
        photoPanning = true;
        photoPanStartX = e.clientX;
        photoPanStartY = e.clientY;
        photoPanOrigX = photoPanX;
        photoPanOrigY = photoPanY;
        if (content) content.classList.add('panning');
    });

    window.addEventListener('mousemove', (e) => {
        if (!photoPanning) return;
        photoPanX = photoPanOrigX + (e.clientX - photoPanStartX);
        photoPanY = photoPanOrigY + (e.clientY - photoPanStartY);
        const img = document.getElementById('modalImage');
        if (img) img.style.transform = `translate(${photoPanX}px, ${photoPanY}px) scale(${photoZoom})`;
    });

    window.addEventListener('mouseup', () => {
        photoPanning = false;
        if (content) content.classList.remove('panning');
    });

    // Тач: пинч-зум + панорама
    let touchStartDist = 0;
    let touchStartZoom = 1;

    modal.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            touchStartDist = getTouchDist(e.touches);
            touchStartZoom = photoZoom;
        } else if (e.touches.length === 1 && photoZoom > 1) {
            photoPanning = true;
            photoPanStartX = e.touches[0].clientX;
            photoPanStartY = e.touches[0].clientY;
            photoPanOrigX = photoPanX;
            photoPanOrigY = photoPanY;
        }
    }, { passive: true });

    modal.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dist = getTouchDist(e.touches);
            const factor = dist / touchStartDist;
            const newZoom = Math.max(PHOTO_ZOOM_MIN, Math.min(PHOTO_ZOOM_MAX, touchStartZoom * factor));
            photoZoom = newZoom;
            if (photoZoom === PHOTO_ZOOM_MIN) { photoPanX = 0; photoPanY = 0; }
            applyPhotoTransform();
        } else if (photoPanning && e.touches.length === 1) {
            e.preventDefault();
            photoPanX = photoPanOrigX + (e.touches[0].clientX - photoPanStartX);
            photoPanY = photoPanOrigY + (e.touches[0].clientY - photoPanStartY);
            const img = document.getElementById('modalImage');
            if (img) img.style.transform = `translate(${photoPanX}px, ${photoPanY}px) scale(${photoZoom})`;
        }
    }, { passive: false });

    modal.addEventListener('touchend', () => {
        photoPanning = false;
    });
}

function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// ========== СТАТУС ВУ ==========
function getVUStatus(expiryDate, state) {
    if (state === 'Архив') {
        return { status: 'archived', text: 'АРХИВ', class: 'eis-status-archived' };
    }

    if (!expiryDate) {
        return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'eis-status-expired' };
    }

    const date = parseDate(expiryDate);
    if (!date) {
        return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'eis-status-expired' };
    }

    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: 'expired', text: 'ПРОСРОЧЕНО', class: 'eis-status-expired' };
    } else if (diffDays <= 7) {
        return { status: 'expiring', text: 'ИСТЕКАЕТ', class: 'eis-status-expiring' };
    } else {
        return { status: 'valid', text: 'ДЕЙСТВИТЕЛЬНО', class: 'eis-status-valid' };
    }
}

// ========== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ТЕКСТА ==========
function fitText(ctx, text, x, y, maxWidth, initialSize, fontFamily, fontWeight, color, align = 'left', fontStyle = 'normal') {
    if (!text || text.trim() === '') return;

    let fontSize = initialSize;
    ctx.textAlign = align;
    ctx.textBaseline = 'bottom';

    do {
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
        const metrics = ctx.measureText(text);
        if (metrics.width <= maxWidth) {
            break;
        }
        fontSize -= 1;
    } while (fontSize > 8);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function () {
    // Горячие клавиши для модалки
    document.addEventListener('keydown', function (e) {
        const modal = document.getElementById('photoModal');
        const isOpen = modal && modal.style.display === 'block';

        if (e.key === 'Escape') {
            if (isOpen) {
                closeModal();
            }
            return;
        }

        if (!isOpen) return;

        if (e.key === 'ArrowLeft') prevPhoto();
        if (e.key === 'ArrowRight') nextPhoto();
        if (e.key === '+' || e.key === '=') zoomPhotoIn();
        if (e.key === '-' || e.key === '_') zoomPhotoOut();
        if (e.key === '0') zoomPhotoReset();
    });
});

// ========== ЭКСПОРТ ==========
window.debounce = debounce;
window.parseDate = parseDate;
window.formatDate = formatDate;
window.formatDateForDisplay = formatDateForDisplay;
window.calculateExpiry = calculateExpiry;
window.splitUrls = splitUrls;
window.loadImage = loadImage;
window.getVUStatus = getVUStatus;
window.fitText = fitText;
window.openPhotoGallery = openPhotoGallery;
window.closeModal = closeModal;
window.prevPhoto = prevPhoto;
window.nextPhoto = nextPhoto;
window.zoomPhotoIn = zoomPhotoIn;
window.zoomPhotoOut = zoomPhotoOut;
window.zoomPhotoReset = zoomPhotoReset;