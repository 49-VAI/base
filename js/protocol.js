// ========== КОНФИГУРАЦИЯ ПРОТОКОЛА ==========
const PROTOCOL_CONFIG = {
    canvasWidth: 1654,
    canvasHeight: 2339,
    backgrounds: {
        page1: 'backgrounds/protocol_page1.png',
        page2: 'backgrounds/protocol_page2.png'
    }
};

// ========== БЕЗОПАСНОЕ ЧТЕНИЕ ЗНАЧЕНИЙ ПОЛЕЙ ==========
function getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function getCheckedValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
}

// ========== ТРАНСЛИТЕРАЦИЯ (для штрих-кода) ==========
function translit(str) {
    const map = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z',
        'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
        'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
        'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
        'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'E','Ж':'Zh','З':'Z',
        'И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
        'С':'S','Т':'T','У':'U','Ф':'F','Х':'H','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sch',
        'Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya'
    };
    return str.split('').map(ch => map[ch] !== undefined ? map[ch] : ch).join('');
}

// ========== ФОРМАТИРОВАНИЕ ДАТЫ И ВРЕМЕНИ ==========
function formatProtocolDate(input) {
    let digits = input.value.replace(/\D/g, '').slice(0, 8);

    let result = '';
    if (digits.length > 0) result += digits.slice(0, 2);
    if (digits.length > 2) result += '.' + digits.slice(2, 4);
    if (digits.length > 4) result += '.' + digits.slice(4, 8);

    if (digits.length === 4) {
        result += '.2026';
    }

    input.value = result;
    generateProtocol();
}

function formatProtocolTime(input) {
    const digits = input.value.replace(/\D/g, '').slice(0, 4);

    let result = '';
    if (digits.length > 0) result += digits.slice(0, 2);
    if (digits.length > 2) result += ':' + digits.slice(2, 4);

    input.value = result;
    generateProtocol();
}

function formatProtocolBirthDate(input) {
    const digits = input.value.replace(/\D/g, '').slice(0, 8);

    let result = '';
    if (digits.length > 0) result += digits.slice(0, 2);
    if (digits.length > 2) result += '.' + digits.slice(2, 4);
    if (digits.length > 4) result += '.' + digits.slice(4, 8);

    input.value = result;
    generateProtocol();
}

// ========== ФОРМАТИРОВАНИЕ ТЕЛЕФОНА ==========
function formatProtocolPhone(input) {
    let digits = input.value.replace(/\D/g, '');

    if (digits.startsWith('8')) {
        digits = '7' + digits.slice(1);
    }
    if (digits && !digits.startsWith('7')) {
        digits = '7' + digits;
    }

    digits = digits.slice(0, 11);

    let result = '';
    if (digits.length > 0) result += '+' + digits[0];
    if (digits.length > 1) result += ' (' + digits.slice(1, 4);
    if (digits.length >= 5) result += ') ' + digits.slice(4, 7);
    if (digits.length >= 8) result += '-' + digits.slice(7, 9);
    if (digits.length >= 10) result += '-' + digits.slice(9, 11);

    input.value = result;
    generateProtocol();
}

// ========== МНОГОСТРОЧНЫЙ ТЕКСТ С АВТОПЕРЕНОСОМ И АВТОРАЗМЕРОМ ==========
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

// ========== ГЕНЕРАЦИЯ ШТРИХ-КОДА ==========
function buildBarcodeString(data) {
    // Дата: ДД.ММ.ГГГГ → ДДММГГ
    let dateCode = '';
    if (data.date) {
        const parts = data.date.split('.');
        if (parts.length >= 3) {
            const dd = parts[0].padStart(2, '0');
            const mm = parts[1].padStart(2, '0');
            const yy = parts[2].slice(-2);
            dateCode = dd + mm + yy;
        }
    }
    dateCode = dateCode.padEnd(6, '0').slice(0, 6);

    // Номер: только цифры, 6 знаков
    const numCode = (data.regNumber || '')
        .replace(/\D/g, '')
        .padStart(6, '0')
        .slice(-6);

    // Статья: SSSS
    // articleNumber = "12.8"  → "128"
    // articlePart   = "ч. 1"  → "1"
    let articleNum = (data.articleNumber || '')
        .replace(/\D/g, '');           // "128"
    articleNum = articleNum.slice(-3).padStart(3, '0');

    let articlePart = (data.articlePart || '')
        .replace(/\D/g, '');           // "1"
    articlePart = articlePart.slice(-1) || '0';

    const articleCode = articleNum + articlePart;

    return dateCode + numCode + articleCode;
}

