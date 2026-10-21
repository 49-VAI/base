// ================================================================
// ПОСТАНОВЛЕНИЕ ПО ДЕЛУ ОБ АДМИНИСТРАТИВНОМ ПРАВОНАРУШЕНИИ
// ================================================================

const RESOLUTION_CONFIG = {
    canvasWidth: 1654,
    canvasHeight: 3150,
    background: 'backgrounds/resolution.png'
};

// ⚠️ Координаты подогнать под ваш бланк resolution.png
// Разделители:
//  • dateReview / violationDate / copyDate — отдельные координаты для ДД, ММ, ГГ
//  • violationTime — отдельно часы и минуты (разные строки)
//  • official / regAddress / actualAddress / work / motivated / violation —
//    многострочные блоки (массив lines)
const RES = {
    // Номер постановления
    number: { x: 826, y: 260, maxWidth: 1100, size: 34, align: 'center' },

    // 1. Дата рассмотрения — ДД ММ ГГ раздельно
    dateReview: {
        day: { x: 149, y: 370, maxWidth: 60, size: 34, align: 'center' },
        month: { x: 279, y: 370, maxWidth: 160, size: 34, align: 'center' },
        year: { x: 429, y: 370, maxWidth: 60, size: 34, align: 'center' }
    },

    // 2. Место рассмотрения — 1 строка
    place: { x: 1290, y: 370, maxWidth: 500, size: 34, align: 'center' },

    // 3. Должность + Подразделение + Звание + ФИО + Адрес органа — 2 строки
    official: {
        lines: [
            { x: 160, y: 475, maxWidth: 1380 },
            { x: 100, y: 545, maxWidth: 1440 }
        ],
        size: 34
    },

    // 4. ФИО нарушителя — клетки по 1 букве (как в протоколе)
    fioCells: {
        startX: 113, stepX: 41, cellWidth: 39, y: 765,
        fontSize: 34, count: 35
    },

    // 5. Дата рождения + место рождения + гражданство + В/У — 1 строка
    birthLine: { x: 100, y: 860, maxWidth: 1440, size: 34, align: 'left' },

    // 6. Адрес регистрации — 2 строки
    regAddress: {
        lines: [
            { x: 1180, y: 960, maxWidth: 360 },
            { x: 100, y: 1000, maxWidth: 1021 }
        ],
        size: 34
    },

    // 7. Телефон (регистрация) — 1 строка
    regPhone: { x: 1239, y: 998, maxWidth: 302, size: 34, align: 'left' },

    // 8. Адрес проживания — 2 строки
    actualAddress: {
        lines: [
            { x: 620, y: 1035, maxWidth: 920 },
            { x: 100, y: 1075, maxWidth: 1021 }
        ],
        size: 34
    },

    // 9. Телефон (факт.) — 1 строка
    actualPhone: { x: 1239, y: 1070, maxWidth: 302, size: 34, align: 'left' },

    // 10. Место работы + телефон — 2 строки
    work: {
        lines: [
            { x: 640, y: 1110, maxWidth: 900 },
            { x: 100, y: 1180, maxWidth: 720 }
        ],
        size: 34
    },

    // 11. Должность — 1 строка
    position: { x: 1040, y: 1180, maxWidth: 500, size: 34, align: 'left' },

    // 12. Марка + модель + гос. номер — 1 строка
    vehicle: { x: 740, y: 1220, maxWidth: 800, size: 34, align: 'left' },

    // 13. Дата нарушения — ДД ММ ГГ раздельно
    violationDate: {
        day: { x: 139, y: 1290, maxWidth: 40, size: 34, align: 'center' },
        month: { x: 249, y: 1290, maxWidth: 140, size: 34, align: 'center' },
        year: { x: 389, y: 1290, maxWidth: 60, size: 34, align: 'center' }
    },

    // 14. Время нарушения — часы и минуты отдельными строками
    violationTime: {
        hours: { x: 569, y: 1290, maxWidth: 60, size: 34, align: 'center' },
        minutes: { x: 789, y: 1290, maxWidth: 60, size: 34, align: 'center' }
    },

    // 15. Место нарушения + Обстоятельства — 3 строки
    violation: {
        lines: [
            { x: 1000, y: 1290, maxWidth: 540 },
            { x: 100, y: 1356, maxWidth: 1440 },
            { x: 100, y: 1426, maxWidth: 1440 }
        ],
        size: 28
    },

    // 16. Часть — 1 строка
    articlePart: { x: 300, y: 1585, maxWidth: 100, size: 34, align: 'center' },

    // 17. Статья — 1 строка
    articleNumber: { x: 741, y: 1585, maxWidth: 260, size: 34, align: 'center' },

    // 18. Мотивированное решение — 6 строк
    motivated: {
        lines: [
            { x: 107, y: 2200, maxWidth: 1440 },
            { x: 107, y: 2268, maxWidth: 1440 },
            { x: 107, y: 2305, maxWidth: 1440 },
            { x: 107, y: 2343, maxWidth: 1440 },
            { x: 107, y: 2380, maxWidth: 1440 },
            { x: 107, y: 2420, maxWidth: 1440 }
        ],
        size: 34
    },

    // 19. Дата получения копии — ДД ММ ГГ раздельно
    copyDate: {
        day: { x: 823, y: 3005, maxWidth: 60, size: 34, align: 'center' },
        month: { x: 973, y: 3005, maxWidth: 200, size: 34, align: 'center' },
        year: { x: 1138, y: 3005, maxWidth: 50, size: 34, align: 'center' }
    },

    // Зачёркивания (язык / оспаривание) — координаты подогнать под бланк
    strikeLangOwns: { x1: 427, y1: 1715, x2: 545, y2: 1716 },
    strikeLangNotOwns: { x1: 565, y1: 1715, x2: 752, y2: 1716 },
    strikeDisputeNo: { x1: 358, y1: 1791, x2: 545, y2: 1792 },
    strikeDisputeYes: { x1: 559, y1: 1791, x2: 746, y2: 1792 }
};

