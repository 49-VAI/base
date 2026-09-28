// ================================================================
// БАЗА ТЕХОСМОТРОВ + РЕЕСТР ТС
// ================================================================

let techDatabase = [];
let techFiltered = [];
let currentDetailId = null;
let currentDetailRow = null;
let vehicleDatabase = [];
let vehicleFiltered = [];
let vehiclesLoaded = false;

function switchTechTab(tab) {
    document.querySelectorAll('.eis-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.eis-tab-content').forEach(c => {
        c.classList.toggle('active', c.id === 'tab-' + tab);
    });
    if (tab === 'vehicles' && !vehiclesLoaded) {
        loadVehiclesFromSupabase();
        vehiclesLoaded = true;
    }
}

// ================================================================
// ЗАГРУЗКА КАРТ ТО
// ================================================================
async function loadTechFromSupabase() {
    const container = document.getElementById('techResults');
    if (!container) return;
    container.innerHTML = `<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка данных...</span></div>`;

    const { data, error } = await supabaseClient
        .from('tech_inspections').select('*')
        .eq('is_current', true).order('valid_until', { ascending: true });

    if (error) { container.innerHTML = `<div class="eis-no-results">Ошибка: ${escapeHtmlTd(error.message)}</div>`; return; }
    techDatabase = data || [];
    updateTechStats();
    applyTechFilters();
}

function updateTechStats() {
    const total = techDatabase.length;
    let valid = 0, expiring = 0, expired = 0, failed = 0;
    techDatabase.forEach(row => {
        const s = getTechStatus(row);
        if (s.status === 'valid') valid++;
        else if (s.status === 'expiring') expiring++;
        else if (s.status === 'expired') expired++;
        if (row.conclusion === 'impossible') failed++;
    });
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setTxt('statTotal', total); setTxt('statValid', valid);
    setTxt('statExpiring', expiring); setTxt('statExpired', expired); setTxt('statFailed', failed);
}

function getTechStatus(row) {
    if (!row.valid_until) return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'eis-status-expired' };
    const date = parseDate(row.valid_until);
    if (!date) return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'eis-status-expired' };
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'expired', text: 'ПРОСРОЧЕНО', class: 'eis-status-expired' };
    if (diffDays <= 7) return { status: 'expiring', text: 'ИСТЕКАЕТ', class: 'eis-status-expiring' };
    return { status: 'valid', text: 'ДЕЙСТВИТЕЛЬНО', class: 'eis-status-valid' };
}

