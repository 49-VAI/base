// ========== КОНФИГУРАЦИЯ ЭКЗАМЕНА ==========
const EXAM_CONFIG = {
    canvasWidth: 1654,
    canvasHeight: 2339,
    backgrounds: {
        page1: 'backgrounds/exam_page1.png',
        page2: 'backgrounds/exam_page2.png'
    }
};

// ========== СПИСОК НАВЫКОВ ==========
const SKILLS_LIST = [
    'Постановка ТС на место стоянки при движении задним ходом с поворотом на 90°',
    'Постановка ТС на место стоянки параллельно тротуару при движении задним ходом',
    'Разворот ТС в ограниченном пространстве с использованием движения задним ходом',
    'Остановка и начало движения на подъеме',
    'Постановка ТС параллельно тротуару при движении по направлению вперед',
    'Проезд регулируемого перекрестка (при его наличии)',
    'Проезд нерегулируемого перекрестка равнозначных дорог (при его наличии)',
    'Проезд нерегулируемого перекрестка неравнозначных дорог',
    'Левые и правые повороты',
    'Проезд железнодорожного переезда (при наличии)',
    'Перестроение на дороге с 2+ полосами в одном направлении',
    'Обгон или опережение (при наличии возможности)',
    'Движение с максимальной разрешенной скоростью',
    'Проезд пешеходных переходов и остановок маршрутных ТС',
    'Торможение и остановка при движении на различных скоростях',
    'Прямолинейное движение задним ходом и парковка на погрузочной эстакаде (для C, CE, C1, C1E)',
    'Сцепление/расцепление прицепа с тягачом (для BE, CE, DE, C1E, D1E)',
    'Разворот на перекрестке и вне перекрестка (для BE, CE, DE, C1E, D1E)',
    'Остановка для безопасной посадки/высадки пассажиров (для D, DE, D1, D1E)'
];

