// ================================================================
// БАЗА ВУ — РАБОТА С SUPABASE (серверный поиск + пагинация)
// ================================================================

let vuResults = [];             // записи текущего поиска (растёт при "Показать ещё")
let vuTotal = 0;                // всего на сервере по фильтру
let vuPage = 0;                 // номер загруженной страницы (0-based)
let vuActiveFilters = {};       // фильтры активного поиска

const VU_PAGE_SIZE = 15;

// ================================================================
// СЕРВЕРНЫЙ ПОИСК ВУ (см. шаг 16.1)
// ================================================================

async function searchVUServer(filters = {}, opts = {}) {
    const page = Math.max(0, parseInt(opts.page, 10) || 0);
    const pageSize = Math.max(1, Math.min(200, parseInt(opts.pageSize, 10) || 50));
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let q = supabaseClient
        .from('military_ids')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (filters.fio && filters.fio.trim()) {
        const f = filters.fio.trim().replace(/[,()%_\\]/g, '');
        if (f) {
            q = q.or(
                `last_name.ilike.%${f}%,` +
                `first_name.ilike.%${f}%,` +
                `middle_name.ilike.%${f}%`
            );
        }
    }

    if (filters.vuNumber && filters.vuNumber.trim()) {
        q = q.ilike('vu_number', `%${filters.vuNumber.trim()}%`);
    }
    if (filters.issuedBy && filters.issuedBy.trim()) {
        q = q.ilike('issued_by', `%${filters.issuedBy.trim()}%`);
    }

    if (filters.dateFrom) q = q.gte('issue_date', filters.dateFrom);
    if (filters.dateTo) q = q.lte('issue_date', filters.dateTo);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    };
    const todayISO = iso(today);
    const plus7 = new Date(today); plus7.setDate(plus7.getDate() + 7);
    const plus7ISO = iso(plus7);

    const st = filters.status || '';
    if (st === 'archived') {
        q = q.eq('status', 'archived');
    } else if (st === 'expired') {
        q = q.eq('status', 'active').or(`expiry_date.is.null,expiry_date.lte.${todayISO}`);
    } else if (st === 'expiring') {
        q = q.eq('status', 'active')
            .gt('expiry_date', todayISO)
            .lte('expiry_date', plus7ISO);
    } else if (st === 'valid') {
        q = q.eq('status', 'active').gt('expiry_date', plus7ISO);
    } else {
        q = q.eq('status', 'active');
    }

    const { data, error, count } = await sbRetry(() => q);
    return {
        rows: data || [],
        total: count || 0,
        page,
        pageSize,
        error
    };
}

async function loadVUById(id) {
    if (!id) return null;
    const { data, error } = await sbRetry(() =>
        supabaseClient.from('military_ids').select('*').eq('id', id).single()
    );
    if (error || !data) return null;
    return normalizeVUFromRaw(data);
}
function normalizeVUFromRaw(row) {
    return {
        id: row.id,
        fio: [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' ') || 'Н/Д',
        lastName: row.last_name,
        firstName: row.first_name,
        middleName: row.middle_name,
        vuNumber: row.vu_number,
        rank: row.rank,
        issueDate: row.issue_date,
        expiryDate: row.expiry_date,
        issuedBy: row.issued_by,
        state: row.status === 'archived' ? 'Архив' : '',
        status: row.status,
        photoUrl: row.photo_url || null,
        photos: {
            vu: row.photo_url ? [row.photo_url] : (row.photos?.vu || []),
            exam: row.photos?.exam || []
        },
        createdBy: row.created_by,
        createdAt: row.created_at,
        _raw: row
    };
}

// ================================================================
// ЗАПУСК ПОИСКА (кнопка / автозагрузка / сброс)
// ================================================================

