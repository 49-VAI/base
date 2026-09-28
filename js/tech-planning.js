// ================================================================
// ПЛАНИРОВАНИЕ ТЕХОСМОТРОВ — ЕИС ВАИ
// Карта действительна максимум 1 месяц → планируем за 3 дня до истечения
// ================================================================

const PLAN_DEFAULT_CAPACITY = 5;   // ТС в день
const PLAN_DEFAULT_HORIZON = 15;   // дней до истечения — попадают в очередь
const PLAN_MAX_HORIZON = 30;   // т.к. карта действует 1 мес.
const PLAN_BUFFER_DAYS = 3;    // записываем за N дней до истечения

const PLAN_MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

let planAppointments = [];
let planCapacity = PLAN_DEFAULT_CAPACITY;
let planHorizon = PLAN_DEFAULT_HORIZON;
let planCurrentMonth = new Date();
let planUnplanned = [];

// ================================================================
// ОБЁРТКА НАД switchTechTab — поддержка вкладки "planning"
// ================================================================
window.switchTechTab = function (tab) {
    document.querySelectorAll('.eis-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.eis-tab-content').forEach(c => {
        c.classList.toggle('active', c.id === 'tab-' + tab);
    });

    if (tab === 'vehicles' && !window.vehiclesLoaded) {
        if (typeof loadVehiclesFromSupabase === 'function') loadVehiclesFromSupabase();
        window.vehiclesLoaded = true;
    }
    if (tab === 'planning') {
        loadPlanningData();
    }
};

// ================================================================
// ФОРМАТ ДАТЫ
// ================================================================
function planISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function planToday() {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return t;
}

// ================================================================
// ЗАГРУЗКА ДАННЫХ
// ================================================================
async function loadPlanningData() {
    if (typeof techDatabase !== 'undefined' && techDatabase.length === 0
        && typeof loadTechFromSupabase === 'function') {
        await loadTechFromSupabase();
    }

    planCapacity = parseInt(localStorage.getItem('tech_plan_capacity') || PLAN_DEFAULT_CAPACITY);
    planHorizon = parseInt(localStorage.getItem('tech_plan_horizon') || PLAN_DEFAULT_HORIZON);

    const capInput = document.getElementById('planningCapacity');
    const horInput = document.getElementById('planningHorizon');
    if (capInput) capInput.value = planCapacity;
    if (horInput) horInput.value = planHorizon;

    const { data, error } = await supabaseClient
        .from('tech_appointments')
        .select('*')
        .order('scheduled_date', { ascending: true });

    if (error) {
        console.warn('Ошибка загрузки appointments:', error);
        planAppointments = [];
        showToast('Не удалось загрузить записи: ' + error.message, 'error');
    } else {
        planAppointments = data || [];
    }

    renderPlanningTab();
}

function onPlanningCapacityChange() {
    const v = parseInt(document.getElementById('planningCapacity').value);
    if (!v || v < 1) return;
    planCapacity = v;
    localStorage.setItem('tech_plan_capacity', v);
    renderPlanningTab();
}

function onPlanningHorizonChange() {
    let v = parseInt(document.getElementById('planningHorizon').value);
    if (!v || v < 5) v = 5;
    if (v > PLAN_MAX_HORIZON) v = PLAN_MAX_HORIZON;
    planHorizon = v;
    document.getElementById('planningHorizon').value = v;
    localStorage.setItem('tech_plan_horizon', v);
    renderPlanningTab();
}

// ================================================================
// ОЧЕРЕДЬ ТС БЕЗ ЗАПИСИ
// ================================================================
function buildUnplannedList() {
    if (typeof techDatabase === 'undefined' || !techDatabase.length) {
        planUnplanned = [];
        return;
    }

    const today = planToday();
    const limit = new Date(today);
    limit.setDate(limit.getDate() + planHorizon);

    // Множество plate с активной записью
    const bookedPlates = new Set(
        planAppointments
            .filter(a => a.status === 'planned')
            .map(a => a.plate_number)
    );

    planUnplanned = techDatabase.filter(row => {
        if (!row.plate_number) return false;
        if (!row.valid_until) return false;
        const d = parseDate(row.valid_until);
        if (!d) return false;
        if (d > limit) return false;              // ещё далеко
        if (bookedPlates.has(row.plate_number)) return false; // уже записан
        return true;
    }).map(row => {
        const d = parseDate(row.valid_until);
        const daysLeft = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
        return { ...row, _daysLeft: daysLeft };
    }).sort((a, b) => a._daysLeft - b._daysLeft);
}

