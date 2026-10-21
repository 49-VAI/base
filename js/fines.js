// ================================================================
// БАЗА НАРУШЕНИЙ — ЕИС ВАИ (с поддержкой статусов и постановлений)
// ================================================================

let currentFineRow = null;
let finesResults = [];
let finesTotal = 0;
let finesPage = 0;
let finesActiveFilters = {};
let finesSearchActive = false;

const FINES_PAGE_SIZE = 50;

// ========== КТО МОЖЕТ МЕНЯТЬ СТАТУС ==========
function canChangeFineStatus() {
    return ['chief_vai', 'chief_odps'].includes(window.currentProfile?.role);
}

// ========== ПОИСК НА СЕРВЕРЕ ==========
async function searchFinesServer(filters = {}, opts = {}) {
    const page = Math.max(0, parseInt(opts.page, 10) || 0);
    const pageSize = Math.max(1, Math.min(200, parseInt(opts.pageSize, 10) || 50));
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let q = supabaseClient
        .from('protocols')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (filters.fio && filters.fio.trim()) {
        const f = filters.fio.trim().replace(/[,()%_\\]/g, '');
        if (f) {
            q = q.or(
                `violator_last_name.ilike.%${f}%,` +
                `violator_first_name.ilike.%${f}%,` +
                `violator_middle_name.ilike.%${f}%`
            );
        }
    }

    if (filters.license && filters.license.trim()) {
        q = q.ilike('driver_license', `%${filters.license.trim()}%`);
    }
    if (filters.birthDate) q = q.eq('violator_birth_date', filters.birthDate);
    if (filters.plate && filters.plate.trim()) {
        q = q.ilike('vehicle_plate', `%${filters.plate.trim()}%`);
    }
    if (filters.regNumber && filters.regNumber.trim()) {
        q = q.ilike('reg_number', `%${filters.regNumber.trim()}%`);
    }
    if (filters.article && filters.article.trim()) {
        q = q.ilike('article_number', `%${filters.article.trim()}%`);
    }
    if (filters.dateFrom) q = q.gte('protocol_date', filters.dateFrom);
    if (filters.dateTo) q = q.lte('protocol_date', filters.dateTo);

    // ★ Фильтр по статусу
    if (filters.status) q = q.eq('status', filters.status);

    const { data, error, count } = await sbRetry(() => q);

    return { rows: data || [], total: count || 0, page, pageSize, error };
}

async function getFinesStats() {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);

    const [totalRes, monthRes, uniqueRes] = await Promise.all([
        sbRetry(() => supabaseClient
            .from('protocols').select('id', { count: 'exact', head: true })),
        sbRetry(() => supabaseClient
            .from('protocols').select('id', { count: 'exact', head: true })
            .gte('protocol_date', monthAgo)),
        sbRetry(() => supabaseClient.rpc('fines_unique_violators'))
    ]);

    return {
        total: totalRes.count || 0,
        monthly: monthRes.count || 0,
        uniqueViolators: (typeof uniqueRes.data === 'number') ? uniqueRes.data : 0
    };
}

async function loadFineById(id) {
    if (!id) return null;
    const { data, error } = await sbRetry(() =>
        supabaseClient.from('protocols').select('*').eq('id', id).single()
    );
    if (error || !data) return null;
    return data;
}

async function loadFinesFromSupabase() {
    await refreshFinesStats();
    showFinesHint();
}

async function refreshFinesStats() {
    try {
        const stats = await getFinesStats();
        const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setTxt('statTotalProtocols', stats.total);
        setTxt('statUniqueViolators', stats.uniqueViolators);
        setTxt('statMonthProtocols', stats.monthly);
    } catch (e) {
        console.warn('[fines] refreshFinesStats error:', e);
    }
}

function showFinesHint() {
    const container = document.getElementById('finesResults');
    const countEl = document.getElementById('finesResultsCount');
    if (!container) return;

    if (countEl) countEl.textContent = 'ЗАПИСЕЙ: 0';

    container.innerHTML = `
        <div class="eis-no-results">
            <div style="font-weight: 700; margin-bottom: 8px; font-size: 15px;">
                Введите данные и нажмите «Найти»
            </div>
            <div style="font-size: 13px; color: #888; max-width: 520px; margin: 0 auto; line-height: 1.6;">
                Заполните хотя бы одно поле. Список нарушений появится после нажатия кнопки поиска.
            </div>
        </div>
    `;
}

