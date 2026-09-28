// ================================================================
// БАЗА НАРУШЕНИЙ — ЕИС ВАИ
// ================================================================

let finesDatabase = [];
let finesFiltered = [];
let currentFineRow = null;

async function loadFinesFromSupabase() {
    const container = document.getElementById('finesResults');
    if (!container) return;

    container.innerHTML = `<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка данных...</span></div>`;

    const { data, error } = await supabaseClient
        .from('protocols').select('*').order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="eis-no-results">Ошибка: ${escapeHtmlF(error.message)}</div>`;
        return;
    }

    finesDatabase = data || [];
    updateFinesStats();
    showFinesHint();
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

function updateFinesStats() {
    const total = finesDatabase.length;

    const uniq = new Set();
    finesDatabase.forEach(r => {
        const key = [r.violator_last_name, r.violator_first_name, r.violator_birth_date]
            .filter(Boolean).join('|');
        if (key) uniq.add(key);
    });

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthly = finesDatabase.filter(r => {
        const d = r.protocol_date ? parseDate(r.protocol_date) : null;
        return d && d >= monthAgo;
    }).length;

    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setTxt('statTotalProtocols', total);
    setTxt('statUniqueViolators', uniq.size);
    setTxt('statMonthProtocols', monthly);
}

function hasAnySearchCriteria() {
    const ids = [
        'fineSearchFIO', 'fineSearchLicense', 'fineSearchBirthDate',
        'fineSearchPlate', 'fineSearchRegNumber', 'fineSearchArticle',
        'fineSearchDateFrom', 'fineSearchDateTo'
    ];
    return ids.some(id => {
        const el = document.getElementById(id);
        return el && el.value.trim() !== '';
    });
}

function runFinesSearch() {
    if (!hasAnySearchCriteria()) {
        showToast('Заполните хотя бы одно поле для поиска', 'warning');
        showFinesHint();
        return;
    }

    const btn = document.getElementById('fineSearchBtn');
    const origHtml = btn ? btn.innerHTML : '';

    if (btn) { btn.disabled = true; btn.innerHTML = 'Поиск...'; }

    setTimeout(() => {
        applyFinesFilters();
        if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
    }, 200);
}

function applyFinesFilters() {
    if (!hasAnySearchCriteria()) {
        finesFiltered = [];
        showFinesHint();
        return;
    }

    const fio = (document.getElementById('fineSearchFIO')?.value || '').toLowerCase().trim();
    const license = (document.getElementById('fineSearchLicense')?.value || '').toLowerCase().trim();
    const birthDate = document.getElementById('fineSearchBirthDate')?.value || '';
    const plate = (document.getElementById('fineSearchPlate')?.value || '').toLowerCase().trim();
    const regNumber = (document.getElementById('fineSearchRegNumber')?.value || '').toLowerCase().trim();
    const article = (document.getElementById('fineSearchArticle')?.value || '').trim();
    const dateFrom = document.getElementById('fineSearchDateFrom')?.value || '';
    const dateTo = document.getElementById('fineSearchDateTo')?.value || '';

    finesFiltered = finesDatabase.filter(row => {
        if (fio) {
            const hay = [row.violator_last_name, row.violator_first_name, row.violator_middle_name]
                .filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(fio)) return false;
        }
        if (license && !(row.driver_license || '').toLowerCase().includes(license)) return false;
        if (birthDate && (row.violator_birth_date || '') !== birthDate) return false;
        if (plate && !(row.vehicle_plate || '').toLowerCase().includes(plate)) return false;
        if (regNumber && !(row.reg_number || '').toLowerCase().includes(regNumber)) return false;
        if (article && !(row.article_number || '').includes(article)) return false;

        if (dateFrom || dateTo) {
            const pd = parseDate(row.protocol_date);
            if (pd) {
                if (dateFrom) {
                    const f = parseDate(dateFrom);
                    if (f && pd < f) return false;
                }
                if (dateTo) {
                    const t = parseDate(dateTo);
                    if (t && pd > t) return false;
                }
            }
        }
        return true;
    });

    displayFines(finesFiltered);
}

function resetFinesSearch() {
    const f = document.getElementById('finesSearchForm');
    if (f) f.reset();
    finesFiltered = [];
    showFinesHint();
    showToast('Форма поиска очищена', 'info');
}

function displayFines(rows) {
    const container = document.getElementById('finesResults');
    const countEl = document.getElementById('finesResultsCount');
    if (!container) return;

    if (countEl) countEl.textContent = `ЗАПИСЕЙ: ${rows.length}`;

    if (rows.length === 0) {
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
    html += '<th>№ протокола</th><th>Дата</th><th>ФИО нарушителя</th><th>В/У</th><th>ТС</th><th>Статья</th><th></th>';
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
        const fio = [row.violator_last_name, row.violator_first_name, row.violator_middle_name]
            .filter(Boolean).join(' ') || '—';
        const article = [
            'ч. ' + row.article_part,
            row.article_number ? 'ст. ' + row.article_number : ''
        ].filter(Boolean).join(' ') || '—';
        const ts = [row.vehicle_make, row.vehicle_plate].filter(Boolean).join(' · ') || '—';

        html += `<tr>
            <td data-label="№"><strong>${escapeHtmlF(row.reg_number || '—')}</strong></td>
            <td data-label="Дата">${row.protocol_date ? formatDate(row.protocol_date) : '—'}</td>
            <td data-label="ФИО">${escapeHtmlF(fio)}</td>
            <td data-label="В/У">${escapeHtmlF(truncate(row.driver_license, 40))}</td>
            <td data-label="ТС">${escapeHtmlF(ts)}</td>
            <td data-label="Статья">${escapeHtmlF(article)}</td>
            <td><button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openFineDetail('${row.id}')">Открыть</button></td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
}

