// ================================================================
// КЛИЕНТ КОМАНДОВАНИЯ ВТО — база ВУ + подача заявок на сдачу
// ================================================================

const LOGISTICS_ALLOWED_ROLES = ['logistics_commander', 'chief_vai'];

const LOGISTICS_ROLE_LABELS = {
    'logistics_commander': 'ВТО',
    'chief_vai': 'Начальник ВАИ'
};

const APP_STATUS_LABELS = {
    pending: { text: 'ОЖИДАЕТ', class: 'eis-status-expiring' },
    conducted: { text: 'ПРОВЕДЕНО', class: 'eis-status-info' },
    passed: { text: 'СДАЛ', class: 'eis-status-valid' },
    failed: { text: 'НЕ СДАЛ', class: 'eis-status-expired' },
    cancelled: { text: 'ОТМЕНЕНО', class: 'eis-status-archived' }
};

let logisticsVUData = [];
let logisticsFiltered = [];
let logisticsProfile = null;
let myApplications = [];
let archiveRequestsCache = {}; // vu_id -> { id, status }

// ---------- УТИЛИТЫ ----------
function escapeHtmlLog(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function shortNameLog(fullName) {
    if (!fullName) return '';
    const parts = String(fullName).trim().split(/\s+/);
    if (!parts.length) return '';
    const last = parts[0];
    const ini = [];
    if (parts[1]) ini.push(parts[1][0].toUpperCase() + '.');
    if (parts[2]) ini.push(parts[2][0].toUpperCase() + '.');
    return ini.length ? `${last} ${ini.join('')}` : last;
}

function formatDateLog(str) {
    if (!str) return '';
    const p = String(str).slice(0, 10).split('-');
    if (p.length !== 3) return str;
    return `${p[2]}.${p[1]}.${p[0]}`;
}

function formatDateTimeLog(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return iso; }
}

function getVUStatusLog(expiryDate) {
    if (!expiryDate) return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'eis-status-expired', days: null };
    const d = new Date(expiryDate + 'T00:00:00');
    if (isNaN(d.getTime())) return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'eis-status-expired', days: null };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d - today) / 86400000);
    if (diff < 0) return { status: 'expired', text: 'ПРОСРОЧЕНО', class: 'eis-status-expired', days: diff };
    if (diff <= 7) return { status: 'expiring', text: 'ИСТЕКАЕТ', class: 'eis-status-expiring', days: diff };
    return { status: 'valid', text: 'ДЕЙСТВИТЕЛЬНО', class: 'eis-status-valid', days: diff };
}

function formatDaysLeft(days) {
    if (days === null) return '';
    if (days < 0) return `просрочено ${Math.abs(days)} дн.`;
    if (days === 0) return 'истекает сегодня';
    return `${days} дн.`;
}

function renderAppStatusBadge(status) {
    const s = APP_STATUS_LABELS[status] || APP_STATUS_LABELS.pending;
    return `<span class="eis-vu-status ${s.class}">${s.text}</span>`;
}

function displayCurrentUser() {
    const p = window.currentProfile;
    if (!p) return 'Неизвестно';
    return [p.rank, shortNameLog(p.full_name || '')].filter(Boolean).join(' ').trim()
        || p.username || 'Неизвестно';
}

async function loadArchiveRequestsForVU() {
    try {
        const { data } = await supabaseClient
            .from('archive_requests')
            .select('id, vu_id, status')
            .in('status', ['pending']);

        archiveRequestsCache = {};
        (data || []).forEach(r => { archiveRequestsCache[r.vu_id] = r; });
    } catch (e) {
        console.warn('[logistics] loadArchiveRequestsForVU:', e);
    }
}

function getSelectedCategories() {
    const list = [];
    document.querySelectorAll('.va-cat:checked').forEach(cb => list.push(cb.value));
    return list;
}

// ================================================================
// ИНИЦИАЛИЗАЦИЯ
// ================================================================
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
    window.currentProfile = profile;
    window.currentUser = session.user;

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
    document.getElementById('userName').textContent =
        [profile.rank, shortNameLog(profile.full_name)].filter(Boolean).join(' ') ||
        profile.username || '—';

    document.getElementById('deniedMessage').textContent =
        `Учётная запись «${profile.username}» не имеет доступа к базе ВУ для командования ВТО.`;
}

