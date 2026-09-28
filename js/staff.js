// ================================================================
// СОСТАВ ПОДРАЗДЕЛЕНИЯ — ЕИС ВАИ
// ================================================================

const CHIEF_ROLES = ['chief_odps', 'chief_reo', 'chief_cuipp', 'chief_vai'];

const STAFF_VEHICLES = [
    { id: '0149mp99', make: 'Skoda Octavia', plate: '0149 MP 99', image: 'images/plates/0149mp99.png' },
    { id: '0267mp99', make: 'Skoda Octavia', plate: '0267 MP 99', image: 'images/plates/0267mp99.png' },
    { id: '0167mp99', make: 'Haval F7', plate: '0167 MP 99', image: 'images/plates/0167mp99.png' },
    { id: '0249mp99', make: 'Haval F7', plate: '0249 MP 99', image: 'images/plates/0249mp99.png' }
];

const DEPARTMENTS = [
    { key: 'command', label: 'Командование', short: 'Командование', color: '#1b5e20' },
    { key: 'odps', label: 'ОДПС — Отдел дорожно-патрульной службы', short: 'ОДПС', color: '#1565c0' },
    { key: 'reo', label: 'РЭО — Регистрационно-экзаменационный отдел', short: 'РЭО', color: '#6a1b9a' },
    { key: 'cuipp', label: 'ЦУиПП', short: 'ЦУиПП', color: '#e65100' },
    { key: 'cadets', label: 'Курсанты', short: 'Курсанты', color: '#455a64' },
    { key: 'other', label: 'Прочие', short: 'Прочие', color: '#757575' }
];

const ROLE_TO_DEPT = {
    'chief_vai': 'command',
    'chief_odps': 'odps',
    'inspector_odps': 'odps',
    'chief_reo': 'reo',
    'inspector_reo': 'reo',
    'chief_cuipp': 'cuipp',
    'cadet': 'cadets'
};

const RANK_IMAGES = {
    'Ефрейтор': 'images/epaulettes/efreytor.png',
    'Мл. сержант': 'images/epaulettes/ml_serzhant.png',
    'Сержант': 'images/epaulettes/serzhant.png',
    'Ст. сержант': 'images/epaulettes/st_serzhant.png',
    'Старшина': 'images/epaulettes/starshina.png',
    'Прапорщик': 'images/epaulettes/praporshchik.png',
    'Ст. прапорщик': 'images/epaulettes/st_praporshchik.png',
    'Лейтенант': 'images/epaulettes/leytenant.png',
    'Ст. лейтенант': 'images/epaulettes/st_leytenant.png',
    'Капитан': 'images/epaulettes/kapitan.png',
    'Майор': 'images/epaulettes/mayor.png',
    'Подполковник': 'images/epaulettes/podpolkovnik.png',
    'Полковник': 'images/epaulettes/polkovnik.png'
};

const RANK_ORDER = [
    'Полковник', 'Подполковник', 'Майор', 'Капитан', 'Ст. лейтенант', 'Лейтенант',
    'Ст. прапорщик', 'Прапорщик', 'Старшина', 'Ст. сержант', 'Сержант', 'Мл. сержант', 'Ефрейтор'
];

let staffList = [];       // только те, кто в составе
let allProfiles = [];     // все профили (для управления составом)
let currentStaff = null;
let pendingPdfFile = null;
let pendingPdfRemove = false;
let manageSelection = {}; // id -> bool (в составе или нет)

function isChief() {
    return CHIEF_ROLES.includes(window.currentProfile?.role);
}

function getInitials(fullName) {
    if (!fullName) return '—';
    const parts = String(fullName).trim().split(/\s+/);
    return parts.slice(0, 2).map(p => (p[0] || '').toUpperCase()).join('');
}

function renderEpauletteImg(rank, cls = '') {
    const src = RANK_IMAGES[rank];
    if (!src) return '';
    return `<img src="${src}" alt="${escapeHtml(rank || '')}"
                 class="eis-epaulette-img ${cls}"
                 onerror="this.style.display='none'">`;
}

function renderPlateImg(vehicleId) {
    const v = STAFF_VEHICLES.find(x => x.id === vehicleId);
    if (!v) return '';
    return `<img src="${v.image}" alt="${v.plate}" class="eis-plate-img"
                 onerror="this.style.display='none'">`;
}

function getVehicle(id) {
    return STAFF_VEHICLES.find(v => v.id === id) || null;
}

