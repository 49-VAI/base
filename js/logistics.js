// ================================================================
// КЛИЕНТ КОМАНДОВАНИЯ ВТО — только просмотр базы ВУ
// ================================================================

const LOGISTICS_ALLOWED_ROLES = ['logistics_commander', 'chief_vai'];

const LOGISTICS_ROLE_LABELS = {
    'logistics_commander': 'ВТО',
    'chief_vai': 'Начальник ВАИ'
};

let logisticsVUData = [];
let logisticsFiltered = [];
let logisticsProfile = null;

// ---------- Утилиты ----------
function escapeHtmlLog(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function shortNameLog(fullName) {
    if (!fullName) return '';
    const parts = String(fullName).trim().split(/\s+/);
    if (parts.length === 0) return '';
    const lastName = parts[0];
    const initials = [];
    if (parts[1]) initials.push(parts[1][0].toUpperCase() + '.');
    if (parts[2]) initials.push(parts[2][0].toUpperCase() + '.');
    return initials.length > 0 ? `${lastName} ${initials.join('')}` : lastName;
}

function formatDateLog(str) {
    if (!str) return '';
    const p = String(str).slice(0, 10).split('-');
    if (p.length !== 3) return str;
    return `${p[2]}.${p[1]}.${p[0]}`;
}

function getVUStatusLog(expiryDate) {
    if (!expiryDate) {
        return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'eis-status-expired', days: null };
    }
    const d = new Date(expiryDate + 'T00:00:00');
    if (isNaN(d.getTime())) {
        return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'eis-status-expired', days: null };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', text: 'ПРОСРОЧЕНО', class: 'eis-status-expired', days: diffDays };
    if (diffDays <= 7) return { status: 'expiring', text: 'ИСТЕКАЕТ', class: 'eis-status-expiring', days: diffDays };
    return { status: 'valid', text: 'ДЕЙСТВИТЕЛЬНО', class: 'eis-status-valid', days: diffDays };
}

function formatDaysLeft(days) {
    if (days === null) return '';
    if (days < 0) return `просрочено ${Math.abs(days)} дн.`;
    if (days === 0) return 'истекает сегодня';
    return `${days} дн.`;
}

// ---------- Инициализация ----------
async function initLogistics() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) { showLoginBlock(); return; }

    const { data: profile, error } = await supabaseClient
        .from('profiles').select('*').eq('id', session.user.id).single();

    if (error || !profile) {
        await supabaseClient.auth.signOut();
        showLoginBlock();
        return;
    }

    if (!LOGISTICS_ALLOWED_ROLES.includes(profile.role)) {
        showAccessDenied(profile);
        return;
    }

    logisticsProfile = profile;
    await showDatabase();
}

function showLoginBlock() {
    document.getElementById('loginBlock').style.display = '';
    document.getElementById('accessDeniedBlock').style.display = 'none';
    document.getElementById('dbBlock').style.display = 'none';
    document.getElementById('userBlock').style.display = 'none';
}

function showAccessDenied(profile) {
    document.getElementById('loginBlock').style.display = 'none';
    document.getElementById('accessDeniedBlock').style.display = '';
    document.getElementById('dbBlock').style.display = 'none';

    const userBlock = document.getElementById('userBlock');
    userBlock.style.display = '';
    document.getElementById('userRole').textContent = profile.position || 'Пользователь';
	document.getElementById('userName').textContent = [
		profile.rank,
		shortNameLog(profile.full_name)
	].filter(Boolean).join(' ') || profile.username || '—';

    document.getElementById('deniedMessage').textContent =
        `Учётная запись «${profile.username}» не имеет доступа к базе ВУ для командования ВТО.`;
}

async function showDatabase() {
    document.getElementById('loginBlock').style.display = 'none';
    document.getElementById('accessDeniedBlock').style.display = 'none';
    document.getElementById('dbBlock').style.display = '';

    document.getElementById('userBlock').style.display = '';

    // ★ Должность (с фолбэком на название роли, если должность не указана)
    const positionText = logisticsProfile.position
        || LOGISTICS_ROLE_LABELS[logisticsProfile.role]
        || 'Пользователь';
    document.getElementById('userRole').textContent = positionText;

    // ★ Звание + Фамилия И.О.
    const nameText = [
        logisticsProfile.rank,
        shortNameLog(logisticsProfile.full_name)
    ].filter(Boolean).join(' ');
    document.getElementById('userName').textContent = nameText || logisticsProfile.username || '—';

    await loadVUData();
}