async function showDatabase() {
    document.getElementById('loginBlock').style.display = 'none';
    document.getElementById('accessDeniedBlock').style.display = 'none';
    document.getElementById('dbBlock').style.display = '';
    document.getElementById('userBlock').style.display = '';

    document.getElementById('userRole').textContent =
        logisticsProfile.position || LOGISTICS_ROLE_LABELS[logisticsProfile.role] || 'Пользователь';

    document.getElementById('userName').textContent =
        [logisticsProfile.rank, shortNameLog(logisticsProfile.full_name)].filter(Boolean).join(' ') ||
        logisticsProfile.username || '—';

    await loadVUData();
    await loadMyApplications();
    switchLogisticsTab('db');
}

// ================================================================
// ВКЛАДКИ
// ================================================================
function switchLogisticsTab(tab) {
    document.querySelectorAll('.eis-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.eis-tab-content').forEach(c => {
        c.classList.toggle('active', c.id === 'log-tab-' + tab);
    });
    if (tab === 'applications') loadMyApplications();
}

// ================================================================
// БАЗА ВУ
// ================================================================
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
        await loadArchiveRequestsForVU();   // ← новая строка
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
        if (status !== 'all' && getVUStatusLog(row.expiry_date).status !== status) return false;
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

    if (!logisticsFiltered.length) {
        container.innerHTML = `<div class="eis-no-results" style="padding:40px;">
            <div style="font-size:32px;margin-bottom:12px;">📭</div>
            <div style="font-weight:700;">Записей не найдено</div>
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

        // ★ Кнопка запроса на архив
        const req = archiveRequestsCache[row.id];
        let archiveBtn = '';
        if (req && req.status === 'pending') {
            archiveBtn = `<span class="eis-vu-status eis-status-expiring"
                            style="font-size:10px; padding:3px 8px;"
                            title="Запрос отправлен, ожидает решения ВАИ">
                        ЗАПРОШЕН АРХИВ
                     </span>`;
        } else {
            archiveBtn = `<button class="eis-btn eis-btn-sm eis-btn-secondary"
                              data-action="request-archive"
                              data-id="${row.id}"
                              data-number="${escapeHtmlLog(row.vu_number || '')}">
                        Запросить архив
                     </button>`;
        }

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
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
            ${photoBtn}
            ${archiveBtn}
        </td>
    </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ================================================================
// ЗАЯВКИ — загрузка
// ================================================================
async function loadMyApplications() {
    const container = document.getElementById('myAppsList');
    if (!container) return;
    container.innerHTML = `<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка...</span></div>`;

    try {
        const { data, error } = await supabaseClient
            .from('vu_applications')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        myApplications = data || [];
        renderMyApplications();
    } catch (e) {
        container.innerHTML = `<div class="eis-no-results" style="padding:40px;">
            <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
            <div style="font-weight:700;">Ошибка загрузки заявок</div>
            <div style="font-size:13px;color:#888;margin-top:6px;">${escapeHtmlLog(e.message)}</div>
        </div>`;
    }
}

function renderMyApplications() {
    const container = document.getElementById('myAppsList');
    const countEl = document.getElementById('myAppsCount');
    if (!container) return;

    if (countEl) countEl.textContent = `ЗАПИСЕЙ: ${myApplications.length}`;

    if (!myApplications.length) {
        container.innerHTML = `<div class="eis-no-results">
            <div style="font-size:32px;margin-bottom:12px;opacity:.5;">📭</div>
            <div style="font-weight:700;">Заявок пока нет</div>
        </div>`;
        return;
    }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>Дата</th><th>ФИО</th><th>Звание</th><th>Категории</th><th>Подал</th><th>Статус</th><th>Примечание ВАИ</th><th></th>';
    html += '</tr></thead><tbody>';

    myApplications.forEach(a => {
        const fio = [a.last_name, a.first_name, a.middle_name].filter(Boolean).join(' ') || '—';
        const date = a.created_at ? new Date(a.created_at).toLocaleDateString('ru-RU') : '—';
        const note = a.status_notes
            ? (a.status_notes.length > 40 ? a.status_notes.slice(0, 40) + '…' : a.status_notes)
            : '—';
        const cats = (a.open_categories || '').split(',').filter(Boolean).join(', ') || '—';
        const canCancel = a.status === 'pending' && a.created_by === window.currentProfile?.id;

        html += `<tr>
            <td data-label="Дата">${date}</td>
            <td data-label="ФИО"><strong>${escapeHtmlLog(fio)}</strong></td>
            <td data-label="Звание">${escapeHtmlLog(a.rank || '—')}</td>
            <td data-label="Категории">${escapeHtmlLog(cats)}</td>
            <td data-label="Подал">${escapeHtmlLog(a.submitted_by_name || '—')}</td>
            <td data-label="Статус">${renderAppStatusBadge(a.status)}</td>
            <td data-label="Примечание">${escapeHtmlLog(note)}</td>
            <td style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="eis-btn eis-btn-sm eis-btn-secondary" data-action="detail" data-id="${a.id}">Детали</button>
                ${canCancel ? `<button class="eis-btn eis-btn-sm eis-btn-danger" data-action="cancel" data-id="${a.id}">Отменить</button>` : ''}
            </td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ================================================================
// ЗАЯВКИ — подача
// ================================================================
async function submitVUApplication() {
    const val = id => document.getElementById(id)?.value.trim() || '';

    const lastName = val('vaLastName');
    const firstName = val('vaFirstName');
    if (!lastName) { showToast('Укажите фамилию', 'warning'); return; }
    if (!firstName) { showToast('Укажите имя', 'warning'); return; }

    const cats = getSelectedCategories();
    if (!cats.length) { showToast('Выберите хотя бы одну категорию', 'warning'); return; }

    // Дубль по ФИО + pending
    try {
        const { data: dup } = await supabaseClient
            .from('vu_applications')
            .select('id')
            .eq('last_name', lastName).eq('first_name', firstName)
            .eq('status', 'pending').maybeSingle();
        if (dup) { showToast(`Заявка на «${lastName} ${firstName}» уже ожидает`, 'warning'); return; }
    } catch (e) { console.warn(e); }

    const payload = {
        last_name: lastName,
        first_name: firstName,
        middle_name: val('vaMiddleName') || null,
        rank: val('vaRank') || null,
        open_categories: cats.join(','),
        vu_number: val('vaVUNumber') || null, 
        unit: val('vaUnit') || null,
        service_type: val('vaServiceType') || 'srochnaya',
        notes: val('vaNotes') || null,
        status: 'pending',
        created_by: window.currentUser?.id || null,
        submitted_by_name: displayCurrentUser()
    };

    const { error } = await supabaseClient.from('vu_applications').insert(payload);
    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    document.getElementById('vuAppForm').reset();
    // Возвращаем C по умолчанию
    const cCb = document.querySelector('.va-cat[value="C"]');
    if (cCb) cCb.checked = true;

    showToast('Заявка подана', 'success');
    await loadMyApplications();
}

// ================================================================
// ЗАЯВКИ — детали (ВТО видит «Подал», НЕ видит «Кто изменил»)
// ================================================================
function openLogAppDetail(id) {
    const app = myApplications.find(a => a.id === id);
    if (!app) { showToast('Заявка не найдена', 'error'); return; }

    const fio = [app.last_name, app.first_name, app.middle_name].filter(Boolean).join(' ') || '—';
    document.getElementById('logAppDetailTitle').textContent = 'Заявка — ' + fio;
    document.getElementById('logAppDetailSubtitle').textContent =
        app.created_at ? 'от ' + formatDateTimeLog(app.created_at) : '';
    document.getElementById('logAppDetailBadge').innerHTML = renderAppStatusBadge(app.status);

    const cats = (app.open_categories || '').split(',').filter(Boolean).join(', ') || '—';
    const fields = [
        ['ФИО', fio],
        ['Звание', app.rank || '—'],
        ['Открытые категории', cats],
        ['Серия и номер ВУ', app.vu_number || '—'],  
        ['Подразделение', app.unit || '—'],
        ['Вид службы', app.service_type === 'srochnaya' ? 'Срочная'
            : app.service_type === 'kontraktnaya' ? 'Контрактная' : '—'],
        ['Ваш комментарий', app.notes || '—'],
        ['Подал заявку', app.submitted_by_name || '—'],
        ['Примечание ВАИ', app.status_notes || '—']
    ];

    document.getElementById('logAppDetailFields').innerHTML = fields.map(([l, v]) => `
        <div class="eis-data-field" style="border-bottom:1px dashed #e0e4e8; padding:8px 0;">
            <div class="eis-data-label">${escapeHtmlLog(l)}</div>
            <div class="eis-data-value">${escapeHtmlLog(v)}</div>
        </div>
    `).join('');

    document.getElementById('logAppDetailModal').style.display = 'flex';
}

function closeLogAppDetail() {
    document.getElementById('logAppDetailModal').style.display = 'none';
}

// ================================================================
// ЗАЯВКИ — отмена
// ================================================================
async function cancelMyApplication(id) {
    const app = myApplications.find(a => a.id === id);
    if (!app) return;
    if (app.created_by !== window.currentProfile?.id) { showToast('Можно отменить только свою заявку', 'warning'); return; }
    if (app.status !== 'pending') { showToast('Отменить можно только заявку в статусе «Ожидает»', 'warning'); return; }

    const ok = await showConfirm({
        title: 'Отмена заявки',
        message: `Отменить заявку ${app.last_name} ${app.first_name}?`,
        confirmText: 'Отменить', type: 'danger'
    });
    if (!ok) return;

    const { error } = await supabaseClient.from('vu_applications').delete().eq('id', id);
    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    showToast('Заявка отменена', 'success');
    await loadMyApplications();
}

// ================================================================
// ФОТО
// ================================================================
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

// ================================================================
// АВТОРИЗАЦИЯ
// ================================================================
async function doLogin(username, password) {
    if (!username || !password) return { success: false, error: 'Введите логин и пароль' };
    const email = `${username.trim().toLowerCase()}@eis.local`;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };

    const { data: profile } = await supabaseClient
        .from('profiles').select('role').eq('id', data.user.id).single();
    if (!profile || !LOGISTICS_ALLOWED_ROLES.includes(profile.role)) {
        await supabaseClient.auth.signOut();
        return { success: false, error: 'У вашей учётной записи нет доступа к этому разделу' };
    }
    return { success: true };
}