function getDept(key) {
    return DEPARTMENTS.find(d => d.key === key) || DEPARTMENTS[DEPARTMENTS.length - 1];
}

// ================================================================
// ЗАГРУЗКА
// ================================================================
async function loadStaff() {
    const container = document.getElementById('staffContainer');
    if (!container) return;

    if (!isChief()) {
        container.innerHTML = `
            <div class="eis-no-results">
                <div style="font-size:32px;margin-bottom:12px;">🔒</div>
                <div style="font-weight:700;">Доступ только для начальства</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="eis-loading">
            <div class="eis-spinner"></div>
            <span>Загрузка состава...</span>
        </div>
    `;

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('in_staff', true);

    if (error) {
        container.innerHTML = `
            <div class="eis-no-results">
                <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
                <div>${escapeHtml(error.message)}</div>
            </div>
        `;
        return;
    }

    staffList = (data || []).map(p => ({
        ...p,
        department: p.department || ROLE_TO_DEPT[p.role] || 'other',
        callsign: p.callsign || '',
        personal_file_url: p.personal_file_url || '',
        personal_file_name: p.personal_file_name || '',
        vehicle_id: p.vehicle_id || '',
        sort_order: p.sort_order || 0
    }));

    renderStaff();
}

// ================================================================
// ОТРИСОВКА
// ================================================================
function renderStaff() {
    const container = document.getElementById('staffContainer');
    if (!container) return;

    if (staffList.length === 0) {
        container.innerHTML = `
            <div class="eis-no-results">
                <div style="font-size:32px;margin-bottom:12px;">👥</div>
                <div style="font-weight:700;margin-bottom:6px;">Состав пуст</div>
                <div style="font-size:13px;color:#888;">
                    Нажмите «Управление составом», чтобы добавить сотрудников
                </div>
            </div>
        `;
        return;
    }

    // Группировка по отделам
    const grouped = {};
    DEPARTMENTS.forEach(d => grouped[d.key] = []);
    staffList.forEach(s => {
        const key = grouped[s.department] ? s.department : 'other';
        grouped[key].push(s);
    });

    // Сортировка: sort_order → rank → имя
    Object.values(grouped).forEach(arr => {
        arr.sort((a, b) => {
            const ao = a.sort_order || 9999;
            const bo = b.sort_order || 9999;
            if (ao !== bo) return ao - bo;
            const ra = RANK_ORDER.indexOf(a.rank);
            const rb = RANK_ORDER.indexOf(b.rank);
            if (ra !== rb) return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb);
            return (a.full_name || '').localeCompare(b.full_name || '');
        });
    });

    let html = '';

    DEPARTMENTS.forEach(dept => {
        const list = grouped[dept.key];
        if (!list || list.length === 0) return;

        html += `
            <div class="eis-staff-dept">
                <div class="eis-staff-dept-head">
                    <span class="eis-staff-dept-bar" style="background:${dept.color}"></span>
                    <span class="eis-staff-dept-title">${escapeHtml(dept.short)}</span>
                    <span class="eis-staff-dept-count">${list.length}</span>
                </div>
                <div class="eis-staff-list">
                    ${list.map((p, i) => renderStaffRow(p, i, list.length, dept)).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderStaffRow(person, index, total, dept) {
    const initials = getInitials(person.full_name);
    const fio = person.full_name || person.username || '—';
    const rank = person.rank || '';
    const position = person.position || ROLE_LABELS[person.role] || person.role || '';
    const vehicle = getVehicle(person.vehicle_id);
    const isMe = person.id === window.currentUser?.id;
    const hasPdf = !!person.personal_file_url;

    return `
        <div class="eis-staff-row ${isMe ? 'is-me' : ''}" data-id="${person.id}">
            <div class="eis-staff-row-bar" style="background:${dept.color}"></div>

            <div class="eis-staff-row-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            </div>

            <div class="eis-staff-row-info">
                <div class="eis-staff-row-name">
                    ${escapeHtml(fio)}
                    ${isMe ? '<span class="eis-staff-row-me">вы</span>' : ''}
                </div>
                ${rank ? `<div class="eis-staff-row-rank">${escapeHtml(rank)}</div>` : ''}
                <div class="eis-staff-row-pos">${escapeHtml(position)}</div>
            </div>

            <div class="eis-staff-row-epaulette">
                ${renderEpauletteImg(rank)}
            </div>

            <div class="eis-staff-row-extra">
                ${person.callsign ? `
                    <div class="eis-staff-row-callsign">
                        <span class="eis-staff-row-callsign-label">Позывной</span>
                        <span class="eis-staff-row-callsign-value">«${escapeHtml(person.callsign)}»</span>
                    </div>
                ` : `<div class="eis-staff-row-callsign is-empty">Без позывного</div>`}

                ${vehicle ? `
                    <div class="eis-staff-row-vehicle">
                        <div class="eis-staff-row-vehicle-make">${escapeHtml(vehicle.make)}</div>
                        <div class="eis-staff-row-vehicle-plate">${renderPlateImg(person.vehicle_id)}</div>
                    </div>
                ` : `<div class="eis-staff-row-vehicle is-empty">Техника не закреплена</div>`}
            </div>

            <div class="eis-staff-row-actions">
                <div class="eis-staff-row-move">
                    <button class="eis-staff-move-btn" title="Выше" ${index === 0 ? 'disabled' : ''}
                            onclick="moveStaff('${person.id}', -1)">↑</button>
                    <button class="eis-staff-move-btn" title="Ниже" ${index === total - 1 ? 'disabled' : ''}
                            onclick="moveStaff('${person.id}', 1)">↓</button>
                </div>
                <div class="eis-staff-row-actions-main">
                    ${hasPdf ? `
                        <button class="eis-btn eis-btn-sm eis-btn-secondary"
                                onclick="openStaffPdf('${person.id}')">📄 Дело</button>
                    ` : ''}
                    <button class="eis-btn eis-btn-sm eis-btn-primary"
                            onclick="openStaffModal('${person.id}')">Изменить</button>
                </div>
            </div>
        </div>
    `;
}

// ================================================================
// ПЕРЕМЕЩЕНИЕ
// ================================================================
async function moveStaff(id, delta) {
    const person = staffList.find(p => p.id === id);
    if (!person) return;

    const group = staffList
        .filter(p => p.department === person.department)
        .sort((a, b) => {
            const ao = a.sort_order || 9999;
            const bo = b.sort_order || 9999;
            if (ao !== bo) return ao - bo;
            const ra = RANK_ORDER.indexOf(a.rank);
            const rb = RANK_ORDER.indexOf(b.rank);
            if (ra !== rb) return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb);
            return (a.full_name || '').localeCompare(b.full_name || '');
        });

    const idx = group.findIndex(p => p.id === id);
    const swapIdx = idx + delta;
    if (swapIdx < 0 || swapIdx >= group.length) return;

    // Нормализуем
    group.forEach((p, i) => p.sort_order = (i + 1) * 100);

    const tmp = group[idx].sort_order;
    group[idx].sort_order = group[swapIdx].sort_order;
    group[swapIdx].sort_order = tmp;

    group.forEach(p => {
        const local = staffList.find(x => x.id === p.id);
        if (local) local.sort_order = p.sort_order;
    });

    renderStaff();

    try {
        await Promise.all(group.map(p =>
            supabaseClient.from('profiles').update({ sort_order: p.sort_order }).eq('id', p.id)
        ));
    } catch (e) {
        console.warn('Ошибка сохранения порядка:', e);
    }
}

// ================================================================
// МОДАЛКА РЕДАКТИРОВАНИЯ ЛИЧНОГО ДЕЛА
// ================================================================
function fillVehicleSelect() {
    const sel = document.getElementById('sfVehicle');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Не закреплена —</option>';
    STAFF_VEHICLES.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.make} — ${v.plate}`;
        sel.appendChild(opt);
    });
}

