// ================================================================
// СОЗДАНИЕ ВУ — генерация + сохранение в Supabase
// ================================================================

// ========== КОНФИГУРАЦИЯ ВУ ==========
const VU_CONFIG = {
    canvasWidth: 1215,
    canvasHeight: 892,
    background: 'backgrounds/vu_base.png', // Единый фон для всех
    rankPhotos: {
        'Гвардии рядовой': 'backgrounds/ranks/ryadovoy.png',
        'Гвардии ефрейтор': 'backgrounds/ranks/efreytor.png',
        'Гвардии мл. сержант': 'backgrounds/ranks/mladshiy_serzhant.png',
        'Гвардии сержант': 'backgrounds/ranks/serzhant.png',
        'Гвардии ст. сержант': 'backgrounds/ranks/starshiy_serzhant.png',
        'Гвардии старшина': 'backgrounds/ranks/starshina.png',
        'Гвардии прапорщик': 'backgrounds/ranks/praporshchik.png',
        'Гвардии ст. прапорщик': 'backgrounds/ranks/starshiy_praporshchik.png',
        'Гвардии лейтенант': 'backgrounds/ranks/leytenant.png',
        'Гвардии ст. лейтенант': 'backgrounds/ranks/starshiy_leytenant.png',
        'Гвардии капитан': 'backgrounds/ranks/kapitan.png',
        'Гвардии майор': 'backgrounds/ranks/mayor.png'
    },
    serviceStamps: {
        'srochnaya': 'backgrounds/stamp_srochnaya.png',
        'kontraktnaya': 'backgrounds/stamp_kontraktnaya.png'
    },
    vaiStamp: 'backgrounds/vai_stamp.png',
    chiefSignature: 'backgrounds/chief_signature.png',
    // Координаты и размеры элементов
    photoRect: { x: 53, y: 381, w: 235, h: 313 },
    stampRect: { x: 221, y: 605, w: 135, h: 135 },
    signatureRect: { x: 200, y: 765, w: 212, h: 74 },
    serviceStampRect: { x: 371, y: 616, w: 216, h: 78 },
    // Углы поворота печати ВАИ
    stampAngleMin: -40,
    stampAngleMax: 40,
    // Углы поворота печати службы (как было в оригинале)
    serviceStampAngleMin: -7,
    serviceStampAngleMax: 10
};

function fitText(ctx, text, x, y, maxWidth, initialSize, fontFamily, fontWeight, color, align = 'left', fontStyle = 'normal') {
    if (!text || text.trim() === '') return;

    let fontSize = initialSize;
    ctx.textAlign = align;
    ctx.textBaseline = 'bottom';

    do {
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
        const metrics = ctx.measureText(text);
        if (metrics.width <= maxWidth) break;
        fontSize -= 1;
    } while (fontSize > 8);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

// Универсальная функция получения угла по сиду + диапазону
function getStampAngle(seed, minDeg, maxDeg) {
    const str = String(seed || '');
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    const t = Math.abs(Math.sin(h) * 10000) % 1;
    return (minDeg + t * (maxDeg - minDeg)) * Math.PI / 180;
}

// ================================================================
// Отрисовка повёрнутой картинки с максимальным качеством
// ================================================================
function drawRotatedImage(ctx, img, cx, cy, w, h, angleRad, alpha = 1) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.translate(cx, cy);
    ctx.rotate(angleRad);
    if (alpha !== 1) ctx.globalAlpha = alpha;

    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
}