function hasAnySearchCriteria() {
    const ids = [
        'fineSearchFIO', 'fineSearchLicense', 'fineSearchBirthDate',
        'fineSearchPlate', 'fineSearchRegNumber', 'fineSearchArticle',
        'fineSearchDateFrom', 'fineSearchDateTo', 'fineSearchStatus'
    ];
    return ids.some(id => {
        const el = document.getElementById(id);
        return el && el.value.trim() !== '';
    });
}

async function runFinesSearch() {
    if (!hasAnySearchCriteria()) {
        showToast('Заполните хотя бы одно поле для поиска', 'warning');
        showFinesHint();
        return;
    }

    const btn = document.getElementById('fineSearchBtn');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = 'Поиск...'; }

    const filters = collectFinesFilters();

    try {
        const res = await searchFinesServer(filters, { page: 0, pageSize: FINES_PAGE_SIZE });
        if (res.error) throw new Error(res.error.message || 'Ошибка поиска');

        finesActiveFilters = filters;
        finesResults = res.rows;
        finesTotal = res.total;
        finesPage = 0;
        finesSearchActive = true;

        renderFinesTable();
    } catch (e) {
        console.error('[fines search]', e);
        showToast('Ошибка поиска: ' + (e.message || 'неизвестная ошибка'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
    }
}

function collectFinesFilters() {
    return {
        fio: (document.getElementById('fineSearchFIO')?.value || '').trim(),
        license: (document.getElementById('fineSearchLicense')?.value || '').trim(),
        birthDate: document.getElementById('fineSearchBirthDate')?.value || '',
        plate: (document.getElementById('fineSearchPlate')?.value || '').trim(),
        regNumber: (document.getElementById('fineSearchRegNumber')?.value || '').trim(),
        article: (document.getElementById('fineSearchArticle')?.value || '').trim(),
        dateFrom: document.getElementById('fineSearchDateFrom')?.value || '',
        dateTo: document.getElementById('fineSearchDateTo')?.value || '',
        status: document.getElementById('fineSearchStatus')?.value || ''
    };
}

function resetFinesSearch() {
    const f = document.getElementById('finesSearchForm');
    if (f) f.reset();

    finesResults = [];
    finesTotal = 0;
    finesPage = 0;
    finesActiveFilters = {};
    finesSearchActive = false;

    showFinesHint();
    showToast('Форма поиска очищена', 'info');
}

// ========== ТАБЛИЦА ==========
function renderFineStatusBadge(status) {
    const s = status || 'active';
    return s === 'paid'
        ? '<span class="eis-vu-status eis-status-archived">ПОГАШЕН</span>'
        : '<span class="eis-vu-status eis-status-expiring">АКТИВЕН</span>';
}

function renderFinesTable() {
    const container = document.getElementById('finesResults');
    const countEl = document.getElementById('finesResultsCount');
    if (!container) return;

    if (countEl) {
        countEl.textContent = finesResults.length < finesTotal
            ? `ЗАПИСЕЙ: ${finesResults.length} из ${finesTotal}`
            : `ЗАПИСЕЙ: ${finesResults.length}`;
    }

    if (finesResults.length === 0) {
        container.innerHTML = `
            <div class="eis-no-results">
                <div style="font-size: 32px; margin-bottom: 12px;">📭</div>
                <div style="font-weight: 700; margin-bottom: 6px;">По введённым данным нарушений не найдено</div>
                <div style="font-size: 13px; color: #888;">Попробуйте изменить критерии поиска</div>
            </div>
        `;
        return;
    }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>№ протокола</th><th>Дата</th><th>ФИО нарушителя</th><th>В/У</th><th>ТС</th><th>Статья</th><th>Статус</th><th></th>';
    html += '</tr></thead><tbody>';

    finesResults.forEach(row => {
        const fio = [row.violator_last_name, row.violator_first_name, row.violator_middle_name]
            .filter(Boolean).join(' ') || '—';
        const article = [
            'ч. ' + row.article_part,
            row.article_number ? 'ст. ' + row.article_number : ''
        ].filter(Boolean).join(' ') || '—';
        const ts = [row.vehicle_make, row.vehicle_plate].filter(Boolean).join(' · ') || '—';
        const statusBadge = renderFineStatusBadge(row.status);

        html += `<tr>
            <td data-label="№"><strong>${escapeHtmlF(row.reg_number || '—')}</strong></td>
            <td data-label="Дата">${row.protocol_date ? formatDate(row.protocol_date) : '—'}</td>
            <td data-label="ФИО">${escapeHtmlF(fio)}</td>
            <td data-label="В/У">${escapeHtmlF(truncate(row.driver_license, 40))}</td>
            <td data-label="ТС">${escapeHtmlF(ts)}</td>
            <td data-label="Статья">${escapeHtmlF(article)}</td>
            <td data-label="Статус">${statusBadge}</td>
            <td><button class="eis-btn eis-btn-sm eis-btn-secondary"
                    data-action="open-fine" data-id="${row.id}">Открыть</button></td>
        </tr>`;
    });

    html += '</tbody></table></div>';

    if (finesTotal > finesResults.length) {
        const remaining = finesTotal - finesResults.length;
        html += `<div style="display:flex;justify-content:center;margin-top:16px;">
            <button class="eis-btn eis-btn-primary" id="finesLoadMoreBtn" onclick="loadMoreFines()">
                Показать ещё (осталось ${remaining})
            </button>
        </div>`;
    }

    container.innerHTML = html;
}

async function loadMoreFines() {
    const btn = document.getElementById('finesLoadMoreBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Загрузка...'; }

    try {
        const nextPage = finesPage + 1;
        const res = await searchFinesServer(finesActiveFilters, { page: nextPage, pageSize: FINES_PAGE_SIZE });
        if (res.error) throw new Error(res.error.message || 'Ошибка загрузки');

        finesResults = finesResults.concat(res.rows);
        finesTotal = res.total;
        finesPage = nextPage;

        renderFinesTable();
    } catch (e) {
        console.error('[fines loadMore]', e);
        showToast('Ошибка загрузки: ' + (e.message || 'неизвестная ошибка'), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Показать ещё'; }
    }
}

function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
}

// ========== ФОТО (включая постановление) ==========
function getFinePhotoList(row) {
    if (!row) return [];
    const list = [];

    let p = row.photos;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (_) { p = null; } }
    if (p) {
        if (Array.isArray(p.page1)) list.push(...p.page1);
        if (Array.isArray(p.page2)) list.push(...p.page2);
        if (Array.isArray(p.resolution)) list.push(...p.resolution);
    }

    if (row.photo_url) list.push(row.photo_url);
    if (row.photo_url_2) list.push(row.photo_url_2);
    if (row.resolution_photo_url) list.push(row.resolution_photo_url);

    return [...new Set(list.filter(Boolean))];
}