async function generateBarcodeImage(text, width = 350, height = 80, scale = 3) {
    return new Promise((resolve) => {
        if (typeof JsBarcode === 'undefined') {
            console.warn('JsBarcode не загружен');
            resolve(null);
            return;
        }

        const offCanvas = document.createElement('canvas');

        try {
            JsBarcode(offCanvas, text, {
                format: 'CODE128C',
                width: 2 * scale,          // полоски крупнее
                height: height * scale,     // высота крупнее
                displayValue: true,
                font: 'monospace',
                fontSize: 14 * scale,       // шрифт крупнее
                textMargin: 2 * scale,
                margin: 5 * scale,
                background: '#ffffff',
                lineColor: '#000000'
            });

            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = offCanvas.toDataURL('image/png');
        } catch (e) {
            console.warn('Ошибка генерации штрих-кода:', e);
            resolve(null);
        }
    });
}

async function drawBarcodeOnCanvas(ctx, data, x, y, width, height) {
    const text = buildBarcodeString(data);
    if (!/^\d+$/.test(text)) return;

    const img = await generateBarcodeImage(text, width, height, 3);
    if (!img) return;

    // Белая подложка под штрих-код
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 4, y - 4, width + 8, height + 30);

    // Сглаживание при уменьшении — чтобы полоски и цифры были чёткими
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Рисуем картинку 1:1 по размеру (не растягиваем!)
    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, width, height + 30);
}

// ========== ГЕНЕРАЦИЯ ПРОТОКОЛА ==========
async function generateProtocol() {
    const canvas1 = document.getElementById('protocolCanvas1');
    const canvas2 = document.getElementById('protocolCanvas2');

    if (!canvas1 || !canvas2) return;

    const data = {
        regNumber: getFieldValue('protocolRegNumber'),
        date: getFieldValue('protocolDate'),
        time: getFieldValue('protocolTime'),
        place: getFieldValue('protocolPlace'),
        officialPosition: getFieldValue('protocolOfficialPosition'),
        officialRank: getFieldValue('protocolOfficialRank'),
        officialName: getFieldValue('protocolOfficialName'),

        lastName: getFieldValue('protocolLastName'),
        firstName: getFieldValue('protocolFirstName'),
        middleName: getFieldValue('protocolMiddleName'),
        birthDate: getFieldValue('protocolBirthDate'),
        birthPlace: getFieldValue('protocolBirthPlace'),
        russianLanguage: getCheckedValue('protocolRussianLanguage'),
        passportSeries: getFieldValue('protocolPassportSeries'),
        passportNumber: getFieldValue('protocolPassportNumber'),
        passportIssued: getFieldValue('protocolPassportIssued'),
        address: getFieldValue('protocolAddress'),
        phone: getFieldValue('protocolPhone'),
        workPlace: getFieldValue('protocolWorkPlace'),

        registeredAddress: getFieldValue('protocolRegisteredAddress'),
        registeredPhone: getFieldValue('protocolRegisteredPhone'),
        actualAddress: getFieldValue('protocolActualAddress'),
        actualPhone: getFieldValue('protocolActualPhone'),
        workPlace2: getFieldValue('protocolWorkPlace2'),
        driverLicense: getFieldValue('protocolDriverLicense'),

        vehicleMake: getFieldValue('protocolVehicleMake'),
        vehicleColor: getFieldValue('protocolVehicleColor'),
        vehiclePlate: getFieldValue('protocolVehiclePlate'),
        vehicleOwner: getFieldValue('protocolVehicleOwner'),
        vehicleRegistered: getFieldValue('protocolVehicleRegistered'),

        // ===== ДАТА, ВРЕМЯ, МЕСТО СОВЕРШЕНИЯ =====
        violationDate: getFieldValue('protocolViolationDate'),
        violationTime: getFieldValue('protocolViolationTime'),
        violationPlace: getFieldValue('protocolViolationPlace'),

        violationDescription: getFieldValue('protocolViolationDescription'),
        articlePart: getFieldValue('protocolArticlePart'),
        articleNumber: getFieldValue('protocolArticleNumber'),
        witnesses: getFieldValue('protocolWitnesses'),
        witnessesNotified: getFieldValue('protocolWitnessesNotified'),

        // ===== СТРАНИЦА 2 =====
        victimsNotified: getFieldValue('protocolVictimsNotified'),
        considerationPlaceTime: getFieldValue('protocolConsiderationPlaceTime'),
        explanation: getFieldValue('protocolExplanation'),
        remarks: getFieldValue('protocolRemarks')
    };

    await drawProtocolPage1(canvas1, data);
    await drawProtocolPage2(canvas2, data);
}

