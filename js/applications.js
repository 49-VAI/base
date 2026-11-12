// ================================================================
// ЗАЯВКИ НА СДАЧУ ВУ — СТОРОНА ВАИ
// ВАИ видит «Кто изменил», НЕ видит «Подал»
// ================================================================

const APP_STATUS_LABELS = {
    pending: { text: 'ОЖИДАЕТ', class: 'eis-status-expiring' },
    conducted: { text: 'ПРОВЕДЕНО', class: 'eis-status-info' },
    passed: { text: 'СДАЛ', class: 'eis-status-valid' },
    failed: { text: 'НЕ СДАЛ', class: 'eis-status-expired' },
    cancelled: { text: 'ОТМЕНЕНО', class: 'eis-status-archived' }
};

let applicationsCache = [];
let applicationsFiltered = [];
let currentApplication = null;

function escapeHtmlApp(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderAppStatusBadge(status) {
    const s = APP_STATUS_LABELS[status] || APP_STATUS_LABELS.pending;
    return `<span class="eis-vu-status ${s.class}">${s.text}</span>`;
}

function canChangeApplicationStatus() {
    return ['inspector_odps', 'inspector_reo', 'chief_odps', 'chief_reo', 'chief_cuipp', 'chief_vai']
        .includes(window.currentProfile?.role);
}

function canDeleteApplication() {
    return ['chief_odps', 'chief_reo', 'chief_cuipp', 'chief_vai'].includes(window.currentProfile?.role);
}

function shortNameApp(fullName) {
    if (!fullName) return '';
    const parts = String(fullName).trim().split(/\s+/);
    if (!parts.length) return '';
    const last = parts[0];
    const ini = [];
    if (parts[1]) ini.push(parts[1][0].toUpperCase() + '.');
    if (parts[2]) ini.push(parts[2][0].toUpperCase() + '.');
    return ini.length ? `${last} ${ini.join('')}` : last;
}

function displayCurrentUserApp() {
    const p = window.currentProfile;
    if (!p) return 'Неизвестно';
    return [p.rank, shortNameApp(p.full_name)].filter(Boolean).join(' ').trim()
        || p.username || 'Неизвестно';
}

function formatDateTimeApp(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return iso; }
}

// ---------- ЗАГРУЗКА ----------
async function loadApplications() {
    const container = document.getElementById('appResults');
    if (!container) return;
    container.innerHTML = `<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка...</span></div>`;

    const { data, error } = await supabaseClient
        .from('vu_applications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="eis-no-results">Ошибка: ${escapeHtmlApp(error.message)}</div>`;
        return;
    }

    applicationsCache = data || [];
    updateAppStats();
    applyAppFilters();
}

function updateAppStats() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('appStatTotal', applicationsCache.length);
    set('appStatPending', applicationsCache.filter(a => a.status === 'pending').length);
    set('appStatConducted', applicationsCache.filter(a => a.status === 'conducted').length);
    set('appStatPassed', applicationsCache.filter(a => a.status === 'passed').length);
    set('appStatFailed', applicationsCache.filter(a => a.status === 'failed').length);
}

// ---------- ФИЛЬТРЫ ----------
function filterAppsByStatus(status) {
    const el = document.getElementById('appFilterStatus');
    if (el) el.value = status;
    applyAppFilters();
}