// ========== ДЕТАЛИ ==========
async function openFineDetail(id) {
    let row = finesResults.find(r => r.id === id);
    if (!row) {
        row = await loadFineById(id);
        if (!row) { showToast('Запись не найдена', 'error'); return; }
    }

    currentFineRow = row;

    const fio = [row.violator_last_name, row.violator_first_name, row.violator_middle_name]
        .filter(Boolean).join(' ') || '—';
    const article = [
        'ч. ' + row.article_part,
        row.article_number ? 'ст. ' + row.article_number : ''
    ].filter(Boolean).join(' ') || '—';

    document.getElementById('fdTitle').textContent = 'Протокол — ' + fio;
    document.getElementById('fdRegNumber').textContent =
        '№ ' + (row.reg_number || '—') + ' от ' + (row.protocol_date ? formatDate(row.protocol_date) : '—');

    const badgeEl = document.getElementById('fdStatusBadge');
    if (badgeEl) badgeEl.innerHTML = renderFineStatusBadge(row.status);

    // Фото
    const photosWrap = document.getElementById('fdPhotosWrap');
    const photoList = getFinePhotoList(row);

    if (photosWrap) {
        if (photoList.length === 0) {
            photosWrap.className = 'eis-fine-photos single';
            photosWrap.innerHTML = `<div class="eis-fine-photo" style="cursor:default;min-height:200px;">
                <div style="color:#888;font-size:13px;">Фото протокола отсутствует</div>
            </div>`;
        } else {
            photosWrap.className = 'eis-fine-photos';
            photosWrap.innerHTML = photoList.map((url, idx) => {
                let label = 'Страница ' + (idx + 1);
                if (idx === 0) label = 'Протокол — стр. 1';
                else if (idx === 1) label = 'Протокол — стр. 2';
                else if (idx === 2) label = 'Постановление';
                return `
                    <div class="eis-fine-photo" onclick="openFinePhotoFull(${idx})">
                        <img src="${url}" alt="${label}">
                        <div class="eis-fine-photo-label">${label}</div>
                        <div class="eis-fine-photo-zoom">🔍 Открыть</div>
                    </div>
                `;
            }).join('');
        }
    }

    // Поля протокола
    const fields = [
        ['Рег. номер', row.reg_number],
        ['Дата составления', row.protocol_date ? formatDate(row.protocol_date) : ''],
        ['Время составления', row.protocol_time],
        ['Место составления', row.protocol_place],
        ['Должность', row.official_position],
        ['Звание', row.official_rank],
        ['ФИО должностного лица', row.official_name],
        ['ФИО нарушителя', fio],
        ['Дата рождения', row.violator_birth_date ? formatDate(row.violator_birth_date) : ''],
        ['Место рождения', row.violator_birth_place],
        ['Владение языком', row.russian_language],
        ['Адрес регистрации', row.registered_address],
        ['Телефон (рег.)', row.registered_phone],
        ['Адрес проживания', row.actual_address],
        ['Телефон (факт.)', row.actual_phone],
        ['Место работы', row.work_place],
        ['Водительское удостоверение', row.driver_license],
        ['Марка ТС', row.vehicle_make],
        ['Цвет ТС', row.vehicle_color],
        ['Гос. номер', row.vehicle_plate],
        ['Владелец', row.vehicle_owner],
        ['Состоит на учёте', row.vehicle_registered],
        ['Дата нарушения', row.violation_date ? formatDate(row.violation_date) : ''],
        ['Время нарушения', row.violation_time],
        ['Место нарушения', row.violation_place],
        ['Существо нарушения', row.violation_description],
        ['Статья', article],
        ['Свидетели', row.witnesses],
        ['Свидетели уведомлены', row.witnesses_notified],
        ['Потерпевшие уведомлены', row.victims_notified],
        ['Место/время рассмотрения', row.consideration_place_time],
        ['Объяснения', row.explanation],
        ['Замечания', row.remarks]
    ];

    // ★ Поля постановления
    if (row.resolution_data) {
        const r = row.resolution_data;
        fields.push(['═══ ПОСТАНОВЛЕНИЕ ═══', '']);
        fields.push(['Номер постановления', r.number]);
        fields.push(['Дата рассмотрения', r.date]);
        fields.push(['Место рассмотрения', r.place]);
        if (r.officialPosition || r.officialName) {
            fields.push(['Должностное лицо', [
                r.officialPosition, r.officialDepartment, r.officialRank, r.officialName
            ].filter(Boolean).join(', ')]);
        }
        if (r.articlePart || r.articleNumber) {
            fields.push(['Статья постановления',
                [r.articlePart ? 'ч. ' + r.articlePart : '',
                r.articleNumber ? 'ст. ' + r.articleNumber : '']
                    .filter(Boolean).join(' ') + ' КоАП РФ']);
        }
        if (r.motivatedDecision) fields.push(['Мотивированное решение', r.motivatedDecision]);
        if (r.copyReceivedDate) fields.push(['Копия получена', r.copyReceivedDate]);
    }

    const fieldsHtml = fields
        .filter(f => {
            if (f[1] === '' || f[1] === null || f[1] === undefined) {
                return f[0].startsWith('═══');
            }
            return true;
        })
        .map(([label, val]) => {
            if (label.startsWith('═══')) {
                return `<div style="grid-column:1/-1; font-weight:700; color:#1e7e34; padding:12px 0 4px; border-bottom:2px solid #1e7e34; margin-top:8px;">${escapeHtmlF(label.replace(/═/g, '').trim())}</div>`;
            }
            return `
                <div class="eis-data-field">
                    <div class="eis-data-label">${escapeHtmlF(label)}</div>
                    <div class="eis-data-value">${escapeHtmlF(String(val))}</div>
                </div>`;
        }).join('');

    const fieldsEl = document.getElementById('fdFields');
    if (fieldsEl) fieldsEl.innerHTML = fieldsHtml;

    // Кнопка скачивания
    const dlBtn = document.getElementById('fdDownloadBtn');
    if (dlBtn) {
        const n = photoList.length;
        dlBtn.textContent = n > 1 ? `Скачать все листы (${n})` : 'Скачать лист';
        dlBtn.disabled = n === 0;
        dlBtn.onclick = () => downloadFine(row);
    }

    // Кнопки редактирования / удаления
    const canEdit = canWriteToDB();

    const editBtn = document.getElementById('fdEditBtn');
    if (editBtn) {
        if (canEdit) {
            editBtn.style.display = '';
            editBtn.onclick = () => openEditFineModal();
        } else {
            editBtn.style.display = 'none';
        }
    }

    const delBtn = document.getElementById('fdDeleteBtn');
    if (delBtn) {
        if (canEdit) {
            delBtn.style.display = '';
            delBtn.disabled = false;
            delBtn.textContent = 'Удалить';
            delBtn.onclick = () => deleteFine();
        } else {
            delBtn.style.display = 'none';
        }
    }

    // ★ Кнопка смены статуса — только начальники
    updateFineStatusUI();

    document.getElementById('fineDetailModal').style.display = 'flex';
}