// ========== СПИСОК ОШИБОК ==========
const ERRORS_LIST = {
    7: [
        { id: 'e1', text: 'Действие/бездействие, вызвавшее вмешательство в управление', maxSlots: 1 },
        { id: 'e2', text: 'Не уступил дорогу ТС, имеющему преимущество', maxSlots: 1 },
        { id: 'e3', text: 'Не уступил дорогу пешеходам, имеющим преимущество', maxSlots: 1 },
        { id: 'e4', text: 'Выехал на полосу встречного движения', maxSlots: 1 },
        { id: 'e5', text: 'Движение на запрещающий сигнал светофора/регулировщика', maxSlots: 1 },
        { id: 'e6', text: 'Не выполнил требования знаков/разметки (1.1, 1.3, 1.11)', maxSlots: 1 },
        { id: 'e7', text: 'Покинул экзамен после его начала', maxSlots: 1 },
        { id: 'e8', text: 'Нарушил правила выполнения обгона', maxSlots: 1 },
        { id: 'e9', text: 'Нарушил правила выполнения поворота', maxSlots: 1 },
        { id: 'e10', text: 'Нарушил правила выполнения разворота', maxSlots: 1 },
        { id: 'e11', text: 'Нарушил правила движения задним ходом', maxSlots: 1 },
        { id: 'e12', text: 'Нарушил правила проезда ЖД переездов', maxSlots: 1 },
        { id: 'e13', text: 'Превысил разрешенную максимальную скорость', maxSlots: 1 },
        { id: 'e14', text: 'Использовал телефон во время движения', maxSlots: 1 }
    ],
    4: [
        { id: 'e15', text: 'Движение не пристегнувшись ремнем безопасности', maxSlots: 2 },
        { id: 'e16', text: 'Выехал на перекресток/остановился на переходе при заторе', maxSlots: 2 },
        { id: 'e17', text: 'Не снизил скорость и/или не остановился', maxSlots: 2 },
        { id: 'e18', text: 'Нарушил правила перевозки пассажиров', maxSlots: 2 },
        { id: 'e19', text: 'Не приступил к выполнению задания экзаменатора', maxSlots: 2 },
        { id: 'e20', text: 'Пересек стоп-линию', maxSlots: 2 }
    ],
    3: [
        { id: 'e21', text: 'Нарушил правила остановки или стоянки', maxSlots: 3 },
        { id: 'e22', text: 'Не подал сигнал поворота', maxSlots: 3 },
        { id: 'e23', text: 'Нарушил правила применения аварийной сигнализации', maxSlots: 3 },
        { id: 'e24', text: 'Ошибка при постановке ТС на стоянку (90°)', maxSlots: 3 },
        { id: 'e25', text: 'Ошибка при параллельной парковке', maxSlots: 3 },
        { id: 'e26', text: 'Ошибка при развороте в ограниченном пространстве', maxSlots: 3 },
        { id: 'e27', text: 'Ошибка при остановке и начале движения на подъеме', maxSlots: 3 },
        { id: 'e28', text: 'Ошибка при движении задним ходом и парковке на эстакаде (C, CE)', maxSlots: 3 },
        { id: 'e29', text: 'Ошибка при сцеплении/расцеплении прицепа', maxSlots: 3 }
    ],
    2: [
        { id: 'e30', text: 'Не выполнил требования дорожной разметки', maxSlots: 4 },
        { id: 'e31', text: 'Нарушил правила расположения ТС на проезжей части', maxSlots: 4 },
        { id: 'e32', text: 'Нарушил правила пользования световыми приборами', maxSlots: 4 },
        { id: 'e33', text: 'Двигался со слишком малой скоростью, создавая помехи', maxSlots: 4 }
    ],
    1: [
        { id: 'e34', text: 'Несвоевременно подал сигнал указателя поворота', maxSlots: 7 },
        { id: 'e35', text: 'Незаблаговременно включил сигнал поворота', maxSlots: 7 },
        { id: 'e36', text: 'Выключил сигнал поворота до завершения маневра', maxSlots: 7 },
        { id: 'e37', text: 'Не выключил сигнал поворота по завершении маневра', maxSlots: 7 },
        { id: 'e38', text: 'Неправильно оценил дорожную обстановку', maxSlots: 7 },
        { id: 'e39', text: 'Неуверенно пользовался органами управления ТС', maxSlots: 7 },
        { id: 'e40', text: 'Резкий старт (рывок)', maxSlots: 7 },
        { id: 'e41', text: 'Резкое торможение без необходимости', maxSlots: 7 },
        { id: 'e42', text: 'Начал движение на неверной передаче', maxSlots: 7 },
        { id: 'e43', text: 'Без необходимости задействовал органы управления', maxSlots: 7 },
        { id: 'e44', text: 'Начал движение с включенным стояночным тормозом', maxSlots: 7 },
        { id: 'e45', text: 'Допустил остановку двигателя', maxSlots: 7 },
        { id: 'e46', text: 'Неконтролируемый откат ТС назад', maxSlots: 7 },
        { id: 'e47', text: 'Иные нарушения ПДД', maxSlots: 7 }
    ]
};

// ========== ХРАНИЛИЩЕ ДЛЯ КОЛИЧЕСТВА ОТМЕТОК ==========
let errorCounts = {};

function initErrorCounts() {
    errorCounts = {};
    for (const [points, errors] of Object.entries(ERRORS_LIST)) {
        errors.forEach(error => {
            errorCounts[error.id] = 0;
        });
    }
}

// ========== ПРЕОБРАЗОВАНИЕ ISO-ДАТЫ В ДД.ММ.ГГГГ ==========
function isoDateToDisplay(isoDate) {
    if (!isoDate) return '';
    const parts = String(isoDate).split('-');
    if (parts.length !== 3) return '';
    const [y, m, d] = parts;
    if (!y || !m || !d) return '';
    return `${d}.${m}.${y}`;
}