// ================================================================
// ЗАГРУЗКА ДНЯ
// ================================================================
function getDayLoad(isoDate) {
    return planAppointments.filter(a =>
        a.scheduled_date === isoDate && a.status === 'planned'
    ).length;
}

function getLoadClass(count) {
    if (count === 0) return 'empty';
    const ratio = count / planCapacity;
    if (ratio > 1) return 'overload';
    if (ratio >= 0.9) return 'almost-full';
    if (ratio >= 0.5) return 'half';
    return 'free';
}

// ================================================================
// РЕНДЕР
// ================================================================
function renderPlanningTab() {
    buildUnplannedList();
    renderPlanningStats();
    renderPlanningCalendar();
    renderPlanningQueue();
}

function renderPlanningStats() {
    const today = planToday();
    const todayISO = planISO(today);

    const todayCount = getDayLoad(todayISO);

    let weekCount = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(today); d.setDate(d.getDate() + i);
        weekCount += getDayLoad(planISO(d));
    }

    const y = planCurrentMonth.getFullYear();
    const m = planCurrentMonth.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let overloadDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const iso = planISO(new Date(y, m, day));
        if (getDayLoad(iso) > planCapacity) overloadDays++;
    }

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('planStatToday', `${todayCount} / ${planCapacity}`);
    set('planStatWeek', weekCount);
    set('planStatOverload', overloadDays);
    set('planStatUnplanned', planUnplanned.length);
}

function renderPlanningCalendar() {
    const grid = document.getElementById('planningGrid');
    const label = document.getElementById('planningMonthLabel');
    if (!grid || !label) return;

    const y = planCurrentMonth.getFullYear();
    const m = planCurrentMonth.getMonth();
    label.textContent = `${PLAN_MONTH_NAMES[m]} ${y}`;

    const firstDay = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const today = planToday();
    let html = '';

    for (let i = 0; i < startWeekday; i++) {
        html += '<div class="eis-plan-day is-empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(y, m, day);
        const iso = planISO(date);
        const isToday = date.getTime() === today.getTime();
        const isPast = date < today;
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        const load = getDayLoad(iso);
        const loadClass = getLoadClass(load);
        const pct = Math.min((load / planCapacity) * 100, 100);
        const hasAppts = load > 0;

        const classes = [
            'eis-plan-day',
            `load-${loadClass}`,
            isToday ? 'is-today' : '',
            isPast ? 'is-past' : '',
            isWeekend ? 'is-weekend' : '',
            hasAppts ? 'has-appts' : ''
        ].filter(Boolean).join(' ');

        const clickAttr = hasAppts ? `onclick="openDayAppointmentsModal('${iso}')"` : '';

        html += `<div class="${classes}" data-date="${iso}" ${clickAttr}>
            <div class="eis-plan-day-head">
                <span class="eis-plan-day-num">${day}</span>
                ${hasAppts ? `<span class="eis-plan-day-count">${load}/${planCapacity}</span>` : ''}
            </div>
            ${hasAppts ? `
                <div class="eis-plan-load-bar">
                    <div class="eis-plan-load-fill" style="width:${pct}%"></div>
                </div>
            ` : ''}
        </div>`;
    }

    const totalCells = startWeekday + daysInMonth;
    const rem = totalCells % 7;
    if (rem !== 0) {
        for (let i = 0; i < 7 - rem; i++) {
            html += '<div class="eis-plan-day is-empty"></div>';
        }
    }

    grid.innerHTML = html;
}

function planningPrevMonth() {
    planCurrentMonth.setMonth(planCurrentMonth.getMonth() - 1);
    renderPlanningCalendar();
    renderPlanningStats();
}

function planningNextMonth() {
    planCurrentMonth.setMonth(planCurrentMonth.getMonth() + 1);
    renderPlanningCalendar();
    renderPlanningStats();
}

function planningToday() {
    planCurrentMonth = new Date();
    renderPlanningCalendar();
    renderPlanningStats();
}

