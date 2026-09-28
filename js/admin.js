// ================================================================
// АДМИН-ПАНЕЛЬ — ЕИС ВАИ
// ================================================================

let allUsers = [];
let currentResetUserId = null;
let currentResetUsername = '';
let auditFullCache = [];
let auditFilteredCache = [];
let auditLogCache = [];

async function loadStats() {
    const tables = [
        { key: 'statUsers', table: 'profiles' },
        { key: 'statVU', table: 'military_ids' },
        { key: 'statExams', table: 'exams' },
        { key: 'statTech', table: 'tech_inspections' },
        { key: 'statProtocols', table: 'protocols' },
        { key: 'statAudit', table: 'audit_log' }
    ];
    for (const t of tables) {
        const { count, error } = await supabaseClient
            .from(t.table).select('*', { count: 'exact', head: true });
        const el = document.getElementById(t.key);
        if (el) el.textContent = error ? '—' : (count ?? 0);
    }
}

// ================================================================
// ПОЛЬЗОВАТЕЛИ (без изменений)
// ================================================================
async function loadUsers() {
    const container = document.getElementById('usersContainer');
    if (!container) return;
    container.innerHTML = `<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка...</span></div>`;

    const { data, error } = await supabaseClient
        .from('profiles').select('*').order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="eis-no-results">⚠️ ${error.message}</div>`;
        return;
    }
    allUsers = data || [];
    renderUsers();
}

function renderUsers() {
    const container = document.getElementById('usersContainer');
    if (!container) return;
    if (allUsers.length === 0) { container.innerHTML = '<div class="eis-no-results">Пользователей нет</div>'; return; }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>Логин</th><th>ФИО</th><th>Звание</th><th>Должность</th><th>Роль</th><th>Создан</th><th>Действия</th>';
    html += '</tr></thead><tbody>';

    allUsers.forEach(u => {
        const roleLabel = ROLE_LABELS[u.role] || u.role;
        const roleClass = u.role === 'chief_vai' ? 'eis-role-chief' : 'eis-role-other';
        const created = u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—';

        html += `<tr>
            <td><strong>${escapeHtml(u.username)}</strong></td>
            <td>${escapeHtml(u.full_name || '')}</td>
            <td>${escapeHtml(u.rank || '')}</td>
            <td>${escapeHtml(u.position || '—')}</td>
            <td><span class="eis-role-badge ${roleClass}">${escapeHtml(roleLabel)}</span></td>
            <td>${created}</td>
            <td class="eis-admin-actions">
                <button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openEditUserModal('${u.id}')">Изменить</button>
                <button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openResetPasswordModal('${u.id}', '${escapeHtml(u.username)}')">Сбросить пароль</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ================================================================
// РЕДАКТИРОВАНИЕ / СОЗДАНИЕ / УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
// ================================================================
function openEditUserModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) { showToast('Пользователь не найден', 'error'); return; }
    const modal = document.getElementById('editUserModal');
    if (!modal) return;

    document.getElementById('euId').value = user.id;
    document.getElementById('euUsername').value = user.username || '';
    document.getElementById('euFullName').value = user.full_name || '';
    document.getElementById('euRank').value = user.rank || 'Ефрейтор';
    document.getElementById('euPosition').value = user.position || '';
    document.getElementById('euRole').value = user.role || 'cadet';
    document.getElementById('euError').textContent = '';
    modal.style.display = 'flex';
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.style.display = 'none';
}

