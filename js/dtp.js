// ================================================================
// ПРОТОКОЛ ДТП — генератор (2 листа, рисование на бланке)
// backgrounds/dtp_page1.png
// backgrounds/dtp_page2.png
// ================================================================

const DTP_CONFIG = {
    canvasWidth: 1654,
    canvasHeight: 2339,
    backgrounds: {
        page1: 'backgrounds/dtp_page1.png',
        page2: 'backgrounds/dtp_page2.png',
        page3: 'backgrounds/dtp_page3.png' 
    }
};

const DTP_CIRCUMSTANCES = [
    { id: 'parked', text: 'ТС находилось на стоянке, парковке, обочине и т.п. в неподвижном состоянии' },
    { id: 'driver_absent', text: 'Водитель отсутствовал на месте ДТП' },
    { id: 'moving_parking', text: 'Двигался на стоянке' },
    { id: 'leaving_parking', text: 'Выезжал со стоянки, с места парковки, остановки, со двора, второстепенной дороги' },
    { id: 'entering_parking', text: 'Заезжал на стоянку, парковку, во двор, на второстепенную дорогу' },
    { id: 'moving_straight', text: 'Двигался прямо (не маневрировал)' },
    { id: 'moving_intersection', text: 'Двигался на перекрестке' },
    { id: 'entering_roundabout', text: 'Заезжал на перекресток с круговым движением' },
    { id: 'moving_roundabout', text: 'Двигался по перекрестку с круговым движением' },
    { id: 'collision_same_lane', text: 'Столкнулся с ТС, двигавшимся в том же направлении по той же полосе' },
    { id: 'collision_other_lane', text: 'Столкнулся с ТС, двигавшимся в том же направлении по другой полосе (в другом ряду)' },
    { id: 'changing_lane', text: 'Менял полосу (перестраивался в другой ряд)' },
    { id: 'overtaking', text: 'Обгонял' },
    { id: 'turning_right', text: 'Поворачивал направо' },
    { id: 'turning_left', text: 'Поворачивал налево' },
    { id: 'u_turn', text: 'Совершал разворот' },
    { id: 'reversing', text: 'Двигался задним ходом' },
    { id: 'oncoming_lane', text: 'Выехал на сторону дороги, предназначенную для встречного движения' },
    { id: 'second_vehicle_left', text: 'Второе ТС находилось слева от меня' },
    { id: 'priority_sign', text: 'Не выполнил требование знака приоритета' },
    { id: 'hit_object', text: 'Совершил наезд (на неподвижное ТС, препятствие, пешехода и т.п.)' },
    { id: 'stopped_red', text: 'Остановился (стоял) на запрещающий сигнал светофора' },
    { id: 'other_a', text: 'Иное (для водителя ТС "А"):' }, // Это будет только для A
    { id: 'other_b', text: 'Иное (для водителя ТС "В"):' }  // Это будет только для B
];

// Координаты для галочек для ТС "A" (левая колонка)
const CIRCUMSTANCE_COORDS_A = {
    parked: { x: 625, y: 622 + 10 },
    driver_absent: { x: 625, y: 671 + 10 },
    moving_parking: { x: 625, y: 703 + 10 },
    leaving_parking: { x: 625, y: 734 + 10 },
    entering_parking: { x: 625, y: 783 + 10 },
    moving_straight: { x: 625, y: 830 + 10 },
    moving_intersection: { x: 625, y: 862 + 10 },
    entering_roundabout: { x: 625, y: 894 + 10 },
    moving_roundabout: { x: 625, y: 940 + 10 },
    collision_same_lane: { x: 625, y: 988 + 10 },
    collision_other_lane: { x: 625, y: 1058 + 10 },
    changing_lane: { x: 625, y: 1128 + 10 },
    overtaking: { x: 625, y: 1175 + 10 },
    turning_right: { x: 625, y: 1207 + 10 },
    turning_left: { x: 625, y: 1238 + 10 },
    u_turn: { x: 625, y: 1270 + 10 },
    reversing: { x: 625, y: 1301 + 10 },
    oncoming_lane: { x: 625, y: 1333 + 10 },
    second_vehicle_left: { x: 625, y: 1402 + 10 },
    priority_sign: { x: 625, y: 1434 + 10 },
    hit_object: { x: 625, y: 1481 + 10 },
    stopped_red: { x: 625, y: 1529 + 10 },
    other_a: { x: 625, y: 1576 + 10 },
};

// Координаты для галочек для ТС "B" (правая колонка)
const CIRCUMSTANCE_COORDS_B = {
    parked: { x: 625 + 441, y: 622 + 10 },
    driver_absent: { x: 625 + 441, y: 671 + 10 },
    moving_parking: { x: 625 + 441, y: 703 + 10 },
    leaving_parking: { x: 625 + 441, y: 734 + 10 },
    entering_parking: { x: 625 + 441, y: 783 + 10 },
    moving_straight: { x: 625 + 441, y: 830 + 10 },
    moving_intersection: { x: 625 + 441, y: 862 + 10 },
    entering_roundabout: { x: 625 + 441, y: 894 + 10 },
    moving_roundabout: { x: 625 + 441, y: 940 + 10 },
    collision_same_lane: { x: 625 + 441, y: 988 + 10 },
    collision_other_lane: { x: 625 + 441, y: 1058 + 10 },
    changing_lane: { x: 625 + 441, y: 1128 + 10 },
    overtaking: { x: 625 + 441, y: 1175 + 10 },
    turning_right: { x: 625 + 441, y: 1207 + 10 },
    turning_left: { x: 625 + 441, y: 1238 + 10 },
    u_turn: { x: 625 + 441, y: 1270 + 10 },
    reversing: { x: 625 + 441, y: 1301 + 10 },
    oncoming_lane: { x: 625 + 441, y: 1333 + 10 },
    second_vehicle_left: { x: 625 + 441, y: 1402 + 10 },
    priority_sign: { x: 625 + 441, y: 1434 + 10 },
    hit_object: { x: 625 + 441, y: 1481 + 10 },
    stopped_red: { x: 625 + 441, y: 1529 + 10 },
    other_b: { x: 625 + 441, y: 1629 + 10 },
};

// Рисование места удара — хранится в координатах бланка
const dtpDrawings = {
    a: [],   // массив линий, линия = массив точек {x, y}
    b: [],
    p3: []
};

// История для undo/redo на 3-м листе (план-схема)
// Каждый шаг — это снимок массива dtpDrawings.p3 (deep clone)
const p3History = {
    undo: [],
    redo: []
};

// Текущий инструмент на 3-м листе
let p3CurrentTool = 'pen';   // 'pen' | 'eraser'
const P3_ERASER_RADIUS = 25; // радиус стирания в координатах канваса

let drawingMode = null;          // 'a' | 'b' | null
let currentDrawLine = null;
let isDrawingOnCanvas = false;

// ================================================================
// ХЕЛПЕРЫ
// ================================================================
function getFieldValueDTP(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.disabled) return '';
    return String(el.value || '').trim();
}

function isoToDisplay(iso) {
    if (!iso) return '';
    const p = String(iso).split('-');
    if (p.length !== 3) return '';
    return `${p[2]}.${p[1]}.${p[0]}`;
}