let attachProtocolsCache = [];

// ========== УТИЛИТЫ ==========
function escapeHtmlAttach(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// ========== ФОРМАТИРОВАНИЕ ==========
function formatResolutionDate(input) {
    let d = input.value.replace(/\D/g, '').slice(0, 8);
    let r = '';
    if (d.length > 0) r += d.slice(0, 2);
    if (d.length > 2) r += '.' + d.slice(2, 4);
    if (d.length > 4) r += '.' + d.slice(4, 8);
    input.value = r;
    generateResolution();
}
function formatResolutionBirthDate(input) { formatResolutionDate(input); }

function formatResolutionTime(input) {
    const d = input.value.replace(/\D/g, '').slice(0, 4);
    let r = '';
    if (d.length > 0) r += d.slice(0, 2);
    if (d.length > 2) r += ':' + d.slice(2, 4);
    input.value = r;
    generateResolution();
}

function formatResolutionPhone(input) {
    let d = input.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && !d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    let r = '';
    if (d.length > 0) r += '+' + d[0];
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length >= 5) r += ') ' + d.slice(4, 7);
    if (d.length >= 8) r += '-' + d.slice(7, 9);
    if (d.length >= 10) r += '-' + d.slice(9, 11);
    input.value = r;
    generateResolution();
}

// ========== ХЕЛПЕРЫ РИСОВАНИЯ ==========
// Раздельная дата: ДД | ММ | ГГ — каждый со своей координатой
function drawDateParts(ctx, dateStr, cfg, ff, color, style) {
    if (!dateStr) return;
    const parts = String(dateStr).split('.');
    if (parts.length < 2) return;

    const draw = (part, partCfg) => {
        if (!part || !partCfg) return;
        fitText(ctx, part, partCfg.x, partCfg.y, partCfg.maxWidth,
            partCfg.size, ff, 'normal', color, partCfg.align || 'center', style);
    };

    draw(parts[0], cfg.day);
    draw(parts[1], cfg.month);
    if (parts[2]) draw(parts[2].slice(-2), cfg.year);
}

// Время: часы на одной строке, минуты на другой
function drawTimeParts(ctx, timeStr, cfg, ff, color, style) {
    if (!timeStr) return;
    const parts = String(timeStr).split(':');
    if (parts.length < 2) return;

    if (parts[0] && cfg.hours) {
        fitText(ctx, parts[0], cfg.hours.x, cfg.hours.y, cfg.hours.maxWidth,
            cfg.hours.size, ff, 'normal', color, cfg.hours.align || 'center', style);
    }
    if (parts[1] && cfg.minutes) {
        fitText(ctx, parts[1], cfg.minutes.x, cfg.minutes.y, cfg.minutes.maxWidth,
            cfg.minutes.size, ff, 'normal', color, cfg.minutes.align || 'center', style);
    }
}