async function saveEditUser() {
    const errEl = document.getElementById('euError');
    const btn = document.getElementById('euSaveBtn');
    errEl.textContent = '';

    const id = document.getElementById('euId').value;
    const username = document.getElementById('euUsername').value.trim();
    const fullName = document.getElementById('euFullName').value.trim();
    const rank = document.getElementById('euRank').value;
    const position = document.getElementById('euPosition').value.trim();
    const role = document.getElementById('euRole').value;

    if (!username || username.length < 3) { errEl.textContent = 'Логин не менее 3 символов'; return; }
    if (!/^[a-z0-9_]+$/i.test(username)) { errEl.textContent = 'Логин: только латиница, цифры и _'; return; }
    if (!fullName) { errEl.textContent = 'Укажите ФИО'; return; }

    const targetUser = allUsers.find(u => u.id === id);
    const isMe = id === window.currentUser?.id;
    if (isMe && targetUser?.role === 'chief_vai' && role !== 'chief_vai') {
        errEl.textContent = 'Нельзя снять с себя роль Начальника ВАИ';
        return;
    }

    const { data: existing } = await supabaseClient
        .from('profiles').select('id').eq('username', username).neq('id', id).maybeSingle();
    if (existing) { errEl.textContent = `Логин "${username}" уже занят`; return; }

    const { data: before } = await supabaseClient.from('profiles').select('*').eq('id', id).single();

    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    const oldUsername = targetUser?.username || '';
    if (username !== oldUsername) {
        const { error: rpcError } = await supabaseClient.rpc('admin_update_user_login', {
            p_user_id: id, p_new_username: username
        });
        if (rpcError) {
            btn.disabled = false; btn.textContent = 'Сохранить';
            errEl.textContent = 'Ошибка смены логина: ' + rpcError.message;
            showToast('Ошибка: ' + rpcError.message, 'error');
            return;
        }
    }

    const { error } = await supabaseClient.from('profiles').update({
        full_name: fullName, rank, position, role,
        updated_at: new Date().toISOString()
    }).eq('id', id);

    btn.disabled = false; btn.textContent = 'Сохранить';

    if (error) { errEl.textContent = 'Ошибка: ' + error.message; showToast('Ошибка: ' + error.message, 'error'); return; }

    const { data: after } = await supabaseClient.from('profiles').select('*').eq('id', id).single();

    // Если логин изменился, но поле username в snapshot не поменялось (т.к. RPC),
    // вручную добавим в extra
    await logUpdate('admin_user_update', 'profiles', id, before, after, {
        target_user: fullName || username,
        login_changed: username !== oldUsername
    });

    if (isMe) {
        showToast('Профиль обновлён. Перезагрузка...', 'success');
        setTimeout(() => window.location.reload(), 800);
        return;
    }
    closeEditUserModal();
    await loadUsers();
    await loadAuditLog();
    showToast(`Пользователь "${username}" обновлён`, 'success');
}

async function deleteUserFromModal() {
    const id = document.getElementById('euId').value;
    const username = document.getElementById('euUsername').value.trim();
    closeEditUserModal();
    await new Promise(r => setTimeout(r, 250));
    await deleteUser(id, username);
}

function openCreateUserModal() {
    document.getElementById('createUserForm').reset();
    document.getElementById('cuError').textContent = '';
    document.getElementById('createUserModal').style.display = 'flex';
}

function closeCreateUserModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

async function submitCreateUser() {
    const errEl = document.getElementById('cuError');
    const btn = document.getElementById('cuSubmitBtn');
    errEl.textContent = '';

    const username = document.getElementById('cuUsername').value.trim();
    const password = document.getElementById('cuPassword').value;
    const fullName = document.getElementById('cuFullName').value.trim();
    const rank = document.getElementById('cuRank').value;
    const role = document.getElementById('cuRole').value;
    const position = document.getElementById('cuPosition').value.trim();

    if (!username || !password || !fullName || !role) { errEl.textContent = 'Заполните обязательные поля'; return; }
    if (username.length < 3) { errEl.textContent = 'Логин не менее 3 символов'; return; }
    if (!/^[a-z0-9_]+$/i.test(username)) { errEl.textContent = 'Логин: только латиница, цифры и _'; return; }
    if (password.length < 6) { errEl.textContent = 'Пароль не менее 6 символов'; return; }

    btn.disabled = true; btn.textContent = 'Создание...';
    const { data, error } = await supabaseClient.rpc('admin_create_user', {
        p_username: username, p_password: password,
        p_full_name: fullName, p_rank: rank,
        p_position: position, p_role: role
    });
    btn.disabled = false; btn.textContent = 'Создать';

    if (error) { errEl.textContent = error.message; showToast('Ошибка: ' + error.message, 'error'); return; }

    let snapshot = { username, full_name: fullName, rank, role, position };
    if (data?.user_id) {
        const { data: prof } = await supabaseClient.from('profiles').select('*').eq('id', data.user_id).single();
        if (prof) snapshot = prof;
    }

    await logCreate('admin_user_create', 'profiles', data?.user_id, snapshot,
        `Создал пользователя «${username}» (${fullName}, ${ROLE_LABELS[role] || role})`);

    closeCreateUserModal();
    await loadUsers();
    await loadStats();
    await loadAuditLog();
    showToast(`Пользователь "${username}" создан`, 'success');
}

async function deleteUser(userId, username) {
    if (userId === window.currentUser?.id) { showToast('Нельзя удалить себя', 'warning'); return; }

    const ok = await showConfirm({
        title: 'Удаление пользователя',
        message: `Удалить пользователя "${username}"? Это действие необратимо.`,
        confirmText: 'Удалить', type: 'danger'
    });
    if (!ok) return;

    const { data: before } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();
    const { error } = await supabaseClient.rpc('admin_delete_user', { p_user_id: userId });
    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    await logDelete('admin_user_delete', 'profiles', userId, before,
        `Удалил пользователя «${username}»`);

    await loadUsers(); await loadStats(); await loadAuditLog();
    showToast('Пользователь удалён', 'success');
}

