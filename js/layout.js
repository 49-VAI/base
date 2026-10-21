const LAYOUT_VERSION = '3';

async function loadPartial(url) {
    const res = await fetch(`${url}?v=${LAYOUT_VERSION}`);
    if (!res.ok) throw new Error(`Не удалось загрузить ${url}`);
    const buffer = await res.arrayBuffer();
    return new TextDecoder('utf-8').decode(buffer);
}

function highlightActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#eisNavMenu .eis-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === current);
    });
}

// ? Каждый partial вставляется СРАЗУ как только пришёл — не ждём остальные
async function injectLayout() {
    const headerMount = document.getElementById('site-header');
    const navMount = document.getElementById('site-nav');
    const footerMount = document.getElementById('site-footer');

    const tasks = [];
    if (headerMount) {
        tasks.push(loadPartial('partials/header.html')
            .then(html => { headerMount.innerHTML = html; })
            .catch(err => console.error('[layout] header:', err)));
    }
    if (navMount) {
        tasks.push(loadPartial('partials/nav.html')
            .then(html => { navMount.innerHTML = html; })
            .catch(err => console.error('[layout] nav:', err)));
    }
    if (footerMount) {
        tasks.push(loadPartial('partials/footer.html')
            .then(html => { footerMount.innerHTML = html; })
            .catch(err => console.error('[layout] footer:', err)));
    }

    await Promise.all(tasks);
    highlightActiveNav();
    document.dispatchEvent(new Event('layout-ready'));
}

// ? Скрипт стоит в конце <body> — точки монтирования уже в DOM.
// Стартуем немедленно, не ждём DOMContentLoaded.
if (document.getElementById('site-header')
    || document.getElementById('site-nav')
    || document.getElementById('site-footer')) {
    injectLayout();
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLayout, { once: true });
} else {
    injectLayout();
}

// -----------------------------------------------------------------
// Бейдж почты — обновляем ТОЛЬКО когда готов и layout, и user.
// Не блокирует ни навигацию, ни что-либо ещё.
// -----------------------------------------------------------------
let __layoutReady = false;
let __userReady = false;

function __tryUpdateMailBadge() {
    if (!__layoutReady || !__userReady) return;
    if (typeof mailboxUpdateNavDot !== 'function') return;

    mailboxUpdateNavDot();

    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'mail.html' && typeof mailboxSubscribeNav === 'function') {
        mailboxSubscribeNav();
    }
}

document.addEventListener('layout-ready', () => {
    __layoutReady = true;
    __tryUpdateMailBadge();
}, { once: true });

document.addEventListener('user-ready', () => {
    __userReady = true;
    __tryUpdateMailBadge();
}, { once: true });

window.injectLayout = injectLayout;
window.highlightActiveNav = highlightActiveNav;