// ФИО в клетки по 1 букве (как в протоколе)
function drawFioInCells(ctx, parts, cfg, ff, color) {
    const cleanParts = (parts || []).filter(Boolean);
    if (cleanParts.length === 0) return;

    const chars = [];
    cleanParts.forEach((part, idx) => {
        if (idx > 0) chars.push(''); // пробел между частями ФИО
        for (const ch of String(part).toUpperCase()) chars.push(ch);
    });

    ctx.fillStyle = color;
    ctx.font = `normal normal ${cfg.fontSize}px "${ff}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let i = 0; i < chars.length && i < cfg.count; i++) {
        if (chars[i] === '') continue;
        const cx = cfg.startX + cfg.stepX * i + cfg.cellWidth / 2;
        ctx.fillText(chars[i], cx, cfg.y);
    }
}

// ========== СБОР ==========
function collectResolutionData() {
    const g = id => {
        const el = document.getElementById(id);
        return el ? (el.value.trim() || '') : '';
    };
    const r = n => document.querySelector(`input[name="${n}"]:checked`)?.value || '';
    return {
        number: g('resNumber'),
        date: g('resDate'),
        place: g('resPlace'),
        officialPosition: g('resOfficialPosition'),
        officialDepartment: g('resOfficialDepartment'), // может отсутствовать в HTML — тогда ''
        officialRank: g('resOfficialRank'),
        officialName: g('resOfficialName'),
        officialAddress: g('resOfficialAddress'),
        citizenLastName: g('resCitizenLastName'),
        citizenFirstName: g('resCitizenFirstName'),
        citizenMiddleName: g('resCitizenMiddleName'),
        birthDate: g('resBirthDate'),
        birthPlace: g('resBirthPlace'),
        citizenship: g('resCitizenship'),
        driverLicense: g('resDriverLicense'),
        registeredAddress: g('resRegisteredAddress'),
        registeredPhone: g('resRegisteredPhone'),
        actualAddress: g('resActualAddress'),
        actualPhone: g('resActualPhone'),
        workPlace: g('resWorkPlace'),
        workPosition: g('resWorkPosition'),
        workPhone: g('resWorkPhone'),
        vehicleMake: g('resVehicleMake'),
        vehicleModel: g('resVehicleModel'),
        vehiclePlate: g('resVehiclePlate'),
        violationDate: g('resViolationDate'),
        violationTime: g('resViolationTime'),
        violationPlace: g('resViolationPlace'),
        circumstances: g('resCircumstances'),
        articlePart: g('resArticlePart'),
        articleNumber: g('resArticleNumber'),
        languageOwns: r('resLanguageOwns'),
        dispute: r('resDispute'),
        motivatedDecision: g('resMotivatedDecision'),
        copyReceivedDate: g('resCopyReceivedDate')
    };
}

// ========== ГЕНЕРАЦИЯ ==========
async function generateResolution() {
    const canvas = document.getElementById('resolutionCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        const bg = await loadImage(RESOLUTION_CONFIG.background);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } catch (e) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Фон постановления не найден (backgrounds/resolution.png)',
            canvas.width / 2, 120);
    }

    const d = collectResolutionData();
    const ff = 'Segoe Script';
    const color = '#000f55';
    const style = 'italic';

    // ----- 0. Номер постановления -----
    if (d.number) {
        fitText(ctx, '№ ' + d.number, RES.number.x, RES.number.y,
            RES.number.maxWidth, RES.number.size, ff, 'normal', color,
            RES.number.align, style);
    }

    // ----- 1. Дата рассмотрения (ДД | ММ | ГГ) -----
    drawDateParts(ctx, d.date, RES.dateReview, ff, color, style);

    // ----- 2. Место рассмотрения -----
    if (d.place) {
        fitText(ctx, d.place, RES.place.x, RES.place.y,
            RES.place.maxWidth, RES.place.size, ff, 'normal', color,
            RES.place.align, style);
    }

    // ----- 3. Должностное лицо (2 строки) -----
    // Формат: «Должность Подразделение, Звание Фамилия И.О. Адрес органа»
    const officialParts = [];
    if (d.officialPosition) officialParts.push(d.officialPosition);
    if (d.officialDepartment) officialParts.push(d.officialDepartment);
    const posDept = officialParts.join(' ');

    const rankName = [d.officialRank, d.officialName].filter(Boolean).join(' ');

    let officialLine = posDept;
    if (rankName) officialLine += (officialLine ? ', ' : '') + rankName;
    if (d.officialAddress) officialLine += (officialLine ? ' ' : '') + d.officialAddress;

    if (officialLine) {
        fitTextMultiline(ctx, officialLine, RES.official.lines,
            RES.official.size, 14, ff, 'normal', color, 'left', style);
    }

    // ----- 4. ФИО нарушителя в клетки -----
    drawFioInCells(
        ctx,
        [d.citizenLastName, d.citizenFirstName, d.citizenMiddleName],
        RES.fioCells, ff, color
    );

    // ----- 5. Дата рождения + место + гражданство + В/У (1 строка) -----
    const birthLine = [
        d.birthDate ? `${d.birthDate} г.р.` : '',
        d.birthPlace,
        d.citizenship ? `гражданство ${d.citizenship}` : '',
        d.driverLicense
    ].filter(Boolean).join(', ');

    if (birthLine) {
        fitText(ctx, birthLine, RES.birthLine.x, RES.birthLine.y,
            RES.birthLine.maxWidth, RES.birthLine.size, ff, 'normal', color,
            RES.birthLine.align, style);
    }

    // ----- 6. Адрес регистрации (2 строки) -----
    if (d.registeredAddress) {
        fitTextMultiline(ctx, d.registeredAddress, RES.regAddress.lines,
            RES.regAddress.size, 14, ff, 'normal', color, 'left', style);
    }

    // ----- 7. Телефон (регистрация) -----
    if (d.registeredPhone) {
        fitText(ctx, d.registeredPhone, RES.regPhone.x, RES.regPhone.y,
            RES.regPhone.maxWidth, RES.regPhone.size, ff, 'normal', color,
            RES.regPhone.align, style);
    }

    // ----- 8. Адрес проживания (2 строки) -----
    if (d.actualAddress) {
        fitTextMultiline(ctx, d.actualAddress, RES.actualAddress.lines,
            RES.actualAddress.size, 14, ff, 'normal', color, 'left', style);
    }

    // ----- 9. Телефон (факт.) -----
    if (d.actualPhone) {
        fitText(ctx, d.actualPhone, RES.actualPhone.x, RES.actualPhone.y,
            RES.actualPhone.maxWidth, RES.actualPhone.size, ff, 'normal', color,
            RES.actualPhone.align, style);
    }

    // ----- 10. Место работы + телефон (2 строки) -----
    const workLine = [d.workPlace, d.workPhone].filter(Boolean).join(', ');
    if (workLine) {
        fitTextMultiline(ctx, workLine, RES.work.lines,
            RES.work.size, 14, ff, 'normal', color, 'left', style);
    }

    // ----- 11. Должность (1 строка) -----
    if (d.workPosition) {
        fitText(ctx, d.workPosition, RES.position.x, RES.position.y,
            RES.position.maxWidth, RES.position.size, ff, 'normal', color,
            RES.position.align, style);
    }

    // ----- 12. ТС: марка + модель + гос.номер (1 строка) -----
    const vehicleLine = [
        [d.vehicleMake, d.vehicleModel].filter(Boolean).join(' '),
        d.vehiclePlate
    ].filter(Boolean).join(' ');

    if (vehicleLine) {
        fitText(ctx, vehicleLine, RES.vehicle.x, RES.vehicle.y,
            RES.vehicle.maxWidth, RES.vehicle.size, ff, 'normal', color,
            RES.vehicle.align, style);
    }

    // ----- 13. Дата нарушения (ДД | ММ | ГГ) -----
    drawDateParts(ctx, d.violationDate, RES.violationDate, ff, color, style);

    // ----- 14. Время нарушения (часы / минуты отдельно) -----
    drawTimeParts(ctx, d.violationTime, RES.violationTime, ff, color, style);

    // ----- 15. Место нарушения + Обстоятельства (3 строки) -----
    const violationText = [d.violationPlace, d.circumstances]
        .filter(Boolean).join('. ');

    if (violationText) {
        fitTextMultiline(ctx, violationText, RES.violation.lines,
            RES.violation.size, 14, ff, 'normal', color, 'left', style);
    }

    // ----- 16. Часть (1 строка) -----
    if (d.articlePart) {
        fitText(ctx, d.articlePart, RES.articlePart.x, RES.articlePart.y,
            RES.articlePart.maxWidth, RES.articlePart.size, ff, 'normal', color,
            RES.articlePart.align, style);
    }

    // ----- 17. Статья (1 строка) -----
    if (d.articleNumber) {
        fitText(ctx, d.articleNumber, RES.articleNumber.x, RES.articleNumber.y,
            RES.articleNumber.maxWidth, RES.articleNumber.size, ff, 'normal', color,
            RES.articleNumber.align, style);
    }

    // ----- 18. Мотивированное решение (6 строк) -----
    if (d.motivatedDecision) {
        fitTextMultiline(ctx, d.motivatedDecision, RES.motivated.lines,
            RES.motivated.size, 12, ff, 'normal', color, 'left', style);
    }

    // Зачёркивания (язык / оспаривание)
    const strike = (cfg) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cfg.x1, cfg.y1);
        ctx.lineTo(cfg.x2, cfg.y2);
        ctx.stroke();
        ctx.restore();
    };
    if (d.languageOwns === 'владею') strike(RES.strikeLangNotOwns);
    else if (d.languageOwns === 'не владею') strike(RES.strikeLangOwns);
    if (d.dispute === 'не оспариваю') strike(RES.strikeDisputeYes);
    else if (d.dispute === 'оспариваю') strike(RES.strikeDisputeNo);

    // ----- 19. Дата получения копии (ДД | ММ | ГГ) -----
    drawDateParts(ctx, d.copyReceivedDate, RES.copyDate, ff, color, style);

    // Подписи
    if (typeof drawSignatureOnCanvas === 'function') {
        drawSignatureOnCanvas(ctx, 'resCitizen', canvas, true);
        drawSignatureOnCanvas(ctx, 'resOfficial', canvas, true);
        drawSignatureOnCanvas(ctx, 'resReceiver', canvas, true);
    }
}

// ========== АВТОЗАПОЛНЕНИЕ ИЗ ПРОТОКОЛА ==========
function autoFillResolutionFromProtocol(force = false) {
    const protoLastName = document.getElementById('protocolLastName')?.value.trim();
    if (!protoLastName) {
        showToast('Сначала заполните данные протокола', 'warning');
        return;
    }

    const setVal = (resId, protoId) => {
        const resEl = document.getElementById(resId);
        const protoEl = document.getElementById(protoId);
        if (!resEl || !protoEl) return;
        if (!force && resEl.value.trim()) return;
        const v = protoEl.value.trim();
        if (v) resEl.value = v;
    };

    setVal('resDate', 'protocolDate');
    setVal('resPlace', 'protocolPlace');
    setVal('resOfficialPosition', 'protocolOfficialPosition');
    setVal('resOfficialRank', 'protocolOfficialRank');
    setVal('resOfficialName', 'protocolOfficialName');
    setVal('resCitizenLastName', 'protocolLastName');
    setVal('resCitizenFirstName', 'protocolFirstName');
    setVal('resCitizenMiddleName', 'protocolMiddleName');
    setVal('resBirthDate', 'protocolBirthDate');
    setVal('resBirthPlace', 'protocolBirthPlace');
    setVal('resDriverLicense', 'protocolDriverLicense');
    setVal('resRegisteredAddress', 'protocolRegisteredAddress');
    setVal('resRegisteredPhone', 'protocolRegisteredPhone');
    setVal('resActualAddress', 'protocolActualAddress');
    setVal('resActualPhone', 'protocolActualPhone');
    setVal('resWorkPlace', 'protocolWorkPlace2');
    setVal('resVehicleMake', 'protocolVehicleMake');
    setVal('resVehiclePlate', 'protocolVehiclePlate');
    setVal('resViolationDate', 'protocolViolationDate');
    setVal('resViolationTime', 'protocolViolationTime');
    setVal('resViolationPlace', 'protocolViolationPlace');
    setVal('resCircumstances', 'protocolViolationDescription');
    setVal('resArticlePart', 'protocolArticlePart');
    setVal('resArticleNumber', 'protocolArticleNumber');

    const protoLang = document.querySelector('input[name="protocolRussianLanguage"]:checked');
    if (protoLang && (force || !document.querySelector('input[name="resLanguageOwns"]:checked'))) {
        const map = { 'владеет': 'владею', 'не владеет': 'не владею' };
        const val = map[protoLang.value];
        const target = document.querySelector(`input[name="resLanguageOwns"][value="${val}"]`);
        if (target) target.checked = true;
    }

    generateResolution();
    showToast('Данные из протокола перенесены в постановление', 'success');
}

// ========== ИНДИКАТОР ПРИВЯЗКИ ==========
async function updateResolutionAttachHint() {
    const el = document.getElementById('resolutionAttachHint');
    if (!el) return;

    const id = window._savedProtocolId;
    if (!id) {
        el.innerHTML = '<strong>Не привязано к протоколу.</strong> При сохранении выберите протокол, к которому приложить постановление.';
        return;
    }

    try {
        const { data } = await supabaseClient
            .from('protocols')
            .select('reg_number, protocol_date, violator_last_name, violator_first_name')
            .eq('id', id)
            .single();

        if (!data) {
            window._savedProtocolId = null;
            try { sessionStorage.removeItem('saved_protocol_id'); } catch (e) { }
            el.innerHTML = '<strong>Не привязано к протоколу.</strong> При сохранении выберите протокол.';
            return;
        }

        const fio = [data.violator_last_name, data.violator_first_name].filter(Boolean).join(' ');
        const dateStr = data.protocol_date ? formatDate(data.protocol_date) : '';

        el.innerHTML = `<strong>Привязано к протоколу:</strong> № ${escapeHtmlAttach(data.reg_number)} ${dateStr ? 'от ' + dateStr : ''}${fio ? ' (' + escapeHtmlAttach(fio) + ')' : ''}.
            <a href="#" onclick="event.preventDefault(); detachResolutionFromProtocol()"
               style="color:#1e7e34; font-weight:600; margin-left:8px;">Отвязать</a>`;
    } catch (e) {
        console.warn('[resolution] attach hint error:', e);
    }
}

function detachResolutionFromProtocol() {
    window._savedProtocolId = null;
    try { sessionStorage.removeItem('saved_protocol_id'); } catch (e) { }
    updateResolutionAttachHint();
    showToast('Постановление отвязано от протокола', 'info');
}

// ========== НОМЕР ПОСЛЕДНЕГО ПОСТАНОВЛЕНИЯ ==========
async function fetchLastResolutionNumber() {
    try {
        const { data, error } = await supabaseClient
            .from('protocols')
            .select('resolution_data')
            .order('updated_at', { ascending: false })
            .limit(50);

        if (error) throw new Error(error.message);

        const withNum = (data || []).find(r => r.resolution_data?.number);
        const lastNumber = withNum?.resolution_data?.number;

        if (!lastNumber) {
            showToast('В базе пока нет постановлений — начните с 000001', 'info');
            return;
        }

        const next = incrementRegNumber(lastNumber);
        document.getElementById('resNumber').value = next;
        generateResolution();
        showToast(`Последний: ${lastNumber}. Подставлен следующий: ${next}`, 'success');
    } catch (e) {
        showToast('Ошибка: ' + e.message, 'error');
    }
}

// ========== СКАЧИВАНИЕ PNG ==========
async function downloadResolution() {
    const canvas = document.getElementById('resolutionCanvas');
    if (!canvas || canvas.width === 0) { showToast('Холст пуст', 'error'); return; }

    const num = document.getElementById('resNumber').value.trim() || 'Постановление';
    const safe = num.replace(/[\\/:*?"<>|]/g, '_');

    const wasActive = {};
    for (const t of ['resCitizen', 'resOfficial', 'resReceiver']) {
        if (typeof signatureData !== 'undefined' && signatureData[t]) {
            wasActive[t] = signatureData[t].active;
            signatureData[t].active = false;
        }
    }

    // ★ Ждём РЕАЛЬНУЮ отрисовку, а не debounce
    await window.generateResolutionNow();

    const link = document.createElement('a');
    link.download = `Постановление_${safe}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    for (const t of ['resCitizen', 'resOfficial', 'resReceiver']) {
        if (typeof signatureData !== 'undefined' && signatureData[t]) {
            signatureData[t].active = wasActive[t];
        }
    }
    window.generateResolutionNow();
}