function updateStaffPlatePreview() {
    const sel = document.getElementById('sfVehicle');
    const wrap = document.getElementById('sfPlatePreview');
    if (!sel || !wrap) return;
    wrap.innerHTML = sel.value ? renderPlateImg(sel.value) : '';
}

function openStaffModal(id) {
    const person = staffList.find(p => p.id === id);
    if (!person) { showToast('Сотрудник не найден', 'error'); return; }

    currentStaff = person;
    pendingPdfFile = null;
    pendingPdfRemove = false;

    document.getElementById('sfId').value = person.id;
    document.getElementById('sfAvatar').textContent = getInitials(person.full_name);
    document.getElementById('sfName').textContent = person.full_name || person.username || '—';
    document.getElementById('sfPosition').textContent = person.position || ROLE_LABELS[person.role] || person.role || '';
    document.getElementById('sfRankLine').textContent = person.rank || '—';
    document.getElementById('sfEpaulette').innerHTML = renderEpauletteImg(person.rank);

    document.getElementById('sfCallsign').value = person.callsign || '';
    document.getElementById('sfDepartment').value = person.department || '';
    document.getElementById('sfError').textContent = '';
    document.getElementById('sfPdfInput').value = '';

    renderPdfCurrent();
    fillVehicleSelect();
    document.getElementById('sfVehicle').value = person.vehicle_id || '';
    updateStaffPlatePreview();

    document.getElementById('staffModal').style.display = 'flex';
}