async function runVUSearch() {
    const filters = collectVUFilters();
    vuActiveFilters = filters;

    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="eis-loading">
                <div class="eis-spinner"></div>
                <span>Поиск...</span>
            </div>
        `;
    }

    try {
        const res = await searchVUServer(filters, { page: 0, pageSize: VU_PAGE_SIZE });
        if (res.error) throw new Error(res.error.message || 'Ошибка поиска');

        vuResults = res.rows.map(normalizeVUFromRaw);
        vuTotal = res.total;
        vuPage = 0;

        renderVUResults();
    } catch (e) {
        console.error('[VU search]', e);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="eis-no-results">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <div style="font-weight: 700; margin-bottom: 8px;">Ошибка поиска</div>
                    <div style="font-size: 13px; color: #888;">${escapeHtml(e.message || '')}</div>
                </div>
            `;
        }
    }
}

function collectVUFilters() {
    return {
        fio: (document.getElementById('searchFIO')?.value || '').trim(),
        vuNumber: (document.getElementById('searchVU')?.value || '').trim(),
        issuedBy: (document.getElementById('searchIssued')?.value || '').trim(),
        status: document.getElementById('searchStatus')?.value || '',
        dateFrom: document.getElementById('searchDateFrom')?.value || '',
        dateTo: document.getElementById('searchDateTo')?.value || ''
    };
}

// Первичная загрузка при входе на страницу — первая страница активных ВУ
async function loadVUFromSupabase() {
    await runVUSearch();
}