// ========== СОХРАНЕНИЕ ==========
async function saveResolutionToDB() {
    if (typeof blockWrite === 'function' && blockWrite('сохранять постановления в базу')) return;

    const number = document.getElementById('resNumber').value.trim();
    const date = document.getElementById('resDate').value.trim();
    const lastName = document.getElementById('resCitizenLastName').value.trim();
    const articleNum = document.getElementById('resArticleNumber').value.trim();

    if (!number) { showToast('Укажите рег. номер постановления', 'warning'); return; }
    if (!date) { showToast('Укажите дату рассмотрения', 'warning'); return; }
    if (!lastName) { showToast('Укажите фамилию гражданина', 'warning'); return; }
    if (!articleNum) { showToast('Укажите номер статьи КоАП РФ', 'warning'); return; }

    const protocolId = window._savedProtocolId;

    if (!protocolId) {
        await openAttachResolutionModal();
        return;
    }

    await saveResolutionToProtocol(protocolId);
}

async function saveResolutionToProtocol(protocolId) {
    const number = document.getElementById('resNumber').value.trim();
    const lastName = document.getElementById('resCitizenLastName').value.trim();
    const articleNum = document.getElementById('resArticleNumber').value.trim();

    const btn = document.getElementById('resolutionSaveToDbBtn');
    const origText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }

    let uploadedFile = null;
    let oldResPhotoUrl = null;

    try {
        const wasActive = {};
        for (const t of ['resCitizen', 'resOfficial', 'resReceiver']) {
            if (signatureData[t]) { wasActive[t] = signatureData[t].active; signatureData[t].active = false; }
        }
        await window.generateResolutionNow();

        const canvas = document.getElementById('resolutionCanvas');
        const photoUrl = await uploadResolutionPhoto(canvas, number);
        uploadedFile = extractFileNameFromUrl(photoUrl);

        for (const t of ['resCitizen', 'resOfficial', 'resReceiver']) {
            if (signatureData[t]) signatureData[t].active = wasActive[t];
        }
        await window.generateResolutionNow();

        const { data: current } = await supabaseClient
            .from('protocols')
            .select('photos, reg_number, resolution_photo_url')
            .eq('id', protocolId)
            .single();

        oldResPhotoUrl = current?.resolution_photo_url || null;

        const photos = (current?.photos && typeof current.photos === 'object')
            ? current.photos
            : { page1: [], page2: [] };
        photos.resolution = [photoUrl];

        const resData = collectResolutionData();
        resData.photo_url = photoUrl;
        resData.saved_at = new Date().toISOString();
        resData.saved_by = window.currentUser?.id || null;

        const { error } = await supabaseClient
            .from('protocols')
            .update({
                resolution_data: resData,
                resolution_photo_url: photoUrl,
                photos: photos,
                updated_at: new Date().toISOString()
            })
            .eq('id', protocolId);

        if (error) throw new Error(error.message);

        if (oldResPhotoUrl && oldResPhotoUrl !== photoUrl) {
            try {
                const oldName = extractFileNameFromUrl(oldResPhotoUrl);
                if (oldName) await supabaseClient.storage.from('protocol-photos').remove([oldName]);
            } catch (e) { console.warn('Не удалось удалить старое фото постановления:', e); }
        }

        if (typeof logAction === 'function') {
            await logAction('resolution_create', 'protocols', protocolId, {
                kind: 'create',
                summary: `Создал постановление ${number} к протоколу ${current?.reg_number || ''} (${lastName})`,
                snapshot: { number, citizen: lastName, article: articleNum }
            });
        }

        window._savedProtocolId = protocolId;
        try { sessionStorage.setItem('saved_protocol_id', protocolId); } catch (e) { }

        showToast(`Постановление ${number} приложено к протоколу ${current?.reg_number || ''}`, 'success');
        updateResolutionAttachHint();

    } catch (e) {
        console.error('[resolution-save]', e);
        if (uploadedFile) {
            try { await supabaseClient.storage.from('protocol-photos').remove([uploadedFile]); } catch (_) { }
        }
        showToast('Ошибка: ' + e.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = origText || 'Сохранить постановление в базу'; }
    }
}

