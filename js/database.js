// ================================================================
// БАЗА ВУ — РАБОТА С SUPABASE
// ================================================================

let vuDatabase = [];

async function loadVUFromSupabase() {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
        <div class="eis-loading">
            <div class="eis-spinner"></div>
            <span>Загрузка данных...</span>
        </div>
    `;

    try {
        const { data, error } = await supabaseClient
            .from('military_ids').select('*').order('created_at', { ascending: false });

        if (error) throw error;

        vuDatabase = (data || []).map(row => ({
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
            createdAt: row.created_at
        }));

        const activeRecords = vuDatabase.filter(vu => vu.state !== 'Архив');
        displayResults(activeRecords);

    } catch (error) {
        console.error('Ошибка загрузки ВУ:', error);
        resultsContainer.innerHTML = `
            <div class="eis-no-results">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <div style="font-weight: 700; margin-bottom: 8px;">Ошибка загрузки данных</div>
                <div style="font-size: 13px; color: #888;">${error.message}</div>
            </div>
        `;
    }
}

function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    const resultsCount = document.getElementById('resultsCount');
    if (!resultsContainer) return;

    if (resultsCount) resultsCount.textContent = `ЗАПИСЕЙ: ${results.length}`;

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="eis-no-results">Записи не найдены</div>';
        return;
    }

    const canEdit = window.currentProfile && [
        'inspector_odps', 'inspector_reo',
        'chief_odps', 'chief_reo', 'chief_cuipp', 'chief_vai'
    ].includes(window.currentProfile.role);

    let html = '';

    results.forEach(vu => {
        const status = getVUStatus(vu.expiryDate, vu.state);
        const isArchived = vu.state === 'Архив';

        html += `
            <div class="eis-vu-record" data-id="${vu.id}">
                <div class="eis-vu-record-header">
                    <div class="eis-vu-number">${vu.vuNumber}</div>
                    <div class="eis-vu-record-header-right">
                        <div class="eis-vu-status ${status.class}">${status.text}</div>
                        ${canEdit ? `
                            <div class="eis-vu-actions">
                                <button class="eis-btn eis-btn-sm eis-btn-secondary"
                                        onclick="openEditVUModal('${vu.id}')">Изменить</button>
                                <button class="eis-btn eis-btn-sm eis-btn-danger"
                                        onclick="deleteVU('${vu.id}', '${vu.vuNumber}')">Удалить</button>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="eis-vu-data">
                    <div class="eis-data-field"><div class="eis-data-label">ФИО</div><div class="eis-data-value">${vu.fio}</div></div>
                    <div class="eis-data-field"><div class="eis-data-label">Звание</div><div class="eis-data-value">${vu.rank}</div></div>
                    <div class="eis-data-field"><div class="eis-data-label">Дата выдачи</div><div class="eis-data-value">${formatDate(vu.issueDate)}</div></div>
                    <div class="eis-data-field"><div class="eis-data-label">Действительно до</div><div class="eis-data-value">${formatDate(vu.expiryDate)}</div></div>
                    <div class="eis-data-field"><div class="eis-data-label">Кем выдано</div><div class="eis-data-value">${vu.issuedBy}</div></div>
                    ${isArchived ? `<div class="eis-data-field"><div class="eis-data-label">Состояние</div><div class="eis-data-value" style="color: #888;">АРХИВ</div></div>` : ''}
                </div>

                ${(vu.photos.vu.length > 0 || vu.photos.exam.length > 0) ? `
                <div class="eis-documents-grid">
                    ${vu.photos.vu.length > 0 ? `
                    <div class="eis-document-thumb" onclick="openPhotoGallery(${JSON.stringify(vu.photos.vu).replace(/"/g, '&quot;')}, 0)">
                        <img src="${vu.photos.vu[0]}" alt="ВУ">
                        <div class="eis-document-label">ВУ</div>
                        ${vu.photos.vu.length > 1 ? `<div class="eis-photo-counter">1/${vu.photos.vu.length}</div>` : ''}
                    </div>` : ''}
                    ${vu.photos.exam.length > 0 ? `
                    <div class="eis-document-thumb" onclick="openPhotoGallery(${JSON.stringify(vu.photos.exam).replace(/"/g, '&quot;')}, 0)">
                        <img src="${vu.photos.exam[0]}" alt="Бланки">
                        <div class="eis-document-label">БЛАНКИ</div>
                        ${vu.photos.exam.length > 1 ? `<div class="eis-photo-counter">1/${vu.photos.exam.length}</div>` : ''}
                    </div>` : ''}
                </div>
                ` : ''}
            </div>
        `;
    });

    resultsContainer.innerHTML = html;
}