function updateFineStatusUI() {
    if (!currentFineRow) return;

    const badgeEl = document.getElementById('fdStatusBadge');
    if (badgeEl) badgeEl.innerHTML = renderFineStatusBadge(currentFineRow.status);

    const btn = document.getElementById('fdStatusBtn');
    if (!btn) return;

    if (canChangeFineStatus()) {
        btn.style.display = '';
        btn.textContent = currentFineRow.status === 'paid'
            ? '↺ Пометить как активный'
            : '✓ Пометить как погашенный';
    } else {
        btn.style.display = 'none';
    }
}

async function toggleFineStatus() {
    if (!currentFineRow) return;

    if (!canChangeFineStatus()) {
        showToast('Изменять статус штрафа могут только Начальник ВАИ и Начальник ОДПС', 'warning');
        return;
    }

    const oldStatus = currentFineRow.status || 'active';
    const newStatus = oldStatus === 'paid' ? 'active' : 'paid';
    const oldLabel = oldStatus === 'paid' ? 'Погашен' : 'Активен';
    const newLabel = newStatus === 'paid' ? 'Погашен' : 'Активен';

    const ok = await showConfirm({
        title: 'Изменение статуса штрафа',
        message: `Протокол ${currentFineRow.reg_number}.\n\nСменить статус «${oldLabel}» → «${newLabel}»?`,
        confirmText: 'Изменить',
        type: 'default'
    });
    if (!ok) return;

    const { error } = await supabaseClient
        .from('protocols')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', currentFineRow.id);

    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    currentFineRow.status = newStatus;
    const idx = finesResults.findIndex(r => r.id === currentFineRow.id);
    if (idx !== -1) finesResults[idx].status = newStatus;

    if (typeof logAction === 'function') {
        await logAction('protocol_status_change', 'protocols', currentFineRow.id, {
            kind: 'update',
            summary: `Изменил статус протокола ${currentFineRow.reg_number} на «${newLabel}»`,
            changes: [{ field: 'status', from: oldStatus, to: newStatus }],
            changed_count: 1
        });
    }

    updateFineStatusUI();
    renderFinesTable();
    showToast(`Статус изменён на «${newLabel}»`, 'success');
}

