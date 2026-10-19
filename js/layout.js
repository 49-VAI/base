// ================================================================
// АВТОПОДСТАНОВКА ШАПКИ, НАВИГАЦИИ И ПОДВАЛА — ЕИС ВАИ
// ================================================================

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

async function injectLayout() {
    const headerMount = document.getElementById('site-header');
    const navMount = document.getElementById('site-nav');
    const footerMount = document.getElementById('site-footer');

    try {
        const [headerHtml, navHtml, footerHtml] = await Promise.all([
            headerMount ? loadPartial('partials/header.html') : Promise.resolve(''),
            navMount ? loadPartial('partials/nav.html') : Promise.resolve(''),
            footerMount ? loadPartial('partials/footer.html') : Promise.resolve('')
        ]);

        if (headerMount) headerMount.innerHTML = headerHtml;
        if (navMount) navMount.innerHTML = navHtml;
        if (footerMount) footerMount.innerHTML = footerHtml;

        highlightActiveNav();

        document.dispatchEvent(new Event('layout-ready'));
    } catch (err) {
        console.error('[layout] Ошибка загрузки partials:', err);
        document.dispatchEvent(new Event('layout-ready'));
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLayout);
} else {
    injectLayout();
}

// ----------------------------------------------------------------
// Красная точка «непрочитанные» в навигации — на всех страницах
// ----------------------------------------------------------------
document.addEventListener('layout-ready', () => {
    document.addEventListener('user-ready', () => {
        if (typeof mailboxUpdateNavDot !== 'function') return;

        mailboxUpdateNavDot();

        // Realtime — только на mail.html, чтобы не держать лишний канал везде
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'mail.html' && typeof mailboxSubscribeNav === 'function') {
            mailboxSubscribeNav();
        }
    }, { once: true });
}, { once: true });

window.injectLayout = injectLayout;
window.highlightActiveNav = highlightActiveNav;