// ========== ИНИЦИАЛИЗАЦИЯ ЧЕКБОКСОВ НАВЫКОВ ==========
function initSkills() {
    const grid = document.getElementById('skillsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    SKILLS_LIST.forEach((skill, index) => {
        const div = document.createElement('div');
        div.className = 'eis-skill-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `skill_${index}`;
        checkbox.addEventListener('change', generateExam);

        const label = document.createElement('label');
        label.htmlFor = `skill_${index}`;
        label.textContent = skill;

        div.appendChild(checkbox);
        div.appendChild(label);
        grid.appendChild(div);
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ОШИБОК ==========
function initErrors() {
    const container = document.getElementById('errorsContainer');
    if (!container) return;

    initErrorCounts();
    container.innerHTML = '';
    let html = '';

    const groups = [
        { points: 7, errors: ERRORS_LIST[7] },
        { points: 4, errors: ERRORS_LIST[4] },
        { points: 3, errors: ERRORS_LIST[3] },
        { points: 2, errors: ERRORS_LIST[2] },
        { points: 1, errors: ERRORS_LIST[1] }
    ];

    groups.forEach(group => {
        html += `<div class="eis-error-group"><div class="eis-error-group-title">${group.points} балла(ов)</div><div class="eis-error-grid">`;
        group.errors.forEach(error => {
            html += `
                <div class="eis-error-item" data-error-id="${error.id}">
                    <div class="eis-error-controls">
                        <button class="eis-error-btn" onclick="changeErrorCount('${error.id}', -1)">−</button>
                        <span class="eis-error-count" id="count_${error.id}">0</span>
                        <button class="eis-error-btn" onclick="changeErrorCount('${error.id}', 1)">+</button>
                        <span class="eis-error-slots">/${error.maxSlots}</span>
                    </div>
                    <label for="${error.id}">${error.text}</label>
                </div>
            `;
        });
        html += `</div></div>`;
    });

    container.innerHTML = html;
}

// ========== ИЗМЕНЕНИЕ КОЛИЧЕСТВА ОТМЕТОК ==========
function changeErrorCount(errorId, delta) {
    let maxSlots = 0;
    for (const [points, errors] of Object.entries(ERRORS_LIST)) {
        const found = errors.find(e => e.id === errorId);
        if (found) {
            maxSlots = found.maxSlots;
            break;
        }
    }

    const newCount = Math.max(0, Math.min(maxSlots, (errorCounts[errorId] || 0) + delta));
    errorCounts[errorId] = newCount;

    const countEl = document.getElementById(`count_${errorId}`);
    if (countEl) countEl.textContent = newCount;

    generateExam();
}

// ========== УПРАВЛЕНИЕ ==========
function checkAllSkills() {
    const checkboxes = document.querySelectorAll('#skillsGrid input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    generateExam();
}

function uncheckAllSkills() {
    const checkboxes = document.querySelectorAll('#skillsGrid input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    generateExam();
}

function getCheckedSkills() {
    const checkboxes = document.querySelectorAll('#skillsGrid input[type="checkbox"]');
    const checked = [];
    checkboxes.forEach((cb, index) => {
        if (cb.checked) checked.push(index);
    });
    return checked;
}

function checkAllErrors() {
    for (const [points, errors] of Object.entries(ERRORS_LIST)) {
        errors.forEach(error => {
            errorCounts[error.id] = error.maxSlots;
            const countEl = document.getElementById(`count_${error.id}`);
            if (countEl) countEl.textContent = error.maxSlots;
        });
    }
    generateExam();
}

function uncheckAllErrors() {
    for (const [points, errors] of Object.entries(ERRORS_LIST)) {
        errors.forEach(error => {
            errorCounts[error.id] = 0;
            const countEl = document.getElementById(`count_${error.id}`);
            if (countEl) countEl.textContent = '0';
        });
    }
    generateExam();
}

function getCheckedErrors() {
    const checked = [];
    for (const [points, errors] of Object.entries(ERRORS_LIST)) {
        errors.forEach(error => {
            if (errorCounts[error.id] > 0) {
                checked.push({
                    id: error.id,
                    count: errorCounts[error.id],
                    maxSlots: error.maxSlots,
                    points: parseInt(points)
                });
            }
        });
    }
    return checked;
}

function getTotalPoints() {
    let total = 0;
    for (const [points, errors] of Object.entries(ERRORS_LIST)) {
        errors.forEach(error => {
            if (errorCounts[error.id] > 0) {
                total += parseInt(points) * errorCounts[error.id];
            }
        });
    }
    return total;
}

// ========== ГЕНЕРАЦИЯ ЭКЗАМЕНАЦИОННЫХ БЛАНКОВ ==========
async function generateExam() {
    const canvas1 = document.getElementById('examCanvas1');
    const canvas2 = document.getElementById('examCanvas2');

    if (!canvas1 || !canvas2) return;

    // Нативные поля даты/времени возвращают ISO-формат
    const examDateRaw = document.getElementById('examDate').value; // "2026-05-15"
    const examTimeRaw = document.getElementById('examTime').value; // "14:30"
    const birthDateRaw = document.getElementById('examBirthDate').value; // "1995-08-20"

    // Преобразуем ISO-даты в ДД.ММ.ГГГГ для отрисовки
    const examDate = isoDateToDisplay(examDateRaw);
    const birthDate = isoDateToDisplay(birthDateRaw);
    const examTime = examTimeRaw || '';

    const category = document.getElementById('examCategory').value.trim() || 'C';
    const transmission = document.getElementById('examTransmission').value.trim() || 'Механика';
    const lastName = document.getElementById('examLastName').value.trim();
    const firstName = document.getElementById('examFirstName').value.trim();
    const middleName = document.getElementById('examMiddleName').value.trim();
    const examiner = document.getElementById('examExaminer').value.trim();
    const vehicleMake = document.getElementById('examVehicleMake').value.trim();
    const vehicleModel = document.getElementById('examVehicleModel').value.trim();
    const plateNumber = document.getElementById('examPlateNumber').value.trim();
    const examinerComment = document.getElementById('examExaminerComment').value.trim();

    const checkedSkills = getCheckedSkills();
    const checkedErrors = getCheckedErrors();
    const totalPoints = getTotalPoints();

    const totalEl = document.getElementById('errorsTotal');
    if (totalEl) totalEl.textContent = `Штрафные баллы: ${totalPoints}`;

    let vehicleFull = '';
    if (vehicleMake) vehicleFull += vehicleMake;
    if (vehicleModel) vehicleFull += ' ' + vehicleModel;
    vehicleFull = vehicleFull.trim();

    const birthDateFormatted = formatDateForDisplay(birthDate);
    const examDateFormatted = formatDateForDisplay(examDate);

    await generateExamPage1(canvas1, {
        examDate: examDateFormatted,
        examTime: examTime,
        category: category,
        transmission: transmission,
        lastName: lastName,
        firstName: firstName,
        middleName: middleName,
        birthDate: birthDateFormatted,
        vehicleMake: vehicleMake,
        vehicleModel: vehicleModel,
        vehicleFull: vehicleFull,
        plateNumber: plateNumber,
        examiner: examiner,
        checkedSkills: checkedSkills,
        checkedErrors: checkedErrors
    });

    await generateExamPage2(canvas2, {
        examDate: examDateFormatted,
        examTime: examTime,
        category: category,
        lastName: lastName,
        firstName: firstName,
        middleName: middleName,
        vehicleFull: vehicleFull,
        plateNumber: plateNumber,
        examiner: examiner,
        checkedErrors: checkedErrors,
        totalPoints: totalPoints,
        examinerComment: examinerComment
    });
}

// ========== ГЕНЕРАЦИЯ СТРАНИЦЫ 1 ==========
async function generateExamPage1(canvas, data) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        const bgImage = await loadImage(EXAM_CONFIG.backgrounds.page1);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.warn('Ошибка загрузки фона стр.1:', error);
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

    const fields = [
        { text: data.examDate, x: 152, y: 228, maxWidth: 260, size: 30 },
        { text: data.examTime, x: 165, y: 263, maxWidth: 260, size: 30 },
        { text: data.category, x: 1193, y: 228, maxWidth: 169, size: 30 },
        { text: data.transmission, x: 965, y: 263, maxWidth: 429, size: 30 },
        { text: data.lastName, x: 210, y: 334, maxWidth: 276, size: 30 },
        { text: data.firstName, x: 147, y: 369, maxWidth: 337, size: 30 },
        { text: data.middleName, x: 212, y: 404, maxWidth: 400, size: 30 },
        { text: data.birthDate, x: 288, y: 465, maxWidth: 245, size: 30 },
        { text: data.vehicleMake, x: 824, y: 334, maxWidth: 398, size: 30 },
        { text: data.vehicleModel, x: 848, y: 369, maxWidth: 382, size: 30 },
        { text: data.plateNumber, x: 1073, y: 439, maxWidth: 184, size: 30 },
        { text: data.examiner, x: 250, y: 500, maxWidth: 1284, size: 30 }
    ];

    fields.forEach(field => {
        if (field.text) {
            fitText(ctx, field.text, field.x, field.y, field.maxWidth, field.size, fontFamily, 'normal', color, 'left', fontStyle);
        }
    });

    // Галочки навыков
    const skillPositions = [
        { x: 206, y: 650 }, { x: 206, y: 696 }, { x: 206, y: 755 }, { x: 206, y: 801 },
        { x: 206, y: 848 }, { x: 206, y: 894 }, { x: 206, y: 927 }, { x: 206, y: 960 },
        { x: 206, y: 994 }, { x: 206, y: 1027 }, { x: 206, y: 1060 }, { x: 206, y: 1094 },
        { x: 206, y: 1127 }, { x: 206, y: 1160 }, { x: 206, y: 1194 },
        { x: 206, y: 1240 }, { x: 206, y: 1299 }, { x: 206, y: 1358 }, { x: 206, y: 1416 }
    ];

    ctx.fillStyle = '#000f55';
    ctx.font = 'italic 30px "Segoe Script"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    data.checkedSkills.forEach(index => {
        if (index < skillPositions.length) {
            ctx.fillText('✓', skillPositions[index].x, skillPositions[index].y);
        }
    });

    // Галочки ошибок на странице 1
    const errorCountMap = {};
    data.checkedErrors.forEach(err => {
        errorCountMap[err.id] = err.count || 0;
    });

    const errorCheckPositions = {
        'e1': { x: 1514, y: 1589 },
        'e2': { x: 1514, y: 1658 },
        'e3': { x: 1514, y: 1698 },
        'e4': { x: 1514, y: 1750 },
        'e5': { x: 1514, y: 1803 },
        'e6': { x: 1514, y: 1871 },
        'e7': { x: 1514, y: 1939 },
        'e8': { x: 1514, y: 1979 },
        'e9': { x: 1514, y: 2019 },
        'e10': { x: 1514, y: 2059 },
        'e11': { x: 1514, y: 2098 },
        'e12': { x: 1514, y: 2138 },
        'e13': { x: 1514, y: 2178 },
        'e14': { x: 1514, y: 2218 }
    };

    ctx.fillStyle = '#000f55';
    ctx.font = 'italic 26px "Segoe Script"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const [errorId, pos] of Object.entries(errorCheckPositions)) {
        const count = errorCountMap[errorId] || 0;
        for (let i = 0; i < count; i++) {
            const offsetX = i * 28;
            ctx.fillText('✓', pos.x + offsetX, pos.y);
        }
    }
}