function drawCheckmark(ctx, x, y, size = 30) {
    ctx.save();
    ctx.fillStyle = '#000f55';
    ctx.font = `italic ${size}px "Segoe Script", "Times New Roman", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', x, y);
    ctx.restore();
}

// ================================================================
// МНОГОСТРОЧНЫЙ ТЕКСТ С АВТОПЕРЕНОСОМ И АВТОРАЗМЕРОМ
// ================================================================
function fitTextMultiline(ctx, text, lines, initialSize, minSize, fontFamily, fontWeight, color, align = 'left', fontStyle = 'normal') {
    if (!text || text.trim() === '') return;

    const words = text.trim().split(/\s+/);

    for (let fontSize = initialSize; fontSize >= minSize; fontSize--) {
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;

        const lineTexts = wrapTextToLines(ctx, words, lines);
        if (lineTexts !== null) {
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.textBaseline = 'bottom';

            for (let i = 0; i < lineTexts.length && i < lines.length; i++) {
                if (!lineTexts[i]) continue;
                ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
                ctx.fillText(lineTexts[i], lines[i].x, lines[i].y);
            }
            return;
        }
    }

    const fontSize = minSize;
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
    const lineTexts = wrapTextToLines(ctx, words, lines, true);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'bottom';

    for (let i = 0; i < lineTexts.length && i < lines.length; i++) {
        if (!lineTexts[i]) continue;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
        ctx.fillText(lineTexts[i], lines[i].x, lines[i].y);
    }
}

function wrapTextToLines(ctx, words, lines, force = false) {
    const result = [];
    let currentLine = '';
    let lineIndex = 0;

    for (let w = 0; w < words.length; w++) {
        const word = words[w];

        if (lineIndex >= lines.length) {
            if (force) return result;
            return null;
        }

        const maxWidth = lines[lineIndex].maxWidth;
        const testLine = currentLine ? currentLine + ' ' + word : word;

        if (ctx.measureText(testLine).width <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                result.push(currentLine);
                lineIndex++;
                currentLine = '';

                if (lineIndex >= lines.length) {
                    if (force) return result;
                    return null;
                }
            }

            const newMaxWidth = lines[lineIndex].maxWidth;
            if (ctx.measureText(word).width <= newMaxWidth) {
                currentLine = word;
            } else {
                let remaining = word;
                while (remaining.length > 0) {
                    if (lineIndex >= lines.length) {
                        if (force) return result;
                        return null;
                    }
                    const mw = lines[lineIndex].maxWidth;
                    let chunk = '';
                    for (let c = 0; c < remaining.length; c++) {
                        const test = chunk + remaining[c];
                        if (ctx.measureText(test).width > mw) break;
                        chunk = test;
                    }
                    if (!chunk) {
                        if (force) return result;
                        return null;
                    }
                    result.push(chunk);
                    remaining = remaining.slice(chunk.length);
                    lineIndex++;
                }
                currentLine = '';
            }
        }
    }

    if (currentLine) {
        result.push(currentLine);
    }

    if (result.length > lines.length) {
        if (force) return result.slice(0, lines.length);
        return null;
    }

    return result;
}

// ================================================================
// РИСОВАНИЕ ПРЯМО НА БЛАНКЕ
// ================================================================
function getCanvasPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if (e.touches && e.touches.length) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function toggleDrawingMode(key) {
    if (drawingMode === key) {
        drawingMode = null;
    } else {
        drawingMode = key;

        if (typeof deactivateSignatures === 'function') {
            deactivateSignatures();
        }
    }
    updateDrawingButtons();
    updateCanvasCursor();
    p3UpdateToolbarState();
}

window.onSignatureActivated = function () {
    if (drawingMode) {
        drawingMode = null;
        updateDrawingButtons();
        updateCanvasCursor();
    }
};

function updateDrawingButtons() {
    const btnA = document.getElementById('toggleDrawABtn');
    const btnB = document.getElementById('toggleDrawBBtn');
    const btnP3 = document.getElementById('toggleDrawP3Btn');   // ← добавить

    if (btnA) {
        if (drawingMode === 'a') {
            btnA.textContent = 'Режим рисования A — ВКЛ (кликните для выкл)';
            btnA.classList.remove('eis-btn-secondary');
            btnA.classList.add('eis-btn-primary');
        } else {
            btnA.textContent = 'Режим рисования — ВЫКЛ';
            btnA.classList.add('eis-btn-secondary');
            btnA.classList.remove('eis-btn-primary');
        }
    }

    if (btnB) {
        if (drawingMode === 'b') {
            btnB.textContent = 'Режим рисования B — ВКЛ (кликните для выкл)';
            btnB.classList.remove('eis-btn-secondary');
            btnB.classList.add('eis-btn-primary');
        } else {
            btnB.textContent = 'Режим рисования — ВЫКЛ';
            btnB.classList.add('eis-btn-secondary');
            btnB.classList.remove('eis-btn-primary');
        }
    }

    // ← добавить блок для плана-схемы
    if (btnP3) {
        if (drawingMode === 'p3') {
            btnP3.textContent = 'Режим рисования — ВКЛ (кликните для выкл)';
            btnP3.classList.remove('eis-btn-secondary');
            btnP3.classList.add('eis-btn-primary');
        } else {
            btnP3.textContent = 'Режим рисования — ВЫКЛ';
            btnP3.classList.add('eis-btn-secondary');
            btnP3.classList.remove('eis-btn-primary');
        }
    }
}

function updateCanvasCursor() {
    const c1 = document.getElementById('dtpCanvas1');
    const c3 = document.getElementById('dtpCanvas3');
    const cursor = drawingMode ? 'crosshair' : 'default';
    if (c1) c1.style.cursor = cursor;
    if (c3) c3.style.cursor = cursor;
}

function clearDtpDrawing(key) {
    dtpDrawings[key] = [];
    generateDTP();
}

function initDtpDrawingHandlers() {
    // Рисование на 1-м листе — режимы 'a' и 'b'
    setupDrawingHandlers('dtpCanvas1', ['a', 'b']);
    // Рисование на 3-м листе (план-схема) — режим 'p3'
    setupDrawingHandlers('dtpCanvas3', ['p3']);
}

function setupDrawingHandlers(canvasId, allowedModes) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const onDown = (e) => {
        if (!drawingMode) return;
        if (!allowedModes.includes(drawingMode)) return;
        e.stopImmediatePropagation();
        e.preventDefault();

        const pos = getCanvasPos(canvas, e);

        // --- ЛАСТИК для p3 ---
        if (drawingMode === 'p3' && p3CurrentTool === 'eraser') {
            p3Snapshot();
            isDrawingOnCanvas = true;
            currentDrawLine = { __eraser: true }; // маркер, что это стирание
            p3EraseAt(pos.x, pos.y);
            generateDTP();
            return;
        }

        // --- Обычное рисование ---
        if (drawingMode === 'p3') p3Snapshot();
        isDrawingOnCanvas = true;
        currentDrawLine = [pos];
        dtpDrawings[drawingMode].push(currentDrawLine);
        generateDTP();
    };

    const onMove = (e) => {
        if (!drawingMode) return;
        if (!allowedModes.includes(drawingMode)) return;
        canvas.style.cursor = 'crosshair';
        if (!isDrawingOnCanvas) return;
        e.stopImmediatePropagation();
        e.preventDefault();

        const pos = getCanvasPos(canvas, e);

        // --- Ластик продолжает стирать ---
        if (drawingMode === 'p3' && p3CurrentTool === 'eraser') {
            p3EraseAt(pos.x, pos.y);
            generateDTP();
            return;
        }

        // --- Обычное рисование продолжается ---
        if (Array.isArray(currentDrawLine)) {
            currentDrawLine.push(pos);
            generateDTP();
        }
    };

    const onUp = (e) => {
        if (!drawingMode || !isDrawingOnCanvas) return;
        e.stopImmediatePropagation();
        e.preventDefault();

        isDrawingOnCanvas = false;
        currentDrawLine = null;
    };

    canvas.addEventListener('mousedown', onDown, true);
    canvas.addEventListener('mousemove', onMove, true);
    canvas.addEventListener('mouseup', onUp, true);
    canvas.addEventListener('mouseleave', onUp, true);

    canvas.addEventListener('touchstart', onDown, { capture: true, passive: false });
    canvas.addEventListener('touchmove', onMove, { capture: true, passive: false });
    canvas.addEventListener('touchend', onUp, { capture: true, passive: false });
    canvas.addEventListener('touchcancel', onUp, { capture: true, passive: false });
}

// Стереть всё, что попадает в радиус ластика
function p3EraseAt(px, py) {
    const r = P3_ERASER_RADIUS;
    dtpDrawings.p3 = dtpDrawings.p3.filter(line => {
        return !p3PointNearLine(px, py, line, r);
    });
}

function drawAllDtpDrawings(ctx, keys = ['a', 'b', 'p3']) {
    ctx.save();
    ctx.strokeStyle = '#000f55';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    keys.forEach(key => {
        const lines = dtpDrawings[key] || [];
        lines.forEach(line => {
            if (line.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(line[0].x, line[0].y);
            for (let i = 1; i < line.length; i++) {
                ctx.lineTo(line[i].x, line[i].y);
            }
            ctx.stroke();
        });
    });

    ctx.restore();
}

// ================================================================
// ГИБДД — активность поля
// ================================================================
function onGibddChange() {
    const val = document.getElementById('dtpGibdd').value;
    const numInput = document.getElementById('dtpGibddNumber');

    if (val === 'Да') {
        numInput.disabled = false;
    } else {
        numInput.disabled = true;
        numInput.value = '';
    }
    generateDTP();
}

// ================================================================
// ОТРИСОВКА ДАННЫХ — ШАПКА И ОБЩИЕ СВЕДЕНИЯ
// ================================================================
function drawDTPHeaderAndGeneral(ctx) {
    const ff = 'Segoe Script';
    const color = '#000f55';
    const style = 'italic';

    const num = getFieldValueDTP('dtpNumber');
    const dateRaw = getFieldValueDTP('dtpDate');
    const timeStr = getFieldValueDTP('dtpTime');

    if (num) fitText(ctx, '№ ' + num, 778 + 292 / 2, 137 + 35, 292, 35, ff, 'normal', color, 'center', style);

    // ===== ДАТА ПО ЯЧЕЙКАМ =====
    if (dateRaw) {
        const parts = String(dateRaw).split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            const digits = (day + month + year).split('');

            if (digits[0]) fitText(ctx, digits[0], 267, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (digits[1]) fitText(ctx, digits[1], 288, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (digits[2]) fitText(ctx, digits[2], 332, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (digits[3]) fitText(ctx, digits[3], 353, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (digits[4]) fitText(ctx, digits[4], 396, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (digits[5]) fitText(ctx, digits[5], 418, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (digits[6]) fitText(ctx, digits[6], 439, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (digits[7]) fitText(ctx, digits[7], 461, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
        }
    }

    // ===== ВРЕМЯ ПО ЯЧЕЙКАМ =====
    if (timeStr) {
        const tParts = String(timeStr).split(':');
        if (tParts.length === 2) {
            const [hh, mm] = tParts;
            const tDigits = (hh + mm).split('');

            if (tDigits[0]) fitText(ctx, tDigits[0], 504, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (tDigits[1]) fitText(ctx, tDigits[1], 526, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (tDigits[2]) fitText(ctx, tDigits[2], 569, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
            if (tDigits[3]) fitText(ctx, tDigits[3], 590, 258 + 25, 20, 25, ff, 'normal', color, 'center', style);
        }
    }

    const place = getFieldValueDTP('dtpPlace');
    if (place) fitText(ctx, place, 250, 203 + 35, 1329, 30, ff, 'normal', color, 'left', style);

    const damaged = getFieldValueDTP('dtpDamagedCount');
    const injured = getFieldValueDTP('dtpInjuredCount');
    const dead = getFieldValueDTP('dtpDeadCount');
    if (damaged) fitText(ctx, damaged, 1025 + 31, 258 + 30, 62, 30, ff, 'normal', color, 'center', style);
    if (injured) fitText(ctx, injured, 832 + 31, 304 + 30, 63, 30, ff, 'normal', color, 'center', style);
    if (dead) fitText(ctx, dead, 1027 + 31, 304 + 30, 62, 30, ff, 'normal', color, 'center', style);

    const alcohol = getFieldValueDTP('dtpAlcohol');
    if (alcohol === 'Да') drawCheckmark(ctx, 955, 360);
    else if (alcohol === 'Нет') drawCheckmark(ctx, 1036, 360);

    const dmgVeh = getFieldValueDTP('dtpDamageOtherVehicles');
    if (dmgVeh === 'Да') drawCheckmark(ctx, 986 + 11, 396 + 10);
    else if (dmgVeh === 'Нет') drawCheckmark(ctx, 1068 + 11, 396 + 10);

    const dmgProp = getFieldValueDTP('dtpDamageOtherProperty');
    if (dmgProp === 'Да') drawCheckmark(ctx, 1424 + 11, 396 + 10);
    else if (dmgProp === 'Нет') drawCheckmark(ctx, 1495 + 11, 396 + 10);

    const witnesses = getFieldValueDTP('dtpWitnesses');
    if (witnesses) {
        fitTextMultiline(
            ctx,
            witnesses,
            [
                { x: 291, y: 441 + 30, maxWidth: 1288 },
                { x: 114, y: 490 + 30, maxWidth: 1465 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    const gibdd = getFieldValueDTP('dtpGibdd');
    if (gibdd === 'Да') drawCheckmark(ctx, 986 + 11, 522 + 10);
    else if (gibdd === 'Нет') drawCheckmark(ctx, 1087 + 11, 522 + 10);

    const gibddNum = getFieldValueDTP('dtpGibddNumber');
    if (gibddNum) fitText(ctx, gibddNum, 1188 + 234 / 2, 522 + 30, 234, 30, ff, 'normal', color, 'center', style);
}

// ================================================================
// ОТРИСОВКА БЛОКА ТС «A» (ЛЕВАЯ КОЛОНКА)
// ================================================================
function drawDTPVehicleBlockA(ctx, startY) {
    const ff = 'Segoe Script';
    const color = '#000f55';
    const style = 'italic';
    const v = (s) => getFieldValueDTP('a' + s);

    if (v('MakeModel')) {
        fitTextMultiline(
            ctx,
            v('MakeModel'),
            [
                { x: 307, y: 621 + 30, maxWidth: 275 },
                { x: 114, y: 652 + 30, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('Vin')) {
        const vinChars = v('Vin').toUpperCase().split('');

        if (vinChars[0]) fitText(ctx, vinChars[0], 115 + 21 / 2, 709 + 25, 21, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[1]) fitText(ctx, vinChars[1], 138 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[2]) fitText(ctx, vinChars[2], 160 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[3]) fitText(ctx, vinChars[3], 182 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[4]) fitText(ctx, vinChars[4], 204 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[5]) fitText(ctx, vinChars[5], 226 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[6]) fitText(ctx, vinChars[6], 248 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[7]) fitText(ctx, vinChars[7], 270 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[8]) fitText(ctx, vinChars[8], 292 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[9]) fitText(ctx, vinChars[9], 314 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[10]) fitText(ctx, vinChars[10], 336 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[11]) fitText(ctx, vinChars[11], 358 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[12]) fitText(ctx, vinChars[12], 380 + 21 / 2, 709 + 25, 21, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[13]) fitText(ctx, vinChars[13], 403 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[14]) fitText(ctx, vinChars[14], 425 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[15]) fitText(ctx, vinChars[15], 447 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[16]) fitText(ctx, vinChars[16], 469 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('Plate')) {
        const plateChars = v('Plate').toUpperCase().split('');

        if (plateChars[0]) fitText(ctx, plateChars[0], 391 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[1]) fitText(ctx, plateChars[1], 412 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[2]) fitText(ctx, plateChars[2], 434 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[3]) fitText(ctx, plateChars[3], 455 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[4]) fitText(ctx, plateChars[4], 476 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[5]) fitText(ctx, plateChars[5], 497 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[6]) fitText(ctx, plateChars[6], 519 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[7]) fitText(ctx, plateChars[7], 540 + 9, 742 + 25, 18, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[8]) fitText(ctx, plateChars[8], 560 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('StsSeries')) {
        const stsSeries = v('StsSeries').toUpperCase().split('');

        if (stsSeries[0]) fitText(ctx, stsSeries[0], 347 + 10, 775+25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsSeries[1]) fitText(ctx, stsSeries[1], 369 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsSeries[2]) fitText(ctx, stsSeries[2], 391 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsSeries[3]) fitText(ctx, stsSeries[3], 413 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('StsNumber')) {
        const stsNumber = v('StsNumber').toUpperCase().split('');

        if (stsNumber[0]) fitText(ctx, stsNumber[0], 448 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[1]) fitText(ctx, stsNumber[1], 470 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[2]) fitText(ctx, stsNumber[2], 492 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[3]) fitText(ctx, stsNumber[3], 514 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[4]) fitText(ctx, stsNumber[4], 536 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[5]) fitText(ctx, stsNumber[5], 558 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('Owner')) {
        fitTextMultiline(
            ctx,
            v('Owner'),
            [
                { x: 303, y: 811 + 35, maxWidth: 279 },
                { x: 114, y: 858 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('OwnerAddress')) {
        fitTextMultiline(
            ctx,
            v('OwnerAddress'),
            [
                { x: 181, y: 905 + 35, maxWidth: 401 },
                { x: 114, y: 937 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('DriverName')) {
        fitTextMultiline(
            ctx,
            v('DriverName'),
            [
                { x: 271, y: 968 + 35, maxWidth: 311 },
                { x: 114, y: 1010 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('DriverBirthDate')) {
        const parts = String(v('DriverBirthDate')).split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            const digits = (day + month + year).split('');

            if (digits[0]) fitText(ctx, digits[0], 356 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[1]) fitText(ctx, digits[1], 378 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[2]) fitText(ctx, digits[2], 422 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[3]) fitText(ctx, digits[3], 444 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[4]) fitText(ctx, digits[4], 488 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[5]) fitText(ctx, digits[5], 510 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[6]) fitText(ctx, digits[6], 532 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[7]) fitText(ctx, digits[7], 554 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        }
    }

    if (v('DriverPhone')) {
        const digits = v('DriverPhone').replace(/\D/g, '').split('');

        if (digits[0]) fitText(ctx, digits[0], 245 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[1]) fitText(ctx, digits[1], 268 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[2]) fitText(ctx, digits[2], 290 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[3]) fitText(ctx, digits[3], 312 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[4]) fitText(ctx, digits[4], 334 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[5]) fitText(ctx, digits[5], 356 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[6]) fitText(ctx, digits[6], 378 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[7]) fitText(ctx, digits[7], 400 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[8]) fitText(ctx, digits[8], 422 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[9]) fitText(ctx, digits[9], 444 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[10]) fitText(ctx, digits[10], 466 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[11]) fitText(ctx, digits[11], 488 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[12]) fitText(ctx, digits[12], 510 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[13]) fitText(ctx, digits[13], 533 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[14]) fitText(ctx, digits[14], 555 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('DriverAddress')) {
        fitTextMultiline(
            ctx,
            v('DriverAddress'),
            [
                { x: 181, y: 1090 + 35, maxWidth: 401 },
                { x: 114, y: 1122 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('VUSeries')) {
        const vuSeries = v('VUSeries').toUpperCase().split('');

        if (vuSeries[0]) fitText(ctx, vuSeries[0], 342 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuSeries[1]) fitText(ctx, vuSeries[1], 364 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuSeries[2]) fitText(ctx, vuSeries[2], 386 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuSeries[3]) fitText(ctx, vuSeries[3], 409 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('VUNumber')) {
        const vuNumber = v('VUNumber').toUpperCase().split('');

        if (vuNumber[0]) fitText(ctx, vuNumber[0], 443 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[1]) fitText(ctx, vuNumber[1], 465 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[2]) fitText(ctx, vuNumber[2], 487 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[3]) fitText(ctx, vuNumber[3], 509 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[4]) fitText(ctx, vuNumber[4], 532 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[5]) fitText(ctx, vuNumber[5], 554 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('VUCategory')) {
        fitText(ctx, v('VUCategory'), 245 + 87/2, 1258 + 25, 87, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('VUIssueDate')) {
        const parts = String(v('VUIssueDate')).split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            const digits = (day + month + year).split('');

            if (digits[0]) fitText(ctx, digits[0], 356 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[1]) fitText(ctx, digits[1], 378 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[2]) fitText(ctx, digits[2], 422 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[3]) fitText(ctx, digits[3], 444 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[4]) fitText(ctx, digits[4], 488 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[5]) fitText(ctx, digits[5], 510 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[6]) fitText(ctx, digits[6], 532 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[7]) fitText(ctx, digits[7], 554 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        }
    }

    if (v('OwnershipDoc')) {
        fitText(ctx, v('OwnershipDoc'), 282, 1319+35, 300, 30, ff, 'normal', color, 'left', style);
    }


    if (v('Insurer')) {
        fitText(ctx, v('Insurer'), 114, 1410+35, 468, 30, ff, 'normal', color, 'left', style);
    }


    if (v('PolicySeries')) {
        const polSeries = v('PolicySeries').toUpperCase().split('');

        if (polSeries[0]) fitText(ctx, polSeries[0], 277 + 9, 1471 + 25, 18, 25, ff, 'normal', color, 'center', 'normal');
        if (polSeries[1]) fitText(ctx, polSeries[1], 297 + 9, 1471 + 25, 18, 25, ff, 'normal', color, 'center', 'normal');
        if (polSeries[2]) fitText(ctx, polSeries[2], 318 + 9, 1471 + 25, 18, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('PolicyNumber')) {
        const polNumber = v('PolicyNumber').toUpperCase().split('');

        if (polNumber[0]) fitText(ctx, polNumber[0], 360 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[1]) fitText(ctx, polNumber[1], 382 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[2]) fitText(ctx, polNumber[2], 404 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[3]) fitText(ctx, polNumber[3], 426 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[4]) fitText(ctx, polNumber[4], 449 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[5]) fitText(ctx, polNumber[5], 471 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[6]) fitText(ctx, polNumber[6], 493 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[7]) fitText(ctx, polNumber[7], 515 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[8]) fitText(ctx, polNumber[8], 537 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[9]) fitText(ctx, polNumber[9], 559 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('PolicyValidUntil')) {
        const parts = String(v('PolicyValidUntil')).split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            const digits = (day + month + year).split('');

            if (digits[0]) fitText(ctx, digits[0], 360 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[1]) fitText(ctx, digits[1], 382 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[2]) fitText(ctx, digits[2], 426 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[3]) fitText(ctx, digits[3], 448 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[4]) fitText(ctx, digits[4], 492 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[5]) fitText(ctx, digits[5], 514 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[6]) fitText(ctx, digits[6], 536 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[7]) fitText(ctx, digits[7], 558 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        }
    }

    const insured = v('Insured');
    if (insured === 'Нет') drawCheckmark(ctx, 421 + 11, 1577 +10);
    else if (insured === 'Да') drawCheckmark(ctx, 509 + 11, 1577+10);

    if (v('Damage')) {
        fitTextMultiline(
            ctx,
            v('Damage'),
            [
                { x: 114, y: 1879 + 35, maxWidth: 468 },
                { x: 114, y: 1910 + 35, maxWidth: 468 },
                { x: 114, y: 1942 + 35, maxWidth: 468 },
                { x: 114, y: 1973 + 35, maxWidth: 468 },
                { x: 114, y: 2004 + 35, maxWidth: 468 },
                { x: 114, y: 2036 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('Remarks')) {
        fitTextMultiline(
            ctx,
            v('Remarks'),
            [
                { x: 249, y: 2067 + 35, maxWidth: 333 },
                { x: 114, y: 2098 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }
}

// ================================================================
// ОТРИСОВКА БЛОКА ТС «B» (ПРАВАЯ КОЛОНКА)
// ================================================================
// ================================================================
// ОТРИСОВКА БЛОКА ТС «B» (ПРАВАЯ КОЛОНКА)
// X_B = X_A + 997
// ================================================================
function drawDTPVehicleBlockB(ctx, startY) {
    const ff = 'Segoe Script';
    const color = '#000f55';
    const style = 'italic';
    const v = (s) => getFieldValueDTP('b' + s);

    if (v('MakeModel')) {
        fitTextMultiline(
            ctx,
            v('MakeModel'),
            [
                { x: 307 + 997, y: 621 + 30, maxWidth: 275 },
                { x: 114 + 997, y: 652 + 30, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('Vin')) {
        const vinChars = v('Vin').toUpperCase().split('');

        if (vinChars[0]) fitText(ctx, vinChars[0], 115 + 997 + 21 / 2, 709 + 25, 21, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[1]) fitText(ctx, vinChars[1], 138 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[2]) fitText(ctx, vinChars[2], 160 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[3]) fitText(ctx, vinChars[3], 182 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[4]) fitText(ctx, vinChars[4], 204 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[5]) fitText(ctx, vinChars[5], 226 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[6]) fitText(ctx, vinChars[6], 248 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[7]) fitText(ctx, vinChars[7], 270 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[8]) fitText(ctx, vinChars[8], 292 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[9]) fitText(ctx, vinChars[9], 314 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[10]) fitText(ctx, vinChars[10], 336 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[11]) fitText(ctx, vinChars[11], 358 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[12]) fitText(ctx, vinChars[12], 380 + 997 + 21 / 2, 709 + 25, 21, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[13]) fitText(ctx, vinChars[13], 403 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[14]) fitText(ctx, vinChars[14], 425 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[15]) fitText(ctx, vinChars[15], 447 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vinChars[16]) fitText(ctx, vinChars[16], 469 + 997 + 10, 709 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('Plate')) {
        const plateChars = v('Plate').toUpperCase().split('');

        if (plateChars[0]) fitText(ctx, plateChars[0], 391 + 997 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[1]) fitText(ctx, plateChars[1], 412 + 997 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[2]) fitText(ctx, plateChars[2], 434 + 997 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[3]) fitText(ctx, plateChars[3], 455 + 997 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[4]) fitText(ctx, plateChars[4], 476 + 997 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[5]) fitText(ctx, plateChars[5], 497 + 997 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[6]) fitText(ctx, plateChars[6], 519 + 997 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[7]) fitText(ctx, plateChars[7], 540 + 997 + 9, 742 + 25, 18, 25, ff, 'normal', color, 'center', 'normal');
        if (plateChars[8]) fitText(ctx, plateChars[8], 560 + 997 + 9, 742 + 25, 19, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('StsSeries')) {
        const stsSeries = v('StsSeries').toUpperCase().split('');

        if (stsSeries[0]) fitText(ctx, stsSeries[0], 347 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsSeries[1]) fitText(ctx, stsSeries[1], 369 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsSeries[2]) fitText(ctx, stsSeries[2], 391 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsSeries[3]) fitText(ctx, stsSeries[3], 413 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('StsNumber')) {
        const stsNumber = v('StsNumber').toUpperCase().split('');

        if (stsNumber[0]) fitText(ctx, stsNumber[0], 448 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[1]) fitText(ctx, stsNumber[1], 470 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[2]) fitText(ctx, stsNumber[2], 492 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[3]) fitText(ctx, stsNumber[3], 514 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[4]) fitText(ctx, stsNumber[4], 536 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (stsNumber[5]) fitText(ctx, stsNumber[5], 558 + 997 + 10, 775 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('Owner')) {
        fitTextMultiline(
            ctx,
            v('Owner'),
            [
                { x: 303 + 997, y: 811 + 35, maxWidth: 279 },
                { x: 114 + 997, y: 858 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('OwnerAddress')) {
        fitTextMultiline(
            ctx,
            v('OwnerAddress'),
            [
                { x: 181 + 997, y: 905 + 35, maxWidth: 401 },
                { x: 114 + 997, y: 937 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('DriverName')) {
        fitTextMultiline(
            ctx,
            v('DriverName'),
            [
                { x: 271 + 997, y: 968 + 35, maxWidth: 311 },
                { x: 114 + 997, y: 1010 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('DriverBirthDate')) {
        const parts = String(v('DriverBirthDate')).split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            const digits = (day + month + year).split('');

            if (digits[0]) fitText(ctx, digits[0], 356 + 997 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[1]) fitText(ctx, digits[1], 378 + 997 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[2]) fitText(ctx, digits[2], 422 + 997 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[3]) fitText(ctx, digits[3], 444 + 997 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[4]) fitText(ctx, digits[4], 488 + 997 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[5]) fitText(ctx, digits[5], 510 + 997 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[6]) fitText(ctx, digits[6], 532 + 997 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[7]) fitText(ctx, digits[7], 554 + 997 + 10, 1053 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        }
    }

    if (v('DriverPhone')) {
        const digits = v('DriverPhone').replace(/\D/g, '').split('');

        if (digits[0]) fitText(ctx, digits[0], 245 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[1]) fitText(ctx, digits[1], 268 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[2]) fitText(ctx, digits[2], 290 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[3]) fitText(ctx, digits[3], 312 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[4]) fitText(ctx, digits[4], 334 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[5]) fitText(ctx, digits[5], 356 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[6]) fitText(ctx, digits[6], 378 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[7]) fitText(ctx, digits[7], 400 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[8]) fitText(ctx, digits[8], 422 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[9]) fitText(ctx, digits[9], 444 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[10]) fitText(ctx, digits[10], 466 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[11]) fitText(ctx, digits[11], 488 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[12]) fitText(ctx, digits[12], 510 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[13]) fitText(ctx, digits[13], 533 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (digits[14]) fitText(ctx, digits[14], 555 + 997 + 10, 1167 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('DriverAddress')) {
        fitTextMultiline(
            ctx,
            v('DriverAddress'),
            [
                { x: 181 + 997, y: 1090 + 35, maxWidth: 401 },
                { x: 114 + 997, y: 1122 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('VUSeries')) {
        const vuSeries = v('VUSeries').toUpperCase().split('');

        if (vuSeries[0]) fitText(ctx, vuSeries[0], 342 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuSeries[1]) fitText(ctx, vuSeries[1], 364 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuSeries[2]) fitText(ctx, vuSeries[2], 386 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuSeries[3]) fitText(ctx, vuSeries[3], 409 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('VUNumber')) {
        const vuNumber = v('VUNumber').toUpperCase().split('');

        if (vuNumber[0]) fitText(ctx, vuNumber[0], 443 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[1]) fitText(ctx, vuNumber[1], 465 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[2]) fitText(ctx, vuNumber[2], 487 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[3]) fitText(ctx, vuNumber[3], 509 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[4]) fitText(ctx, vuNumber[4], 532 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (vuNumber[5]) fitText(ctx, vuNumber[5], 554 + 997 + 10, 1200 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('VUCategory')) {
        fitText(ctx, v('VUCategory'), 245 + 997 + 87 / 2, 1258 + 25, 87, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('VUIssueDate')) {
        const parts = String(v('VUIssueDate')).split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            const digits = (day + month + year).split('');

            if (digits[0]) fitText(ctx, digits[0], 356 + 997 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[1]) fitText(ctx, digits[1], 378 + 997 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[2]) fitText(ctx, digits[2], 422 + 997 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[3]) fitText(ctx, digits[3], 444 + 997 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[4]) fitText(ctx, digits[4], 488 + 997 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[5]) fitText(ctx, digits[5], 510 + 997 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[6]) fitText(ctx, digits[6], 532 + 997 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[7]) fitText(ctx, digits[7], 554 + 997 + 10, 1258 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        }
    }

    if (v('OwnershipDoc')) {
        fitText(ctx, v('OwnershipDoc'), 282 + 997, 1319 + 35, 300, 30, ff, 'normal', color, 'left', style);
    }

    if (v('Insurer')) {
        fitText(ctx, v('Insurer'), 114 + 997, 1410 + 35, 468, 30, ff, 'normal', color, 'left', style);
    }

    if (v('PolicySeries')) {
        const polSeries = v('PolicySeries').toUpperCase().split('');

        if (polSeries[0]) fitText(ctx, polSeries[0], 277 + 997 + 9, 1471 + 25, 18, 25, ff, 'normal', color, 'center', 'normal');
        if (polSeries[1]) fitText(ctx, polSeries[1], 297 + 997 + 9, 1471 + 25, 18, 25, ff, 'normal', color, 'center', 'normal');
        if (polSeries[2]) fitText(ctx, polSeries[2], 318 + 997 + 9, 1471 + 25, 18, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('PolicyNumber')) {
        const polNumber = v('PolicyNumber').toUpperCase().split('');

        if (polNumber[0]) fitText(ctx, polNumber[0], 360 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[1]) fitText(ctx, polNumber[1], 382 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[2]) fitText(ctx, polNumber[2], 404 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[3]) fitText(ctx, polNumber[3], 426 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[4]) fitText(ctx, polNumber[4], 449 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[5]) fitText(ctx, polNumber[5], 471 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[6]) fitText(ctx, polNumber[6], 493 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[7]) fitText(ctx, polNumber[7], 515 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[8]) fitText(ctx, polNumber[8], 537 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        if (polNumber[9]) fitText(ctx, polNumber[9], 559 + 997 + 10, 1471 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
    }

    if (v('PolicyValidUntil')) {
        const parts = String(v('PolicyValidUntil')).split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            const digits = (day + month + year).split('');

            if (digits[0]) fitText(ctx, digits[0], 360 + 997 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[1]) fitText(ctx, digits[1], 382 + 997 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[2]) fitText(ctx, digits[2], 426 + 997 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[3]) fitText(ctx, digits[3], 448 + 997 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[4]) fitText(ctx, digits[4], 492 + 997 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[5]) fitText(ctx, digits[5], 514 + 997 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[6]) fitText(ctx, digits[6], 536 + 997 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
            if (digits[7]) fitText(ctx, digits[7], 558 + 997 + 10, 1528 + 25, 20, 25, ff, 'normal', color, 'center', 'normal');
        }
    }

    const insured = v('Insured');
    if (insured === 'Нет') drawCheckmark(ctx, 421 + 997 + 11, 1577 + 10);
    else if (insured === 'Да') drawCheckmark(ctx, 509 + 997 + 11, 1577 + 10);

    if (v('Damage')) {
        fitTextMultiline(
            ctx,
            v('Damage'),
            [
                { x: 114 + 997, y: 1879 + 35, maxWidth: 468 },
                { x: 114 + 997, y: 1910 + 35, maxWidth: 468 },
                { x: 114 + 997, y: 1942 + 35, maxWidth: 468 },
                { x: 114 + 997, y: 1973 + 35, maxWidth: 468 },
                { x: 114 + 997, y: 2004 + 35, maxWidth: 468 },
                { x: 114 + 997, y: 2036 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    if (v('Remarks')) {
        fitTextMultiline(
            ctx,
            v('Remarks'),
            [
                { x: 249 + 997, y: 2067 + 35, maxWidth: 333 },
                { x: 114 + 997, y: 2098 + 35, maxWidth: 468 }
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }
}

// ================================================================
// ГЕНЕРАЦИЯ
// ================================================================
async function generateDTP() {
    const canvas1 = document.getElementById('dtpCanvas1');
    const canvas2 = document.getElementById('dtpCanvas2');
    const canvas3 = document.getElementById('dtpCanvas3');
    if (!canvas1 || !canvas2) return;

    // ============= СТРАНИЦА 1 =============
    const ctx1 = canvas1.getContext('2d');
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
    try {
        const bg1 = await loadImage(DTP_CONFIG.backgrounds.page1);
        ctx1.drawImage(bg1, 0, 0, canvas1.width, canvas1.height);
    } catch (e) {
        console.warn('[dtp] Фон стр.1 не найден');
        ctx1.fillStyle = '#ffffff';
        ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
    }

    drawDTPHeaderAndGeneral(ctx1);

    const VEHICLES_START_Y = 1000;
    drawDTPVehicleBlockA(ctx1, VEHICLES_START_Y);
    drawDTPVehicleBlockB(ctx1, VEHICLES_START_Y);

    drawDtpCircumstances(ctx1);

    // Рисунок A/B поверх первого листа
    drawAllDtpDrawings(ctx1, ['a', 'b']);

    // Подписи водителей
    if (typeof drawSignatureOnCanvas === 'function') {
        drawSignatureOnCanvas(ctx1, 'driverA', canvas1, true);
        drawSignatureOnCanvas(ctx1, 'driverB', canvas1, true);
    }

    // ============= СТРАНИЦА 2 =============
    const ctx2 = canvas2.getContext('2d');
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    try {
        const bg2 = await loadImage(DTP_CONFIG.backgrounds.page2);
        ctx2.drawImage(bg2, 0, 0, canvas2.width, canvas2.height);
    } catch (e) {
        console.warn('[dtp] Фон стр.2 не найден');
        ctx2.fillStyle = '#ffffff';
        ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
    }

    await drawDTPPage2Content(ctx2);

    // ============= СТРАНИЦА 3 — ПЛАН-СХЕМА =============
    if (canvas3) {
        const ctx3 = canvas3.getContext('2d');
        ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
        try {
            const bg3 = await loadImage(DTP_CONFIG.backgrounds.page3);
            ctx3.drawImage(bg3, 0, 0, canvas3.width, canvas3.height);
        } catch (e) {
            console.warn('[dtp] Фон стр.3 (план-схема) не найден');
            ctx3.fillStyle = '#ffffff';
            ctx3.fillRect(0, 0, canvas3.width, canvas3.height);
        }

        await drawDTPPage3Content(ctx3);
    }
}

// ================================================================
// СКАЧИВАНИЕ PNG
// ================================================================
function saveDTPPage1() {
    const canvas = document.getElementById('dtpCanvas1');
    if (!canvas || canvas.width === 0) { showToast('Холст пуст', 'error'); return; }

    const num = getFieldValueDTP('dtpNumber') || 'ДТП';
    const safe = num.replace(/[\\/:*?"<>|]/g, '_');
    const link = document.createElement('a');
    link.download = `ДТП_${safe}_стр1.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Страница 1 скачана', 'success');
}