function getFinePhotoList(row) {
    if (!row) return [];
    const list = [];

    let p = row.photos;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (_) { p = null; } }
    if (p) {
        if (Array.isArray(p.page1)) list.push(...p.page1);
        if (Array.isArray(p.page2)) list.push(...p.page2);
    }

    if (row.photo_url) list.push(row.photo_url);
    if (row.photo_url_2) list.push(row.photo_url_2);

    return [...new Set(list.filter(Boolean))];
}

function openFineDetail(id) {
    const row = finesDatabase.find(r => r.id === id);
    if (!row) { showToast('Запись не найдена', 'error'); return; }

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

    const photosWrap = document.getElementById('fdPhotosWrap');
    const photoList = getFinePhotoList(row);

    if (photosWrap) {
        if (photoList.length === 0) {
            photosWrap.className = 'eis-fine-photos single';
            photosWrap.innerHTML = `<div class="eis-fine-photo" style="cursor:default;min-height:200px;">
                <div style="color:#888;font-size:13px;">Фото протокола отсутствует</div>
            </div>`;
        } else {
            photosWrap.className = 'eis-fine-photos' + (photoList.length === 1 ? ' single' : '');
            photosWrap.innerHTML = photoList.map((url, idx) => `
                <div class="eis-fine-photo" onclick="openFinePhotoFull(${idx})">
                    <img src="${url}" alt="Стр. ${idx + 1}">
                    <div class="eis-fine-photo-label">Страница ${idx + 1}</div>
                    <div class="eis-fine-photo-zoom">🔍 Открыть</div>
                </div>
            `).join('');
        }
    }

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

    const fieldsHtml = fields
        .filter(f => f[1] !== null && f[1] !== undefined && f[1] !== '')
        .map(([label, val]) => `
            <div class="eis-data-field">
                <div class="eis-data-label">${escapeHtmlF(label)}</div>
                <div class="eis-data-value">${escapeHtmlF(String(val))}</div>
            </div>
        `).join('');

    const fieldsEl = document.getElementById('fdFields');
    if (fieldsEl) fieldsEl.innerHTML = fieldsHtml;

    const dlBtn = document.getElementById('fdDownloadBtn');
    if (dlBtn) {
        const n = photoList.length;
        dlBtn.textContent = n > 1 ? `Скачать оба листа (${n})` : 'Скачать лист';
        dlBtn.disabled = n === 0;
        dlBtn.onclick = () => downloadFine(row);
    }

    const editBtn = document.getElementById('fdEditBtn');
    if (editBtn) editBtn.onclick = () => openEditFineModal();

    const delBtn = document.getElementById('fdDeleteBtn');
    if (delBtn) {
        delBtn.disabled = false;
        delBtn.textContent = 'Удалить';
        delBtn.onclick = () => deleteFine();
    }

    document.getElementById('fineDetailModal').style.display = 'flex';
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
            link.download = `${base}_стр${idx + 1}.jpg`;
            link.target = '_blank';
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, idx * 400);
    });

    showToast(
        list.length > 1 ? `Скачивание ${list.length} файлов...` : 'Скачивание файла...',
        'info'
    );
}

function openEditFineModal() {
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

    const idx = finesDatabase.findIndex(r => r.id === id);
    if (idx !== -1) finesDatabase[idx] = { ...finesDatabase[idx], ...payload };

    closeEditFineModal();
    showToast(`Протокол ${regNumber} обновлён`, 'success');

    if (finesFiltered.length > 0) applyFinesFilters();
    else displayFines(finesDatabase);
}

async function deleteFine() {
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

        if (row.photo_url) {
            const parts = row.photo_url.split('/protocol-photos/');
            if (parts.length >= 2) fileNames.push(decodeURIComponent(parts[1]));
        }
        if (row.photo_url_2) {
            const parts = row.photo_url_2.split('/protocol-photos/');
            if (parts.length >= 2) fileNames.push(decodeURIComponent(parts[1]));
        }

        if (fileNames.length > 0) {
            try {
                await supabaseClient.storage.from('protocol-photos').remove([...new Set(fileNames)]);
            } catch (e) { console.warn('Не удалось удалить часть файлов:', e); }
        }

        const { error } = await supabaseClient.from('protocols').delete().eq('id', row.id);
        if (error) throw new Error(error.message);

        // 5-м аргументом СТРОКА
        await logDelete('protocol_delete', 'protocols', row.id, row,
            `Удалил протокол ${row.reg_number} (${row.violator_last_name || ''} ${row.violator_first_name || ''})`.trim());

        finesDatabase = finesDatabase.filter(r => r.id !== row.id);
        finesFiltered = finesFiltered.filter(r => r.id !== row.id);

        closeFineDetail();
        updateFinesStats();

        if (finesFiltered.length > 0) displayFines(finesFiltered);
        else if (hasAnySearchCriteria()) displayFines(finesFiltered);
        else showFinesHint();

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

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeFineDetail(); closeEditFineModal(); }
    });
});

window.loadFinesFromSupabase = loadFinesFromSupabase;
window.runFinesSearch = runFinesSearch;
window.applyFinesFilters = applyFinesFilters;
window.resetFinesSearch = resetFinesSearch;
window.openFineDetail = openFineDetail;
window.closeFineDetail = closeFineDetail;
window.openFinePhotoFull = openFinePhotoFull;
window.downloadFine = downloadFine;
window.getFinePhotoList = getFinePhotoList;
window.openEditFineModal = openEditFineModal;
window.closeEditFineModal = closeEditFineModal;
window.saveEditFine = saveEditFine;
window.deleteFine = deleteFine;