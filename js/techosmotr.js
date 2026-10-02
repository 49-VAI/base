// ========== КОНФИГУРАЦИЯ ТЕХОСМОТРА ==========
const TECH_CONFIG = {
    canvasWidth: 1654,
    canvasHeight: 2339,
    background: 'backgrounds/techosmotr.png'
};

// ========== ОБВОДКА "ВОЗМОЖНО / НЕВОЗМОЖНО" ==========
const TECH_CONCLUSION_FRAME = {
    image: 'backgrounds/frame_pass2.png',
    possible:   { x: 986, y: 1435, width: 239, height: 78 },
    impossible: { x: 1305, y: 1433, width: 239, height: 78 }
};

// ========== КООРДИНАТЫ КЛЕТОК ==========
const TECH_CARD_CELLS = {
    startX: 68,
    stepX: 35,
    cellWidth: 33,
    cellHeight: 31,
    y: 252,
    fontSize: 30,
    count: 15,
    dotPositions: []
};

const TECH_DATE_CELLS = {
    startX: 995,
    stepX: 47,
    cellWidth: 45,
    cellHeight: 31,
    y: 248,
    fontSize: 26,
    count: 8,
    dotPositions: []
};

const TECH_EXPERT_DATE_CELLS = {
    startX: 139,
    stepX: 35,
    cellWidth: 33,
    cellHeight: 24,
    y: 1698+28,
    fontSize: 30,
    count: 8,
    dotPositions: [2, 5]
};

// ========== СПИСОК ПУНКТОВ ==========
const TECH_ITEMS = [
    'Работоспособность рабочей тормозной системы',
    'Отсутствие утечек сжатого воздуха из колесных тормозных камер',
    'Отсутствие подтеканий тормозной жидкости, нарушения герметичности трубопроводов или соединений в гидравлическом тормозном приводе',
    'Отсутствие коррозии, механических повреждений тормозных систем',
    'Исправность средств сигнализации и контроля тормозных систем',
    'Работоспособность усилителя рулевого управления. Плавность изменения усилия при повороте рулевого колеса',
    'Отсутствие самопроизвольного поворота рулевого колеса при работающем двигателе',
    'Отсутствие повреждения и полная комплектность деталей рулевого механизма',
    'Работоспособность световых сигналов',
    'Отсутствие повреждений световых приборов',
    'Наличие и расположение световых приборов в местах, предусмотренных конструкцией',
    'Наличие и работоспособность стеклоочистителей и стеклоомывателей',
    'Отсутствие признаков непригодности шин к эксплуатации',
    'Наличие всех болтов или гаек крепления дисков и ободьев колес',
    'Установка шин на транспортное средство в соответствии с требованиями',
    'Соответствие содержания загрязняющих веществ в отработавших газах транспортных средств установленным требованиям',
    'Отсутствие подтекания и каплепадения топлива в системе',
    'Соответствие нормам уровня шума выпускной системы',
    'Установка государственных регистрационных знаков в соответствии с требованиями',
    'Соответствие норме светопропускания ветрового стекла, передних боковых стекол и стекол передних дверей',
    'Работоспособность замков дверей кузова, кабины, механизмов регулировки и фиксирующих устройств сидений',
    'Наличие работоспособного звукового сигнального прибора',
    'Оснащение транспортных средств исправными ремнями безопасности',
    'Наличие знака аварийной остановки',
    'Наличие огнетушителей, соответствующих установленным требованиям'
];

// ========== СОСТОЯНИЕ ПУНКТОВ ==========
let techItemStates = {};

function initTechItemStates() {
    techItemStates = {};
    TECH_ITEMS.forEach((_, i) => {
        techItemStates[i] = null;
    });
}

// ========== ФОРМАТИРОВАНИЕ ПОЛЕЙ ВВОДА ==========
function formatTechCardNumber(input) {
    input.value = input.value.replace(/\D/g, '').slice(0, 15);
    generateTech();
}