function saveDTPPage2() {
    const canvas = document.getElementById('dtpCanvas2');
    if (!canvas || canvas.width === 0) { showToast('Холст пуст', 'error'); return; }

    const num = getFieldValueDTP('dtpNumber') || 'ДТП';
    const safe = num.replace(/[\\/:*?"<>|]/g, '_');
    const link = document.createElement('a');
    link.download = `ДТП_${safe}_стр2.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Страница 2 скачана', 'success');
}

function saveDTPPage3() {
    const canvas = document.getElementById('dtpCanvas3');
    if (!canvas || canvas.width === 0) { showToast('Холст пуст', 'error'); return; }

    const num = getFieldValueDTP('dtpNumber') || 'ДТП';
    const safe = num.replace(/[\\/:*?"<>|]/g, '_');
    const link = document.createElement('a');
    link.download = `ДТП_${safe}_схема.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('План-схема скачана', 'success');
}

// ================================================================
// СКАЧИВАНИЕ ВСЕХ СТРАНИЦ АРХИВОМ (.zip)
// ================================================================
async function saveDTPBoth() {
    await saveDTPAll();
}

async function saveDTPAll() {
    // Проверяем наличие JSZip
    if (typeof JSZip === 'undefined') {
        showToast('Ошибка: библиотека JSZip не загружена', 'error');
        // Откат к последовательному скачиванию
        saveDTPPage1();
        setTimeout(saveDTPPage2, 600);
        setTimeout(saveDTPPage3, 1200);
        return;
    }

    const canvas1 = document.getElementById('dtpCanvas1');
    const canvas2 = document.getElementById('dtpCanvas2');
    const canvas3 = document.getElementById('dtpCanvas3');

    if (!canvas1 || canvas1.width === 0) { showToast('Холст стр.1 пуст', 'error'); return; }

    const num = getFieldValueDTP('dtpNumber') || 'ДТП';
    const safe = num.replace(/[\\/:*?"<>|]/g, '_');

    // Меняем кнопку на состояние "Сохранение..."
    const btns = document.querySelectorAll('.eis-actions-bar .eis-btn');
    let archiveBtn = null;
    btns.forEach(b => {
        if (b.textContent.includes('Скачать все страницы') || b.textContent.includes('Скачать обе')) {
            archiveBtn = b;
        }
    });

    const origText = archiveBtn ? archiveBtn.textContent : '';
    if (archiveBtn) {
        archiveBtn.disabled = true;
        archiveBtn.textContent = 'Формирование архива...';
    }

    try {
        // Подписи временно отключаем, чтобы рамки редактирования не попали на бланк
        const wasActive = {};
        if (typeof signatureData !== 'undefined') {
            for (const type of ['driverA', 'driverB', 'p2Officer']) {
                if (signatureData[type]) {
                    wasActive[type] = signatureData[type].active;
                    signatureData[type].active = false;
                }
            }
        }

        // Перерисовываем бланки без рамок подписей
        await generateDTP();

        const zip = new JSZip();

        // Функция: canvas → blob PNG
        const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error('Не удалось получить PNG'));
            }, 'image/png');
        });

        // Добавляем страницы в архив
        const blob1 = await canvasToBlob(canvas1);
        zip.file(`ДТП_${safe}_стр1.png`, blob1);

        if (canvas2 && canvas2.width > 0) {
            const blob2 = await canvasToBlob(canvas2);
            zip.file(`ДТП_${safe}_стр2.png`, blob2);
        }

        if (canvas3 && canvas3.width > 0) {
            const blob3 = await canvasToBlob(canvas3);
            zip.file(`ДТП_${safe}_схема.png`, blob3);
        }

        // Генерируем zip
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        // Восстанавливаем подписи
        if (typeof signatureData !== 'undefined') {
            for (const type of ['driverA', 'driverB', 'p2Officer']) {
                if (signatureData[type]) signatureData[type].active = wasActive[type];
            }
        }
        await generateDTP();

        // Скачиваем
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ДТП_${safe}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        showToast(`Архив ДТП_${safe}.zip скачан`, 'success');

    } catch (e) {
        console.error('[saveDTPAll]', e);
        showToast('Ошибка формирования архива: ' + e.message, 'error');
    } finally {
        if (archiveBtn) {
            archiveBtn.disabled = false;
            archiveBtn.textContent = origText;
        }
    }
}