async function uploadResolutionPhoto(canvas, number) {
    const safe = String(number).replace(/[^a-zA-Z0-9]/g, '_') || 'resolution';
    const fileName = `resolution_${safe}_${Date.now()}.jpg`;
    const blob = await compressProtocolCanvas(canvas, 1600, 0.85);

    const { error } = await supabaseClient.storage
        .from('protocol-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

    if (error) throw new Error('Не удалось загрузить фото: ' + error.message);

    const { data: { publicUrl } } = supabaseClient.storage
        .from('protocol-photos')
        .getPublicUrl(fileName);
    return publicUrl;
}

function extractFileNameFromUrl(url) {
    if (!url) return null;
    const parts = url.split('/protocol-photos/');
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
}

// ========== МОДАЛКА ВЫБОРА ПРОТОКОЛА ==========
async function openAttachResolutionModal() {
    const modal = document.getElementById('attachResolutionModal');
    if (!modal) return;

    document.getElementById('attachProtocolSearch').value = '';
    document.getElementById('attachProtocolSelectedId').value = '';
    document.getElementById('attachProtocolConfirmBtn').disabled = true;
    document.getElementById('attachProtocolList').innerHTML =
        '<div class="eis-loading"><div class="eis-spinner"></div><span>Загрузка...</span></div>';

    modal.style.display = 'flex';

    try {
        const { data, error } = await supabaseClient
            .from('protocols')
            .select('id, reg_number, protocol_date, violator_last_name, violator_first_name, violator_middle_name, vehicle_plate, resolution_data, created_at')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) throw new Error(error.message);

        attachProtocolsCache = data || [];
        renderAttachProtocolList();
    } catch (e) {
        document.getElementById('attachProtocolList').innerHTML =
            `<div class="eis-no-results">Ошибка: ${escapeHtmlAttach(e.message)}</div>`;
    }
}