function formatTechDate(input) {
    const digits = input.value.replace(/\D/g, '').slice(0, 8);

    let result = '';
    if (digits.length > 0) result += digits.slice(0, 2);
    if (digits.length > 2) result += '.' + digits.slice(2, 4);
    if (digits.length > 4) result += '.' + digits.slice(4, 8);

    input.value = result;
    generateTech();
}

// ========== ОТРИСОВКА ЗНАЧЕНИЯ ПО КЛЕТКАМ ==========
function drawInCells(ctx, value, cellsConfig, fontFamily, color, fontStyle) {
    if (!value) return;

    let digits = String(value).replace(/\D/g, '');
    if (!digits) return;

    const dotPositions = cellsConfig.dotPositions || [];
    const count = cellsConfig.count || 15;

    if (dotPositions.length > 0 && digits.length === 8) {
        digits = digits.slice(0, 4) + digits.slice(6, 8);
    }

    ctx.fillStyle = color;
    ctx.font = `${fontStyle} normal ${cellsConfig.fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    let digitIndex = 0;

    for (let i = 0; i < count; i++) {
        const x = cellsConfig.startX + i * cellsConfig.stepX + cellsConfig.cellWidth / 2;

        if (dotPositions.includes(i)) {
            ctx.fillText('.', x, cellsConfig.y);
            continue;
        }

        const ch = digits[digitIndex];
        if (!ch) break;

        ctx.fillText(ch, x, cellsConfig.y);
        digitIndex++;
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ UI ПУНКТОВ ==========
function initTechItems() {
    const container = document.getElementById('techItemsContainer');
    if (!container) return;

    initTechItemStates();
    container.innerHTML = '';

    TECH_ITEMS.forEach((text, index) => {
        const row = document.createElement('div');
        row.className = 'eis-tech-item';
        row.dataset.index = index;

        row.innerHTML = `
            <div class="eis-tech-item-number">${index + 1}</div>
            <div class="eis-tech-item-text">${text}</div>
            <div class="eis-tech-item-actions">
                <button type="button" class="eis-tech-btn eis-tech-btn-ok" data-state="ok" onclick="setTechItem(${index}, 'ok')">✓</button>
                <button type="button" class="eis-tech-btn eis-tech-btn-fail" data-state="fail" onclick="setTechItem(${index}, 'fail')">✕</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function setTechItem(index, state) {
    if (techItemStates[index] === state) {
        techItemStates[index] = null;
    } else {
        techItemStates[index] = state;
    }

    const row = document.querySelector(`.eis-tech-item[data-index="${index}"]`);
    if (row) {
        row.querySelectorAll('.eis-tech-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.state === techItemStates[index]);
        });
    }

    generateTech();
}

function setAllTechItems(state) {
    TECH_ITEMS.forEach((_, index) => {
        techItemStates[index] = state;
    });

    document.querySelectorAll('.eis-tech-item').forEach(row => {
        row.querySelectorAll('.eis-tech-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.state === state);
        });
    });

    generateTech();
}