// ================================================================
// ИНИЦИАЛИЗАЦИЯ
// ================================================================
document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('dtpCanvas1')) return;

    initDtpDrawingHandlers();
    initDtpCircumstances();

    p3SetTool('pen');
    p3UpdateToolbarState();

    document.querySelectorAll('.eis-input, .eis-select').forEach(input => {
        input.addEventListener('input', generateDTP);
        input.addEventListener('change', generateDTP);
    });

    onGibddChange();

    setTimeout(generateDTP, 200);
});

// ============ ИНИЦИАЛИЗАЦИЯ ЧЕКБОКСОВ ============
function initDtpCircumstances() {
    const containerA = document.getElementById('circumstancesA');
    const containerB = document.getElementById('circumstancesB');
    if (!containerA || !containerB) return;

    const buildCheckboxes = (container, prefix) => {
        container.innerHTML = '';
        DTP_CIRCUMSTANCES.forEach(circ => {
            // Пропускаем "other_b" для A и "other_a" для B
            if (prefix === 'a' && circ.id === 'other_b') return;
            if (prefix === 'b' && circ.id === 'other_a') return;

            const isOther = (circ.id === 'other_a' || circ.id === 'other_b');

            // Обёртка для пункта
            const wrapper = document.createElement('div');
            wrapper.className = 'eis-circumstance-item';

            // Чекбокс + подпись
            const label = document.createElement('label');
            label.className = 'eis-radio';
            label.htmlFor = `${prefix}_${circ.id}`;

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `${prefix}_${circ.id}`;
            input.name = `circumstances_${prefix}`;
            input.value = circ.id;
            input.addEventListener('change', () => {
                // Показываем/скрываем поле ввода
                if (isOther && otherInput) {
                    otherInput.style.display = input.checked ? 'block' : 'none';
                    if (!input.checked) otherInput.value = ''; // очищаем при снятии
                }
                generateDTP();
            });

            const span = document.createElement('span');
            span.textContent = circ.text;

            label.appendChild(input);
            label.appendChild(span);
            wrapper.appendChild(label);

            // Текстовое поле для "Иное"
            let otherInput = null;
            if (isOther) {
                otherInput = document.createElement('input');
                otherInput.type = 'text';
                otherInput.className = 'eis-input eis-input-sm';
                otherInput.id = `${prefix}_${circ.id}_text`;
                otherInput.placeholder = 'Впишите свой вариант...';
                otherInput.style.display = 'none'; // по умолчанию скрыто
                otherInput.style.marginTop = '4px';
                otherInput.addEventListener('input', generateDTP);
                wrapper.appendChild(otherInput);
            }

            container.appendChild(wrapper);
        });
    };

    buildCheckboxes(containerA, 'a');
    buildCheckboxes(containerB, 'b');
}