async function generateVU() {
    const canvas = document.getElementById('vuCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // ★ Максимальное сглаживание для всего канваса
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const vuNumber = document.getElementById('createVUNumber').value.trim();
    const rank = document.getElementById('createRank').value;
    const serviceType = document.getElementById('createServiceType')?.value || '';
    const lastName = document.getElementById('createLastName').value.trim();
    const firstName = document.getElementById('createFirstName').value.trim();
    const middleName = document.getElementById('createMiddleName').value.trim();
    const issueDate = document.getElementById('createIssueDate').value.trim();

    const expiryDate = calculateExpiry(issueDate);

    const expiryInput = document.getElementById('createExpiryDate');
    if (expiryInput) expiryInput.value = expiryDate;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Единый задний фон
    try {
        const bgImage = await loadImage(VU_CONFIG.background);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.warn('Ошибка загрузки фона:', error);
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Ошибка загрузки фона', 607, 446);
    }

    const fontFamily = 'Segoe Script';
    const color = '#000f55';

    // 2. Надпись "войсковая часть 23921" — верх (120; 285), размер 30 → низ = 315
    fitText(ctx, 'войсковая часть 23921', 120, 315, 400, 30, fontFamily, 'normal', color, 'left', 'italic');

    // 3. Надпись "66" — верх (439; 374), размер 22 → низ = 396
    fitText(ctx, '66', 439, 396, 100, 22, fontFamily, 'normal', color, 'left', 'italic');

    // 4. Фотография по званию — размер 235x313, координаты (53; 381)
    if (rank && VU_CONFIG.rankPhotos[rank]) {
        try {
            const photoImg = await loadImage(VU_CONFIG.rankPhotos[rank]);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(photoImg, VU_CONFIG.photoRect.x, VU_CONFIG.photoRect.y, VU_CONFIG.photoRect.w, VU_CONFIG.photoRect.h);
        } catch (error) {
            console.warn('Ошибка загрузки фото звания:', error);
        }
    }

    

    // 6. Надпись "Начальник 66-ой ВАИ" — верх (137; 720), размер 30 → низ = 750
    fitText(ctx, 'Начальник 66-ой ВАИ', 137, 750, 400, 30, fontFamily, 'normal', color, 'left', 'italic');

    // 7. Надпись "капитан" — верх (51; 795), размер 30 → низ = 825
    fitText(ctx, 'капитан', 51, 817, 300, 30, fontFamily, 'normal', color, 'left', 'italic');

    // 8. Надпись "М.А. Котиков" — верх (378; 787), размер 30 → низ = 817
    fitText(ctx, 'М. Котиков', 368, 817, 300, 30, fontFamily, 'normal', color, 'left', 'italic');

    // 9. Подпись начальника — размер 212x74, координаты (200; 765)
    try {
        const sigImg = await loadImage(VU_CONFIG.chiefSignature);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sigImg, VU_CONFIG.signatureRect.x, VU_CONFIG.signatureRect.y, VU_CONFIG.signatureRect.w, VU_CONFIG.signatureRect.h);
    } catch (error) {
        console.warn('Ошибка загрузки подписи начальника:', error);
    }

    // 5. Печать ВАИ — размер 135x135, координаты (221; 605), угол от -40 до 40
    try {
        const stampImg = await loadImage(VU_CONFIG.vaiStamp);
        const { x, y, w, h } = VU_CONFIG.stampRect;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const seed = (vuNumber || '') + '|' + (lastName || '');
        const angle = getStampAngle(seed, VU_CONFIG.stampAngleMin, VU_CONFIG.stampAngleMax);

        drawRotatedImage(ctx, stampImg, cx, cy, w, h, angle, 0.9);
    } catch (error) {
        console.warn('Ошибка загрузки печати ВАИ:', error);
    }

    // 10. Печать срочной/контрактной службы — размер 216x78, координаты (371; 616), угол от -7 до 10
    if (serviceType && VU_CONFIG.serviceStamps[serviceType]) {
        try {
            const stampImg = await loadImage(VU_CONFIG.serviceStamps[serviceType]);
            const { x, y, w, h } = VU_CONFIG.serviceStampRect;
            const cx = x + w / 2;
            const cy = y + h / 2;
            const seed = (vuNumber || '') + '|' + (lastName || '') + '|service';
            const angle = getStampAngle(seed, VU_CONFIG.serviceStampAngleMin, VU_CONFIG.serviceStampAngleMax);

            drawRotatedImage(ctx, stampImg, cx, cy, w, h, angle, 0.9);
        } catch (error) {
            console.warn('Ошибка загрузки печати службы:', error);
        }
    }

    // ===== ОСТАЛЬНЫЕ ЭЛЕМЕНТЫ =====
    if (rank) {
        // Номер ВУ
        if (vuNumber) fitText(ctx, vuNumber, 389, 106, 123, 25, fontFamily, 'normal', color, 'left', 'italic');

        // Звание (первая буква строчная)
        const rankLower = rank.charAt(0).toLowerCase() + rank.slice(1);
        fitText(ctx, rankLower, 218, 149, 341, 30, fontFamily, 'normal', color, 'left', 'italic');

        // ФИО
        if (lastName) fitText(ctx, lastName, 148, 191, 411, 30, fontFamily, 'normal', color, 'left', 'italic');
        if (firstName) fitText(ctx, firstName, 102, 233, 457, 30, fontFamily, 'normal', color, 'left', 'italic');
        if (middleName) fitText(ctx, middleName, 149, 275, 410, 30, fontFamily, 'normal', color, 'left', 'italic');

        // Дата выдачи
        if (issueDate) {
            const dateStr = formatDateForDisplay(issueDate);
            const dateParts = dateStr.split('.');
            if (dateParts.length === 3 && dateParts[0].length === 2 && dateParts[1].length === 2) {
                fitText(ctx, dateParts[0], 320, 486, 49, 30, fontFamily, 'normal', color, 'left', 'italic');
                fitText(ctx, dateParts[1], 443, 486, 116, 30, fontFamily, 'normal', color, 'center', 'italic');
                const year = dateParts[2].slice(-2);
                fitText(ctx, year, 529, 483, 33, 23, fontFamily, 'normal', color, 'left', 'italic');
            }
        }

        // Дата окончания
        if (expiryDate) {
            const dateStr = formatDateForDisplay(expiryDate);
            const dateParts = dateStr.split('.');
            if (dateParts.length === 3 && dateParts[0].length === 2 && dateParts[1].length === 2) {
                fitText(ctx, dateParts[0], 320, 594, 49, 30, fontFamily, 'normal', color, 'left', 'italic');
                fitText(ctx, dateParts[1], 443, 594, 116, 30, fontFamily, 'normal', color, 'center', 'italic');
                const year = dateParts[2].slice(-2);
                fitText(ctx, year, 529, 591, 33, 23, fontFamily, 'normal', color, 'left', 'italic');
            }
        }
    }
}