// ========== ГЕНЕРАЦИЯ СТРАНИЦЫ 2 ==========
async function generateExamPage2(canvas, data) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        const bgImage = await loadImage(EXAM_CONFIG.backgrounds.page2);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.warn('Ошибка загрузки фона стр.2:', error);
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

    // Комментарий экзаменатора
    if (data.examinerComment) {
        fitText(ctx, data.examinerComment, 109, 2055, 1449, 30, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // Фамилии для подписей
    const examinerText = document.getElementById('signatureExaminerText')?.value || '';
    if (examinerText) {
        fitText(ctx, examinerText, 1156, 2122, 400, 30, fontFamily, 'normal', color, 'left', fontStyle);
    }

    const candidateText = document.getElementById('signatureCandidateText')?.value || '';
    if (candidateText) {
        fitText(ctx, candidateText, 1156, 2180, 400, 30, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // Обводка в зависимости от баллов
    const totalPoints = data.totalPoints || 0;

    try {
        let frameImage;
        if (totalPoints < 7) {
            frameImage = await loadImage('backgrounds/frame_pass.png');
            ctx.drawImage(frameImage, 1157, 1947);
        } else {
            frameImage = await loadImage('backgrounds/frame_pass.png');
            ctx.drawImage(frameImage, 1379, 1947);
        }
    } catch (error) {
        console.warn('Ошибка загрузки обводки:', error);
    }

    // Галочки ошибок на странице 2
    const errorCountMap = {};
    data.checkedErrors.forEach(err => {
        errorCountMap[err.id] = err.count || 0;
    });

    const errorCheckPositions = {
        'e15': { x: 1503, y: 110 },
        'e16': { x: 1503, y: 150 },
        'e17': { x: 1503, y: 189 },
        'e18': { x: 1503, y: 229 },
        'e19': { x: 1503, y: 269 },
        'e20': { x: 1503, y: 321 },
        'e21': { x: 1493, y: 407 },
        'e22': { x: 1493, y: 460 },
        'e23': { x: 1493, y: 512 },
        'e24': { x: 1493, y: 565 },
        'e25': { x: 1493, y: 630 },
        'e26': { x: 1493, y: 695 },
        'e27': { x: 1493, y: 748 },
        'e28': { x: 1493, y: 816 },
        'e29': { x: 1493, y: 913 },
        'e30': { x: 1483, y: 1028 },
        'e31': { x: 1483, y: 1081 },
        'e32': { x: 1483, y: 1120 },
        'e33': { x: 1483, y: 1173 },
        'e34': { x: 1415, y: 1255 },
        'e35': { x: 1415, y: 1311 },
        'e36': { x: 1415, y: 1364 },
        'e37': { x: 1415, y: 1403 },
        'e38': { x: 1415, y: 1443 },
        'e39': { x: 1415, y: 1479 },
        'e40': { x: 1415, y: 1522 },
        'e41': { x: 1415, y: 1575 },
        'e42': { x: 1415, y: 1640 },
        'e43': { x: 1415, y: 1705 },
        'e44': { x: 1415, y: 1758 },
        'e45': { x: 1415, y: 1798 },
        'e46': { x: 1415, y: 1866 },
        'e47': { x: 1415, y: 1935 }
    };

    ctx.fillStyle = '#000f55';
    ctx.font = 'italic 26px "Segoe Script"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const [errorId, pos] of Object.entries(errorCheckPositions)) {
        const count = errorCountMap[errorId] || 0;
        for (let i = 0; i < count; i++) {
            const offsetX = i * 20;
            ctx.fillText('✓', pos.x + offsetX, pos.y);
        }
    }

    // Подписи
    drawSignatureOnCanvas(ctx, 'examiner', canvas, true);
    drawSignatureOnCanvas(ctx, 'candidate', canvas, true);
}

// ========== СОХРАНЕНИЕ СТРАНИЦ ==========
function saveExamPage1() {
    const canvas = document.getElementById('examCanvas1');
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
        showToast('Холст пуст', 'warning');
        return;
    }

    const lastName = document.getElementById('examLastName').value.trim() || 'unknown';
    const fileName = `${lastName}_экзамен_стр1.png`;

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function saveExamPage2() {
    const wasActive = {};
    for (const type of ['examiner', 'candidate']) {
        wasActive[type] = signatureData[type].active;
        signatureData[type].active = false;
    }

    const canvas = document.getElementById('examCanvas2');
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
        showToast('Холст пуст', 'warning');
        for (const type of ['examiner', 'candidate']) {
            signatureData[type].active = wasActive[type];
        }
        return;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const examinerText = document.getElementById('signatureExaminerText')?.value || '';
    const candidateText = document.getElementById('signatureCandidateText')?.value || '';
    const examinerComment = document.getElementById('examExaminerComment').value.trim();
    const totalPoints = getTotalPoints();
    const checkedErrors = getCheckedErrors();

    loadImage(EXAM_CONFIG.backgrounds.page2).then(bgImage => {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        const fontFamily = 'Segoe Script';
        const color = '#000f55';
        const fontStyle = 'italic';

        if (examinerComment) {
            fitText(ctx, examinerComment, 109, 2055, 1449, 30, fontFamily, 'normal', color, 'left', fontStyle);
        }

        if (examinerText) {
            fitText(ctx, examinerText, 1156, 2122, 400, 30, fontFamily, 'normal', color, 'left', fontStyle);
        }
        if (candidateText) {
            fitText(ctx, candidateText, 1156, 2180, 400, 30, fontFamily, 'normal', color, 'left', fontStyle);
        }

        loadImage('backgrounds/frame_pass.png').then(frameImage => {
            if (totalPoints < 7) {
                ctx.drawImage(frameImage, 1157, 1947);
            } else {
                ctx.drawImage(frameImage, 1379, 1947);
            }

            const errorCountMap = {};
            checkedErrors.forEach(err => {
                errorCountMap[err.id] = err.count || 0;
            });

            const errorCheckPositions = {
                'e15': { x: 1503, y: 110 }, 'e16': { x: 1503, y: 150 },
                'e17': { x: 1503, y: 189 }, 'e18': { x: 1503, y: 229 },
                'e19': { x: 1503, y: 269 }, 'e20': { x: 1503, y: 321 },
                'e21': { x: 1493, y: 407 }, 'e22': { x: 1493, y: 460 },
                'e23': { x: 1493, y: 512 }, 'e24': { x: 1493, y: 565 },
                'e25': { x: 1493, y: 630 }, 'e26': { x: 1493, y: 695 },
                'e27': { x: 1493, y: 748 }, 'e28': { x: 1493, y: 816 },
                'e29': { x: 1493, y: 913 }, 'e30': { x: 1483, y: 1028 },
                'e31': { x: 1483, y: 1081 }, 'e32': { x: 1483, y: 1120 },
                'e33': { x: 1483, y: 1173 }, 'e34': { x: 1415, y: 1255 },
                'e35': { x: 1415, y: 1311 }, 'e36': { x: 1415, y: 1364 },
                'e37': { x: 1415, y: 1403 }, 'e38': { x: 1415, y: 1443 },
                'e39': { x: 1415, y: 1479 }, 'e40': { x: 1415, y: 1522 },
                'e41': { x: 1415, y: 1575 }, 'e42': { x: 1415, y: 1640 },
                'e43': { x: 1415, y: 1705 }, 'e44': { x: 1415, y: 1758 },
                'e45': { x: 1415, y: 1798 }, 'e46': { x: 1415, y: 1866 },
                'e47': { x: 1415, y: 1935 }
            };

            ctx.fillStyle = '#000f55';
            ctx.font = 'italic 26px "Segoe Script"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (const [errorId, pos] of Object.entries(errorCheckPositions)) {
                const count = errorCountMap[errorId] || 0;
                for (let i = 0; i < count; i++) {
                    const offsetX = i * 20;
                    ctx.fillText('✓', pos.x + offsetX, pos.y);
                }
            }

            drawSignatureOnCanvas(ctx, 'examiner', canvas, false);
            drawSignatureOnCanvas(ctx, 'candidate', canvas, false);

            const lastName = document.getElementById('examLastName').value.trim() || 'unknown';
            const fileName = `${lastName}_экзамен_стр2.png`;

            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();

            for (const type of ['examiner', 'candidate']) {
                signatureData[type].active = wasActive[type];
            }
            generateExam();
        }).catch(() => {
            const lastName = document.getElementById('examLastName').value.trim() || 'unknown';
            const fileName = `${lastName}_экзамен_стр2.png`;
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();

            for (const type of ['examiner', 'candidate']) {
                signatureData[type].active = wasActive[type];
            }
            generateExam();
        });
    }).catch(error => {
        console.error('Ошибка сохранения:', error);
        showToast('Ошибка сохранения: ' + (error?.message || 'неизвестная ошибка'), 'error');
        for (const type of ['examiner', 'candidate']) {
            signatureData[type].active = wasActive[type];
        }
    });
}

function saveExamBoth() {
    saveExamPage1();

    setTimeout(() => {
        saveExamPage2();
    }, 1000);
}

// ========== ПОДПИСКА НА ИЗМЕНЕНИЯ ==========
document.addEventListener('DOMContentLoaded', function () {
    // Работаем только на странице exam.html
    if (!document.getElementById('examCanvas1')) return;

    initSkills();
    initErrors();

    setTimeout(generateExam, 200);
});

const __generateExamNow = generateExam;
window.generateExam = debounce(generateExam, 250);
window.generateExamNow = __generateExamNow;
window.saveExamPage1 = saveExamPage1;
window.saveExamPage2 = saveExamPage2;
window.saveExamBoth = saveExamBoth;
window.checkAllSkills = checkAllSkills;
window.uncheckAllSkills = uncheckAllSkills;
window.checkAllErrors = checkAllErrors;
window.uncheckAllErrors = uncheckAllErrors;
window.changeErrorCount = changeErrorCount;
window.isoDateToDisplay = isoDateToDisplay;