function closeFineDetail() {
    const m = document.getElementById('fineDetailModal');
    if (m) m.style.display = 'none';
    currentFineRow = null;
}

function openFinePhotoFull(index) {
    if (!currentFineRow) return;
    const list = getFinePhotoList(currentFineRow);
    if (list.length === 0) return;
    openPhotoGallery(list, index || 0);
}

function downloadFine(row) {
    const list = getFinePhotoList(row);
    if (list.length === 0) { showToast('Нет файлов для скачивания', 'warning'); return; }

    const base = row.reg_number || 'protocol';

    list.forEach((url, idx) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = url;
            let suffix = `_стр${idx + 1}`;
            if (idx === 2) suffix = '_постановление';
            link.download = `${base}${suffix}.jpg`;
            link.target = '_blank';
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, idx * 400);
    });

    showToast(list.length > 1 ? `Скачивание ${list.length} файлов...` : 'Скачивание файла...', 'info');
}

// ========== РЕДАКТИРОВАНИЕ ПРОТОКОЛА ==========
function openEditFineModal() {
    if (blockWrite('редактировать протоколы')) return;
    if (!currentFineRow) { showToast('Запись не найдена', 'error'); return; }
    const row = currentFineRow;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('efId', row.id);
    setVal('efRegNumber', row.reg_number);
    setVal('efProtocolDate', row.protocol_date || '');
    setVal('efProtocolTime', row.protocol_time);
    setVal('efProtocolPlace', row.protocol_place);
    setVal('efOfficialPosition', row.official_position);
    setVal('efOfficialRank', row.official_rank);
    setVal('efOfficialName', row.official_name);
    setVal('efLastName', row.violator_last_name);
    setVal('efFirstName', row.violator_first_name);
    setVal('efMiddleName', row.violator_middle_name);
    setVal('efBirthDate', row.violator_birth_date || '');
    setVal('efBirthPlace', row.violator_birth_place);
    setVal('efRussianLanguage', row.russian_language);
    setVal('efRegisteredAddress', row.registered_address);
    setVal('efRegisteredPhone', row.registered_phone);
    setVal('efActualAddress', row.actual_address);
    setVal('efActualPhone', row.actual_phone);
    setVal('efWorkPlace', row.work_place);
    setVal('efDriverLicense', row.driver_license);
    setVal('efVehicleMake', row.vehicle_make);
    setVal('efVehicleColor', row.vehicle_color);
    setVal('efVehiclePlate', row.vehicle_plate);
    setVal('efVehicleOwner', row.vehicle_owner);
    setVal('efVehicleRegistered', row.vehicle_registered);
    setVal('efViolationDate', row.violation_date || '');
    setVal('efViolationTime', row.violation_time);
    setVal('efViolationPlace', row.violation_place);
    setVal('efViolationDescription', row.violation_description);
    setVal('efArticlePart', row.article_part);
    setVal('efArticleNumber', row.article_number);
    setVal('efWitnesses', row.witnesses);
    setVal('efWitnessesNotified', row.witnesses_notified);
    setVal('efVictimsNotified', row.victims_notified);
    setVal('efConsiderationPlaceTime', row.consideration_place_time);
    setVal('efExplanation', row.explanation);
    setVal('efRemarks', row.remarks);

    const errEl = document.getElementById('efError');
    if (errEl) errEl.textContent = '';

    closeFineDetail();
    document.getElementById('editFineModal').style.display = 'flex';
}