// ================================================================
// ОЧЕРЕДЬ
// ================================================================
function renderPlanningQueue() {
    const container = document.getElementById('planningQueue');
    const countEl = document.getElementById('planningQueueCount');
    if (!container) return;

    if (countEl) countEl.textContent = `ЗАПИСЕЙ: ${planUnplanned.length}`;

    if (planUnplanned.length === 0) {
        container.innerHTML = `<div class="eis-no-results">
            <div style="font-size:32px;margin-bottom:12px;">✅</div>
            <div style="font-weight:700;">Все ТС запланированы</div>
            <div style="font-size:13px;color:#888;margin-top:6px;">
                Нет ТС с истекающей картой без записи (горизонт — ${planHorizon} дн.)
            </div>
        </div>`;
        return;
    }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>Истекает</th><th>Осталось</th><th>Гос.номер</th><th>ТС</th><th>Эксперт</th><th></th>';
    html += '</tr></thead><tbody>';

    planUnplanned.forEach(row => {
        const days = row._daysLeft;
        let diffText, diffColor;
        if (days < 0) { diffText = `просрочено ${Math.abs(days)} дн.`; diffColor = '#c62828'; }
        else if (days === 0) { diffText = 'истекает сегодня'; diffColor = '#c62828'; }
        else if (days <= 3) { diffText = `${days} дн.`; diffColor = '#c62828'; }
        else if (days <= 7) { diffText = `${days} дн.`; diffColor = '#f57c00'; }
        else { diffText = `${days} дн.`; diffColor = '#b28704'; }

        html += `<tr>
            <td data-label="Истекает">${formatDate(row.valid_until)}</td>
            <td data-label="Осталось" style="color:${diffColor};font-weight:700;">${diffText}</td>
            <td data-label="Гос.номер"><strong>${escapeHtmlTd(row.plate_number || '—')}</strong></td>
            <td data-label="ТС">${escapeHtmlTd(row.vehicle_make_model || '—')}</td>
            <td data-label="Эксперт">${escapeHtmlTd(row.expert_name || '—')}</td>
            <td>
                <button class="eis-btn eis-btn-sm eis-btn-primary"
                        onclick="openAssignModal('${escapeHtmlTd(row.plate_number || '')}', '${escapeHtmlTd(row.vehicle_make_model || '')}', '${row.valid_until}')">
                    Записать
                </button>
            </td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ================================================================
// ВСЕ ИЗВЕСТНЫЕ ТС
// ================================================================
function getAllKnownVehicles() {
    const map = new Map();

    if (typeof vehicleDatabase !== 'undefined') {
        vehicleDatabase.forEach(v => {
            if (v.plate_number) {
                map.set(v.plate_number, {
                    plate: v.plate_number,
                    make: v.make_model || ''
                });
            }
        });
    }

    if (typeof techDatabase !== 'undefined') {
        techDatabase.forEach(t => {
            if (t.plate_number && !map.has(t.plate_number)) {
                map.set(t.plate_number, {
                    plate: t.plate_number,
                    make: t.vehicle_make_model || ''
                });
            }
        });
    }

    return Array.from(map.values()).sort((a, b) => a.plate.localeCompare(b.plate));
}

// ================================================================
// ПОДБОР ДАТЫ — за 3 дня до истечения (карта действует 1 месяц)
// ================================================================
function suggestDate(validUntil) {
    const today = planToday();
    let suggested = new Date(today);

    if (validUntil) {
        const vu = parseDate(validUntil);
        if (vu) {
            const diff = Math.ceil((vu - today) / (1000 * 60 * 60 * 24));
            // Хотим записать за PLAN_BUFFER_DAYS дней до истечения
            const offset = diff - PLAN_BUFFER_DAYS;

            if (offset > 0) {
                // Карта ещё не скоро истечёт — ставим за 3 дня до конца
                suggested.setDate(suggested.getDate() + offset);
            } else {
                // Истекает скоро или уже просрочено — ставим на завтра
                suggested.setDate(suggested.getDate() + 1);
            }
        }
    } else {
        suggested.setDate(suggested.getDate() + 1);
    }

    // Если день забит — ищем следующий свободный (в пределах 120 дней)
    for (let i = 0; i < 120; i++) {
        const iso = planISO(suggested);
        if (getDayLoad(iso) < planCapacity) return iso;
        suggested.setDate(suggested.getDate() + 1);
    }
    return planISO(suggested);
}

// ================================================================
// МОДАЛКА: ЗАПИСЬ
// ================================================================
function openAssignModal(plate, make, validUntil) {
    const modal = document.getElementById('assignModal');
    if (!modal) return;

    const sel = document.getElementById('assignVehicle');
    const vehicles = getAllKnownVehicles();

    sel.innerHTML = '<option value="">— Выберите ТС —</option>' +
        vehicles.map(v =>
            `<option value="${escapeHtmlTd(v.plate)}" data-make="${escapeHtmlTd(v.make)}">
                ${escapeHtmlTd(v.plate)}${v.make ? ' — ' + escapeHtmlTd(v.make) : ''}
            </option>`
        ).join('');

    if (plate) {
        sel.value = plate;
        if (sel.value !== plate) {
            const opt = document.createElement('option');
            opt.value = plate;
            opt.dataset.make = make || '';
            opt.textContent = `${plate}${make ? ' — ' + make : ''}`;
            sel.appendChild(opt);
            sel.value = plate;
        }
    }

    document.getElementById('assignDate').value = suggestDate(validUntil || null);
    document.getElementById('assignTime').value = '';
    document.getElementById('assignNotes').value = '';
    document.getElementById('assignError').textContent = '';

    onAssignDateChange();
    modal.style.display = 'flex';
}

function onAssignVehicleChange() { /* зарезервировано */ }

function onAssignDateChange() {
    const dateISO = document.getElementById('assignDate').value;
    const loadEl = document.getElementById('assignLoad');
    if (!loadEl) return;

    if (!dateISO) {
        loadEl.textContent = 'Выберите дату';
        loadEl.className = 'eis-assign-load';
        return;
    }

    const load = getDayLoad(dateISO);
    const ratio = load / planCapacity;
    let cls = 'free';
    if (ratio > 1) cls = 'overload';
    else if (ratio >= 0.9) cls = 'almost-full';
    else if (ratio >= 0.5) cls = 'half';

    loadEl.className = 'eis-assign-load ' + cls;
    loadEl.textContent = `Записано ${load} из ${planCapacity} (${Math.round(ratio * 100)}%)`;
}

async function saveAppointment() {
    const sel = document.getElementById('assignVehicle');
    const dateISO = document.getElementById('assignDate').value;
    const time = document.getElementById('assignTime').value;
    const notes = document.getElementById('assignNotes').value.trim();
    const errEl = document.getElementById('assignError');
    const btn = document.getElementById('assignSaveBtn');

    errEl.textContent = '';

    const plate = sel.value;
    if (!plate) { errEl.textContent = 'Выберите ТС'; return; }
    if (!dateISO) { errEl.textContent = 'Укажите дату'; return; }

    const opt = sel.options[sel.selectedIndex];
    const make = opt.dataset.make || '';

    const existing = planAppointments.find(a =>
        a.plate_number === plate && a.status === 'planned'
    );
    if (existing) {
        errEl.textContent = `Для ${plate} уже есть запись на ${formatDate(existing.scheduled_date)}`;
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    const payload = {
        plate_number: plate,
        make_model: make,
        scheduled_date: dateISO,
        scheduled_time: time || null,
        status: 'planned',
        notes: notes || null,
        created_by: window.currentUser?.id || null
    };

    const { data, error } = await supabaseClient
        .from('tech_appointments').insert(payload).select().single();

    btn.disabled = false;
    btn.textContent = 'Записать';

    if (error) {
        errEl.textContent = 'Ошибка: ' + error.message;
        return;
    }

    planAppointments.push(data);

    if (typeof logCreate === 'function') {
        await logCreate('tech_appointment_create', 'tech_appointments', data.id, data,
            `Записал ТС ${plate} на ТО ${formatDate(dateISO)}`);
    }

    showToast(`ТС ${plate} записан на ${formatDate(dateISO)}`, 'success');
    closeAssignModal();
    renderPlanningTab();
}

function closeAssignModal() {
    const modal = document.getElementById('assignModal');
    if (modal) modal.style.display = 'none';
}

// ================================================================
// МОДАЛКА: ЗАПИСИ ДНЯ
// ================================================================
function openDayAppointmentsModal(isoDate) {
    const modal = document.getElementById('dayAppointmentsModal');
    const title = document.getElementById('dayApptTitle');
    const body = document.getElementById('dayApptBody');
    if (!modal || !body) return;

    const list = planAppointments
        .filter(a => a.scheduled_date === isoDate && a.status === 'planned')
        .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));

    const load = list.length;
    const ratio = load / planCapacity;
    let badgeColor = '#28a745';
    if (ratio > 1) badgeColor = '#c62828';
    else if (ratio >= 0.9) badgeColor = '#f57c00';
    else if (ratio >= 0.5) badgeColor = '#b28704';

    if (title) {
        title.innerHTML = `Записи на ${formatDate(isoDate)} — 
            <span style="color:${badgeColor}">${load} / ${planCapacity}</span>`;
    }

    if (list.length === 0) {
        body.innerHTML = '<div class="eis-no-results">На этот день записей нет</div>';
        modal.style.display = 'flex';
        return;
    }

    let html = '<div class="eis-admin-table-wrap"><table class="eis-admin-table"><thead><tr>';
    html += '<th>Время</th><th>Гос.номер</th><th>ТС</th><th>Примечание</th><th></th>';
    html += '</tr></thead><tbody>';

    list.forEach(a => {
        html += `<tr>
            <td data-label="Время">${escapeHtmlTd(a.scheduled_time || '—')}</td>
            <td data-label="Гос.номер"><strong>${escapeHtmlTd(a.plate_number)}</strong></td>
            <td data-label="ТС">${escapeHtmlTd(a.make_model || '—')}</td>
            <td data-label="Примечание">${escapeHtmlTd(a.notes || '—')}</td>
            <td>
                <button class="eis-btn eis-btn-sm eis-btn-danger"
                        onclick="cancelAppointment('${a.id}', '${escapeHtmlTd(a.plate_number)}')">
                    Отменить
                </button>
            </td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    body.innerHTML = html;

    modal.style.display = 'flex';
}

function closeDayAppointmentsModal() {
    const modal = document.getElementById('dayAppointmentsModal');
    if (modal) modal.style.display = 'none';
}

async function cancelAppointment(id, plate) {
    const ok = await showConfirm({
        title: 'Отмена записи',
        message: `Удалить запись ТС ${plate} с этого дня?`,
        confirmText: 'Удалить',
        type: 'danger'
    });
    if (!ok) return;

    const { error } = await supabaseClient
        .from('tech_appointments').delete().eq('id', id);

    if (error) { showToast('Ошибка: ' + error.message, 'error'); return; }

    planAppointments = planAppointments.filter(a => a.id !== id);

    if (typeof logDelete === 'function') {
        await logDelete('tech_appointment_delete', 'tech_appointments', id,
            { plate_number: plate }, `Отменил запись ТС ${plate} на ТО`);
    }

    showToast('Запись удалена', 'success');
    closeDayAppointmentsModal();
    renderPlanningTab();
}

// ================================================================
// ИНИЦИАЛИЗАЦИЯ
// ================================================================
document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('planningGrid')) return;

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeAssignModal();
            closeDayAppointmentsModal();
        }
    });

    document.querySelectorAll('#assignModal, #dayAppointmentsModal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target !== m) return;
            if (m.id === 'assignModal') closeAssignModal();
            else closeDayAppointmentsModal();
        });
    });
});

// ================================================================
// ЭКСПОРТ
// ================================================================
window.loadPlanningData = loadPlanningData;
window.renderPlanningTab = renderPlanningTab;
window.onPlanningCapacityChange = onPlanningCapacityChange;
window.onPlanningHorizonChange = onPlanningHorizonChange;
window.planningPrevMonth = planningPrevMonth;
window.planningNextMonth = planningNextMonth;
window.planningToday = planningToday;
window.openAssignModal = openAssignModal;
window.closeAssignModal = closeAssignModal;
window.onAssignVehicleChange = onAssignVehicleChange;
window.onAssignDateChange = onAssignDateChange;
window.saveAppointment = saveAppointment;
window.openDayAppointmentsModal = openDayAppointmentsModal;
window.closeDayAppointmentsModal = closeDayAppointmentsModal;
window.cancelAppointment = cancelAppointment;