function renderPdfCurrent() {
    const wrap = document.getElementById('sfPdfCurrent');
    if (!wrap) return;

    if (pendingPdfRemove) {
        wrap.innerHTML = '<div class="eis-staff-pdf-empty">Файл будет удалён при сохранении</div>';
        return;
    }
    if (pendingPdfFile) {
        wrap.innerHTML = `
            <div class="eis-staff-pdf-current-file">
                <span>📄 ${escapeHtml(pendingPdfFile.name)}</span>
                <button type="button" class="eis-staff-pdf-remove" onclick="cancelPendingPdf()">×</button>
            </div>`;
        return;
    }
    if (currentStaff?.personal_file_url) {
        const name = currentStaff.personal_file_name || 'Личное дело.pdf';
        wrap.innerHTML = `
            <div class="eis-staff-pdf-current-file is-saved">
                <a href="${currentStaff.personal_file_url}" target="_blank" rel="noopener">📄 ${escapeHtml(name)}</a>
                <button type="button" class="eis-staff-pdf-remove" title="Удалить файл"
                        onclick="markPendingPdfRemove()">×</button>
            </div>`;
        return;
    }
    wrap.innerHTML = '<div class="eis-staff-pdf-empty">Файл не загружен</div>';
}

function onStaffPdfSelected(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
        showToast('Только PDF файлы', 'warning');
        input.value = '';
        return;
    }
    if (file.size > 20 * 1024 * 1024) {
        showToast('Файл больше 20 МБ', 'warning');
        input.value = '';
        return;
    }
    pendingPdfFile = file;
    pendingPdfRemove = false;
    renderPdfCurrent();
}

function cancelPendingPdf() {
    pendingPdfFile = null;
    document.getElementById('sfPdfInput').value = '';
    renderPdfCurrent();
}

function markPendingPdfRemove() {
    if (!confirm('Удалить личное дело?')) return;
    pendingPdfRemove = true;
    pendingPdfFile = null;
    document.getElementById('sfPdfInput').value = '';
    renderPdfCurrent();
}

function closeStaffModal() {
    document.getElementById('staffModal').style.display = 'none';
    currentStaff = null;
    pendingPdfFile = null;
    pendingPdfRemove = false;
}

