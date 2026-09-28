// ================================================================
// АВТОРИЗАЦИЯ + ЖУРНАЛИРОВАНИЕ — ЕИС ВАИ
// ================================================================

async function signIn(username, password) {
    if (!username || !password) return { success: false, error: 'Введите логин и пароль' };
    const email = usernameToEmail(username);
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

function usernameToEmail(username) {
    return `${String(username).trim().toLowerCase()}@eis.local`;
}

async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error('Ошибка выхода:', error);
    window.location.href = 'login.html';
}

async function changePassword(newPassword) {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    return { success: !error, error: error?.message };
}

// ================================================================
// ЧИТАЕМЫЕ НАЗВАНИЯ ПОЛЕЙ — ЧТОБЫ ПИСАТЬ "Звание", а не "rank"
// ================================================================
const FIELD_LABELS = {
    vu_number: 'Номер ВУ', rank: 'звание', last_name: 'фамилия', first_name: 'имя',
    middle_name: 'отчество', issue_date: 'дата выдачи', expiry_date: 'срок действия',
    issued_by: 'кем выдано', status: 'статус',

    reg_number: 'номер протокола', protocol_date: 'дата составления',
    protocol_time: 'время составления', protocol_place: 'место составления',
    official_position: 'должность инспектора', official_rank: 'звание инспектора',
    official_name: 'ФИО инспектора', violator_last_name: 'фамилия нарушителя',
    violator_first_name: 'имя нарушителя', violator_middle_name: 'отчество нарушителя',
    violator_birth_date: 'дата рождения нарушителя', violator_birth_place: 'место рождения',
    russian_language: 'владение языком', registered_address: 'адрес регистрации',
    registered_phone: 'телефон (регистрация)', actual_address: 'адрес проживания',
    actual_phone: 'телефон (факт.)', work_place: 'место работы',
    driver_license: 'вод. удостоверение', vehicle_make: 'марка ТС',
    vehicle_color: 'цвет ТС', vehicle_plate: 'гос. номер', vehicle_owner: 'владелец ТС',
    vehicle_registered: 'состоит на учёте', violation_date: 'дата нарушения',
    violation_time: 'время нарушения', violation_place: 'место нарушения',
    violation_description: 'существо нарушения', article_part: 'часть статьи',
    article_number: 'статья КоАП', witnesses: 'свидетели',
    witnesses_notified: 'свидетели уведомлены', victims_notified: 'потерпевшие уведомлены',
    consideration_place_time: 'место/время рассмотрения', explanation: 'объяснения',
    remarks: 'замечания',

    card_number: 'номер карты', valid_until: 'действительно до',
    department: 'подразделение', check_type: 'тип проверки',
    plate_number: 'гос. номер', vehicle_make_model: 'марка и модель',
    vin: 'VIN', category: 'категория', year: 'год выпуска',
    sts_series: 'СТС серия', sts_number: 'СТС номер',
    sts_issued_by: 'СТС кем выдан', sts_issued_date: 'СТС когда выдан',
    mass_without_load: 'масса без нагрузки', max_mass: 'макс. масса',
    engine_power: 'мощность двигателя', mileage: 'пробег',
    conclusion: 'заключение', expert_date: 'дата осмотра', expert_name: 'ФИО эксперта',
    make_model: 'марка и модель', owner_unit: 'подразделение / часть',

    username: 'логин', full_name: 'ФИО', position: 'должность', role: 'роль',
    callsign: 'позывной', vehicle_id: 'закреплённая техника',
    personal_file_name: 'личное дело', in_staff: 'в составе', sort_order: 'порядок',

    scheduled_date: 'дата записи',
    scheduled_time: 'время записи',
    plate_number: 'гос. номер ТС',
    make_model: 'марка, модель',
    notes: 'примечание',
};

function fieldLabel(key) { return FIELD_LABELS[key] || key; }