function closeEditFineModal() {
    const m = document.getElementById('editFineModal');
    if (m) m.style.display = 'none';
}

async function saveEditFine() {
    if (blockWrite('сохранять изменения протокола')) return;

    const errEl = document.getElementById('efError');
    const btn = document.getElementById('efSaveBtn');
    if (errEl) errEl.textContent = '';

    const id = document.getElementById('efId').value;
    const regNumber = document.getElementById('efRegNumber').value.trim();
    const lastName = document.getElementById('efLastName').value.trim();
    const firstName = document.getElementById('efFirstName').value.trim();
    const violation = document.getElementById('efViolationDescription').value.trim();
    const articleNum = document.getElementById('efArticleNumber').value.trim();

    if (!id) { if (errEl) errEl.textContent = 'Ошибка: ID не найден'; return; }
    if (!regNumber) { if (errEl) errEl.textContent = 'Укажите регистрационный номер'; return; }
    if (!lastName) { if (errEl) errEl.textContent = 'Укажите фамилию нарушителя'; return; }
    if (!firstName) { if (errEl) errEl.textContent = 'Укажите имя нарушителя'; return; }
    if (!violation) { if (errEl) errEl.textContent = 'Укажите существо нарушения'; return; }
    if (!articleNum) { if (errEl) errEl.textContent = 'Укажите номер статьи КоАП РФ'; return; }

    const { data: existing } = await supabaseClient
        .from('protocols').select('id').eq('reg_number', regNumber).neq('id', id).maybeSingle();

    if (existing) {
        if (errEl) errEl.textContent = `Протокол ${regNumber} уже существует в базе`;
        return;
    }

    const { data: before } = await supabaseClient
        .from('protocols').select('*').eq('id', id).single();

    const getVal = (fid) => {
        const el = document.getElementById(fid);
        return el ? (el.value.trim() || null) : null;
    };

    const payload = {
        reg_number: regNumber,
        protocol_date: getVal('efProtocolDate'),
        protocol_time: getVal('efProtocolTime'),
        protocol_place: getVal('efProtocolPlace'),
        official_position: getVal('efOfficialPosition'),
        official_rank: getVal('efOfficialRank'),
        official_name: getVal('efOfficialName'),
        violator_last_name: lastName,
        violator_first_name: firstName,
        violator_middle_name: getVal('efMiddleName'),
        violator_birth_date: getVal('efBirthDate'),
        violator_birth_place: getVal('efBirthPlace'),
        russian_language: getVal('efRussianLanguage'),
        registered_address: getVal('efRegisteredAddress'),
        registered_phone: getVal('efRegisteredPhone'),
        actual_address: getVal('efActualAddress'),
        actual_phone: getVal('efActualPhone'),
        work_place: getVal('efWorkPlace'),
        driver_license: getVal('efDriverLicense'),
        vehicle_make: getVal('efVehicleMake'),
        vehicle_color: getVal('efVehicleColor'),
        vehicle_plate: getVal('efVehiclePlate'),
        vehicle_owner: getVal('efVehicleOwner'),
        vehicle_registered: getVal('efVehicleRegistered'),
        violation_date: getVal('efViolationDate'),
        violation_time: getVal('efViolationTime'),
        violation_place: getVal('efViolationPlace'),
        violation_description: violation,
        article_part: getVal('efArticlePart'),
        article_number: articleNum,
        witnesses: getVal('efWitnesses'),
        witnesses_notified: getVal('efWitnessesNotified'),
        victims_notified: getVal('efVictimsNotified'),
        consideration_place_time: getVal('efConsiderationPlaceTime'),
        explanation: getVal('efExplanation'),
        remarks: getVal('efRemarks'),
        updated_at: new Date().toISOString()
    };

    if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }

    const { error } = await supabaseClient.from('protocols').update(payload).eq('id', id);

    if (btn) { btn.disabled = false; btn.textContent = 'Сохранить'; }

    if (error) {
        if (errEl) errEl.textContent = 'Ошибка: ' + error.message;
        showToast('Ошибка: ' + error.message, 'error');
        return;
    }

    const { data: after } = await supabaseClient
        .from('protocols').select('*').eq('id', id).single();

    await logUpdate('protocol_update', 'protocols', id, before, after, {
        summary_prefix: `Изменил протокол ${regNumber} (${lastName} ${firstName})`
    });

    closeEditFineModal();

    if (finesSearchActive && hasAnySearchCriteria()) {
        await runFinesSearch();
    } else {
        const idx = finesResults.findIndex(r => r.id === id);
        if (idx !== -1) finesResults[idx] = { ...finesResults[idx], ...payload };
        renderFinesTable();
    }

    await refreshFinesStats();
    showToast(`Протокол ${regNumber} обновлён`, 'success');
}