function openResetPasswordModal(userId, username) {
    currentResetUserId = userId;
    currentResetUsername = username;
    document.getElementById('rpNewPassword').value = '';
    document.getElementById('rpError').textContent = '';
    document.getElementById('resetPasswordModal').style.display = 'flex';
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').style.display = 'none';
    currentResetUserId = null; currentResetUsername = '';
}

async function submitResetPassword() {
    if (!currentResetUserId) return;
    const errEl = document.getElementById('rpError'); errEl.textContent = '';
    const newPass = document.getElementById('rpNewPassword').value;
    if (newPass.length < 6) { errEl.textContent = 'Пароль не менее 6 символов'; return; }

    const { error } = await supabaseClient.rpc('admin_reset_password', {
        p_user_id: currentResetUserId, p_new_password: newPass
    });
    if (error) { errEl.textContent = error.message; showToast('Ошибка: ' + error.message, 'error'); return; }

    await logAction('admin_password_reset', 'profiles', currentResetUserId, {
        kind: 'other',
        summary: `Сбросил пароль пользователю «${currentResetUsername}»`
    });

    closeResetPasswordModal(); await loadAuditLog();
    showToast('Пароль сброшен', 'success');
}

// ================================================================
// AUDIT LOG
// ================================================================
async function loadAuditLog() {
    const container = document.getElementById('auditContainer');
    if (!container) return;

    auditFullCache = [];
    container.innerHTML = `<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка...</span></div>`;

    const { data, error } = await supabaseClient
        .from('audit_log').select('*')
        .order('created_at', { ascending: false }).limit(500);

    if (error) { container.innerHTML = `<div class="eis-no-results">Ошибка: ${escapeHtml(error.message)}</div>`; return; }
    if (!data || data.length === 0) { container.innerHTML = '<div class="eis-no-results">Записей пока нет</div>'; return; }

    const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
    let userMap = {};
    if (userIds.length) {
        const { data: profiles } = await supabaseClient
            .from('profiles').select('id, username, full_name, rank, role, position')
            .in('id', userIds);
        (profiles || []).forEach(p => { userMap[p.id] = p; });
    }

    auditFullCache = data.map(row => ({ ...row, _profile: userMap[row.user_id] || null }));
    fillAuditFilters();
    applyAuditFilters();
}

function fillAuditFilters() {
    const userSel = document.getElementById('auditFilterUser');
    const actionSel = document.getElementById('auditFilterAction');
    const entitySel = document.getElementById('auditFilterEntity');
    if (!userSel || !actionSel || !entitySel) return;

    const usersMap = {};
    auditFullCache.forEach(r => {
        if (r.user_id) {
            const p = r._profile || {};
            usersMap[r.user_id] = p.full_name || p.username || r.user_id.slice(0, 8);
        }
    });
    userSel.innerHTML = '<option value="">Все пользователи</option>' +
        Object.entries(usersMap).sort((a, b) => a[1].localeCompare(b[1]))
            .map(([id, name]) => `<option value="${id}">${escapeHtml(name)}</option>`).join('');

    const actions = [...new Set(auditFullCache.map(r => r.action).filter(Boolean))].sort();
    actionSel.innerHTML = '<option value="">Все действия</option>' +
        actions.map(a => `<option value="${a}">${escapeHtml(humanizeAction(a))}</option>`).join('');

    const entities = [...new Set(auditFullCache.map(r => r.entity_type).filter(Boolean))].sort();
    entitySel.innerHTML = '<option value="">Все объекты</option>' +
        entities.map(e => `<option value="${e}">${escapeHtml(e)}</option>`).join('');
}

function resetAuditFilters() {
    document.getElementById('auditFilterUser').value = '';
    document.getElementById('auditFilterAction').value = '';
    document.getElementById('auditFilterEntity').value = '';
    document.getElementById('auditFilterQuery').value = '';
    applyAuditFilters();
}