// ================================================================
// ЧЕЛОВЕЧЕСКИЕ ПРЕОБРАЗОВАНИЯ ЗНАЧЕНИЙ
// ================================================================
function humanValue(key, value) {
    if (value === null || value === undefined || value === '') return '—';
    if (value === true) return 'Да';
    if (value === false) return 'Нет';

    // Даты
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const p = value.slice(0, 10).split('-');
        return `${p[2]}.${p[1]}.${p[0]}`;
    }
    if (key === 'role') {
        const map = {
            cadet: 'Курсант', inspector_odps: 'Инспектор ОДПС', inspector_reo: 'Инспектор РЭО',
            chief_odps: 'Начальник ОДПС', chief_reo: 'Начальник РЭО',
            chief_cuipp: 'Начальник ЦУиПП', chief_vai: 'Начальник ВАИ'
        };
        return map[value] || value;
    }
    if (key === 'status') return value === 'active' ? 'Активен' : value === 'archived' ? 'В архиве' : value;
    if (key === 'conclusion') return value === 'possible' ? 'Возможно' : value === 'impossible' ? 'Невозможно' : value;
    if (key === 'check_type') return value === 'primary' ? 'Первичная' : value === 'secondary' ? 'Вторичная' : value;
    if (key === 'in_staff') return value ? 'Да' : 'Нет';

    const s = String(value);
    return s.length > 120 ? s.slice(0, 120) + '…' : s;
}

// ================================================================
// ГЕНЕРАЦИЯ ЧЕЛОВЕЧЕСКОЙ ФРАЗЫ
// ================================================================
const AUDIT_SKIP_FIELDS = new Set([
    'id', 'created_at', 'updated_at', 'created_by',
    'photo_url', 'photo_url_2', 'photos',
    'personal_file_url', 'createdAt'
]);

function computeChanges(before, after, extraSkip = []) {
    if (!before || !after) return [];
    const skip = new Set([...AUDIT_SKIP_FIELDS, ...extraSkip]);
    const out = [];
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

    keys.forEach(key => {
        if (skip.has(key)) return;
        const a = normalizeVal(before[key]);
        const b = normalizeVal(after[key]);
        if (a !== b) out.push({ field: key, from: before[key], to: after[key] });
    });
    return out;
}

function normalizeVal(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    return String(v).trim();
}

// Собрать читаемую фразу из списка изменений
function humanizeChanges(changes) {
    if (!changes || changes.length === 0) return 'Изменений нет';

    return changes.map(c => {
        const label = fieldLabel(c.field);
        const from = humanValue(c.field, c.from);
        const to = humanValue(c.field, c.to);
        if (!c.from && c.to) return `${label} → ${to}`;
        if (c.from && !c.to) return `${label}: было «${from}», стёрли`;
        return `${label}: «${from}» → «${to}»`;
    }).join('; ');
}

// ================================================================
// БАЗОВЫЙ ЛОГ
// ================================================================
async function logAction(action, entityType, entityId, details = {}) {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const p = window.currentProfile || {};

        const meta = {
            ts: new Date().toISOString(),
            username: p.username || null,
            full_name: p.full_name || null,
            rank: p.rank || null,
            position: p.position || null,
            role: p.role || null,
            url: window.location.pathname + window.location.search
        };

        const { error } = await supabaseClient.from('audit_log').insert({
            user_id: user.id,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            details: { ...details, _meta: meta }
        });

        if (error) console.warn('[audit] ошибка записи:', error);
    } catch (e) {
        console.warn('[audit] не удалось записать:', e);
    }
}

// ================================================================
// ХЕЛПЕРЫ: СОЗДАНИЕ / ОБНОВЛЕНИЕ / УДАЛЕНИЕ
// ================================================================

// Создание — пишем что создали, в человеческом виде
async function logCreate(action, entityType, entityId, createdObject, summary) {
    return logAction(action, entityType, entityId, {
        kind: 'create',
        summary: summary || describeCreate(entityType, createdObject),
        snapshot: pickSnapshot(createdObject)
    });
}

// Обновление — пишем что изменилось и как
async function logUpdate(action, entityType, entityId, before, after, extra = {}) {
    const changes = computeChanges(before, after);
    const summary = humanizeChanges(changes);

    return logAction(action, entityType, entityId, {
        kind: 'update',
        summary: summary,
        changes: changes,
        changed_count: changes.length,
        ...extra
    });
}