async function saveVU() {
    const canvas = document.getElementById('vuCanvas');
    if (!canvas || canvas.width === 0) { showToast('Холст пуст', 'error'); return; }

    const vuNumber = document.getElementById('createVUNumber').value.trim();
    const rank = document.getElementById('createRank').value;
    const serviceType = document.getElementById('createServiceType')?.value || '';
    const lastName = document.getElementById('createLastName').value.trim();
    const firstName = document.getElementById('createFirstName').value.trim();
    const middleName = document.getElementById('createMiddleName').value.trim();
    const issueDateRaw = document.getElementById('createIssueDate').value.trim();

    if (!vuNumber) { showToast('Укажите номер ВУ', 'warning'); return; }
    if (!lastName) { showToast('Укажите фамилию', 'warning'); return; }
    if (!firstName) { showToast('Укажите имя', 'warning'); return; }
    if (!issueDateRaw) { showToast('Укажите дату выдачи', 'warning'); return; }

    const issueDate = parseDate(issueDateRaw);
    if (!issueDate) { showToast('Неверный формат даты выдачи', 'error'); return; }

    const expiryDate = new Date(issueDate);
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const issuedBy = buildIssuedBy(window.currentProfile);
    const fio = [lastName, firstName, middleName].filter(Boolean).join(' ');

    const preview = {
        vuNumber, rank, serviceType, fio,
        lastName, firstName, middleName,
        issueDate, expiryDate, issuedBy, canvas
    };

    openConfirmVUModal(preview);
}

function buildIssuedBy(profile) {
    if (!profile) return '66-я территориальная ВАИ';

    const rank = profile.rank || '';
    const fullName = profile.full_name || '';
    const parts = fullName.trim().split(/\s+/);

    let shortName = '';
    if (parts.length >= 1) {
        shortName = parts[0];
        if (parts[1]) shortName += ' ' + parts[1][0] + '.';
        if (parts[2]) shortName += parts[2][0] + '.';
    }

    return `${rank} ${shortName}`.trim() || '66-я территориальная ВАИ';
}

function openConfirmVUModal(preview) {
    const modal = document.getElementById('confirmVUModal');
    if (!modal) return;

    document.getElementById('cvNumber').textContent = preview.vuNumber;
    document.getElementById('cvRank').textContent = preview.rank;
    document.getElementById('cvFIO').textContent = preview.fio;
    document.getElementById('cvIssueDate').textContent = formatDateForDisplay(preview.issueDate);
    document.getElementById('cvExpiryDate').textContent = formatDateForDisplay(preview.expiryDate);
    document.getElementById('cvIssuedBy').textContent = preview.issuedBy;

    const cvService = document.getElementById('cvServiceType');
    if (cvService) {
        cvService.textContent =
            preview.serviceType === 'srochnaya' ? 'Срочная служба' :
                preview.serviceType === 'kontraktnaya' ? 'Контрактная служба' : '—';
    }

    const img = document.getElementById('cvPhoto');
    if (img) img.src = preview.canvas.toDataURL('image/png');

    modal.dataset.previewData = 'set';
    window._vuPreviewData = preview;

    const errEl = document.getElementById('cvError');
    if (errEl) errEl.textContent = '';

    modal.style.display = 'flex';
}

function closeConfirmVUModal() {
    const modal = document.getElementById('confirmVUModal');
    if (modal) modal.style.display = 'none';
    window._vuPreviewData = null;
}