function applyAuditFilters() {
    const userId = document.getElementById('auditFilterUser')?.value || '';
    const action = document.getElementById('auditFilterAction')?.value || '';
    const entity = document.getElementById('auditFilterEntity')?.value || '';
    const q = (document.getElementById('auditFilterQuery')?.value || '').toLowerCase().trim();

    auditFilteredCache = auditFullCache.filter(r => {
        if (userId && r.user_id !== userId) return false;
        if (action && r.action !== action) return false;
        if (entity && r.entity_type !== entity) return false;
        if (q) {
            const d = r.details || {};
            const haystack = [
                d.summary, d.vu_number, d.reg_number, d.card_number, d.username,
                d.plate_number, d.target_username, d.target_fio, d.target_user,
                r._profile?.full_name, r._profile?.username
            ].filter(Boolean).join(' ').toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        return true;
    });

    renderAuditTable();
}

function renderAuditTable() {
    const container = document.getElementById('auditContainer');
    if (!container) return;

    if (auditFilteredCache.length === 0) {
        container.innerHTML = '<div class="eis-no-results">По фильтрам ничего не найдено</div>';
        return;
    }

    auditLogCache = auditFilteredCache;

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>Время</th><th>Кто</th><th>Что сделал</th><th></th>';
    html += '</tr></thead><tbody>';

    auditFilteredCache.forEach((row, index) => {
        const p = row._profile || {};
        const userName = p.full_name
            ? `${p.rank ? p.rank + ' ' : ''}${p.full_name}`
            : (p.username || '—');

        const time = row.created_at
            ? new Date(row.created_at).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit'
            })
            : '—';

        const summary = row.details?.summary || '—';
        const action = humanizeAction(row.action);

        html += `<tr>
            <td class="eis-audit-time">${time}</td>
            <td>
                <div style="font-weight:600;font-size:13px;">${escapeHtml(userName)}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">${escapeHtml(p.position || '')}</div>
            </td>
            <td>
                <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">${escapeHtml(action)}</div>
                <div style="font-size:13px;line-height:1.4;">${escapeHtml(summary)}</div>
            </td>
            <td>
                <button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openAuditDetailModal(${index})">Детали</button>
            </td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function humanizeAction(action) {
    const map = {
        'vu_create': 'Создание ВУ',
        'vu_update': 'Редактирование ВУ',
        'vu_status_change': 'Смена статуса ВУ',
        'vu_delete': 'Удаление ВУ',
        'exam_create': 'Создание экзамена',
        'tech_create': 'Создание ТО',
        'tech_update': 'Редактирование ТО',
        'tech_delete': 'Удаление ТО',
        'vehicle_create': 'Добавление ТС',
        'vehicle_update': 'Редактирование ТС',
        'vehicle_delete': 'Удаление ТС',
        'protocol_create': 'Создание протокола',
        'protocol_update': 'Редактирование протокола',
        'protocol_delete': 'Удаление протокола',
        'staff_update': 'Изменение личного дела',
        'staff_manage': 'Управление составом',
        'admin_user_create': 'Создание пользователя',
        'admin_user_update': 'Редактирование пользователя',
        'admin_user_delete': 'Удаление пользователя',
        'admin_role_change': 'Смена роли',
        'admin_password_reset': 'Сброс пароля',
        'tech_appointment_create': 'Запись на ТО',
        'tech_appointment_delete': 'Отмена записи на ТО'
    };
    return map[action] || action;
}

// ================================================================
// МОДАЛКА ДЕТАЛЕЙ
// ================================================================
function openAuditDetailModal(index) {
    const row = auditLogCache[index];
    if (!row) { showToast('Запись не найдена', 'error'); return; }
    const modal = document.getElementById('auditDetailModal');
    if (!modal) return;

    const d = row.details || {};
    const p = row._profile || {};

    document.getElementById('adAction').textContent = humanizeAction(row.action);
    document.getElementById('adActionCode').textContent = row.action || '—';

    const userName = p.full_name
        ? `${p.rank ? p.rank + ' ' : ''}${p.full_name}`
        : (p.username || '—');
    const timeFull = row.created_at
        ? new Date(row.created_at).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
        : '—';

    // Контекст
    document.getElementById('adFields').innerHTML = `
        <div class="eis-audit-detail-row">
            <div class="eis-audit-detail-label">Что сделал</div>
            <div class="eis-audit-detail-value" style="font-size:14px;">${escapeHtml(d.summary || '—')}</div>
        </div>
        <div class="eis-audit-detail-row">
            <div class="eis-audit-detail-label">Кто</div>
            <div class="eis-audit-detail-value">${escapeHtml(userName)}${p.position ? ' — ' + escapeHtml(p.position) : ''}</div>
        </div>
        <div class="eis-audit-detail-row">
            <div class="eis-audit-detail-label">Когда</div>
            <div class="eis-audit-detail-value">${escapeHtml(timeFull)}</div>
        </div>
    `;

    // Изменения — таблица «было → стало» на русском
    const changesSection = document.getElementById('adChangesSection');
    if (d.changes && Array.isArray(d.changes) && d.changes.length > 0) {
        document.getElementById('adChangesTitle').textContent = 'Что изменилось';
        document.getElementById('adChangesCount').textContent = `${d.changes.length} пол.`;
        document.getElementById('adChanges').innerHTML = buildChangesTable(d.changes);
        changesSection.style.display = '';
    } else {
        changesSection.style.display = 'none';
    }

    // Снимок созданной записи
    const createdSection = document.getElementById('adCreatedSection');
    if (d.snapshot && d.kind === 'create') {
        document.getElementById('adCreated').innerHTML = buildSnapshotTable(d.snapshot);
        createdSection.style.display = '';
    } else {
        createdSection.style.display = 'none';
    }

    // Снимок удалённой записи
    const deletedSection = document.getElementById('adDeletedSection');
    if (d.snapshot && d.kind === 'delete') {
        document.getElementById('adDeleted').innerHTML = buildSnapshotTable(d.snapshot);
        deletedSection.style.display = '';
    } else {
        deletedSection.style.display = 'none';
    }

    // Сырой JSON — скрыт по умолчанию
    document.getElementById('adDetails').innerHTML =
        `<pre>${escapeHtml(JSON.stringify(row.details || {}, null, 2))}</pre>`;
    document.getElementById('adDetails').style.display = 'none';
    document.getElementById('adRawToggle').textContent = '▶';
    document.getElementById('adExtraSection').style.display = 'none';

    document.getElementById('adCopyBtn').onclick = () => {
        navigator.clipboard.writeText(JSON.stringify(row, null, 2)).then(
            () => showToast('Скопировано', 'success'),
            () => showToast('Не удалось скопировать', 'error')
        );
    };

    modal.style.display = 'flex';
}

function buildChangesTable(changes) {
    let html = '<table class="eis-audit-changes-table"><thead><tr>';
    html += '<th>Поле</th><th>Было</th><th>Стало</th></tr></thead><tbody>';

    changes.forEach(c => {
        html += `<tr>
            <td class="eis-audit-field-name">${escapeHtml(fieldLabel(c.field))}</td>
            <td><span class="eis-audit-old">${escapeHtml(humanValue(c.field, c.from))}</span></td>
            <td><span class="eis-audit-new">${escapeHtml(humanValue(c.field, c.to))}</span></td>
        </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

function buildSnapshotTable(obj) {
    const entries = Object.entries(obj).filter(([k, v]) => v !== null && v !== '');
    if (entries.length === 0) return '<div style="color:#888;font-style:italic;">Нет данных</div>';

    let html = '<table class="eis-audit-changes-table"><thead><tr>';
    html += '<th style="width:40%;">Поле</th><th>Значение</th></tr></thead><tbody>';

    entries.forEach(([k, v]) => {
        html += `<tr>
            <td class="eis-audit-field-name">${escapeHtml(fieldLabel(k))}</td>
            <td>${escapeHtml(humanValue(k, v))}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

function toggleRawAuditJson() {
    const el = document.getElementById('adDetails');
    const tg = document.getElementById('adRawToggle');
    if (!el) return;
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
    if (tg) tg.textContent = isHidden ? '▼' : '▶';
}

function closeAuditDetailModal() {
    const modal = document.getElementById('auditDetailModal');
    if (modal) modal.style.display = 'none';
}

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
    if (!document.getElementById('usersContainer')) return;

    document.addEventListener('user-ready', async () => {
        await loadStats();
        await loadUsers();
        await loadAuditLog();
    }, { once: true });

    document.querySelectorAll('.eis-modal-form').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCreateUserModal(); closeResetPasswordModal();
            closeAuditDetailModal(); closeEditUserModal();
        }
    });
});

window.loadStats = loadStats;
window.loadUsers = loadUsers;
window.loadAuditLog = loadAuditLog;
window.applyAuditFilters = applyAuditFilters;
window.resetAuditFilters = resetAuditFilters;
window.openCreateUserModal = openCreateUserModal;
window.closeCreateUserModal = closeCreateUserModal;
window.submitCreateUser = submitCreateUser;
window.openResetPasswordModal = openResetPasswordModal;
window.closeResetPasswordModal = closeResetPasswordModal;
window.submitResetPassword = submitResetPassword;
window.deleteUser = deleteUser;
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.saveEditUser = saveEditUser;
window.deleteUserFromModal = deleteUserFromModal;
window.openAuditDetailModal = openAuditDetailModal;
window.closeAuditDetailModal = closeAuditDetailModal;
window.toggleRawAuditJson = toggleRawAuditJson;