async function loadVUData() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка...</span></div>`;

    try {
        const { data, error } = await supabaseClient
            .from('military_ids')
            .select('id, vu_number, rank, last_name, first_name, middle_name, issue_date, expiry_date, issued_by, photo_url, status')
            .eq('status', 'active')
            .order('expiry_date', { ascending: true });

        if (error) throw new Error(error.message);
        logisticsVUData = data || [];
        updateStats();
        applyFilters();
    } catch (e) {
        container.innerHTML = `<div class="eis-no-results" style="padding:40px;">
            <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
            <div style="font-weight:700;">Ошибка загрузки</div>
            <div style="font-size:13px;color:#888;margin-top:6px;">${escapeHtmlLog(e.message)}</div>
        </div>`;
    }
}

function updateStats() {
    let valid = 0, expiring = 0, expired = 0;
    logisticsVUData.forEach(row => {
        const s = getVUStatusLog(row.expiry_date);
        if (s.status === 'valid') valid++;
        else if (s.status === 'expiring') expiring++;
        else expired++;
    });
    document.getElementById('statTotal').textContent = logisticsVUData.length;
    document.getElementById('statValid').textContent = valid;
    document.getElementById('statExpiring').textContent = expiring;
    document.getElementById('statExpired').textContent = expired;
}

function setStatusFilter(status) {
    document.getElementById('statusFilter').value = status;
    applyFilters();
}

function applyFilters() {
    const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    const status = document.getElementById('statusFilter').value;
    const sort = document.getElementById('sortSelect').value;

    logisticsFiltered = logisticsVUData.filter(row => {
        if (q) {
            const fio = [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' ').toLowerCase();
            const hay = [fio, row.vu_number, row.rank].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        if (status !== 'all') {
            const s = getVUStatusLog(row.expiry_date);
            if (s.status !== status) return false;
        }
        return true;
    });

    logisticsFiltered.sort((a, b) => {
        if (sort === 'fio-asc') {
            const fa = [a.last_name, a.first_name].filter(Boolean).join(' ');
            const fb = [b.last_name, b.first_name].filter(Boolean).join(' ');
            return fa.localeCompare(fb);
        }
        if (sort === 'issue-desc') return (b.issue_date || '').localeCompare(a.issue_date || '');
        if (sort === 'expiry-desc') return (b.expiry_date || '').localeCompare(a.expiry_date || '');
        return (a.expiry_date || '9999').localeCompare(b.expiry_date || '9999');
    });

    renderTable();
}

function renderTable() {
    const container = document.getElementById('resultsContainer');
    const countEl = document.getElementById('resultsCount');

    countEl.textContent = `ЗАПИСЕЙ: ${logisticsFiltered.length}`;

    if (logisticsFiltered.length === 0) {
        container.innerHTML = `<div class="eis-no-results" style="padding:40px;">
            <div style="font-size:32px;margin-bottom:12px;">📭</div>
            <div style="font-weight:700;">Записей не найдено</div>
            <div style="font-size:13px;color:#888;margin-top:6px;">Попробуйте изменить критерии поиска</div>
        </div>`;
        return;
    }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>№ ВУ</th><th>ФИО</th><th>Звание</th><th>Дата выдачи</th><th>Действительно до</th><th>Осталось</th><th></th>';
    html += '</tr></thead><tbody>';

    logisticsFiltered.forEach(row => {
        const fio = [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' ') || '—';
        const status = getVUStatusLog(row.expiry_date);
        const daysText = formatDaysLeft(status.days);

        let daysColor = '#28a745';
        if (status.status === 'expired') daysColor = '#c62828';
        else if (status.status === 'expiring') daysColor = '#f57c00';

        const photoBtn = row.photo_url
            ? `<button class="eis-btn eis-btn-sm eis-btn-secondary"
                       data-photo-url="${escapeHtmlLog(row.photo_url)}"
                       onclick="openPhotoFromBtn(this)">Фото</button>`
            : '';

        html += `<tr>
            <td data-label="№ ВУ"><strong>${escapeHtmlLog(row.vu_number || '—')}</strong></td>
            <td data-label="ФИО">${escapeHtmlLog(fio)}</td>
            <td data-label="Звание">${escapeHtmlLog(row.rank || '—')}</td>
            <td data-label="Выдан">${row.issue_date ? formatDateLog(row.issue_date) : '—'}</td>
            <td data-label="До"><strong>${row.expiry_date ? formatDateLog(row.expiry_date) : '—'}</strong></td>
            <td data-label="Осталось">
                <span class="eis-vu-status ${status.class}" style="margin-right:6px;">${status.text}</span>
                <span style="font-size:12px;color:${daysColor};font-weight:600;">${daysText}</span>
            </td>
            <td>${photoBtn}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function openPhotoFromBtn(btn) {
    const url = btn.dataset.photoUrl;
    if (!url) return;
    document.getElementById('photoImg').src = url;
    document.getElementById('photoModal').style.display = 'block';
}

function closePhoto() {
    document.getElementById('photoModal').style.display = 'none';
    document.getElementById('photoImg').src = '';
}

// ---------- Авторизация ----------
async function doLogin(username, password) {
    if (!username || !password) return { success: false, error: 'Введите логин и пароль' };
    const email = `${username.trim().toLowerCase()}@eis.local`;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };

    // Сразу проверяем роль — иначе пользователь с чужой ролью окажется залогинен
    const { data: profile } = await supabaseClient
        .from('profiles').select('role').eq('id', data.user.id).single();

    if (!profile || !LOGISTICS_ALLOWED_ROLES.includes(profile.role)) {
        await supabaseClient.auth.signOut();
        return { success: false, error: 'У вашей учётной записи нет доступа к этому разделу' };
    }
    return { success: true };
}

async function doLogout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

function translateAuthErrorLog(msg) {
    const map = {
        'Invalid login credentials': 'Неверный логин или пароль',
        'Email not confirmed': 'Email не подтверждён',
        'Too many requests': 'Слишком много попыток. Подождите немного'
    };
    return map[msg] || msg;
}

// ---------- Старт ----------
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.textContent = 'Вход...';
        errEl.textContent = '';

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        const result = await doLogin(username, password);
        if (result.success) {
            await initLogistics();
        } else {
            errEl.textContent = translateAuthErrorLog(result.error);
            btn.disabled = false;
            btn.textContent = 'Войти';
        }
    });

    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('sortSelect').addEventListener('change', applyFilters);

    initLogistics();
});

window.doLogout = doLogout;
window.setStatusFilter = setStatusFilter;
window.openPhotoFromBtn = openPhotoFromBtn;
window.closePhoto = closePhoto;