async function requestArchive(vuId, vuNumber) {
    if (archiveRequestsCache[vuId]) {
        showToast('Запрос на архивирование уже отправлен', 'warning');
        return;
    }

    const row = logisticsVUData.find(r => r.id === vuId);
    const fio = row
        ? [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' ')
        : '';

    const ok = await showConfirm({
        title: 'Запрос на архивирование',
        message: `Отправить в ВАИ запрос на архивирование ВУ ${vuNumber || ''}${fio ? ' (' + fio + ')' : ''}?`,
        confirmText: 'Отправить', type: 'default'
    });
    if (!ok) return;

    const { data, error } = await supabaseClient
        .from('archive_requests')
        .insert({
            vu_id: vuId,
            vu_number: vuNumber || null,
            fio: fio || null,
            status: 'pending',
            requested_by: window.currentUser?.id || null,
            requested_by_name: displayCurrentUser()
        })
        .select()
        .single();

    if (error) {
        showToast('Ошибка: ' + error.message, 'error');
        return;
    }

    archiveRequestsCache[vuId] = { id: data.id, status: 'pending' };
    renderTable();
    showToast('Запрос отправлен в ВАИ', 'success');
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

// ================================================================
// СТАРТ
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            btn.disabled = true; btn.textContent = 'Вход...'; errEl.textContent = '';

            const u = document.getElementById('loginUsername').value.trim();
            const p = document.getElementById('loginPassword').value;
            const r = await doLogin(u, p);

            if (r.success) await initLogistics();
            else {
                errEl.textContent = translateAuthErrorLog(r.error);
                btn.disabled = false; btn.textContent = 'Войти';
            }
        });
    }

    ['searchInput', 'statusFilter', 'sortSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(id === 'searchInput' ? 'input' : 'change', applyFilters);
    });

    const appsList = document.getElementById('myAppsList');
    if (appsList) {
        appsList.addEventListener('click', (e) => {
            const b = e.target.closest('[data-action]');
            if (!b) return;
            if (b.dataset.action === 'detail') openLogAppDetail(b.dataset.id);
            else if (b.dataset.action === 'cancel') cancelMyApplication(b.dataset.id);
        });
    }

    const modal = document.getElementById('logAppDetailModal');
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeLogAppDetail(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeLogAppDetail(); closePhoto(); }
    });

    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="request-archive"]');
            if (btn) {
                requestArchive(btn.dataset.id, btn.dataset.number || '');
            }
        });
    }

    initLogistics();
});

window.doLogout = doLogout;
window.setStatusFilter = setStatusFilter;
window.openPhotoFromBtn = openPhotoFromBtn;
window.closePhoto = closePhoto;
window.switchLogisticsTab = switchLogisticsTab;
window.loadMyApplications = loadMyApplications;
window.submitVUApplication = submitVUApplication;
window.openLogAppDetail = openLogAppDetail;
window.requestArchive = requestArchive;
window.loadArchiveRequestsForVU = loadArchiveRequestsForVU;
window.closeLogAppDetail = closeLogAppDetail;
window.cancelMyApplication = cancelMyApplication;