// ============ ОТРИСОВКА ГАЛОЧЕК ОБСТОЯТЕЛЬСТВ ============
function drawDtpCircumstances(ctx) {
    const ff = 'Segoe Script';
    const color = '#000f55';
    const style = 'italic';

    const drawChecks = (prefix, coords) => {
        for (const circId in coords) {
            const checkbox = document.getElementById(`${prefix}_${circId}`);
            if (checkbox && checkbox.checked) {
                const pos = coords[circId];
                if (pos) {
                    drawCheckmark(ctx, pos.x, pos.y);

                    // Для "Иное" — дополнительно отрисуем введённый текст справа от галочки
                    if (circId === 'other_a') {
                        const textInput = document.getElementById(`${prefix}_${circId}_text`);
                        const text = textInput ? textInput.value.trim() : '';
                        if (text) {
                            fitText(
                                ctx,
                                text,
                                677,
                                1592 + 35,
                                332,
                                30,
                                ff, 'normal', color, 'left', style
                            );
                        }
                    }
                    if (circId === 'other_b') {
                        const textInput = document.getElementById(`${prefix}_${circId}_text`);
                        const text = textInput ? textInput.value.trim() : '';
                        if (text) {
                            fitText(
                                ctx,
                                text,
                                677,
                                1644 + 35,
                                332,
                                30,
                                ff, 'normal', color, 'left', style
                            );
                        }
                    }
                }
            }
        }
    };

    drawChecks('a', CIRCUMSTANCE_COORDS_A);
    drawChecks('b', CIRCUMSTANCE_COORDS_B);

    // === ВЫВОД КОЛИЧЕСТВА ОТМЕЧЕННЫХ ГАЛОЧЕК ===
    const countA = countCheckedCircumstances('a');
    const countB = countCheckedCircumstances('b');

    // Координаты для ТС "A" — ПОДСТАВЬТЕ СВОИ
    if (countA >= 0) {
        fitText(ctx, String(countA), 614+21, 1690 + 35, 42, 30, ff, 'normal', color, 'center', style);
    }

    // Координаты для ТС "B" — ПОДСТАВЬТЕ СВОИ
    if (countB >= 0) {
        fitText(ctx, String(countB), 1034 + 21, 1690 + 35, 42, 30, ff, 'normal', color, 'center', style);
    }
}