function applyAppFilters() {
    const q = (document.getElementById('appSearchQuery')?.value || '').toLowerCase().trim();
    const status = document.getElementById('appFilterStatus')?.value || '';
    const from = document.getElementById('appFilterDateFrom')?.value || '';
    const to = document.getElementById('appFilterDateTo')?.value || '';

    applicationsFiltered = applicationsCache.filter(a => {
        if (status && a.status !== status) return false;
        if (q) {
            const fio = [a.last_name, a.first_name, a.middle_name].filter(Boolean).join(' ');
            const hay = [fio, a.unit, a.rank].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        if (from && a.created_at && a.created_at.slice(0, 10) < from) return false;
        if (to && a.created_at && a.created_at.slice(0, 10) > to) return false;
        return true;
    });

    renderApplicationsTable();
}

function resetAppFilters() {
    document.getElementById('appSearchQuery').value = '';
    document.getElementById('appFilterStatus').value = '';
    document.getElementById('appFilterDateFrom').value = '';
    document.getElementById('appFilterDateTo').value = '';
    applyAppFilters();
}

// ---------- ТАБЛИЦА ----------
function renderApplicationsTable() {
    const container = document.getElementById('appResults');
    const countEl = document.getElementById('appResultsCount');
    if (!container) return;

    if (countEl) countEl.textContent = `ЗАПИСЕЙ: ${applicationsFiltered.length}`;

    if (!applicationsFiltered.length) {
        container.innerHTML = `<div class="eis-no-results">
            <div style="font-size:32px;margin-bottom:12px;opacity:.5;">📭</div>
            <div style="font-weight:700;">Заявок не найдено</div>
        </div>`;
        return;
    }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>Дата</th><th>ФИО</th><th>Звание</th><th>Категории</th><th>Подразделение</th><th>Статус</th><th>Изменил</th><th></th>';
    html += '</tr></thead><tbody>';

    applicationsFiltered.forEach(a => {
        const fio = [a.last_name, a.first_name, a.middle_name].filter(Boolean).join(' ') || '—';
        const date = a.created_at ? new Date(a.created_at).toLocaleDateString('ru-RU') : '—';
        const cats = (a.open_categories || '').split(',').filter(Boolean).join(', ') || '—';

        html += `<tr>
            <td data-label="Дата">${date}</td>
            <td data-label="ФИО"><strong>${escapeHtmlApp(fio)}</strong></td>
            <td data-label="Звание">${escapeHtmlApp(a.rank || '—')}</td>
            <td data-label="Категории">${escapeHtmlApp(cats)}</td>
            <td data-label="Подразделение">${escapeHtmlApp(a.unit || '—')}</td>
            <td data-label="Статус">${renderAppStatusBadge(a.status)}</td>
            <td data-label="Изменил">${escapeHtmlApp(a.status_changed_by_name || '—')}</td>
            <td><button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openAppDetail('${a.id}')">Открыть</button></td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ---------- ДЕТАЛИ ----------
function openAppDetail(id) {
    const app = applicationsCache.find(a => a.id === id);
    if (!app) { showToast('Заявка не найдена', 'error'); return; }
    currentApplication = app;

    const fio = [app.last_name, app.first_name, app.middle_name].filter(Boolean).join(' ') || '—';
    document.getElementById('appDetailTitle').textContent = 'Заявка — ' + fio;
    document.getElementById('appDetailSubtitle').textContent =
        app.created_at ? 'от ' + formatDateTimeApp(app.created_at) : '';
    document.getElementById('appDetailStatusBadge').innerHTML = renderAppStatusBadge(app.status);

    const cats = (app.open_categories || '').split(',').filter(Boolean).join(', ') || '—';
    const fields = [
        ['ФИО', fio],
        ['Звание', app.rank || '—'],
        ['Открытые категории', cats],
        ['Серия и номер ВУ', app.vu_number || '—'],
        ['Подразделение', app.unit || '—'],
        ['Вид службы', app.service_type === 'srochnaya' ? 'Срочная'
            : app.service_type === 'kontraktnaya' ? 'Контрактная' : '—'],
        ['Комментарий ВТО', app.notes || '—'],
        ['Примечание ВАИ', app.status_notes || '—'],
        ['Кто изменил статус', app.status_changed_by_name || '—'],
        ['Статус изменён', app.status_changed_at ? formatDateTimeApp(app.status_changed_at) : '—']
    ];

    document.getElementById('appDetailFields').innerHTML = fields.map(([l, v]) => `
        <div class="eis-data-field" style="border-bottom:1px dashed #e0e4e8; padding:8px 0;">
            <div class="eis-data-label">${escapeHtmlApp(l)}</div>
            <div class="eis-data-value">${escapeHtmlApp(v)}</div>
        </div>
    `).join('');

    document.getElementById('appStatusNotes').value = app.status_notes || '';

    const actions = document.getElementById('appDetailActions');
    actions.style.display = canChangeApplicationStatus() ? '' : 'none';
    document.getElementById('appDeleteBtn').style.display = canDeleteApplication() ? '' : 'none';

    document.getElementById('appDetailModal').style.display = 'flex';
}

function closeAppDetail() {
    document.getElementById('appDetailModal').style.display = 'none';
    currentApplication = null;
}

// ---------- СМЕНА СТАТУСА ----------
async function setApplicationStatus(status) {
    if (!currentApplication) return;
    if (!canChangeApplicationStatus()) { showToast('Нет прав', 'warning'); return; }

    const label = APP_STATUS_LABELS[status]?.text || status;
    const notes = document.getElementById('appStatusNotes').value.trim();

    const ok = await showConfirm({
        title: 'Изменение статуса',
        message: `Установить статус «${label}»?`,
        confirmText: 'Установить', type: 'default'
    });
    if (!ok) return;

    const payload = {
        status,
        status_notes: notes || null,
        status_changed_by: window.currentUser?.id || null,
        status_changed_by_name: displayCurrentUserApp(),
        status_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
        .from('vu_applications').update(payload).eq('id', currentApplication.id);

    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    if (typeof logAction === 'function') {
        await logAction('vu_application_status', 'vu_applications', currentApplication.id, {
            kind: 'update',
            summary: `Изменил статус заявки ${currentApplication.last_name} ${currentApplication.first_name} → ${label}`,
            changes: [{ field: 'status', from: currentApplication.status, to: status }],
            changed_count: 1
        });
    }

    showToast(`Статус изменён на «${label}»`, 'success');
    closeAppDetail();
    await loadApplications();
}

// ---------- УДАЛЕНИЕ ----------
async function deleteApplication() {
    if (!currentApplication) return;
    if (!canDeleteApplication()) { showToast('Нет прав на удаление', 'warning'); return; }

    const fio = [currentApplication.last_name, currentApplication.first_name].filter(Boolean).join(' ');
    const ok = await showConfirm({
        title: 'Удаление заявки',
        message: `Удалить заявку ${fio}?`,
        confirmText: 'Удалить', type: 'danger'
    });
    if (!ok) return;

    const { error } = await supabaseClient
        .from('vu_applications').delete().eq('id', currentApplication.id);
    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    if (typeof logAction === 'function') {
        await logAction('vu_application_delete', 'vu_applications', currentApplication.id, {
            kind: 'delete', summary: `Удалил заявку на ВУ ${fio}`
        });
    }

    showToast('Заявка удалена', 'success');
    closeAppDetail();
    await loadApplications();
}

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('appResults')) return;

    document.addEventListener('user-ready', () => loadApplications(), { once: true });

    ['appSearchQuery', 'appFilterStatus', 'appFilterDateFrom', 'appFilterDateTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', applyAppFilters);
            el.addEventListener('change', applyAppFilters);
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeAppDetail();
    });
});

window.loadApplications = loadApplications;
window.applyAppFilters = applyAppFilters;
window.resetAppFilters = resetAppFilters;
window.filterAppsByStatus = filterAppsByStatus;
window.openAppDetail = openAppDetail;
window.closeAppDetail = closeAppDetail;
window.setApplicationStatus = setApplicationStatus;
window.deleteApplication = deleteApplication;