async function loadMoreVU() {
    const btn = document.getElementById('vuLoadMoreBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Загрузка...'; }

    try {
        const nextPage = vuPage + 1;
        const res = await searchVUServer(vuActiveFilters, { page: nextPage, pageSize: VU_PAGE_SIZE });
        if (res.error) throw new Error(res.error.message || 'Ошибка загрузки');

        vuResults = vuResults.concat(res.rows.map(normalizeVUFromRaw));
        vuTotal = res.total;
        vuPage = nextPage;

        renderVUResults();
    } catch (e) {
        console.error('[VU loadMore]', e);
        showToast('Ошибка загрузки: ' + (e.message || ''), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Показать ещё'; }
    }
}

function resetSearch() {
    document.getElementById('searchForm').reset();
    runVUSearch();
}

// ================================================================
// РЕНДЕР РЕЗУЛЬТАТОВ
// ================================================================

function renderVUResults() {
    const resultsContainer = document.getElementById('results');
    const resultsCount = document.getElementById('resultsCount');
    if (!resultsContainer) return;

    if (resultsCount) {
        resultsCount.textContent = vuResults.length < vuTotal
            ? `ЗАПИСЕЙ: ${vuResults.length} из ${vuTotal}`
            : `ЗАПИСЕЙ: ${vuResults.length}`;
    }

    if (vuResults.length === 0) {
        resultsContainer.innerHTML = '<div class="eis-no-results">Записи не найдены</div>';
        return;
    }

    const canEdit = canWriteToDB() && [
        'inspector_odps', 'inspector_reo',
        'chief_odps', 'chief_reo', 'chief_cuipp', 'chief_vai'
    ].includes(window.currentProfile?.role);

    let html = '';

    vuResults.forEach(vu => {
        const status = getVUStatus(vu.expiryDate, vu.state);
        const isArchived = vu.state === 'Архив';

        const vuPhotosVu = vu.photos?.vu || [];
        const vuPhotosExam = vu.photos?.exam || [];

        const vuNumber = vu.vuNumber || '';
        const rank = vu.rank || '';
        const fio = vu.fio || 'Н/Д';
        const issuedBy = vu.issuedBy || '';
        const issueDate = vu.issueDate || '';
        const expiryDate = vu.expiryDate || '';

        html += `
            <div class="eis-vu-record" data-id="${vu.id}">
                <div class="eis-vu-record-header">
                    <div class="eis-vu-number">${escapeHtml(vuNumber)}</div>
                    <div class="eis-vu-record-header-right">
                        <div class="eis-vu-status ${status.class}">${status.text}</div>
                        ${canEdit ? `
                            <div class="eis-vu-actions">
                                <button class="eis-btn eis-btn-sm eis-btn-secondary"
                                        data-action="edit-vu" data-id="${vu.id}">Изменить</button>
                                <button class="eis-btn eis-btn-sm eis-btn-danger"
                                        data-action="delete-vu"
                                        data-id="${vu.id}"
                                        data-number="${escapeHtml(vuNumber)}">Удалить</button>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="eis-vu-data">
                    <div class="eis-data-field"><div class="eis-data-label">ФИО</div><div class="eis-data-value">${escapeHtml(fio)}</div></div>
                    <div class="eis-data-field"><div class="eis-data-label">Звание</div><div class="eis-data-value">${escapeHtml(rank)}</div></div>
                    <div class="eis-data-field"><div class="eis-data-label">Дата выдачи</div><div class="eis-data-value">${escapeHtml(formatDate(issueDate))}</div></div>
                    <div class="eis-data-field"><div class="eis-data-label">Действительно до</div><div class="eis-data-value">${escapeHtml(formatDate(expiryDate))}</div></div>
                    <div class="eis-data-field"><div class="eis-data-label">Кем выдано</div><div class="eis-data-value">${escapeHtml(issuedBy)}</div></div>
                    ${isArchived ? `<div class="eis-data-field"><div class="eis-data-label">Состояние</div><div class="eis-data-value" style="color: #888;">АРХИВ</div></div>` : ''}
                </div>

                ${(vuPhotosVu.length > 0 || vuPhotosExam.length > 0) ? `
                <div class="eis-documents-grid">
                    ${vuPhotosVu.length > 0 ? `
                    <div class="eis-document-thumb"
                         data-action="open-photos"
                         data-photos="${escapeHtml(JSON.stringify(vuPhotosVu))}"
                         data-index="0">
                        <img src="${escapeHtml(vuPhotosVu[0] || '')}" alt="ВУ">
                        <div class="eis-document-label">ВУ</div>
                        ${vuPhotosVu.length > 1 ? `<div class="eis-photo-counter">1/${vuPhotosVu.length}</div>` : ''}
                    </div>` : ''}
                    ${vuPhotosExam.length > 0 ? `
                    <div class="eis-document-thumb"
                         data-action="open-photos"
                         data-photos="${escapeHtml(JSON.stringify(vuPhotosExam))}"
                         data-index="0">
                        <img src="${escapeHtml(vuPhotosExam[0] || '')}" alt="Бланки">
                        <div class="eis-document-label">БЛАНКИ</div>
                        ${vuPhotosExam.length > 1 ? `<div class="eis-photo-counter">1/${vuPhotosExam.length}</div>` : ''}
                    </div>` : ''}
                </div>
                ` : ''}
            </div>
        `;
    });

    if (vuTotal > vuResults.length) {
        const remaining = vuTotal - vuResults.length;
        html += `<div style="display:flex;justify-content:center;margin-top:16px;">
            <button class="eis-btn eis-btn-primary" id="vuLoadMoreBtn" onclick="loadMoreVU()">
                Показать ещё
            </button>
        </div>`;
    }

    resultsContainer.innerHTML = html;
}

// ================================================================
// РЕДАКТИРОВАНИЕ / АРХИВ / УДАЛЕНИЕ (с fallback через loadVUById)
// ================================================================

async function openEditVUModal(vuId) {
    if (blockWrite('редактировать ВУ')) return;

    let vu = vuResults.find(v => v.id === vuId);
    if (!vu) vu = await loadVUById(vuId);
    if (!vu) { showToast('Запись не найдена', 'error'); return; }

    const modal = document.getElementById('editVUModal');
    if (!modal) return;

    // Для записей из vuResults поля в «плоском» виде; для loadVUById — тоже
    // (мы уже привели формат в loadVUById)
    document.getElementById('evId').value = vu.id;
    document.getElementById('evNumber').value = vu.vuNumber || '';
    document.getElementById('evRank').value = vu.rank || '';
    document.getElementById('evLastName').value = vu.lastName || '';
    document.getElementById('evFirstName').value = vu.firstName || '';
    document.getElementById('evMiddleName').value = vu.middleName || '';
    document.getElementById('evIssueDate').value = vu.issueDate || '';
    document.getElementById('evExpiryDate').value = vu.expiryDate || '';
    document.getElementById('evIssuedBy').value = vu.issuedBy || '';
    document.getElementById('evStatus').value = vu.status || 'active';
    document.getElementById('evError').textContent = '';

    modal.style.display = 'flex';
}

function closeEditVUModal() {
    const modal = document.getElementById('editVUModal');
    if (modal) modal.style.display = 'none';
}

async function saveEditVU() {
    if (blockWrite('сохранять изменения ВУ')) return;

    const errEl = document.getElementById('evError');
    const btn = document.getElementById('evSaveBtn');
    errEl.textContent = '';

    const id = document.getElementById('evId').value;
    const number = document.getElementById('evNumber').value.trim();
    const rank = document.getElementById('evRank').value.trim();
    const lastName = document.getElementById('evLastName').value.trim();
    const firstName = document.getElementById('evFirstName').value.trim();
    const middleName = document.getElementById('evMiddleName').value.trim();
    const issueDate = document.getElementById('evIssueDate').value;
    const expiryDate = document.getElementById('evExpiryDate').value;
    const issuedBy = document.getElementById('evIssuedBy').value.trim();
    const status = document.getElementById('evStatus').value;

    if (!number) { errEl.textContent = 'Укажите номер ВУ'; return; }
    if (!lastName) { errEl.textContent = 'Укажите фамилию'; return; }
    if (!firstName) { errEl.textContent = 'Укажите имя'; return; }
    if (!issueDate) { errEl.textContent = 'Укажите дату выдачи'; return; }
    if (!expiryDate) { errEl.textContent = 'Укажите срок действия'; return; }

    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    const { data: existing } = await supabaseClient
        .from('military_ids').select('id').eq('vu_number', number).neq('id', id).maybeSingle();

    if (existing) {
        errEl.textContent = `ВУ с номером ${number} уже существует в базе`;
        btn.disabled = false;
        btn.textContent = 'Сохранить';
        return;
    }

    const { data: before } = await supabaseClient
        .from('military_ids').select('*').eq('id', id).single();

    const { error } = await supabaseClient
        .from('military_ids')
        .update({
            vu_number: number, rank, last_name: lastName, first_name: firstName,
            middle_name: middleName || null,
            issue_date: issueDate, expiry_date: expiryDate, issued_by: issuedBy, status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    btn.disabled = false;
    btn.textContent = 'Сохранить';

    if (error) {
        errEl.textContent = 'Ошибка: ' + error.message;
        showToast('Ошибка: ' + error.message, 'error');
        return;
    }

    const { data: after } = await supabaseClient
        .from('military_ids').select('*').eq('id', id).single();

    await logUpdate('vu_update', 'military_ids', id, before, after, {
        summary_prefix: `Изменил ВУ ${number} (${lastName} ${firstName})`
    });

    closeEditVUModal();
    showToast(`ВУ ${number} обновлён`, 'success');
    await runVUSearch();
}

async function toggleArchiveVU(vuId) {
    if (blockWrite('менять статус ВУ')) return;

    let vu = vuResults.find(v => v.id === vuId);
    if (!vu) vu = await loadVUById(vuId);
    if (!vu) return;

    const currentStatus = vu.status;
    const isArchived = currentStatus === 'archived';
    const newStatus = isArchived ? 'active' : 'archived';
    const actionText = isArchived ? 'Разархивировать' : 'Архивировать';

    const fio = vu.fio || 'Н/Д';
    const num = vu.vuNumber || vu.vu_number || '—';

    const ok = await showConfirm({
        title: actionText + ' ВУ',
        message: `${actionText} ВУ ${num} (${fio})?`,
        confirmText: actionText,
        type: 'default'
    });
    if (!ok) return;

    const { error } = await supabaseClient
        .from('military_ids')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', vuId);

    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    await logAction('vu_status_change', 'military_ids', vuId, {
        kind: 'update',
        summary: `${isArchived ? 'Разархивировал' : 'Архивировал'} ВУ ${num} (${fio})`,
        changes: [{ field: 'status', from: currentStatus, to: newStatus }],
        changed_count: 1
    });

    showToast(`ВУ ${num} ${isArchived ? 'разархивировано' : 'архивировано'}`, 'success');
    await runVUSearch();
}

async function deleteVU(vuId, vuNumber) {
    if (blockWrite('удалять ВУ')) return;

    let vu = vuResults.find(v => v.id === vuId);
    if (!vu) vu = await loadVUById(vuId);

    const fio = vu?.fio || '';

    const ok = await showConfirm({
        title: 'Удаление ВУ',
        message: `Удалить ВУ ${vuNumber}${fio ? ' (' + fio + ')' : ''}? Запись и фото будут удалены безвозвратно.`,
        confirmText: 'Удалить',
        type: 'danger'
    });
    if (!ok) return;

    const { data: fullRow } = await supabaseClient
        .from('military_ids').select('*').eq('id', vuId).single();

    const photoUrl = vu?.photoUrl || fullRow?.photo_url;
    if (photoUrl) {
        try {
            const fileName = extractFileNameFromUrl(photoUrl);
            if (fileName) {
                await supabaseClient.storage.from('vu-photos').remove([fileName]);
            }
        } catch (e) {
            console.warn('Не удалось удалить фото из Storage:', e);
        }
    }

    const { error } = await supabaseClient
        .from('military_ids').delete().eq('id', vuId);

    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    await logDelete('vu_delete', 'military_ids', vuId, fullRow || vu,
        `Удалил ВУ ${vuNumber}${fio ? ' (' + fio + ')' : ''}`);

    showToast(`ВУ ${vuNumber} удалён`, 'success');
    await runVUSearch();
}

function extractFileNameFromUrl(url) {
    if (!url) return null;
    try {
        const parts = url.split('/vu-photos/');
        if (parts.length < 2) return null;
        return decodeURIComponent(parts[1]);
    } catch (e) { return null; }
}

// ================================================================
// ИНИЦИАЛИЗАЦИЯ
// ================================================================

document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('results')) return;

    document.addEventListener('user-ready', () => {
        loadVUFromSupabase();
    }, { once: true });

    // ★ Debounce на ввод в фильтры — 300 мс
    const debouncedSearch = debounce(() => runVUSearch(), 300);
    const searchInputs = document.querySelectorAll('#searchForm .eis-input, #searchForm .eis-select');
    searchInputs.forEach(input => {
        input.addEventListener('input', debouncedSearch);
        input.addEventListener('change', () => runVUSearch());
    });

    // ★ Делегирование кликов по динамическим кнопкам
    document.getElementById('results').addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit-vu"]');
        if (editBtn) {
            openEditVUModal(editBtn.dataset.id);
            return;
        }
        const delBtn = e.target.closest('[data-action="delete-vu"]');
        if (delBtn) {
            deleteVU(delBtn.dataset.id, delBtn.dataset.number);
            return;
        }
        const photoBtn = e.target.closest('[data-action="open-photos"]');
        if (photoBtn) {
            try {
                const photos = JSON.parse(photoBtn.dataset.photos || '[]');
                if (Array.isArray(photos) && photos.length > 0) {
                    openPhotoGallery(photos, parseInt(photoBtn.dataset.index, 10) || 0);
                }
            } catch (err) {
                console.warn('[photos] JSON parse error:', err);
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeEditVUModal();
    });
});

window.loadVUFromSupabase = loadVUFromSupabase;
window.runVUSearch = runVUSearch;
window.loadMoreVU = loadMoreVU;
window.renderVUResults = renderVUResults;
window.resetSearch = resetSearch;
window.openEditVUModal = openEditVUModal;
window.closeEditVUModal = closeEditVUModal;
window.saveEditVU = saveEditVU;
window.toggleArchiveVU = toggleArchiveVU;
window.deleteVU = deleteVU;