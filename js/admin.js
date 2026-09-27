// ================================================================
// АДМИН-ПАНЕЛЬ — ЕИС ВАИ
// ================================================================

let allUsers = [];
let currentResetUserId = null;
let auditLogCache = [];

// ================================================================
// СТАТИСТИКА
// ================================================================
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
            .from(t.table)
            .select('*', { count: 'exact', head: true });

        const el = document.getElementById(t.key);
        if (el) {
            el.textContent = error ? '—' : (count ?? 0);
        }
    }
}

// ================================================================
// ПОЛЬЗОВАТЕЛИ
// ================================================================
async function loadUsers() {
    const container = document.getElementById('usersContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="eis-loading">
            <div class="eis-spinner"></div>
            <span>Загрузка пользователей...</span>
        </div>
    `;

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `
            <div class="eis-no-results">
                <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
                <div>${error.message}</div>
            </div>
        `;
        return;
    }

    allUsers = data || [];
    renderUsers();
}

function renderUsers() {
    const container = document.getElementById('usersContainer');
    if (!container) return;

    if (allUsers.length === 0) {
        container.innerHTML = '<div class="eis-no-results">Пользователей нет</div>';
        return;
    }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>Логин</th><th>ФИО</th><th>Звание</th><th>Должность</th><th>Роль</th><th>Создан</th><th>Действия</th>';
    html += '</tr></thead><tbody>';

    allUsers.forEach(u => {
        const roleLabel = ROLE_LABELS[u.role] || u.role;
        const roleClass = u.role === 'chief_vai' ? 'eis-role-chief' : 'eis-role-other';
        const created = u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—';

        html += `<tr>
            <td><strong>${escapeHtml(u.username)}</strong></td>
            <td>${escapeHtml(u.full_name)}</td>
            <td>${escapeHtml(u.rank || '')}</td>
            <td>${escapeHtml(u.position || '—')}</td>
            <td><span class="eis-role-badge ${roleClass}">${escapeHtml(roleLabel)}</span></td>
            <td>${created}</td>
            <td class="eis-admin-actions">
                <button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openEditUserModal('${u.id}')">
                    Изменить
                </button>
                <button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openResetPasswordModal('${u.id}', '${escapeHtml(u.username)}')">
                    Сбросить пароль
                </button>
            </td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function renderRoleOptions(currentRole) {
    const roles = [
        ['cadet', 'Курсант'],
        ['inspector_odps', 'Инспектор ОДПС'],
        ['inspector_reo', 'Инспектор РЭО'],
        ['chief_odps', 'Начальник ОДПС'],
        ['chief_reo', 'Начальник РЭО'],
        ['chief_cuipp', 'Начальник ЦУиПП'],
        ['chief_vai', 'Начальник ВАИ']
    ];

    return roles.map(([val, label]) =>
        `<option value="${val}" ${val === currentRole ? 'selected' : ''}>${label}</option>`
    ).join('');
}

// ================================================================
// РЕДАКТИРОВАНИЕ ПОЛЬЗОВАТЕЛЯ
// ================================================================
function openEditUserModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showToast('Пользователь не найден', 'error');
        return;
    }

    const modal = document.getElementById('editUserModal');
    if (!modal) return;

    // Заполняем поля
    document.getElementById('euId').value = user.id;
    document.getElementById('euUsername').value = user.username || '';
    document.getElementById('euFullName').value = user.full_name || '';
    document.getElementById('euRank').value = user.rank || 'Ефрейтор';
    document.getElementById('euPosition').value = user.position || '';
    document.getElementById('euRole').value = user.role || 'cadet';

    // Ошибку сбрасываем
    document.getElementById('euError').textContent = '';

    // Показываем
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

    // Валидация
    if (!username || username.length < 3) {
        errEl.textContent = 'Логин должен быть не менее 3 символов';
        return;
    }

    if (!/^[a-z0-9_]+$/i.test(username)) {
        errEl.textContent = 'Логин: только латиница, цифры и _';
        return;
    }

    if (!fullName) {
        errEl.textContent = 'Укажите ФИО';
        return;
    }

    // Защита: не позволяем снять с себя роль chief_vai
    const targetUser = allUsers.find(u => u.id === id);
    const isMe = id === window.currentUser?.id;

    if (isMe && targetUser?.role === 'chief_vai' && role !== 'chief_vai') {
        errEl.textContent = 'Нельзя снять с себя роль Начальника ВАИ';
        return;
    }

    // Проверка уникальности логина
    const { data: existing } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', id)
        .maybeSingle();

    if (existing) {
        errEl.textContent = `Логин "${username}" уже занят`;
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    // Если логин изменился — сначала меняем email через RPC
    const oldUsername = targetUser?.username || '';
    if (username !== oldUsername) {
        const { data: rpcData, error: rpcError } = await supabaseClient.rpc('admin_update_user_login', {
            p_user_id: id,
            p_new_username: username
        });

        if (rpcError) {
            btn.disabled = false;
            btn.textContent = 'Сохранить';
            errEl.textContent = 'Ошибка смены логина: ' + rpcError.message;
            showToast('Ошибка смены логина: ' + rpcError.message, 'error');
            return;
        }

        console.log('Логин/email изменены:', rpcData);
    }

    // Обновляем остальные поля профиля
    const { error } = await supabaseClient
        .from('profiles')
        .update({
            full_name: fullName,
            rank: rank,
            position: position,
            role: role,
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

    // Логируем
    await logAction('admin_user_update', 'profiles', id, {
        username: username,
        role: role,
		login_changed: username !== oldUsername
    });

    // Если редактировали себя — перезагрузим страницу
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

// Удаление из модалки
async function deleteUserFromModal() {
    const id = document.getElementById('euId').value;
    const username = document.getElementById('euUsername').value.trim();

    // Закрываем модалку редактирования
    closeEditUserModal();

    // Небольшая задержка, чтобы модалки не накладывались
    await new Promise(r => setTimeout(r, 250));

    // Вызываем существующий deleteUser
    await deleteUser(id, username);
}

// ================================================================
// СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ
// ================================================================
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

    if (!username || !password || !fullName || !role) {
        errEl.textContent = 'Заполните обязательные поля';
        showToast('Заполните обязательные поля', 'warning');
        return;
    }

    if (username.length < 3) {
        errEl.textContent = 'Логин должен быть не менее 3 символов';
        showToast('Логин должен быть не менее 3 символов', 'warning');
        return;
    }

    if (!/^[a-z0-9_]+$/i.test(username)) {
        errEl.textContent = 'Логин может содержать только латиницу, цифры и _';
        showToast('Логин: только латиница, цифры и _', 'warning');
        return;
    }

    if (password.length < 6) {
        errEl.textContent = 'Пароль должен быть не менее 6 символов';
        showToast('Пароль должен быть не менее 6 символов', 'warning');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Создание...';

    const { data, error } = await supabaseClient.rpc('admin_create_user', {
        p_username: username,
        p_password: password,
        p_full_name: fullName,
        p_rank: rank,
        p_position: position,
        p_role: role
    });

    btn.disabled = false;
    btn.textContent = 'Создать';

    if (error) {
        errEl.textContent = error.message;
        showToast('Ошибка: ' + error.message, 'error');
        return;
    }

    await logAction('admin_user_create', 'profiles', data?.user_id, {
        username, role
    });

    closeCreateUserModal();
    await loadUsers();
    await loadStats();
    await loadAuditLog();
    showToast(`Пользователь "${username}" создан`, 'success');
}

// ================================================================
// УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ (confirm + RPC + лог)
// ================================================================
async function deleteUser(userId, username) {
    if (userId === window.currentUser?.id) {
        showToast('Нельзя удалить себя', 'warning');
        return;
    }

    const ok = await showConfirm({
        title: 'Удаление пользователя',
        message: `Удалить пользователя "${username}"? Это действие необратимо.`,
        confirmText: 'Удалить',
        type: 'danger'
    });

    if (!ok) return;

    const { data, error } = await supabaseClient.rpc('admin_delete_user', {
        p_user_id: userId
    });

    if (error) {
        showToast('Ошибка: ' + error.message, 'error');
        return;
    }

    await logAction('admin_user_delete', 'profiles', userId, { username });
    await loadUsers();
    await loadStats();
    await loadAuditLog();
    showToast('Пользователь удалён', 'success');
}

// ================================================================
// СБРОС ПАРОЛЯ
// ================================================================
function openResetPasswordModal(userId, username) {
    currentResetUserId = userId;
    document.getElementById('rpNewPassword').value = '';
    document.getElementById('rpError').textContent = '';
    document.getElementById('resetPasswordModal').style.display = 'flex';
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').style.display = 'none';
    currentResetUserId = null;
}

async function submitResetPassword() {
    if (!currentResetUserId) return;

    const errEl = document.getElementById('rpError');
    errEl.textContent = '';

    const newPass = document.getElementById('rpNewPassword').value;
    if (newPass.length < 6) {
        errEl.textContent = 'Пароль должен быть не менее 6 символов';
        showToast('Пароль должен быть не менее 6 символов', 'warning');
        return;
    }

    const { error } = await supabaseClient.rpc('admin_reset_password', {
        p_user_id: currentResetUserId,
        p_new_password: newPass
    });

    if (error) {
        errEl.textContent = error.message;
        showToast('Ошибка: ' + error.message, 'error');
        return;
    }

    await logAction('admin_password_reset', 'profiles', currentResetUserId, {});
    closeResetPasswordModal();
    await loadAuditLog();
    showToast('Пароль сброшен', 'success');
}

// ================================================================
// AUDIT LOG
// ================================================================
async function loadAuditLog() {
    const container = document.getElementById('auditContainer');
    if (!container) return;

    auditLogCache = [];

    container.innerHTML = `
        <div class="eis-loading">
            <div class="eis-spinner"></div>
            <span>Загрузка...</span>
        </div>
    `;

    const { data, error } = await supabaseClient
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        container.innerHTML = `<div class="eis-no-results">Ошибка: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="eis-no-results">Записей пока нет</div>';
        return;
    }

    const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
    let userMap = {};

    if (userIds.length > 0) {
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, username, full_name, rank')
            .in('id', userIds);

        (profiles || []).forEach(p => {
            userMap[p.id] = p;
        });
    }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>Время</th><th>Пользователь</th><th>Действие</th><th>Объект</th><th>Детали</th><th></th>';
    html += '</tr></thead><tbody>';

    data.forEach((row, index) => {
        const u = userMap[row.user_id];
        const userName = u ? `${u.rank || ''} ${u.full_name || u.username}`.trim() : '—';
        const time = row.created_at ? new Date(row.created_at).toLocaleString('ru-RU') : '—';
        const action = humanizeAction(row.action);
        const details = row.details ? JSON.stringify(row.details) : '';

        // Сохраняем запись в кэш по индексу
        auditLogCache[index] = {
            ...row,
            _userName: userName,
            _actionHuman: action
        };

        html += `<tr>
            <td class="eis-audit-time">${time}</td>
            <td>${escapeHtml(userName)}</td>
            <td><span class="eis-audit-action">${escapeHtml(action)}</span></td>
            <td>${escapeHtml(row.entity_type || '—')}${row.entity_id ? ' #' + escapeHtml(String(row.entity_id).slice(0, 8)) : ''}</td>
            <td class="eis-audit-details">${escapeHtml(details)}</td>
            <td>
                <button class="eis-btn eis-btn-sm eis-btn-secondary" onclick="openAuditDetailModal(${index})">
                    Подробнее
                </button>
            </td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function humanizeAction(action) {
    const map = {
        'vu_create': '📄 Создание ВУ',
        'vu_update': '✏️ Редактирование ВУ',
        'vu_status_change': '📦 Смена статуса ВУ',
        'vu_delete': '🗑 Удаление ВУ',

        'exam_create': '🎓 Создание экзамена',

        'tech_create': '📄 Создание ТО',
        'tech_update': '✏️ Редактирование ТО',
        'tech_delete': '🗑 Удаление ТО',

        'vehicle_create': '🚗 Добавление ТС в реестр',
        'vehicle_update': '✏️ Редактирование ТС',
        'vehicle_delete': '🗑 Удаление ТС из реестра',

        'protocol_create': '📋 Создание протокола',
        'protocol_update': '✏️ Редактирование протокола',
        'protocol_delete': '🗑 Удаление протокола',
        'admin_user_create': '👤 Создание пользователя',
        'admin_user_update': '✏️ Редактирование пользователя',
        'admin_user_delete': '🗑 Удаление пользователя',
        'admin_role_change': '🔄 Смена роли',
        'admin_password_reset': '🔐 Сброс пароля'
    };
    return map[action] || action;
}

// ================================================================
// МОДАЛКА ПОДРОБНОЙ ИНФОРМАЦИИ О ЗАПИСИ АУДИТА
// ================================================================
function openAuditDetailModal(index) {
    const row = auditLogCache[index];
    if (!row) {
        showToast('Запись не найдена', 'error');
        return;
    }

    const modal = document.getElementById('auditDetailModal');
    if (!modal) return;

    const time = row.created_at
        ? new Date(row.created_at).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
        : '—';

    document.getElementById('adAction').textContent = row._actionHuman || row.action;
    document.getElementById('adActionCode').textContent = row.action || '—';

    const fields = [
        ['ID записи', row.id || '—'],
        ['Время', time],
        ['Пользователь', row._userName || '—'],
        ['UUID пользователя', row.user_id || '—'],
        ['Тип объекта', row.entity_type || '—'],
        ['ID объекта', row.entity_id || '—']
    ];

    let fieldsHtml = '';
    fields.forEach(([label, value]) => {
        fieldsHtml += `
            <div class="eis-audit-detail-row">
                <div class="eis-audit-detail-label">${escapeHtml(label)}</div>
                <div class="eis-audit-detail-value">${escapeHtml(String(value))}</div>
            </div>
        `;
    });
    document.getElementById('adFields').innerHTML = fieldsHtml;

    const detailsEl = document.getElementById('adDetails');
    if (row.details && Object.keys(row.details).length > 0) {
        detailsEl.innerHTML = `<pre>${escapeHtml(JSON.stringify(row.details, null, 2))}</pre>`;
    } else {
        detailsEl.innerHTML = '<div style="color: #888; font-style: italic;">Нет дополнительных данных</div>';
    }

    const copyBtn = document.getElementById('adCopyBtn');
    copyBtn.onclick = () => {
        const text = JSON.stringify(row, null, 2);
        navigator.clipboard.writeText(text).then(() => {
            showToast('JSON скопирован в буфер обмена', 'success');
        }).catch(() => {
            showToast('Не удалось скопировать', 'error');
        });
    };

    modal.style.display = 'flex';
}

function closeAuditDetailModal() {
    const modal = document.getElementById('auditDetailModal');
    if (modal) modal.style.display = 'none';
}

// ================================================================
// УТИЛИТЫ
// ================================================================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCreateUserModal();
            closeResetPasswordModal();
            closeAuditDetailModal();
            closeEditUserModal();
        }
    });
});

// ================================================================
// ЭКСПОРТ
// ================================================================
window.loadStats = loadStats;
window.loadUsers = loadUsers;
window.loadAuditLog = loadAuditLog;
window.openCreateUserModal = openCreateUserModal;
window.closeCreateUserModal = closeCreateUserModal;
window.submitCreateUser = submitCreateUser;
window.openResetPasswordModal = openResetPasswordModal;
window.closeResetPasswordModal = closeResetPasswordModal;
window.submitResetPassword = submitResetPassword;
window.deleteUser = deleteUser;

// Редактирование пользователя
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.saveEditUser = saveEditUser;
window.deleteUserFromModal = deleteUserFromModal;

// Audit log — детали
window.openAuditDetailModal = openAuditDetailModal;
window.closeAuditDetailModal = closeAuditDetailModal;