async function deleteFine() {
    if (blockWrite('удалять протоколы')) return;
    if (!currentFineRow) return;
    const row = currentFineRow;

    const ok = await showConfirm({
        title: 'Удаление протокола',
        message: `Удалить протокол ${row.reg_number} (${row.violator_last_name || ''} ${row.violator_first_name || ''})? Все фото будут удалены безвозвратно.`,
        confirmText: 'Удалить',
        type: 'danger'
    });

    if (!ok) return;

    const btn = document.getElementById('fdDeleteBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Удаление...'; }

    try {
        const photos = row.photos || {};
        const fileNames = [];

        const collect = (arr) => {
            if (!Array.isArray(arr)) return;
            arr.forEach(url => {
                if (!url) return;
                const parts = url.split('/protocol-photos/');
                if (parts.length >= 2) fileNames.push(decodeURIComponent(parts[1]));
            });
        };

        collect(photos.page1);
        collect(photos.page2);
        collect(photos.resolution);

        if (row.photo_url) {
            const parts = row.photo_url.split('/protocol-photos/');
            if (parts.length >= 2) fileNames.push(decodeURIComponent(parts[1]));
        }
        if (row.photo_url_2) {
            const parts = row.photo_url_2.split('/protocol-photos/');
            if (parts.length >= 2) fileNames.push(decodeURIComponent(parts[1]));
        }
        if (row.resolution_photo_url) {
            const parts = row.resolution_photo_url.split('/protocol-photos/');
            if (parts.length >= 2) fileNames.push(decodeURIComponent(parts[1]));
        }

        if (fileNames.length > 0) {
            try {
                await supabaseClient.storage.from('protocol-photos').remove([...new Set(fileNames)]);
            } catch (e) { console.warn('Не удалось удалить часть файлов:', e); }
        }

        const { error } = await supabaseClient.from('protocols').delete().eq('id', row.id);
        if (error) throw new Error(error.message);

        await logDelete('protocol_delete', 'protocols', row.id, row,
            `Удалил протокол ${row.reg_number} (${row.violator_last_name || ''} ${row.violator_first_name || ''})`.trim());

        closeFineDetail();

        finesResults = finesResults.filter(r => r.id !== row.id);
        finesTotal = Math.max(0, finesTotal - 1);

        if (hasAnySearchCriteria()) {
            await runFinesSearch();
        } else {
            showFinesHint();
        }

        await refreshFinesStats();
        showToast(`Протокол ${row.reg_number} удалён`, 'success');

    } catch (e) {
        console.error('[delete fine]', e);
        showToast('Ошибка: ' + e.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Удалить'; }
    }
}

function escapeHtmlF(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('finesResults')) return;

    document.addEventListener('user-ready', () => { loadFinesFromSupabase(); }, { once: true });

    const form = document.getElementById('finesSearchForm');
    if (form) {
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); runFinesSearch(); }
        });
    }

    document.getElementById('finesResults').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="open-fine"]');
        if (btn) openFineDetail(btn.dataset.id);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeFineDetail(); closeEditFineModal(); }
    });
});

window.loadFinesFromSupabase = loadFinesFromSupabase;
window.refreshFinesStats = refreshFinesStats;
window.runFinesSearch = runFinesSearch;
window.resetFinesSearch = resetFinesSearch;
window.renderFinesTable = renderFinesTable;
window.loadMoreFines = loadMoreFines;
window.openFineDetail = openFineDetail;
window.closeFineDetail = closeFineDetail;
window.openFinePhotoFull = openFinePhotoFull;
window.downloadFine = downloadFine;
window.getFinePhotoList = getFinePhotoList;
window.openEditFineModal = openEditFineModal;
window.closeEditFineModal = closeEditFineModal;
window.saveEditFine = saveEditFine;
window.deleteFine = deleteFine;
window.toggleFineStatus = toggleFineStatus;
window.canChangeFineStatus = canChangeFineStatus;