function applyTechFilters() {
    const q = (document.getElementById('techSearchQuery')?.value || '').toLowerCase().trim();
    const from = document.getElementById('techSearchDateFrom')?.value;
    const to = document.getElementById('techSearchDateTo')?.value;
    const conclusion = document.getElementById('techSearchConclusion')?.value || '';

    techFiltered = techDatabase.filter(row => {
        if (q) {
            const hay = [row.card_number, row.plate_number, row.vin, row.vehicle_make_model, row.expert_name]
                .filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        if (from) { const d = parseDate(row.valid_until), f = parseDate(from); if (d && f && d < f) return false; }
        if (to) { const d = parseDate(row.valid_until), t = parseDate(to); if (d && t && d > t) return false; }
        if (conclusion && row.conclusion !== conclusion) return false;
        return true;
    });
    displayTechResults(techFiltered);
}

function resetTechSearch() { document.getElementById('techSearchForm').reset(); applyTechFilters(); }
function filterByStatus(status) {
    techFiltered = status ? techDatabase.filter(r => getTechStatus(r).status === status) : techDatabase;
    displayTechResults(techFiltered);
}
function filterByConclusion(conclusion) {
    techFiltered = techDatabase.filter(r => r.conclusion === conclusion);
    displayTechResults(techFiltered);
}

function displayTechResults(rows) {
    const container = document.getElementById('techResults');
    const countEl = document.getElementById('techResultsCount');
    if (!container) return;
    if (countEl) countEl.textContent = `ЗАПИСЕЙ: ${rows.length}`;
    if (rows.length === 0) { container.innerHTML = '<div class="eis-no-results">Записи не найдены</div>'; return; }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>№ карты</th><th>Гос.номер</th><th>ТС</th><th>До</th><th>Эксперт</th><th>Заключение</th><th>Статус</th><th></th>';
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
        const status = getTechStatus(row);
        const cText = row.conclusion === 'possible' ? 'Возможно' : row.conclusion === 'impossible' ? 'Невозможно' : '—';
        const cColor = row.conclusion === 'impossible' ? 'color:#c62828;font-weight:600' : row.conclusion === 'possible' ? 'color:#28a745' : '';
        html += `<tr>
            <td data-label="№ карты"><strong>${escapeHtmlTd(row.card_number || '')}</strong></td>
            <td data-label="Гос.номер">${escapeHtmlTd(row.plate_number || '—')}</td>
            <td data-label="ТС">${escapeHtmlTd(row.vehicle_make_model || '—')}</td>
            <td data-label="До">${row.valid_until ? formatDate(row.valid_until) : '—'}</td>
            <td data-label="Эксперт">${escapeHtmlTd(row.expert_name || '—')}</td>
            <td data-label="Заключение" style="${cColor}">${cText}</td>
            <td data-label="Статус"><span class="eis-vu-status ${status.class}">${status.text}</span></td>
            <td><button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openTechDetailModal('${row.id}')">Подробнее</button></td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

async function openTechDetailModal(id) {
    let row = techDatabase.find(r => r.id === id);
    if (!row) {
        const { data, error } = await supabaseClient.from('tech_inspections').select('*').eq('id', id).single();
        if (error || !data) { showToast('Запись не найдена', 'error'); return; }
        row = data;
    }
    currentDetailId = id; currentDetailRow = row;
    const status = getTechStatus(row);
    const isOld = row.is_current === false;

    document.getElementById('tdTitle').textContent = 'Диагностическая карта № ' + (row.card_number || '');
    document.getElementById('tdStatus').innerHTML =
        `<span class="eis-vu-status ${status.class}">${status.text}</span>` +
        (isOld ? ' <span style="color:#888;font-size:12px;margin-left:8px;">(старая версия)</span>' : '');
    document.getElementById('tdPhoto').src = row.photo_url || '';

    const fields = [
        ['Гос. номер', row.plate_number], ['Марка, модель', row.vehicle_make_model],
        ['VIN', row.vin], ['Категория', row.category], ['Год выпуска', row.year],
        ['СТС', [row.sts_series, row.sts_number].filter(Boolean).join(' ')],
        ['СТС выдан кем', row.sts_issued_by],
        ['СТС выдан когда', row.sts_issued_date ? formatDate(row.sts_issued_date) : ''],
        ['Тип проверки', row.check_type === 'primary' ? 'Первичная' : row.check_type === 'secondary' ? 'Вторичная' : ''],
        ['Действительно до', row.valid_until ? formatDate(row.valid_until) : ''],
        ['Эксперт', row.expert_name],
        ['Дата осмотра', row.expert_date ? formatDate(row.expert_date) : ''],
        ['Заключение', row.conclusion === 'possible' ? 'Возможно' : row.conclusion === 'impossible' ? 'Невозможно' : ''],
        ['Пункты', summarizeItems(row.items_states)]
    ];

    const fieldsHtml = fields.filter(f => f[1] !== null && f[1] !== undefined && f[1] !== '' && f[1] !== 0)
        .map(([label, val]) => `
            <div class="eis-data-field">
                <div class="eis-data-label">${escapeHtmlTd(label)}</div>
                <div class="eis-data-value">${escapeHtmlTd(String(val))}</div>
            </div>`).join('');

    const versionsHtml = await buildVersionHistoryHtml(row.id);
    document.getElementById('tdFields').innerHTML = fieldsHtml + versionsHtml;

    document.getElementById('tdDownloadBtn').onclick = () => downloadTechPhoto(row);
    document.getElementById('tdRecheckBtn').onclick = () => window.location.href = 'tech.html?clone=' + row.id;
    document.getElementById('tdEditBtn').onclick = () => window.location.href = 'tech.html?edit=' + row.id;
    document.getElementById('tdDeleteBtn').onclick = () => deleteTechFromDB(row);

    document.getElementById('techDetailModal').style.display = 'flex';
}

async function buildVersionHistoryHtml(currentId) {
    const chain = []; const visited = new Set();
    let walkId = currentId;
    while (walkId && !visited.has(walkId)) {
        visited.add(walkId);
        const { data } = await supabaseClient.from('tech_inspections')
            .select('id, card_number, valid_until, expert_name, created_at, photo_url, previous_id, is_current')
            .eq('id', walkId).single();
        if (!data) break;
        chain.push(data); walkId = data.previous_id;
    }
    let foundNewer = true;
    while (foundNewer) {
        foundNewer = false;
        const ids = chain.map(c => c.id);
        const { data: newer } = await supabaseClient.from('tech_inspections')
            .select('id, card_number, valid_until, expert_name, created_at, photo_url, previous_id, is_current')
            .in('previous_id', ids);
        if (newer && newer.length > 0) {
            for (const n of newer) if (!visited.has(n.id)) { visited.add(n.id); chain.push(n); foundNewer = true; }
        }
    }
    if (chain.length <= 1) return '';
    chain.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const items = chain.map(v => {
        const isCurrent = v.id === currentId;
        return `<div class="eis-tech-version-item ${isCurrent ? 'is-current' : ''}">
            <div>
                <strong>№ ${escapeHtmlTd(v.card_number || '')}</strong>
                <span style="color:#888;font-size:12px;"> · ${v.valid_until ? formatDate(v.valid_until) : '—'}</span>
                ${isCurrent ? '<span style="color:#1e7e34;font-weight:600;font-size:11px;"> (текущая)</span>' : ''}
            </div>
            <div style="display:flex;gap:6px;">
                ${v.photo_url ? `<button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="viewVersionPhoto('${v.id}')">Фото</button>` : ''}
                ${!isCurrent ? `<button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openTechDetailModal('${v.id}')">Открыть</button>` : ''}
            </div>
        </div>`;
    }).join('');

    return `<div class="eis-tech-versions">
        <div class="eis-audit-detail-title" style="margin-top:20px;">История версий (${chain.length})</div>
        ${items}
    </div>`;
}

async function viewVersionPhoto(id) {
    const { data } = await supabaseClient.from('tech_inspections').select('photo_url').eq('id', id).single();
    if (data?.photo_url) openPhotoGallery([data.photo_url], 0);
}

function closeTechDetailModal() {
    document.getElementById('techDetailModal').style.display = 'none';
    currentDetailId = null; currentDetailRow = null;
}

function openTechPhotoFull() {
    if (!currentDetailRow?.photo_url) return;
    openPhotoGallery([currentDetailRow.photo_url], 0);
}

function summarizeItems(states) {
    if (!states) return '—';
    let ok = 0, fail = 0;
    Object.values(states).forEach(s => { if (s === 'ok') ok++; else if (s === 'fail') fail++; });
    return `${ok} ✓ / ${fail} ✕`;
}

function downloadTechPhoto(row) {
    if (!row.photo_url) { showToast('Фото отсутствует', 'warning'); return; }
    const link = document.createElement('a');
    link.href = row.photo_url;
    link.download = `ТО_${row.card_number || 'unknown'}.jpg`;
    link.target = '_blank'; link.click();
}

// ================================================================
// УДАЛЕНИЕ ТО + ВСЕХ ВЕРСИЙ
// ================================================================
async function deleteTechFromDB(row) {
    const chain = await collectVersionChain(row.id);
    if (chain.length === 0) { showToast('Запись не найдена', 'error'); return; }

    const versionsCount = chain.length;
    const msg = versionsCount > 1
        ? `Удалить карту № ${row.card_number} и ВСЕ её версии (${versionsCount} шт.)? Фото будут удалены из хранилища.`
        : `Удалить карту № ${row.card_number} (${row.plate_number || 'без номера'})?`;

    const ok = await showConfirm({
        title: versionsCount > 1 ? 'Удаление ТО со всеми версиями' : 'Удаление ТО',
        message: msg, confirmText: 'Удалить', type: 'danger'
    });
    if (!ok) return;

    // полный снимок главной записи
    const { data: fullRow } = await supabaseClient
        .from('tech_inspections').select('*').eq('id', row.id).single();

    const fileNames = chain.map(v => extractStorageFileName(v.photo_url, 'tech-photos')).filter(Boolean);
    if (fileNames.length > 0) {
        try { await supabaseClient.storage.from('tech-photos').remove(fileNames); }
        catch (e) { console.warn('Не удалось удалить часть фото:', e); }
    }

    const ids = chain.map(v => v.id);
    const { error } = await supabaseClient.from('tech_inspections').delete().in('id', ids);
    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    const summary = versionsCount > 1
        ? `Удалил карту ТО № ${row.card_number} и её ${versionsCount - 1} версию(й) (${row.plate_number || '—'})`
        : `Удалил карту ТО № ${row.card_number} (${row.plate_number || '—'})`;

    await logDelete('tech_delete', 'tech_inspections', row.id, fullRow || row, summary);

    showToast(versionsCount > 1 ? `Удалено: карта + ${versionsCount - 1} версий` : 'Запись удалена', 'success');
    closeTechDetailModal();
    await loadTechFromSupabase();
}

async function collectVersionChain(startId) {
    const chain = []; const visited = new Set();
    let walkId = startId;
    while (walkId && !visited.has(walkId)) {
        visited.add(walkId);
        const { data } = await supabaseClient.from('tech_inspections')
            .select('id, card_number, photo_url, previous_id').eq('id', walkId).single();
        if (!data) break;
        chain.push(data); walkId = data.previous_id;
    }
    let foundNewer = true;
    while (foundNewer) {
        foundNewer = false;
        const ids = chain.map(c => c.id);
        const { data: newer } = await supabaseClient.from('tech_inspections')
            .select('id, card_number, photo_url, previous_id').in('previous_id', ids);
        if (newer && newer.length > 0) {
            for (const n of newer) if (!visited.has(n.id)) { visited.add(n.id); chain.push(n); foundNewer = true; }
        }
    }
    return chain;
}

// ================================================================
// РЕЕСТР ТС
// ================================================================
async function loadVehiclesFromSupabase() {
    const container = document.getElementById('vehicleResults');
    if (!container) return;
    container.innerHTML = `<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка...</span></div>`;

    const { data, error } = await supabaseClient.from('vehicles').select('*').order('plate_number', { ascending: true });
    if (error) { container.innerHTML = `<div class="eis-no-results">Ошибка: ${escapeHtmlTd(error.message)}</div>`; return; }
    vehicleDatabase = data || [];
    applyVehicleFilters();
}

function applyVehicleFilters() {
    const q = (document.getElementById('vehicleSearchQuery')?.value || '').toLowerCase().trim();
    const cat = (document.getElementById('vehicleSearchCategory')?.value || '').toLowerCase().trim();

    vehicleFiltered = vehicleDatabase.filter(v => {
        if (q) {
            const hay = [v.plate_number, v.make_model, v.vin].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        if (cat && (v.category || '').toLowerCase() !== cat) return false;
        return true;
    });
    displayVehicles(vehicleFiltered);
}

function resetVehicleSearch() {
    document.getElementById('vehicleSearchQuery').value = '';
    document.getElementById('vehicleSearchCategory').value = '';
    applyVehicleFilters();
}

function displayVehicles(rows) {
    const container = document.getElementById('vehicleResults');
    const countEl = document.getElementById('vehicleResultsCount');
    if (!container) return;
    if (countEl) countEl.textContent = `ЗАПИСЕЙ: ${rows.length}`;
    if (rows.length === 0) { container.innerHTML = '<div class="eis-no-results">Записи не найдены</div>'; return; }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>Гос.номер</th><th>Марка, модель</th><th>VIN</th><th>Категория</th><th>Год</th><th>Подразделение</th><th></th>';
    html += '</tr></thead><tbody>';

    rows.forEach(v => {
        html += `<tr>
            <td data-label="Гос.номер"><strong>${escapeHtmlTd(v.plate_number || '')}</strong></td>
            <td data-label="Марка">${escapeHtmlTd(v.make_model || '—')}</td>
            <td data-label="VIN">${escapeHtmlTd(v.vin || '—')}</td>
            <td data-label="Категория">${escapeHtmlTd(v.category || '—')}</td>
            <td data-label="Год">${v.year || '—'}</td>
            <td data-label="Подразделение">${escapeHtmlTd(v.owner_unit || '—')}</td>
            <td class="eis-admin-actions">
                <button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openVehicleModal('${v.id}')">Изменить</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function openVehicleModal(id) {
    const modal = document.getElementById('vehicleModal');
    if (!modal) return;
    document.getElementById('vehError').textContent = '';
    document.getElementById('vehDeleteBtn').style.display = 'none';

    if (id) {
        const v = vehicleDatabase.find(x => x.id === id);
        if (!v) { showToast('ТС не найдено', 'error'); return; }
        document.getElementById('vehicleModalTitle').textContent = 'Редактирование ТС';
        document.getElementById('vehId').value = v.id;
        document.getElementById('vehPlate').value = v.plate_number || '';
        document.getElementById('vehMakeModel').value = v.make_model || '';
        document.getElementById('vehVIN').value = v.vin || '';
        document.getElementById('vehCategory').value = v.category || '';
        document.getElementById('vehYear').value = v.year || '';
        document.getElementById('vehSTSSeries').value = v.sts_series || '';
        document.getElementById('vehSTSNumber').value = v.sts_number || '';
        document.getElementById('vehSTSIssuedBy').value = v.sts_issued_by || '';
        document.getElementById('vehSTSIssuedDate').value = v.sts_issued_date ? formatDate(v.sts_issued_date) : '';
        document.getElementById('vehMassWithoutLoad').value = v.mass_without_load || '';
        document.getElementById('vehMaxMass').value = v.max_mass || '';
        document.getElementById('vehEnginePower').value = v.engine_power || '';
        document.getElementById('vehOwnerUnit').value = v.owner_unit || '';
        document.getElementById('vehDeleteBtn').style.display = 'inline-flex';
    } else {
        document.getElementById('vehicleModalTitle').textContent = 'Добавить ТС в реестр';
        document.getElementById('vehId').value = '';
        ['vehPlate', 'vehMakeModel', 'vehVIN', 'vehCategory', 'vehYear', 'vehSTSSeries', 'vehSTSNumber', 'vehSTSIssuedBy', 'vehSTSIssuedDate', 'vehMassWithoutLoad', 'vehMaxMass', 'vehEnginePower', 'vehOwnerUnit']
            .forEach(fid => document.getElementById(fid).value = '');
    }
    modal.style.display = 'flex';
}

function closeVehicleModal() {
    const modal = document.getElementById('vehicleModal');
    if (modal) modal.style.display = 'none';
}

async function saveVehicle() {
    const errEl = document.getElementById('vehError');
    const btn = document.getElementById('vehSaveBtn');
    errEl.textContent = '';

    const id = document.getElementById('vehId').value;
    const plate = document.getElementById('vehPlate').value.trim();
    const make = document.getElementById('vehMakeModel').value.trim();

    if (!plate) { errEl.textContent = 'Укажите гос. номер'; return; }
    if (!make) { errEl.textContent = 'Укажите марку и модель'; return; }

    const toISO = (str) => {
        if (!str) return null;
        const p = str.split('.');
        if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
        return str;
    };

    const yearVal = document.getElementById('vehYear').value.trim();

    const payload = {
        plate_number: plate,
        make_model: make,
        vin: document.getElementById('vehVIN').value.trim() || null,
        category: document.getElementById('vehCategory').value.trim() || null,
        year: yearVal ? parseInt(yearVal.replace(/\D/g, '')) || null : null,
        sts_series: document.getElementById('vehSTSSeries').value.trim() || null,
        sts_number: document.getElementById('vehSTSNumber').value.trim() || null,
        sts_issued_by: document.getElementById('vehSTSIssuedBy').value.trim() || null,
        sts_issued_date: toISO(document.getElementById('vehSTSIssuedDate').value.trim()),
        mass_without_load: document.getElementById('vehMassWithoutLoad').value.trim() || null,
        max_mass: document.getElementById('vehMaxMass').value.trim() || null,
        engine_power: document.getElementById('vehEnginePower').value.trim() || null,
        owner_unit: document.getElementById('vehOwnerUnit').value.trim() || null,
        updated_at: new Date().toISOString()
    };

    btn.disabled = true; btn.textContent = 'Сохранение...';

    // снимок до (только для update)
    let beforeVeh = null;
    if (id) {
        const { data: b } = await supabaseClient.from('vehicles').select('*').eq('id', id).single();
        beforeVeh = b;
    }

    let result;
    if (id) result = await supabaseClient.from('vehicles').update(payload).eq('id', id).select().single();
    else {
        payload.created_by = window.currentUser?.id || null;
        result = await supabaseClient.from('vehicles').insert(payload).select().single();
    }
    btn.disabled = false; btn.textContent = 'Сохранить';

    if (result.error) { errEl.textContent = result.error.message; showToast('Ошибка: ' + result.error.message, 'error'); return; }

    if (id && beforeVeh) {
        await logUpdate('vehicle_update', 'vehicles', result.data.id, beforeVeh, result.data, {
            summary_prefix: `Изменил ТС ${plate}`
        });
    } else {
        await logCreate('vehicle_create', 'vehicles', result.data.id, result.data,
            `Добавил ТС ${plate} — ${make}`);
    }

    showToast(id ? 'ТС обновлено' : 'ТС добавлено в реестр', 'success');
    closeVehicleModal();
    await loadVehiclesFromSupabase();
}

async function deleteVehicleFromModal() {
    const id = document.getElementById('vehId').value;
    if (!id) return;
    const v = vehicleDatabase.find(x => x.id === id);
    if (!v) return;

    const ok = await showConfirm({
        title: 'Удаление ТС',
        message: `Удалить "${v.plate_number} ${v.make_model}" из реестра?`,
        confirmText: 'Удалить', type: 'danger'
    });
    if (!ok) return;

    const { data: fullRow } = await supabaseClient.from('vehicles').select('*').eq('id', id).single();
    const { error } = await supabaseClient.from('vehicles').delete().eq('id', id);
    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    await logDelete('vehicle_delete', 'vehicles', id, fullRow || v,
        `Удалил ТС ${v.plate_number} — ${v.make_model}`);

    showToast('ТС удалено из реестра', 'success');
    closeVehicleModal();
    await loadVehiclesFromSupabase();
}

function escapeHtmlTd(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function extractStorageFileName(url, bucket) {
    if (!url) return null;
    const parts = url.split('/' + bucket + '/');
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
}

document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('techResults')) return;

    document.addEventListener('user-ready', () => {
        loadTechFromSupabase();
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') === 'vehicles') switchTechTab('vehicles');
    }, { once: true });

    ['techSearchQuery', 'techSearchDateFrom', 'techSearchDateTo', 'techSearchConclusion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', applyTechFilters); el.addEventListener('change', applyTechFilters); }
    });

    ['vehicleSearchQuery', 'vehicleSearchCategory'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', applyVehicleFilters); el.addEventListener('change', applyVehicleFilters); }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeTechDetailModal(); closeVehicleModal(); }
    });
});

window.switchTechTab = switchTechTab;
window.loadTechFromSupabase = loadTechFromSupabase;
window.applyTechFilters = applyTechFilters;
window.viewVersionPhoto = viewVersionPhoto;
window.resetTechSearch = resetTechSearch;
window.filterByStatus = filterByStatus;
window.filterByConclusion = filterByConclusion;
window.openTechDetailModal = openTechDetailModal;
window.closeTechDetailModal = closeTechDetailModal;
window.openTechPhotoFull = openTechPhotoFull;
window.collectVersionChain = collectVersionChain;
window.deleteTechFromDB = deleteTechFromDB;
window.loadVehiclesFromSupabase = loadVehiclesFromSupabase;
window.applyVehicleFilters = applyVehicleFilters;
window.resetVehicleSearch = resetVehicleSearch;
window.openVehicleModal = openVehicleModal;
window.closeVehicleModal = closeVehicleModal;
window.saveVehicle = saveVehicle;
window.deleteVehicleFromModal = deleteVehicleFromModal;