// Удаление — пишем что удалили
async function logDelete(action, entityType, entityId, deletedObject, summary) {
    return logAction(action, entityType, entityId, {
        kind: 'delete',
        summary: summary || describeDelete(entityType, deletedObject),
        snapshot: pickSnapshot(deletedObject)
    });
}

// Снимок для create/delete — только читаемые поля
function pickSnapshot(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const out = {};
    Object.keys(obj).forEach(k => {
        if (AUDIT_SKIP_FIELDS.has(k)) return;
        const v = obj[k];
        if (v === null || v === undefined || v === '') return;
        out[k] = v;
    });
    return out;
}

// Человеческое описание создания
function describeCreate(entityType, obj) {
    if (!obj) return 'Создана запись';

    if (entityType === 'military_ids') {
        const fio = [obj.last_name, obj.first_name, obj.middle_name].filter(Boolean).join(' ');
        return `Создал ВУ ${obj.vu_number || '—'} для ${fio || 'неизвестного'} (${obj.rank || 'звание не указано'})`;
    }
    if (entityType === 'protocols') {
        const fio = [obj.violator_last_name, obj.violator_first_name].filter(Boolean).join(' ');
        const art = [obj.article_part, obj.article_number].filter(Boolean).join(' ст. ');
        return `Создал протокол ${obj.reg_number || '—'} на ${fio || 'неизвестного'} (${art || 'статья не указана'})`;
    }
    if (entityType === 'tech_inspections') {
        return `Создал карту ТО № ${obj.card_number || '—'} на ${obj.plate_number || '—'} (${obj.vehicle_make_model || '—'})`;
    }
    if (entityType === 'vehicles') {
        return `Добавил ТС ${obj.plate_number || '—'} — ${obj.make_model || '—'}`;
    }
    if (entityType === 'profiles') {
        return `Создал пользователя ${obj.username || '—'} (${obj.full_name || ''})`;
    }
    return 'Создана запись';
}

// Человеческое описание удаления
function describeDelete(entityType, obj) {
    if (!obj) return 'Удалена запись';

    if (entityType === 'military_ids') {
        const fio = [obj.last_name, obj.first_name].filter(Boolean).join(' ');
        return `Удалил ВУ ${obj.vu_number || '—'} (${fio || '—'})`;
    }
    if (entityType === 'protocols') {
        const fio = [obj.violator_last_name, obj.violator_first_name].filter(Boolean).join(' ');
        return `Удалил протокол ${obj.reg_number || '—'} (${fio || '—'})`;
    }
    if (entityType === 'tech_inspections') {
        return `Удалил карту ТО № ${obj.card_number || '—'} (${obj.plate_number || '—'})`;
    }
    if (entityType === 'vehicles') {
        return `Удалил ТС ${obj.plate_number || '—'} — ${obj.make_model || '—'}`;
    }
    if (entityType === 'profiles') {
        return `Удалил пользователя ${obj.username || '—'}`;
    }
    return 'Удалена запись';
}

// ================================================================
// ПЕРЕВОД ОШИБОК
// ================================================================
function translateAuthError(msg) {
    const map = {
        'Invalid login credentials': 'Неверный логин или пароль',
        'Email not confirmed': 'Email не подтверждён',
        'Too many requests': 'Слишком много попыток. Подождите немного',
        'User already registered': 'Пользователь с таким логином уже существует',
        'Password should be at least 6 characters': 'Пароль должен быть не менее 6 символов'
    };
    return map[msg] || msg;
}

// ================================================================
// ЭКСПОРТ
// ================================================================
window.signIn = signIn;
window.usernameToEmail = usernameToEmail;
window.signOut = signOut;
window.changePassword = changePassword;
window.logAction = logAction;
window.logCreate = logCreate;
window.logUpdate = logUpdate;
window.logDelete = logDelete;
window.fieldLabel = fieldLabel;
window.humanValue = humanValue;
window.humanizeChanges = humanizeChanges;
window.computeChanges = computeChanges;
window.FIELD_LABELS = FIELD_LABELS;
window.translateAuthError = translateAuthError;