function renderAttachProtocolList() {
    const container = document.getElementById('attachProtocolList');
    if (!container) return;

    const q = (document.getElementById('attachProtocolSearch')?.value || '').toLowerCase().trim();
    const selectedId = document.getElementById('attachProtocolSelectedId')?.value || '';

    const filtered = attachProtocolsCache.filter(p => {
        if (!q) return true;
        const fio = [p.violator_last_name, p.violator_first_name, p.violator_middle_name].filter(Boolean).join(' ');
        const hay = [p.reg_number, fio, p.vehicle_plate].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="eis-no-results" style="padding:24px;">Протоколы не найдены</div>';
        return;
    }

    container.innerHTML = filtered.map(p => {
        const fio = [p.violator_last_name, p.violator_first_name, p.violator_middle_name].filter(Boolean).join(' ') || '—';
        const hasRes = !!p.resolution_data;
        const dateStr = p.protocol_date ? formatDate(p.protocol_date) : '—';
        const isChecked = p.id === selectedId;

        return `<label class="eis-manage-row ${isChecked ? 'is-checked' : ''}" data-id="${p.id}" style="cursor:pointer;" 
                       onclick="selectAttachProtocol('${p.id}')">
            <input type="radio" name="attachProtocolRadio" value="${p.id}" ${isChecked ? 'checked' : ''}
                   onchange="selectAttachProtocol('${p.id}')">
            <div class="eis-manage-row-info">
                <div class="eis-manage-row-name">
                    <strong>${escapeHtmlAttach(p.reg_number || '—')}</strong>
                    · ${escapeHtmlAttach(fio)}
                    ${hasRes ? '<span style="color:#f57c00;font-size:11px;margin-left:6px;">(уже есть постановление)</span>' : ''}
                </div>
                <div class="eis-manage-row-sub">
                    ${dateStr}${p.vehicle_plate ? ' · ' + escapeHtmlAttach(p.vehicle_plate) : ''}
                </div>
            </div>
        </label>`;
    }).join('');
}

function selectAttachProtocol(id) {
    document.getElementById('attachProtocolSelectedId').value = id;
    document.getElementById('attachProtocolConfirmBtn').disabled = false;
    document.querySelectorAll('#attachProtocolList .eis-manage-row').forEach(row => {
        row.classList.toggle('is-checked', row.dataset.id === id);
    });
}

async function confirmAttachResolution() {
    const id = document.getElementById('attachProtocolSelectedId').value;
    if (!id) return;

    closeAttachResolutionModal();
    window._savedProtocolId = id;
    try { sessionStorage.setItem('saved_protocol_id', id); } catch (e) { }
    await saveResolutionToProtocol(id);
}

function closeAttachResolutionModal() {
    const modal = document.getElementById('attachResolutionModal');
    if (modal) modal.style.display = 'none';
}

// ========== ЗАГРУЗКА ИЗ URL (?protocolId=) ==========
async function initResolutionFromUrl() {
    const urlId = new URLSearchParams(window.location.search).get('protocolId');
    if (!urlId) return;

    window._savedProtocolId = urlId;
    try { sessionStorage.setItem('saved_protocol_id', urlId); } catch (e) { }

    try {
        const { data } = await supabaseClient
            .from('protocols')
            .select('resolution_data')
            .eq('id', urlId)
            .single();

        if (data?.resolution_data) {
            const r = data.resolution_data;
            const setVal = (id, v) => {
                const el = document.getElementById(id);
                if (el && v !== undefined && v !== null) el.value = v;
            };
            setVal('resNumber', r.number);
            setVal('resDate', r.date);
            setVal('resPlace', r.place);
            setVal('resOfficialPosition', r.officialPosition);
            setVal('resOfficialDepartment', r.officialDepartment);
            setVal('resOfficialRank', r.officialRank);
            setVal('resOfficialName', r.officialName);
            setVal('resOfficialAddress', r.officialAddress);
            setVal('resCitizenLastName', r.citizenLastName);
            setVal('resCitizenFirstName', r.citizenFirstName);
            setVal('resCitizenMiddleName', r.citizenMiddleName);
            setVal('resBirthDate', r.birthDate);
            setVal('resBirthPlace', r.birthPlace);
            setVal('resCitizenship', r.citizenship);
            setVal('resDriverLicense', r.driverLicense);
            setVal('resRegisteredAddress', r.registeredAddress);
            setVal('resRegisteredPhone', r.registeredPhone);
            setVal('resActualAddress', r.actualAddress);
            setVal('resActualPhone', r.actualPhone);
            setVal('resWorkPlace', r.workPlace);
            setVal('resWorkPosition', r.workPosition);
            setVal('resWorkPhone', r.workPhone);
            setVal('resVehicleMake', r.vehicleMake);
            setVal('resVehicleModel', r.vehicleModel);
            setVal('resVehiclePlate', r.vehiclePlate);
            setVal('resViolationDate', r.violationDate);
            setVal('resViolationTime', r.violationTime);
            setVal('resViolationPlace', r.violationPlace);
            setVal('resCircumstances', r.circumstances);
            setVal('resArticlePart', r.articlePart);
            setVal('resArticleNumber', r.articleNumber);
            setVal('resMotivatedDecision', r.motivatedDecision);
            setVal('resCopyReceivedDate', r.copyReceivedDate);

            if (r.languageOwns) {
                const t = document.querySelector(`input[name="resLanguageOwns"][value="${r.languageOwns}"]`);
                if (t) t.checked = true;
            }
            if (r.dispute) {
                const t = document.querySelector(`input[name="resDispute"][value="${r.dispute}"]`);
                if (t) t.checked = true;
            }

            generateResolution();
            showToast('Постановление загружено для редактирования', 'info');
        }
    } catch (e) {
        console.warn('[resolution] init from URL error:', e);
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', async function () {
    if (!document.getElementById('resolutionCanvas')) return;

    await initResolutionFromUrl();
    updateResolutionAttachHint();
    setTimeout(generateResolution, 300);
});

const __generateResolutionNow = generateResolution;
window.generateResolution = debounce(generateResolution, 250);
window.generateResolutionNow = __generateResolutionNow;
window.autoFillResolutionFromProtocol = autoFillResolutionFromProtocol;
window.fetchLastResolutionNumber = fetchLastResolutionNumber;
window.downloadResolution = downloadResolution;
window.saveResolutionToDB = saveResolutionToDB;
window.saveResolutionToProtocol = saveResolutionToProtocol;
window.formatResolutionDate = formatResolutionDate;
window.formatResolutionTime = formatResolutionTime;
window.formatResolutionPhone = formatResolutionPhone;
window.formatResolutionBirthDate = formatResolutionBirthDate;
window.updateResolutionAttachHint = updateResolutionAttachHint;
window.detachResolutionFromProtocol = detachResolutionFromProtocol;
window.openAttachResolutionModal = openAttachResolutionModal;
window.closeAttachResolutionModal = closeAttachResolutionModal;
window.renderAttachProtocolList = renderAttachProtocolList;
window.selectAttachProtocol = selectAttachProtocol;
window.confirmAttachResolution = confirmAttachResolution;