function searchVU() {
    const searchFIO = document.getElementById('searchFIO').value.toLowerCase().trim();
    const searchVU = document.getElementById('searchVU').value.toLowerCase().trim();
    const searchIssued = document.getElementById('searchIssued').value.toLowerCase().trim();
    const searchDateFrom = document.getElementById('searchDateFrom').value;
    const searchDateTo = document.getElementById('searchDateTo').value;
    const searchStatus = document.getElementById('searchStatus').value;

    let filtered = vuDatabase.filter(vu => {
        if (searchStatus !== 'archived' && vu.state === 'Архив') return false;
        if (searchFIO && !vu.fio.toLowerCase().includes(searchFIO)) return false;
        if (searchVU && !vu.vuNumber.toLowerCase().includes(searchVU)) return false;
        if (searchIssued && !vu.issuedBy.toLowerCase().includes(searchIssued)) return false;

        if (searchDateFrom) {
            const from = parseDate(searchDateFrom);
            const d = parseDate(vu.issueDate);
            if (from && d && d < from) return false;
        }
        if (searchDateTo) {
            const to = parseDate(searchDateTo);
            const d = parseDate(vu.issueDate);
            if (to && d && d > to) return false;
        }
        if (searchStatus) {
            const st = getVUStatus(vu.expiryDate, vu.state).status;
            if (st !== searchStatus) return false;
        }
        return true;
    });

    displayResults(filtered);
}

function resetSearch() {
    document.getElementById('searchForm').reset();
    const active = vuDatabase.filter(vu => vu.state !== 'Архив');
    displayResults(active);
}

function openEditVUModal(vuId) {
    const vu = vuDatabase.find(v => v.id === vuId);
    if (!vu) { showToast('Запись не найдена', 'error'); return; }

    const modal = document.getElementById('editVUModal');
    if (!modal) return;

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

    // logUpdate сам строит человеческий summary из changes
    await logUpdate('vu_update', 'military_ids', id, before, after, {
        summary_prefix: `Изменил ВУ ${number} (${lastName} ${firstName})`
    });

    closeEditVUModal();
    showToast(`ВУ ${number} обновлён`, 'success');
    await loadVUFromSupabase();
}

async function toggleArchiveVU(vuId) {
    const vu = vuDatabase.find(v => v.id === vuId);
    if (!vu) return;

    const isArchived = vu.status === 'archived';
    const newStatus = isArchived ? 'active' : 'archived';
    const actionText = isArchived ? 'Разархивировать' : 'Архивировать';

    const ok = await showConfirm({
        title: actionText + ' ВУ',
        message: `${actionText} ВУ ${vu.vuNumber} (${vu.fio})?`,
        confirmText: actionText,
        type: 'default'
    });

    if (!ok) return;

    const { error } = await supabaseClient
        .from('military_ids')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', vuId);

    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    // logAction с готовой строкой summary
    await logAction('vu_status_change', 'military_ids', vuId, {
        kind: 'update',
        summary: `${isArchived ? 'Разархивировал' : 'Архивировал'} ВУ ${vu.vuNumber} (${vu.fio})`,
        changes: [{ field: 'status', from: vu.status, to: newStatus }],
        changed_count: 1
    });

    showToast(`ВУ ${vu.vuNumber} ${isArchived ? 'разархивировано' : 'архивировано'}`, 'success');
    await loadVUFromSupabase();
}

async function deleteVU(vuId, vuNumber) {
    const vu = vuDatabase.find(v => v.id === vuId);

    const ok = await showConfirm({
        title: 'Удаление ВУ',
        message: `Удалить ВУ ${vuNumber} (${vu ? vu.fio : ''})? Запись и фото будут удалены безвозвратно.`,
        confirmText: 'Удалить',
        type: 'danger'
    });

    if (!ok) return;

    const { data: fullRow } = await supabaseClient
        .from('military_ids').select('*').eq('id', vuId).single();

    if (vu && vu.photoUrl) {
        try {
            const fileName = extractFileNameFromUrl(vu.photoUrl);
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

    // 5-м аргументом СТРОКА-фраза
    await logDelete('vu_delete', 'military_ids', vuId, fullRow || vu,
        `Удалил ВУ ${vuNumber}${vu?.fio ? ' (' + vu.fio + ')' : ''}`);

    showToast(`ВУ ${vuNumber} удалён`, 'success');
    await loadVUFromSupabase();
}

function extractFileNameFromUrl(url) {
    if (!url) return null;
    try {
        const parts = url.split('/vu-photos/');
        if (parts.length < 2) return null;
        return decodeURIComponent(parts[1]);
    } catch (e) { return null; }
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('results')) {
        document.addEventListener('user-ready', () => {
            loadVUFromSupabase();
        }, { once: true });

        const searchInputs = document.querySelectorAll('#searchForm .eis-input, #searchForm .eis-select');
        searchInputs.forEach(input => {
            input.addEventListener('input', searchVU);
            input.addEventListener('change', searchVU);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeEditVUModal();
        });
    }
});

window.loadVUFromSupabase = loadVUFromSupabase;
window.displayResults = displayResults;
window.searchVU = searchVU;
window.resetSearch = resetSearch;
window.openEditVUModal = openEditVUModal;
window.closeEditVUModal = closeEditVUModal;
window.saveEditVU = saveEditVU;
window.toggleArchiveVU = toggleArchiveVU;
window.deleteVU = deleteVU;