// ========== ГЕНЕРАЦИЯ ДИАГНОСТИЧЕСКОЙ КАРТЫ ==========
async function generateTech() {
    const canvas = document.getElementById('techCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cardNumber = document.getElementById('techCardNumber').value.trim();
    const validUntil = document.getElementById('techValidUntil').value.trim();
    const checkType = document.querySelector('input[name="techCheckType"]:checked')?.value || '';
    const plateNumber = document.getElementById('techPlateNumber').value.trim();
    const vehicleMakeModel = document.getElementById('techVehicleMakeModel').value.trim();
    const vin = document.getElementById('techVIN').value.trim();
    const category = document.getElementById('techCategory').value.trim();
    const year = document.getElementById('techYear').value.trim();
    const stsSeries = document.getElementById('techSTSSeries').value.trim();
    const stsNumber = document.getElementById('techSTSNumber').value.trim();
    const stsIssuedBy = document.getElementById('techSTSIssuedBy').value.trim();
    const stsIssuedDate = document.getElementById('techSTSIssuedDate').value.trim();

    const massWithoutLoad = document.getElementById('techMassWithoutLoad').value.trim();
    const maxMass = document.getElementById('techMaxMass').value.trim();
    const enginePower = document.getElementById('techEnginePower').value.trim();
    const mileage = document.getElementById('techMileage').value.trim();
    const conclusion = document.querySelector('input[name="techConclusion"]:checked')?.value || '';

    const recheck1 = document.getElementById('techRecheck1').value.trim();
    const recheck2 = document.getElementById('techRecheck2').value.trim();
    const recheck3 = document.getElementById('techRecheck3').value.trim();

    const expertDate = document.getElementById('techExpertDate').value.trim();
    const expertName = document.getElementById('techExpertName').value.trim();

    // Фон
    try {
        const bg = await loadImage(TECH_CONFIG.background);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } catch (e) {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Ошибка загрузки фона', canvas.width / 2, canvas.height / 2);
        return;
    }

    const fontFamily = 'Segoe Script';
    const color = '#000f55';
    const fontStyle = 'italic';

    // Заголовок
    if (cardNumber) {
        drawInCells(ctx, cardNumber, TECH_CARD_CELLS, fontFamily, color, fontStyle);
    }
    if (validUntil) {
        drawInCells(ctx, validUntil, TECH_DATE_CELLS, fontFamily, color, fontStyle);
    }

    fitText(ctx, '66-я территориальная ВАИ Нижегородского гарнизона', 600, 309, 1000, 26, fontFamily, 'normal', color, 'left', fontStyle);

    // Первичная/вторичная
    if (checkType === 'primary') {
        ctx.fillStyle = color;
        ctx.font = 'italic 40px "Segoe Script"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', 350, 320);
    } else if (checkType === 'secondary') {
        ctx.fillStyle = color;
        ctx.font = 'italic 40px "Segoe Script"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', 1435, 320);
    }

    // СТС
    let stsFull = '';
    if (stsSeries || stsNumber) {
        stsFull = `${stsSeries} ${stsNumber}`.trim();
    }
    if (stsIssuedBy) {
        stsFull += (stsFull ? ', ' : '') + 'выдано ' + stsIssuedBy;
    }
    if (stsIssuedDate) {
        stsFull += (stsFull ? ', ' : '') + stsIssuedDate + ' г.';
    }

    // Данные ТС
    const fields = [
        { text: plateNumber, x: 372, y: 366, maxWidth: 588, size: 26 },
        { text: vehicleMakeModel, x: 1166, y: 366, maxWidth: 431, size: 26 },
        { text: vin, x: 115, y: 368+52/2+52/4, maxWidth: 844, size: 26 },
        { text: category, x: 1122, y: 369+25, maxWidth: 475, size: 26 },
        { text: year, x: 1142, y: 395+27, maxWidth: 455, size: 26 },
        { text: stsFull, x: 448, y: 422+27, maxWidth: 1149, size: 26 },
        { text: massWithoutLoad, x: 328, y: 1334+38, maxWidth: 425, size: 26 },
        { text: maxMass, x: 1222, y: 1334+38, maxWidth: 375, size: 26 },
        { text: enginePower, x: 358, y: 1374+38, maxWidth: 395, size: 26 },
        { text: mileage, x: 922, y: 1374+38, maxWidth: 675, size: 26 }
    ];

    fields.forEach(f => {
        if (f.text) {
            fitText(ctx, f.text, f.x, f.y, f.maxWidth, f.size, fontFamily, 'normal', color, 'left', fontStyle);
        }
    });

    // Отметки по пунктам
    const techItemPositions = [
        { x: 785, y: 577+21/2 },
        { x: 785, y: 601+44/2 },
        { x: 785, y: 647+66/2 },
        { x: 785, y: 715+44/2 },
        { x: 785, y: 761+67/2 },
        { x: 785, y: 854+43/2 },
        { x: 785, y: 900+44/2 },
        { x: 785, y: 946+44/2 },
        { x: 785, y: 1038+66/2 },
        { x: 785, y: 1107+21/2 },
        { x: 785, y: 1130+44/2 },
        { x: 785, y: 1200+44/2 },
        { x: 1448, y: 577+21/2 },
        { x: 1448, y: 601+44/2 },
        { x: 1448, y: 647+66/2 },
        { x: 1448, y: 761+67/2 },
        { x: 1448, y: 830+21/2 },
        { x: 1448, y: 854+43/2 },
        { x: 1448, y: 946+44/2 },
        { x: 1448, y: 992+44/2 },
        { x: 1448, y: 1038+66/2 },
        { x: 1448, y: 1107+21/2 },
        { x: 1448, y: 1130+44/2 },
        { x: 1448, y: 1176+22/2 },
        { x: 1448, y: 1200+44/2 }
    ];

    ctx.fillStyle = color;
    ctx.font = 'italic 26px "Segoe Script"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    TECH_ITEMS.forEach((_, i) => {
        const state = techItemStates[i];
        const pos = techItemPositions[i];
        if (!pos || !state) return;

        if (state === 'ok') {
            ctx.fillText('✓', pos.x, pos.y);
        } else if (state === 'fail') {
            ctx.fillText('✕', pos.x, pos.y);
        }
    });

    // Заключение
    if (conclusion && TECH_CONCLUSION_FRAME[conclusion]) {
        try {
            const frameImg = await loadImage(TECH_CONCLUSION_FRAME.image);
            const f = TECH_CONCLUSION_FRAME[conclusion];
            ctx.drawImage(frameImg, f.x, f.y, f.width, f.height);
        } catch (err) {
            console.warn('Ошибка загрузки обводки заключения:', err);
        }
    }

    // Пункты повторной проверки
    const recheckFields = [
        { text: recheck1, y: 1598+25 },
        { text: recheck2, y: 1625+25 },
        { text: recheck3, y: 1652+25 }
    ];
    recheckFields.forEach(f => {
        if (f.text) {
            fitText(ctx, f.text, 52, f.y, 1045, 26, fontFamily, 'normal', color, 'left', fontStyle);
        }
    });

    // Дата эксперта
    if (expertDate) {
        drawInCells(ctx, expertDate, TECH_EXPERT_DATE_CELLS, fontFamily, color, fontStyle);
    }

    // ФИО эксперта
    if (expertName) {
        fitText(ctx, expertName, 60, 1777+27, 719, 26, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // Подпись
    if (typeof drawSignatureOnCanvas === 'function') {
        drawSignatureOnCanvas(ctx, 'techExpert', canvas, true);
    }
}

// ========== СОХРАНЕНИЕ ==========
async function saveTech() {
    const wasActive = signatureData.techExpert ? signatureData.techExpert.active : false;

    if (signatureData.techExpert) {
        signatureData.techExpert.active = false;
    }

    await generateTech();

    const canvas = document.getElementById('techCanvas');
    if (!canvas || canvas.width === 0) {
        alert('Холст пуст');
        if (signatureData.techExpert) signatureData.techExpert.active = wasActive;
        await generateTech();
        return;
    }

    const lastName = document.getElementById('techExpertName').value.trim().split(' ').pop() || 'unknown';
    const fileName = `Техосмотр_${lastName}.png`;

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();

    if (signatureData.techExpert) {
        signatureData.techExpert.active = wasActive;
    }
    await generateTech();
}

// ========== ПОДПИСКА НА СОБЫТИЯ ==========
document.addEventListener('DOMContentLoaded', function () {
    // Работаем только на странице tech.html
    if (!document.getElementById('techCanvas')) return;

    initTechItems();

    const inputs = document.querySelectorAll('#tab-tech .eis-input, .eis-input');
    inputs.forEach(input => {
        input.addEventListener('input', generateTech);
        input.addEventListener('change', generateTech);
    });

    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (radio.name === 'techCheckType' || radio.name === 'techConclusion') {
            radio.addEventListener('change', generateTech);
        }
    });

    setTimeout(generateTech, 200);
});

// ========== ЭКСПОРТ ==========
window.generateTech = generateTech;
window.saveTech = saveTech;
window.setTechItem = setTechItem;
window.setAllTechItems = setAllTechItems;
window.initTechItems = initTechItems;
window.formatTechCardNumber = formatTechCardNumber;
window.formatTechDate = formatTechDate;