// ========== ОТРИСОВКА СТРАНИЦЫ 1 ==========
async function drawProtocolPage1(canvas, data) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        const bgImage = await loadImage(PROTOCOL_CONFIG.backgrounds.page1);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.warn('Ошибка загрузки фона стр.1 протокола:', error);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Фон протокола (стр. 1) не найден', canvas.width / 2, canvas.height / 2);
        return;
    }

    const fontFamily = 'Segoe Script';
    const color = '#000f55';
    const fontStyle = 'italic';

    // ===== РЕГИСТРАЦИОННЫЙ НОМЕР =====
    if (data.regNumber) {
        fitText(ctx, '№ ' + data.regNumber, 491 + 383.5, 275, 1257 - 491, 35, fontFamily, 'normal', color, 'center', fontStyle);
    }

    // ===== ДАТА, ВРЕМЯ, МЕСТО СОСТАВЛЕНИЯ =====
    if (data.date) {
        const parts = data.date.split('.');
        if (parts.length >= 2) {
            fitText(ctx, parts[0], 140, 351 + 35, 60, 35, fontFamily, 'normal', color, 'center', fontStyle);
            fitText(ctx, parts[1], 271.5, 351 + 35, 133, 35, fontFamily, 'normal', color, 'center', fontStyle);
        }
    }
    if (data.time) {
        const parts = data.time.split(':');
        if (parts.length >= 2) {
            fitText(ctx, parts[0], 763 + 51 / 2, 351 + 33, 51, 30, fontFamily, 'normal', color, 'center', fontStyle);
            fitText(ctx, parts[1], 879 + 51 / 2, 351 + 33, 51, 30, fontFamily, 'normal', color, 'center', fontStyle);
        }
    }
    if (data.place) {
        fitText(ctx, data.place, 1216, 351 + 35, 383, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== ДОЛЖНОСТНОЕ ЛИЦО =====
    const officialLine = [
        data.officialPosition,
        [data.officialRank, data.officialName].filter(Boolean).join(' ')
    ].filter(Boolean).join(', ');
    if (officialLine) {
        fitText(ctx, officialLine, 242, 460 + 35, 1350, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== ФИО НАРУШИТЕЛЯ (по клеткам) =====
    const fioParts = [data.lastName, data.firstName, data.middleName].filter(Boolean);
    if (fioParts.length > 0) {
        const CELL_START_X = 57;
        const CELL_STEP    = 42.75;
        const CELL_WIDTH   = 41;
        const CELL_Y       = 601 + 74 - 15;
        const CELL_COUNT   = 35;
        const CELL_SIZE    = 34;

        const chars = [];
        fioParts.forEach((part, idx) => {
            if (idx > 0) chars.push('');
            for (const ch of part.toUpperCase()) chars.push(ch);
        });

        ctx.fillStyle = color;
        ctx.font = `normal normal ${CELL_SIZE}px "${fontFamily}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        for (let i = 0; i < chars.length && i < CELL_COUNT; i++) {
            if (chars[i] === '') continue;
            const cx = CELL_START_X + CELL_STEP * i + CELL_WIDTH / 2;
            ctx.fillText(chars[i], cx, CELL_Y);
        }
    }

    // ===== ДАТА И МЕСТО РОЖДЕНИЯ =====
    const birthDateText = data.birthDate ? `${data.birthDate} г.р.` : '';
    const birthFull = [birthDateText, data.birthPlace].filter(Boolean).join(', ');
    if (birthFull) {
        fitText(ctx, birthFull, 71, 721 + 30, 900, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== ВЛАДЕНИЕ РУССКИМ ЯЗЫКОМ =====
    if (data.russianLanguage) {
        fitText(ctx, data.russianLanguage, 1219 + 367 / 4, 721 + 30, 367, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== ЗАРЕГИСТРИРОВАН ПО МЕСТУ ЖИТЕЛЬСТВА / ПРЕБЫВАНИЯ =====
    if (data.registeredAddress) {
        fitTextMultiline(
            ctx,
            data.registeredAddress,
            [
                { x: 928, y: 791 + 30, maxWidth: 684 },
                { x: 71, y: 830 + 30, maxWidth: 1000 }
            ],
            35, 14,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== ТЕЛЕФОН РЕГИСТРАЦИИ =====
    if (data.registeredPhone) {
        fitText(ctx, data.registeredPhone, 1145, 830 + 30, 457, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== ФАКТИЧЕСКИ ПРОЖИВАЮЩИЙ =====
    if (data.actualAddress) {
        fitTextMultiline(
            ctx,
            data.actualAddress,
            [
                { x: 523, y: 868 + 30, maxWidth: 1089 },
                { x: 71, y: 906 + 30, maxWidth: 1000 }
            ],
            35, 14,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== ТЕЛЕФОН ФАКТИЧЕСКИЙ =====
    if (data.actualPhone) {
        fitText(ctx, data.actualPhone, 1145, 906 + 30, 457, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== РАБОТАЮЩИЙ / СЛУЖАЩИЙ =====
    if (data.workPlace2) {
        fitText(ctx, data.workPlace2, 538, 945 + 30, 1067, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== ВОДИТЕЛЬСКОЕ УДОСТОВЕРЕНИЕ (2 строки) =====
    if (data.driverLicense) {
        fitTextMultiline(
            ctx,
            data.driverLicense,
            [
                { x: 1045, y: 1021 + 30, maxWidth: 550 },
                { x: 71, y: 1060 + 30, maxWidth: 1533 }
            ],
            35, 14,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== ТРАНСПОРТНОЕ СРЕДСТВО =====
    const vehicleParts = [
        data.vehicleMake,
        data.vehicleColor ? data.vehicleColor.toLowerCase() : '',
        data.vehiclePlate
    ].filter(Boolean);

    if (vehicleParts.length > 0) {
        fitText(
            ctx,
            vehicleParts.join(', '),
            577, 1129 + 30, 1034, 35,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    if (data.vehicleOwner) {
        fitText(ctx, String(data.vehicleOwner), 307, 1201 + 30, 1300, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    if (data.vehicleRegistered) {
        fitText(ctx, String(data.vehicleRegistered).toLowerCase(), 363, 1269 + 30, 1251, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== ДАТА СОВЕРШЕНИЯ =====
    if (data.violationDate) {
        const dparts = data.violationDate.split('.');
        if (dparts.length >= 2) {
            if (dparts[0]) {
                fitText(ctx, dparts[0], 87, 1308 + 30, 50, 35, fontFamily, 'normal', color, 'left', fontStyle);
            }
            if (dparts[1]) {
                fitText(ctx, dparts[1], 181, 1308 + 30, 100, 35, fontFamily, 'normal', color, 'left', fontStyle);
            }
        }
    }

    // ===== ВРЕМЯ СОВЕРШЕНИЯ =====
    if (data.violationTime) {
        const tparts = data.violationTime.split(':');
        if (tparts.length >= 2) {
            if (tparts[0]) {
                fitText(ctx, tparts[0], 443, 1308 + 30, 50, 35, fontFamily, 'normal', color, 'left', fontStyle);
            }
            if (tparts[1]) {
                fitText(ctx, tparts[1], 597, 1308 + 30, 50, 35, fontFamily, 'normal', color, 'left', fontStyle);
            }
        }
    }

    // ===== МЕСТО СОВЕРШЕНИЯ =====
    if (data.violationPlace) {
        fitText(ctx, data.violationPlace, 786, 1308 + 30, 817, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== СУЩЕСТВО НАРУШЕНИЯ =====
    if (data.violationDescription) {
        fitTextMultiline(
            ctx,
            data.violationDescription,
            [
                { x: 420, y: 1373 + 35, maxWidth: 1184 },
                { x: 71, y: 1443 + 35, maxWidth: 1533 },
                { x: 71, y: 1514 + 35, maxWidth: 1533 }
            ],
            35, 14,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== СТАТЬЯ =====
    if (data.articlePart) {
        fitText(ctx, data.articlePart, 815, 1552 + 35, 80, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }
    if (data.articleNumber) {
        fitText(ctx, data.articleNumber, 1030, 1552 + 35, 100, 35, fontFamily, 'normal', color, 'left', fontStyle);
    }

    // ===== СВИДЕТЕЛИ =====
    if (data.witnesses) {
        fitTextMultiline(
            ctx,
            data.witnesses,
            [
                { x: 741, y: 1667 + 35, maxWidth: 851 },
                { x: 74, y: 1744 + 35, maxWidth: 1533 },
                { x: 74, y: 1782 + 35, maxWidth: 1533 }
            ],
            35, 14,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== СВИДЕТЕЛЯМ РАЗЪЯСНЕНА ОТВЕТСТВЕННОСТЬ =====
    if (data.witnessesNotified) {
        fitText(
            ctx,
            data.witnessesNotified,
            361, 2012 + 35, 651, 35,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== ШТРИХ-КОД В ПРАВОМ ВЕРХНЕМ УГЛУ =====
    await drawBarcodeOnCanvas(ctx, data, 1284, 20, 350, 90);
}

// ========== ОТРИСОВКА СТРАНИЦЫ 2 ==========
async function drawProtocolPage2(canvas, data) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        const bgImage = await loadImage(PROTOCOL_CONFIG.backgrounds.page2);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.warn('Ошибка загрузки фона стр.2 протокола:', error);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Фон протокола (стр. 2) не найден', canvas.width / 2, canvas.height / 2);
        return;
    }

    const fontFamily = 'Segoe Script';
    const color = '#000f55';
    const fontStyle = 'italic';

    // ===== ПОТЕРПЕВШИМ РАЗЪЯСНЕНЫ ПРАВА =====
    if (data.victimsNotified) {
        fitText(
            ctx,
            data.victimsNotified,
            418, 164 + 35, 834, 35,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== МЕСТО И ВРЕМЯ РАССМОТРЕНИЯ ДЕЛА =====
    if (data.considerationPlaceTime) {
        fitTextMultiline(
            ctx,
            data.considerationPlaceTime,
            [
                { x: 1227, y: 317 + 35, maxWidth: 367 },
                { x: 55, y: 355 + 35, maxWidth: 1550 }
            ],
            35, 14,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== ОБЪЯСНЕНИЯ ЛИЦА / ПОКАЗАНИЯ ПОТЕРПЕВШИХ И СВИДЕТЕЛЕЙ =====
    if (data.explanation) {
        fitTextMultiline(
            ctx,
            data.explanation,
            [
                { x: 1513, y: 470 + 35, maxWidth: 84 },
                { x: 55, y: 509 + 35, maxWidth: 1550 },
                { x: 55, y: 547 + 35, maxWidth: 1550 }
            ],
            35, 14,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== ОБЪЯСНЕНИЯ И ЗАМЕЧАНИЯ ПО СОДЕРЖАНИЮ ПРОТОКОЛА =====
    if (data.remarks) {
        fitTextMultiline(
            ctx,
            data.remarks,
            [
                { x: 918, y: 739 + 35, maxWidth: 684 },
                { x: 55, y: 777 + 35, maxWidth: 1550 },
                { x: 55, y: 815 + 35, maxWidth: 1550 }
            ],
            35, 14,
            fontFamily, 'normal', color, 'left', fontStyle
        );
    }

    // ===== ПОДПИСИ =====
    if (typeof drawSignatureOnCanvas === 'function') {
        drawSignatureOnCanvas(ctx, 'official', canvas, true);
        drawSignatureOnCanvas(ctx, 'violator', canvas, true);
        drawSignatureOnCanvas(ctx, 'witness', canvas, true);
        drawSignatureOnCanvas(ctx, 'victim', canvas, true);
    }
}

// ========== СОХРАНЕНИЕ ==========
async function saveProtocolPage1() {
    const wasActive = {};
    for (const type of ['official', 'violator', 'witness', 'victim']) {
        if (typeof signatureData !== 'undefined' && signatureData[type]) {
            wasActive[type] = signatureData[type].active;
            signatureData[type].active = false;
        }
    }

    await generateProtocol();

    const canvas = document.getElementById('protocolCanvas1');
    if (!canvas) {
        for (const type of ['official', 'violator', 'witness', 'victim']) {
            if (typeof signatureData !== 'undefined' && signatureData[type]) {
                signatureData[type].active = wasActive[type];
            }
        }
        return;
    }

    const link = document.createElement('a');
    link.download = `Протокол_стр1_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    for (const type of ['official', 'violator', 'witness', 'victim']) {
        if (typeof signatureData !== 'undefined' && signatureData[type]) {
            signatureData[type].active = wasActive[type];
        }
    }
    await generateProtocol();
}

async function saveProtocolPage2() {
    const wasActive = {};
    for (const type of ['official', 'violator', 'witness', 'victim']) {
        if (typeof signatureData !== 'undefined' && signatureData[type]) {
            wasActive[type] = signatureData[type].active;
            signatureData[type].active = false;
        }
    }

    await generateProtocol();

    const canvas = document.getElementById('protocolCanvas2');
    if (!canvas) {
        for (const type of ['official', 'violator', 'witness', 'victim']) {
            if (typeof signatureData !== 'undefined' && signatureData[type]) {
                signatureData[type].active = wasActive[type];
            }
        }
        return;
    }

    const link = document.createElement('a');
    link.download = `Протокол_стр2_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    for (const type of ['official', 'violator', 'witness', 'victim']) {
        if (typeof signatureData !== 'undefined' && signatureData[type]) {
            signatureData[type].active = wasActive[type];
        }
    }
    await generateProtocol();
}

async function saveProtocolBoth() {
    const wasActive = {};
    for (const type of ['official', 'violator', 'witness', 'victim']) {
        if (typeof signatureData !== 'undefined' && signatureData[type]) {
            wasActive[type] = signatureData[type].active;
            signatureData[type].active = false;
        }
    }

    await generateProtocol();

    const canvas1 = document.getElementById('protocolCanvas1');
    const canvas2 = document.getElementById('protocolCanvas2');

    const dateStr = new Date().toISOString().slice(0, 10);

    if (canvas1) {
        const link1 = document.createElement('a');
        link1.download = `Протокол_стр1_${dateStr}.png`;
        link1.href = canvas1.toDataURL('image/png');
        link1.click();
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    if (canvas2) {
        const link2 = document.createElement('a');
        link2.download = `Протокол_стр2_${dateStr}.png`;
        link2.href = canvas2.toDataURL('image/png');
        link2.click();
    }

    for (const type of ['official', 'violator', 'witness', 'victim']) {
        if (typeof signatureData !== 'undefined' && signatureData[type]) {
            signatureData[type].active = wasActive[type];
        }
    }
    await generateProtocol();
}

// ================================================================
// СОХРАНЕНИЕ ПРОТОКОЛА В БАЗУ ЕИС
// ================================================================
async function saveProtocolToDB() {
    const btn = document.getElementById('protocolSaveToDbBtn');
    const origText = btn ? btn.textContent : 'Сохранить в базу ЕИС';

    // Обязательные поля
    const regNumber = getFieldValue('protocolRegNumber');
    const protocolDate = getFieldValue('protocolDate');
    const lastName = getFieldValue('protocolLastName');
    const firstName = getFieldValue('protocolFirstName');
    const violation = getFieldValue('protocolViolationDescription');
    const articleNum = getFieldValue('protocolArticleNumber');

    if (!regNumber) { showToast('Укажите регистрационный номер протокола', 'warning'); return; }
    if (!protocolDate) { showToast('Укажите дату составления', 'warning'); return; }
    if (!lastName) { showToast('Укажите фамилию нарушителя', 'warning'); return; }
    if (!firstName) { showToast('Укажите имя нарушителя', 'warning'); return; }
    if (!violation) { showToast('Укажите существо нарушения', 'warning'); return; }
    if (!articleNum) { showToast('Укажите номер статьи КоАП РФ', 'warning'); return; }

    // Проверяем уникальность
    const { data: existing } = await supabaseClient
        .from('protocols')
        .select('id')
        .eq('reg_number', regNumber)
        .maybeSingle();

    if (existing) {
        showToast(`Протокол ${regNumber} уже существует в базе`, 'error');
        return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }

    const uploadedFiles = [];

    try {
        // 1. Генерируем канвасы без подсветки подписей
        const wasActive = {};
        if (typeof signatureData !== 'undefined') {
            for (const type of ['official', 'violator', 'witness', 'victim']) {
                if (signatureData[type]) {
                    wasActive[type] = signatureData[type].active;
                    signatureData[type].active = false;
                }
            }
        }
        await generateProtocol();

        const canvas1 = document.getElementById('protocolCanvas1');
        const canvas2 = document.getElementById('protocolCanvas2');
        if (!canvas1 || !canvas2) throw new Error('Не удалось сгенерировать изображения');

        // 2. Загружаем обе страницы
        const url1 = await uploadProtocolPhoto(canvas1, regNumber, 1);
        uploadedFiles.push(extractProtocolFileName(url1));
        const url2 = await uploadProtocolPhoto(canvas2, regNumber, 2);
        uploadedFiles.push(extractProtocolFileName(url2));

        // Восстанавливаем подписи
        if (typeof signatureData !== 'undefined') {
            for (const type of ['official', 'violator', 'witness', 'victim']) {
                if (signatureData[type]) signatureData[type].active = wasActive[type];
            }
        }
        await generateProtocol();

        // 3. Собираем payload
        const toISO = (str) => {
            if (!str) return null;
            const p = String(str).trim().split('.');
            if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
            return str;
        };

        const payload = {
            reg_number: regNumber,
            protocol_date: toISO(protocolDate),
            protocol_time: getFieldValue('protocolTime') || null,
            protocol_place: getFieldValue('protocolPlace') || null,
            official_position: getFieldValue('protocolOfficialPosition') || null,
            official_rank: getFieldValue('protocolOfficialRank') || null,
            official_name: getFieldValue('protocolOfficialName') || null,
            violator_last_name: lastName,
            violator_first_name: firstName,
            violator_middle_name: getFieldValue('protocolMiddleName') || null,
            violator_birth_date: toISO(getFieldValue('protocolBirthDate')),
            violator_birth_place: getFieldValue('protocolBirthPlace') || null,
            russian_language: getCheckedValue('protocolRussianLanguage') || null,
            registered_address: getFieldValue('protocolRegisteredAddress') || null,
            registered_phone: getFieldValue('protocolRegisteredPhone') || null,
            actual_address: getFieldValue('protocolActualAddress') || null,
            actual_phone: getFieldValue('protocolActualPhone') || null,
            work_place: getFieldValue('protocolWorkPlace2') || null,
            driver_license: getFieldValue('protocolDriverLicense') || null,
            vehicle_make: getFieldValue('protocolVehicleMake') || null,
            vehicle_color: getFieldValue('protocolVehicleColor') || null,
            vehicle_plate: getFieldValue('protocolVehiclePlate') || null,
            vehicle_owner: getFieldValue('protocolVehicleOwner') || null,
            vehicle_registered: getFieldValue('protocolVehicleRegistered') || null,
            violation_date: toISO(getFieldValue('protocolViolationDate')),
            violation_time: getFieldValue('protocolViolationTime') || null,
            violation_place: getFieldValue('protocolViolationPlace') || null,
            violation_description: violation,
            article_part: getFieldValue('protocolArticlePart') || null,
            article_number: articleNum,
            witnesses: getFieldValue('protocolWitnesses') || null,
            witnesses_notified: getFieldValue('protocolWitnessesNotified') || null,
            victims_notified: getFieldValue('protocolVictimsNotified') || null,
            consideration_place_time: getFieldValue('protocolConsiderationPlaceTime') || null,
            explanation: getFieldValue('protocolExplanation') || null,
            remarks: getFieldValue('protocolRemarks') || null,
            photo_url: url1,
            photos: { page1: [url1], page2: [url2] },
            created_by: window.currentUser?.id || null
        };

        // 4. Запись в БД
        const { data, error } = await supabaseClient
            .from('protocols')
            .insert(payload)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await logAction('protocol_create', 'protocols', data.id, {
            reg_number: regNumber,
            fio: `${lastName} ${firstName}`,
            article: `${payload.article_part || ''} ст. ${payload.article_number || ''}`.trim()
        });

        showToast(`Протокол ${regNumber} сохранён в базе ЕИС`, 'success');

    } catch (e) {
        console.error('[protocol-save]', e);

        // Чистим загруженные файлы при ошибке
        if (uploadedFiles.length > 0) {
            try {
                await supabaseClient.storage.from('protocol-photos').remove(uploadedFiles);
            } catch (_) { }
        }

        showToast('Ошибка: ' + e.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = origText; }
    }
}

// ================================================================
// ЗАГРУЗКА ФОТО ПРОТОКОЛА
// ================================================================
async function uploadProtocolPhoto(canvas, regNumber, pageNum) {
    const safe = String(regNumber).replace(/[^a-zA-Z0-9]/g, '_') || 'protocol';
    const fileName = `protocol_${safe}_p${pageNum}_${Date.now()}.jpg`;

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

function compressProtocolCanvas(sourceCanvas, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const srcW = sourceCanvas.width, srcH = sourceCanvas.height;
        let dstW = srcW, dstH = srcH;
        if (srcW > maxWidth) {
            dstW = maxWidth;
            dstH = Math.round(srcH * (maxWidth / srcW));
        }
        const off = document.createElement('canvas');
        off.width = dstW; off.height = dstH;
        const ctx = off.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, dstW, dstH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sourceCanvas, 0, 0, srcW, srcH, 0, 0, dstW, dstH);
        off.toBlob(
            b => b ? resolve(b) : reject(new Error('Не удалось сжать изображение')),
            'image/jpeg',
            quality
        );
    });
}

function extractProtocolFileName(url) {
    if (!url) return null;
    const parts = url.split('/protocol-photos/');
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
}

// ========== ПОДПИСКА НА СОБЫТИЯ ==========
document.addEventListener('DOMContentLoaded', function () {
    // Работаем только на странице protocol.html
    if (!document.getElementById('protocolCanvas1')) return;

    const inputs = document.querySelectorAll('.eis-input');
    inputs.forEach(input => {
        input.addEventListener('input', generateProtocol);
        input.addEventListener('change', generateProtocol);
    });

    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        if (radio.name === 'protocolRussianLanguage') {
            radio.addEventListener('change', generateProtocol);
        }
    });

    setTimeout(generateProtocol, 300);
});

// ================================================================
// ПОЛУЧЕНИЕ ПОСЛЕДНЕГО НОМЕРА ПРОТОКОЛА
// ================================================================
async function fetchLastProtocolNumber() {
    const btn = document.getElementById('lastProtocolBtn');
    const input = document.getElementById('protocolRegNumber');
    if (!btn || !input) return;

    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Поиск...';

    try {
        // Берём запись с самой поздней датой создания
        const { data, error } = await supabaseClient
            .from('protocols')
            .select('reg_number, protocol_date, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw new Error(error.message);

        if (!data || !data.reg_number) {
            showToast('В базе пока нет протоколов — начните с 000001-ПДД', 'info');
            return;
        }

        const lastNumber = data.reg_number;
        const nextNumber = incrementRegNumber(lastNumber);

        input.value = nextNumber;
        generateProtocol();

        showToast(
            `Последний номер в базе: ${lastNumber}. Подставлен следующий: ${nextNumber}`,
            'success'
        );
    } catch (e) {
        console.error('[last-protocol]', e);
        showToast('Ошибка: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = origText;
    }
}

// Увеличивает числовую часть номера на 1, сохраняя формат и префикс/суффикс
// "000001-ПДД" → "000002-ПДД"
// "12-АП"       → "13-АП"
function incrementRegNumber(regNumber) {
    const str = String(regNumber || '').trim();
    if (!str) return '000001-ПДД';

    const match = str.match(/^(.*?)(\d+)(\D*)$/);
    if (!match) return str;

    const [, prefix, digits, suffix] = match;
    const next = String(parseInt(digits, 10) + 1).padStart(digits.length, '0');

    return prefix + next + suffix;
}

// ========== ЭКСПОРТ ==========
window.generateProtocol = generateProtocol;
window.saveProtocolPage1 = saveProtocolPage1;
window.saveProtocolPage2 = saveProtocolPage2;
window.saveProtocolBoth = saveProtocolBoth;
window.formatProtocolDate = formatProtocolDate;
window.formatProtocolTime = formatProtocolTime;
window.formatProtocolPhone = formatProtocolPhone;
window.saveProtocolToDB = saveProtocolToDB;
window.fetchLastProtocolNumber = fetchLastProtocolNumber;
window.incrementRegNumber = incrementRegNumber;
window.formatProtocolBirthDate = formatProtocolBirthDate;
window.getFieldValue = getFieldValue;
window.getCheckedValue = getCheckedValue;
window.buildBarcodeString = buildBarcodeString;
window.drawBarcodeOnCanvas = drawBarcodeOnCanvas;