// ============ ПОДСЧЁТ ОТМЕЧЕННЫХ ГАЛОЧЕК ============
function countCheckedCircumstances(prefix) {
    let count = 0;
    DTP_CIRCUMSTANCES.forEach(circ => {
        // Пропускаем "other_b" для A и "other_a" для B
        if (prefix === 'a' && circ.id === 'other_b') return;
        if (prefix === 'b' && circ.id === 'other_a') return;

        const checkbox = document.getElementById(`${prefix}_${circ.id}`);
        if (checkbox && checkbox.checked) {
            count++;
        }
    });
    return count;
}

// ================================================================
// ВТОРОЙ ЛИСТ — ДАННЫЕ
// ================================================================

// ---------- Блокировка поля "Где находится ТС" ----------
function onP2CanMoveChange() {
    const val = document.querySelector('input[name="p2CanMove"]:checked')?.value || '';
    const loc = document.getElementById('p2VehicleLocation');
    if (loc) {
        loc.disabled = val !== 'no';
        if (val !== 'no') loc.value = '';
    }
    generateDTP();
}

// ---------- Отрисовка второго листа ----------
async function drawDTPPage2Content(ctx) {
    const ff = 'Segoe Script';
    const color = '#000f55';
    const style = 'italic';

    const v = (id) => getFieldValueDTP(id);
    const radio = (name) =>
        document.querySelector(`input[name="${name}"]:checked`)?.value || '';

    // ---- Транспортное средство (галочка A или B) ----
    const veh = radio('dtpP2Vehicle');
    if (veh === 'a') {
        drawCheckmark(ctx, 474+20, 122+10, 40);
    } else if (veh === 'b') {
        drawCheckmark(ctx, 612+20, 122+10, 40);
    }

    // ---- Обстоятельства ДТП ----
    const circumstances = v('p2Circumstances');
    if (circumstances) {
        fitTextMultiline(
            ctx,
            circumstances,
            [
                { x: 332, y: 233 + 35, maxWidth: 1247 },
                { x: 114, y: 264 + 35, maxWidth: 1465 },
                { x: 114, y: 295 + 35, maxWidth: 1465 },
                { x: 114, y: 327 + 35, maxWidth: 1465 },
                { x: 114, y: 358 + 35, maxWidth: 1465 },
                { x: 114, y: 389 + 35, maxWidth: 1465 },
                { x: 114, y: 421 + 35, maxWidth: 1465 },
                { x: 114, y: 452 + 35, maxWidth: 1465 },
                { x: 114, y: 483 + 35, maxWidth: 1465 },
                { x: 114, y: 515 + 35, maxWidth: 1465 },
                { x: 114, y: 546 + 35, maxWidth: 1465 },
                { x: 114, y: 577 + 35, maxWidth: 1465 },
                { x: 114, y: 609 + 35, maxWidth: 1465 },
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    // ---- ТС находилось под управлением ----
    const drivenBy = radio('p2DrivenBy');
    if (drivenBy === 'owner') {
        drawCheckmark(ctx, 454+11, 715+10);
    } else if (drivenBy === 'other') {
        drawCheckmark(ctx, 454 + 11, 748+10);
    }

    // ---- Другие ТС ----
    const otherVehicles = v('p2OtherVehicles');
    if (otherVehicles) {
        fitTextMultiline(
            ctx,
            otherVehicles,
            [
                { x: 114, y: 857 + 35, maxWidth: 1465 },
                { x: 114, y: 904 + 35, maxWidth: 1465 },
                { x: 114, y: 952 + 35, maxWidth: 1465 },
                { x: 114, y: 983 + 35, maxWidth: 1465 },
                { x: 114, y: 1014 + 35, maxWidth: 1465 },
                { x: 114, y: 1045 + 35, maxWidth: 1465 },
                { x: 114, y: 1077 + 35, maxWidth: 1465 },
                { x: 114, y: 1108 + 35, maxWidth: 1465 },
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    // ---- Повреждения иного имущества ----
    const propName = v('p2PropertyName');
    if (propName) {
        fitText(ctx, propName, 333, 1230 + 35, 1246, 30, ff, 'normal', color, 'left', style);
    }
    const propOwner = v('p2PropertyOwner');
    if (propOwner) {
        fitText(ctx, propOwner, 374, 1278 + 35, 1205, 30, ff, 'normal', color, 'left', style);
    }

    // ---- Может ли передвигаться ----
    const canMove = radio('p2CanMove');
    if (canMove === 'yes') {
        drawCheckmark(ctx, 572+10, 1400+11);
    } else if (canMove === 'no') {
        drawCheckmark(ctx, 652+10, 1400+11);
    }
    const loc = v('p2VehicleLocation');
    if (loc) {
        fitTextMultiline(
            ctx,
            loc,
            [
                { x: 555, y: 1418 + 35, maxWidth: 1024 },
                { x: 114, y: 1449 + 35, maxWidth: 1465 },
                { x: 114, y: 1481 + 35, maxWidth: 1465 },
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    // ---- Примечание ----
    const note = v('p2Note');
    if (note) {
        fitTextMultiline(
            ctx,
            note,
            [
                { x: 114, y: 1542 + 35, maxWidth: 1465 },
                { x: 114, y: 1573 + 35, maxWidth: 1465 },
                { x: 114, y: 1604 + 35, maxWidth: 1465 },
                { x: 114, y: 1635 + 35, maxWidth: 1465 },
                { x: 114, y: 1667 + 35, maxWidth: 1465 },
                { x: 114, y: 1698 + 35, maxWidth: 1465 },
            ],
            30, 14,
            ff, 'normal', color, 'left', style
        );
    }

    // ---- Дата заполнения ----
    const fillDate = v('p2FillDate');
    if (fillDate) {
        const parts = String(fillDate).split('-');
        if (parts.length === 3) {
            fitText(ctx, parts[2], 134 + 56 / 2, 1755 + 35, 56, 30, ff, 'normal', color, 'center', style);         
            fitText(ctx, parts[1], 221 + 213 / 2, 1755 + 35, 213, 30, ff, 'normal', color, 'center', style);     
            fitText(ctx, parts[0].slice(-2), 473 + 40 / 2, 1755 + 35, 40, 30, ff, 'normal', color, 'center', style); 
        }
    }

    // ---- ФИО сотрудника ----
    const officerName = v('p2OfficerName');
    if (officerName) {
        fitText(ctx, officerName, 1147 + 413 / 2, 1755 + 35, 413, 30, ff, 'normal', color, 'center', style);
    }

    // ---- Подпись сотрудника ----
    if (typeof drawSignatureOnCanvas === 'function') {
        drawSignatureOnCanvas(ctx, 'p2Officer', document.getElementById('dtpCanvas2'), true);
    }
}

async function drawDTPPage3Content(ctx) {
    const ff = 'Segoe Script';
    const color = '#000f55';
    const style = 'italic';

    const v = (id) => getFieldValueDTP(id);

    // ---- Дата составления (ДД.ММ.ГГ) ----
    const fillDate = v('p3FillDate');
    if (fillDate) {
        const parts = String(fillDate).split('-');
        if (parts.length === 3) {
            // Координаты подгони под свой бланк (canvas 1697×1200)
            fitText(ctx, parts[2], 83 + 49/2, 134+35, 49, 30, ff, 'normal', color, 'center', style);
            fitText(ctx, parts[1], 149 + 122 / 2, 134 + 35, 122, 30, ff, 'normal', color, 'center', style);
            fitText(ctx, parts[0].slice(-2), 300 + 25, 134 + 35, 50, 30, ff, 'normal', color, 'center', style);
        }
    }

    const fillTime = v('p3FillTime');
    if (fillTime) {
        const tParts = String(fillTime).split(':');
        if (tParts.length === 2) {
            // Координаты подгони под свой бланк (canvas 1697×1200)
            fitText(ctx, tParts[0], 425 + 49 / 2, 134 + 35, 49, 30, ff, 'normal', color, 'center', style);
            fitText(ctx, tParts[1], 525+49/2, 134+35, 49, 30, ff, 'normal', color, 'center', style);
        }
    }

    // ---- Место составления ----
    const place = v('p3Place');
    if (place) {
        fitText(ctx, place, 640, 135+35, 998, 30, ff, 'normal', color, 'left', style);
    }

    // ---- Рисование пользователя поверх схемы ----
    drawAllDtpDrawings(ctx, ['p3']);
}

// ================================================================
// УПРАВЛЕНИЕ РИСОВАНИЕМ НА ПЛАН-СХЕМЕ (p3)
// ================================================================

// Deep clone массива линий
function p3CloneLines(lines) {
    return lines.map(line => line.map(pt => ({ x: pt.x, y: pt.y })));
}

// Снимок состояния перед изменением (для undo)
function p3Snapshot() {
    p3History.undo.push(p3CloneLines(dtpDrawings.p3));
    // Ограничиваем историю — чтобы память не жрало
    if (p3History.undo.length > 50) p3History.undo.shift();
    p3History.redo = [];
}

// Установка инструмента
function p3SetTool(tool) {
    p3CurrentTool = tool;

    const penBtn = document.getElementById('p3ToolPen');
    const eraserBtn = document.getElementById('p3ToolEraser');

    if (penBtn) penBtn.classList.toggle('is-active', tool === 'pen');
    if (eraserBtn) eraserBtn.classList.toggle('is-active', tool === 'eraser');
}

// Отмена последнего действия
function p3Undo() {
    if (p3History.undo.length === 0) {
        showToast('Нечего отменять', 'info', 1500);
        return;
    }
    // Сохраняем текущее в redo
    p3History.redo.push(p3CloneLines(dtpDrawings.p3));
    // Восстанавливаем предыдущее
    dtpDrawings.p3 = p3History.undo.pop();
    generateDTP();
}

// Вернуть отменённое
function p3Redo() {
    if (p3History.redo.length === 0) {
        showToast('Нечего возвращать', 'info', 1500);
        return;
    }
    p3History.undo.push(p3CloneLines(dtpDrawings.p3));
    dtpDrawings.p3 = p3History.redo.pop();
    generateDTP();
}

// Полная очистка 3-го листа
async function p3ClearAll() {
    if (dtpDrawings.p3.length === 0) return;

    const ok = await showConfirm({
        title: 'Очистить схему',
        message: 'Удалить все линии с плана-схемы? Действие можно будет отменить.',
        confirmText: 'Очистить',
        type: 'danger'
    });
    if (!ok) return;

    p3Snapshot();
    dtpDrawings.p3 = [];
    generateDTP();
}

// Проверка: попадает ли точка в линию (для ластика)
function p3PointNearLine(px, py, line, radius) {
    if (!line || line.length === 0) return false;

    // Если в линии одна точка — просто расстояние
    if (line.length === 1) {
        const dx = px - line[0].x;
        const dy = py - line[0].y;
        return (dx * dx + dy * dy) <= radius * radius;
    }

    // Проверяем расстояние до каждого сегмента
    for (let i = 1; i < line.length; i++) {
        const x1 = line[i - 1].x, y1 = line[i - 1].y;
        const x2 = line[i].x, y2 = line[i].y;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        let t = 0;
        if (lenSq > 0) {
            t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));
        }

        const cx = x1 + t * dx;
        const cy = y1 + t * dy;
        const ddx = px - cx;
        const ddy = py - cy;

        if ((ddx * ddx + ddy * ddy) <= radius * radius) return true;
    }

    return false;
}

function p3UpdateToolbarState() {
    const isDrawing = (drawingMode === 'p3');

    const ids = ['p3ToolPen', 'p3ToolEraser', 'p3BtnUndo', 'p3BtnRedo', 'p3BtnClear'];

    ids.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !isDrawing;
    });

    // Визуально приглушаем весь тулбар, когда рисование выключено
    const toolbar = document.getElementById('p3Toolbar');
    if (toolbar) toolbar.classList.toggle('is-disabled', !isDrawing);
}

// ================================================================
// ЭКСПОРТ
// ================================================================
window.generateDTP = generateDTP;
window.saveDTPPage1 = saveDTPPage1;
window.saveDTPPage2 = saveDTPPage2;
window.saveDTPPage3 = saveDTPPage3;
window.saveDTPBoth = saveDTPBoth;
window.saveDTPAll = saveDTPAll;
window.toggleDrawingMode = toggleDrawingMode;
window.clearDtpDrawing = clearDtpDrawing;
window.onGibddChange = onGibddChange;
window.onP2CanMoveChange = onP2CanMoveChange;
window.drawDTPPage3Content = drawDTPPage3Content;
window.p3SetTool = p3SetTool;
window.p3Undo = p3Undo;
window.p3Redo = p3Redo;
window.p3ClearAll = p3ClearAll;
window.drawDTPPage2Content = drawDTPPage2Content;