async function confirmSaveVU() {
    const preview = window._vuPreviewData;
    if (!preview) return;

    const errEl = document.getElementById('cvError');
    const btn = document.getElementById('cvSaveBtn');
    errEl.textContent = '';

    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    try {
        const { data: existing } = await supabaseClient
            .from('military_ids').select('id').eq('vu_number', preview.vuNumber).maybeSingle();

        if (existing) {
            errEl.textContent = `ВУ с номером ${preview.vuNumber} уже существует в базе`;
            showToast(`ВУ ${preview.vuNumber} уже существует в базе`, 'error');
            btn.disabled = false;
            btn.textContent = 'Записать в базу';
            return;
        }

        const photoUrl = await uploadVUPhoto(preview.canvas, preview.vuNumber, preview.lastName);

        const issueDateISO = toISODate(preview.issueDate);
        const expiryDateISO = toISODate(preview.expiryDate);

        const { data, error } = await supabaseClient
            .from('military_ids')
            .insert({
                vu_number: preview.vuNumber,
                rank: preview.rank,
                last_name: preview.lastName,
                first_name: preview.firstName,
                middle_name: preview.middleName || null,
                issue_date: issueDateISO,
                expiry_date: expiryDateISO,
                issued_by: preview.issuedBy,
                status: 'active',
                photo_url: photoUrl,
                photos: { vu: [photoUrl] },
                created_by: window.currentUser?.id || null
            })
            .select()
            .single();

        if (error) {
            console.error('Ошибка записи ВУ:', error);
            errEl.textContent = 'Не удалось сохранить: ' + error.message;
            showToast('Не удалось сохранить ВУ: ' + error.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Записать в базу';
            return;
        }

        await logCreate('vu_create', 'military_ids', data.id, data,
            `Создал ВУ ${preview.vuNumber} для ${preview.fio} (${preview.rank})`);

        closeConfirmVUModal();
        showToast(`ВУ ${preview.vuNumber} сохранён в базе`, 'success');

    } catch (e) {
        console.error(e);
        errEl.textContent = 'Ошибка: ' + e.message;
        showToast('Ошибка: ' + e.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Записать в базу';
    }
}

async function uploadVUPhoto(canvas, vuNumber, lastName) {
    const safeNumber = translitToLatin(vuNumber).replace(/[^a-zA-Z0-9]/g, '_');
    const safeLastName = translitToLatin(lastName).replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();

    let fileName = `${safeNumber}_${safeLastName}_${timestamp}.jpg`;

    if (/^[._]/.test(fileName)) fileName = 'vu' + fileName;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(fileName)) fileName = `vu_${timestamp}.jpg`;

    const blob = await compressCanvasToJpeg(canvas, 1600, 0.85);
    console.log(`[upload] Сжатое фото: ${(blob.size / 1024).toFixed(1)} КБ`);

    const { error } = await supabaseClient.storage
        .from('vu-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

    if (error) {
        console.error('Ошибка загрузки фото:', error);
        throw new Error('Не удалось загрузить фото: ' + error.message);
    }

    const { data: { publicUrl } } = supabaseClient.storage.from('vu-photos').getPublicUrl(fileName);
    return publicUrl;
}

function compressCanvasToJpeg(sourceCanvas, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const srcW = sourceCanvas.width;
        const srcH = sourceCanvas.height;
        let dstW = srcW, dstH = srcH;

        if (srcW > maxWidth) {
            dstW = maxWidth;
            dstH = Math.round(srcH * (maxWidth / srcW));
        }

        const off = document.createElement('canvas');
        off.width = dstW;
        off.height = dstH;
        const ctx = off.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, dstW, dstH);
        ctx.drawImage(sourceCanvas, 0, 0, srcW, srcH, 0, 0, dstW, dstH);

        off.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Не удалось сжать изображение')),
            'image/jpeg',
            quality
        );
    });
}

function translitToLatin(str) {
    const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z',
        'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
        'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z',
        'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
        'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };
    return String(str).split('').map(ch => map[ch] !== undefined ? map[ch] : ch).join('');
}

function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('vuCanvas')) generateVU();
});

function downloadVUImage() {
    const canvas = document.getElementById('vuCanvas');
    if (!canvas || canvas.width === 0) { showToast('Холст пуст', 'error'); return; }

    const vuNumber = document.getElementById('createVUNumber').value.trim();
    const lastName = document.getElementById('createLastName').value.trim();

    if (!lastName) { showToast('Укажите фамилию', 'warning'); return; }

    let fileName;
    if (vuNumber) {
        const safeNumber = vuNumber.replace(/[\\/:*?"<>|]/g, '_');
        fileName = `${lastName}_${safeNumber}_ВУ.png`;
    } else {
        fileName = `${lastName}_ВУ.png`;
    }

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast(`Файл "${fileName}" скачан`, 'success');
}

window.downloadVUImage = downloadVUImage;
window.generateVU = generateVU;
window.saveVU = saveVU;
window.openConfirmVUModal = openConfirmVUModal;
window.closeConfirmVUModal = closeConfirmVUModal;
window.confirmSaveVU = confirmSaveVU;