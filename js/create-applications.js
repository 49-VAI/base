// ================================================================
// СОЗДАНИЕ ВУ — подстановка из заявки
// ================================================================

const RANK_TO_GVARDIA = {
    'Рядовой': 'Гвардии рядовой',
    'Ефрейтор': 'Гвардии ефрейтор',
    'Мл. сержант': 'Гвардии мл. сержант',
    'Сержант': 'Гвардии сержант',
    'Ст. сержант': 'Гвардии ст. сержант',
    'Старшина': 'Гвардии старшина',
    'Прапорщик': 'Гвардии прапорщик',
    'Ст. прапорщик': 'Гвардии ст. прапорщик',
    'Лейтенант': 'Гвардии лейтенант',
    'Ст. лейтенант': 'Гвардии ст. лейтенант',
    'Капитан': 'Гвардии капитан',
    'Майор': 'Гвардии майор'
};

let applicationPickerCache = [];

function escapeHtmlCA(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function openApplicationPicker() {
    const modal = document.getElementById('applicationPickerModal');
    const container = document.getElementById('applicationPickerList');
    if (!modal || !container) return;

    modal.style.display = 'flex';
    container.innerHTML = `<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка...</span></div>`;

    document.getElementById('appPickerSearch').value = '';

    try {
        const { data, error } = await supabaseClient
            .from('vu_applications')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        applicationPickerCache = data || [];
        renderApplicationPickerList();
    } catch (e) {
        container.innerHTML = `<div class="eis-no-results" style="padding:24px;">
            Ошибка: ${escapeHtmlCA(e.message)}
        </div>`;
    }
}

function closeApplicationPicker() {
    document.getElementById('applicationPickerModal').style.display = 'none';
}

function renderApplicationPickerList() {
    const container = document.getElementById('applicationPickerList');
    if (!container) return;

    const status = document.getElementById('appPickerStatusFilter')?.value || '';
    const q = (document.getElementById('appPickerSearch')?.value || '').toLowerCase().trim();

    const filtered = applicationPickerCache.filter(a => {
        if (status && a.status !== status) return false;
        if (q) {
            const fio = [a.last_name, a.first_name, a.middle_name].filter(Boolean).join(' ');
            const hay = [fio, a.unit, a.rank].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    if (!filtered.length) {
        container.innerHTML = `<div class="eis-no-results" style="padding:24px;">
            Заявок не найдено
        </div>`;
        return;
    }

    const STATUS_LABEL = {
        pending: 'ОЖИДАЕТ',
        conducted: 'ПРОВЕДЕНО',
        passed: 'СДАЛ',
        failed: 'НЕ СДАЛ',
        cancelled: 'ОТМЕНЕНО'
    };
    const STATUS_CLASS = {
        pending: 'eis-status-expiring',
        conducted: 'eis-status-info',
        passed: 'eis-status-valid',
        failed: 'eis-status-expired',
        cancelled: 'eis-status-archived'
    };

    container.innerHTML = filtered.map(a => {
        const fio = [a.last_name, a.first_name, a.middle_name].filter(Boolean).join(' ') || '—';
        const cats = (a.open_categories || '').split(',').filter(Boolean).join(', ') || '—';
        const st = a.status || 'pending';
        return `<div class="eis-manage-row" style="cursor:pointer;"
                     onclick="applyApplicationToForm('${a.id}')">
            <div class="eis-manage-row-info" style="padding:10px 12px;">
                <div class="eis-manage-row-name">
                    <strong>${escapeHtmlCA(fio)}</strong>
                    <span class="eis-vu-status ${STATUS_CLASS[st]}"
                          style="margin-left:8px;font-size:10px;padding:2px 8px;">
                        ${STATUS_LABEL[st]}
                    </span>
                </div>
                <div class="eis-manage-row-sub">
                    ${escapeHtmlCA(a.rank || '—')} · Категории: ${escapeHtmlCA(cats)}
                    ${a.unit ? ' · ' + escapeHtmlCA(a.unit) : ''}
                    ${a.vu_number ? ' · ВУ: ' + escapeHtmlCA(a.vu_number) : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

function applyApplicationToForm(id) {
    const app = applicationPickerCache.find(a => a.id === id);
    if (!app) { showToast('Заявка не найдена', 'error'); return; }

    const setVal = (fid, v) => {
        const el = document.getElementById(fid);
        if (el) el.value = v || '';
    };

    // ФИО
    setVal('createLastName', app.last_name || '');
    setVal('createFirstName', app.first_name || '');
    setVal('createMiddleName', app.middle_name || '');

    // Звание — с маппингом "Рядовой" → "Гвардии рядовой"
    const rank = app.rank || '';
    const gvRank = RANK_TO_GVARDIA[rank] || '';
    const rankSelect = document.getElementById('createRank');
    if (gvRank && rankSelect) {
        // Проверяем что опция существует
        const exists = Array.from(rankSelect.options).some(o => o.value === gvRank);
        if (exists) rankSelect.value = gvRank;
    }

    // Вид службы
    const svc = app.service_type === 'kontraktnaya' ? 'kontraktnaya' : 'srochnaya';
    setVal('createServiceType', svc);

    // Дата выдачи — сегодня
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setVal('createIssueDate', iso);

    // Запоминаем, из какой заявки подставлены данные
    window._appliedApplication = app;

    closeApplicationPicker();
    if (typeof generateVU === 'function') generateVU();

    showToast(`Данные из заявки ${app.last_name} ${app.first_name} подставлены`, 'success');
}

window.openApplicationPicker = openApplicationPicker;
window.closeApplicationPicker = closeApplicationPicker;
window.renderApplicationPickerList = renderApplicationPickerList;
window.applyApplicationToForm = applyApplicationToForm;