async function saveStaff() {
    if (!currentStaff) return;

    const btn = document.getElementById('sfSaveBtn');
    const errEl = document.getElementById('sfError');
    errEl.textContent = '';

    const callsign = document.getElementById('sfCallsign').value.trim();
    const department = document.getElementById('sfDepartment').value;
    const vehicleId = document.getElementById('sfVehicle').value;

    if (callsign && callsign.length > 30) {
        errEl.textContent = 'Позывной длиннее 30 символов';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    let newFileUrl = currentStaff.personal_file_url || null;
    let newFileName = currentStaff.personal_file_name || null;
    let newFileToDelete = null;

    try {
        if (pendingPdfRemove && currentStaff.personal_file_url) {
            newFileToDelete = extractFileNameFromUrl(currentStaff.personal_file_url);
            newFileUrl = null;
            newFileName = null;
        }

        if (pendingPdfFile) {
            if (currentStaff.personal_file_url) {
                newFileToDelete = extractFileNameFromUrl(currentStaff.personal_file_url);
            }
            const uploaded = await uploadPersonalPdf(pendingPdfFile, currentStaff.id);
            newFileUrl = uploaded.url;
            newFileName = pendingPdfFile.name;
        }

        const { error } = await supabaseClient
            .from('profiles')
            .update({
                callsign: callsign || null,
                department: department || null,
                vehicle_id: vehicleId || null,
                personal_file_url: newFileUrl,
                personal_file_name: newFileName,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentStaff.id);

        if (error) throw error;

        if (newFileToDelete) {
            try { await supabaseClient.storage.from('personal-files').remove([newFileToDelete]); }
            catch (e) { console.warn('Не удалось удалить старый файл:', e); }
        }

        await logAction('staff_update', 'profiles', currentStaff.id, {
            callsign, department, vehicle_id: vehicleId,
            pdf_changed: !!pendingPdfFile || pendingPdfRemove
        });

        const idx = staffList.findIndex(p => p.id === currentStaff.id);
        if (idx !== -1) {
            staffList[idx] = {
                ...staffList[idx],
                callsign, department,
                vehicle_id: vehicleId,
                personal_file_url: newFileUrl,
                personal_file_name: newFileName
            };
        }

        closeStaffModal();
        renderStaff();
        showToast('Личное дело обновлено', 'success');
    } catch (e) {
        console.error(e);
        errEl.textContent = 'Ошибка: ' + e.message;
        showToast('Ошибка: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Сохранить';
    }
}

// ================================================================
// ЗАГРУЗКА PDF
// ================================================================
async function uploadPersonalPdf(file, personId) {
    const safe = String(personId).replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `personal_${safe}_${Date.now()}.pdf`;

    const { error } = await supabaseClient.storage
        .from('personal-files')
        .upload(fileName, file, { contentType: 'application/pdf', upsert: false });

    if (error) throw new Error('Ошибка загрузки PDF: ' + error.message);

    const { data: { publicUrl } } = supabaseClient.storage
        .from('personal-files')
        .getPublicUrl(fileName);

    return { url: publicUrl, fileName };
}

function extractFileNameFromUrl(url) {
    if (!url) return null;
    const parts = url.split('/personal-files/');
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
}

// ================================================================
// ПРОСМОТР PDF
// ================================================================
function openStaffPdf(id) {
    const person = staffList.find(p => p.id === id);
    if (!person || !person.personal_file_url) return;

    document.getElementById('pdfTitle').textContent =
        'Личное дело — ' + (person.full_name || person.username || '');
    document.getElementById('pdfFrame').src = person.personal_file_url;
    document.getElementById('pdfDownloadLink').href = person.personal_file_url;
    document.getElementById('pdfDownloadLink').download =
        person.personal_file_name || `Личное_дело_${person.full_name || id}.pdf`;

    document.getElementById('staffPdfModal').style.display = 'flex';
}

function closeStaffPdfModal() {
    document.getElementById('staffPdfModal').style.display = 'none';
    document.getElementById('pdfFrame').src = 'about:blank';
}

// ================================================================
// УПРАВЛЕНИЕ СОСТАВОМ
// ================================================================
async function openManageStaffModal() {
    document.getElementById('manageStaffSearch').value = '';
    document.getElementById('manageStaffList').innerHTML =
        '<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка...</span></div>';
    document.getElementById('manageStaffModal').style.display = 'flex';

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

    if (error) {
        document.getElementById('manageStaffList').innerHTML =
            `<div class="eis-no-results">Ошибка: ${escapeHtml(error.message)}</div>`;
        return;
    }

    allProfiles = data || [];
    manageSelection = {};
    allProfiles.forEach(p => {
        manageSelection[p.id] = !!p.in_staff;
    });

    renderManageStaffList();
}

function renderManageStaffList() {
    const container = document.getElementById('manageStaffList');
    if (!container) return;

    const q = (document.getElementById('manageStaffSearch')?.value || '').toLowerCase().trim();

    // Группируем по отделам
    const grouped = {};
    DEPARTMENTS.forEach(d => grouped[d.key] = []);

    allProfiles.forEach(p => {
        const dept = p.department || ROLE_TO_DEPT[p.role] || 'other';
        const key = grouped[dept] ? dept : 'other';
        grouped[key].push(p);
    });

    // Фильтрация
    Object.keys(grouped).forEach(k => {
        grouped[k] = grouped[k].filter(p => {
            if (!q) return true;
            const hay = [
                p.full_name, p.username, p.rank, p.position,
                ROLE_LABELS[p.role] || p.role
            ].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        });
    });

    let html = '';
    let totalSelected = 0;

    DEPARTMENTS.forEach(dept => {
        const list = grouped[dept.key];
        if (!list || list.length === 0) return;

        html += `
            <div class="eis-manage-group">
                <div class="eis-manage-group-title" style="border-left-color:${dept.color}">
                    ${escapeHtml(dept.short)}
                    <span class="eis-manage-group-count">${list.length}</span>
                </div>
                ${list.map(p => {
            const checked = manageSelection[p.id];
            if (checked) totalSelected++;
            const initials = getInitials(p.full_name);
            const roleLabel = ROLE_LABELS[p.role] || p.role;
            const fio = p.full_name || p.username || '—';
            return `
                        <label class="eis-manage-row ${checked ? 'is-checked' : ''}" data-id="${p.id}">
                            <input type="checkbox" ${checked ? 'checked' : ''}
                                   onchange="toggleManageSelection('${p.id}', this.checked)">
                            <div class="eis-manage-row-avatar">${escapeHtml(initials)}</div>
                            <div class="eis-manage-row-info">
                                <div class="eis-manage-row-name">${escapeHtml(fio)}</div>
                                <div class="eis-manage-row-sub">
                                    ${p.rank ? escapeHtml(p.rank) + ' · ' : ''}${escapeHtml(roleLabel)}
                                </div>
                            </div>
                        </label>
                    `;
        }).join('')}
            </div>
        `;
    });

    if (!html) {
        html = '<div class="eis-no-results">Никого не найдено</div>';
    }

    container.innerHTML = html;
    document.getElementById('manageStaffCounter').textContent = `Выбрано: ${totalSelected}`;
}

function toggleManageSelection(id, checked) {
    manageSelection[id] = checked;
    // Перерисуем счётчик без полной перерисовки списка
    const total = Object.values(manageSelection).filter(Boolean).length;
    document.getElementById('manageStaffCounter').textContent = `Выбрано: ${total}`;

    // Подсветка строки
    const row = document.querySelector(`.eis-manage-row[data-id="${id}"]`);
    if (row) row.classList.toggle('is-checked', checked);
}

function closeManageStaffModal() {
    document.getElementById('manageStaffModal').style.display = 'none';
}

async function saveManageStaff() {
    const btn = document.getElementById('manageSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    try {
        const updates = [];
        allProfiles.forEach(p => {
            const shouldBe = !!manageSelection[p.id];
            const currently = !!p.in_staff;
            if (shouldBe !== currently) {
                updates.push({ id: p.id, in_staff: shouldBe });
            }
        });

        if (updates.length > 0) {
            // Обновляем по одному (безопаснее, чем .in с разными значениями)
            await Promise.all(updates.map(u =>
                supabaseClient.from('profiles').update({ in_staff: u.in_staff }).eq('id', u.id)
            ));
        }

        await logAction('staff_manage', 'profiles', null, {
            added: updates.filter(u => u.in_staff).length,
            removed: updates.filter(u => !u.in_staff).length
        });

        closeManageStaffModal();
        await loadStaff();
        showToast('Состав обновлён', 'success');
    } catch (e) {
        console.error(e);
        showToast('Ошибка: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Сохранить';
    }
}

// ================================================================
// УТИЛИТЫ
// ================================================================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ================================================================
// ИНИЦИАЛИЗАЦИЯ
// ================================================================
document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('staffContainer')) return;

    document.addEventListener('user-ready', () => {
        if (!isChief()) {
            sessionStorage.setItem('flash_message', 'Недостаточно прав для доступа к разделу «Состав»');
            sessionStorage.setItem('flash_message_type', 'warning');
            window.location.href = 'index.html';
            return;
        }
        loadStaff();
    }, { once: true });

    document.querySelectorAll('#staffModal, #staffPdfModal, #manageStaffModal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target !== m) return;
            if (m.id === 'staffPdfModal') closeStaffPdfModal();
            else if (m.id === 'manageStaffModal') closeManageStaffModal();
            else closeStaffModal();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeStaffModal();
            closeStaffPdfModal();
            closeManageStaffModal();
        }
    });
});

// ================================================================
// ЭКСПОРТ
// ================================================================
window.loadStaff = loadStaff;
window.openStaffModal = openStaffModal;
window.closeStaffModal = closeStaffModal;
window.saveStaff = saveStaff;
window.updateStaffPlatePreview = updateStaffPlatePreview;
window.moveStaff = moveStaff;
window.openStaffPdf = openStaffPdf;
window.closeStaffPdfModal = closeStaffPdfModal;
window.onStaffPdfSelected = onStaffPdfSelected;
window.cancelPendingPdf = cancelPendingPdf;
window.markPendingPdfRemove = markPendingPdfRemove;
window.openManageStaffModal = openManageStaffModal;
window.closeManageStaffModal = closeManageStaffModal;
window.renderManageStaffList = renderManageStaffList;
window.toggleManageSelection = toggleManageSelection;
window.saveManageStaff = saveManageStaff;