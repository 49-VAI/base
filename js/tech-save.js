// ================================================================
// СОХРАНЕНИЕ ТО В БАЗУ + РЕЕСТР ТС + РЕЖИМЫ EDIT/CLONE
// ================================================================

let techEditMode = null;
let techVehiclesCache = [];

document.addEventListener('DOMContentLoaded', async function () {
    if (!document.getElementById('techCanvas')) return;

    await loadVehicleSelect();

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    const cloneId = params.get('clone');

    if (editId) await loadTechForEdit(editId);
    else if (cloneId) await loadTechForClone(cloneId);
});

async function loadVehicleSelect() {
    const sel = document.getElementById('techVehicleSelect');
    if (!sel) return;

    const { data, error } = await supabaseClient
        .from('vehicles').select('*').order('plate_number', { ascending: true });

    if (error) { console.warn('Не удалось загрузить ТС:', error); return; }

    techVehiclesCache = data || [];

    sel.innerHTML = '<option value="">— Не выбрано —</option>';
    techVehiclesCache.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.plate_number} — ${v.make_model || ''}`.trim();
        sel.appendChild(opt);
    });
}

function onVehicleSelected(id) {
    if (!id) return;
    const v = techVehiclesCache.find(x => x.id === id);
    if (!v) return;

    const setVal = (fid, val) => {
        const el = document.getElementById(fid);
        if (el && val !== null && val !== undefined) el.value = val;
    };

    setVal('techPlateNumber', v.plate_number || '');
    setVal('techVehicleMakeModel', v.make_model || '');
    setVal('techVIN', v.vin || '');
    setVal('techCategory', v.category || '');
    setVal('techYear', v.year || '');
    setVal('techSTSSeries', v.sts_series || '');
    setVal('techSTSNumber', v.sts_number || '');
    setVal('techSTSIssuedBy', v.sts_issued_by || '');
    setVal('techSTSIssuedDate', v.sts_issued_date ? formatDateForDisplay(v.sts_issued_date) : '');
    setVal('techMassWithoutLoad', v.mass_without_load || '');
    setVal('techMaxMass', v.max_mass || '');
    setVal('techEnginePower', v.engine_power || '');

    generateTech();
    showToast('Данные ТС подставлены', 'success');
}

async function loadTechForEdit(id) {
    const { data, error } = await supabaseClient
        .from('tech_inspections').select('*').eq('id', id).single();

    if (error || !data) { showToast('Запись не найдена', 'error'); return; }

    fillTechForm(data, { skipResults: false });
    techEditMode = { id: data.id, previousId: data.previous_id, oldPhotoUrl: data.photo_url };

    const titleEl = document.querySelector('.eis-page-title');
    if (titleEl) titleEl.textContent = 'Редактирование ТО № ' + data.card_number;

    const actionsBar = document.querySelector('.eis-actions-bar');
    if (actionsBar) {
        actionsBar.innerHTML = `
            <button class="eis-btn eis-btn-secondary" onclick="cancelTechEdit()">Отмена</button>
            <button class="eis-btn eis-btn-success" onclick="saveTechToDB()">Сохранить изменения</button>
        `;
    }
}

async function loadTechForClone(id) {
    const { data, error } = await supabaseClient
        .from('tech_inspections').select('*').eq('id', id).single();

    if (error || !data) { showToast('Запись не найдена', 'error'); return; }

    fillTechForm(data, { skipDates: true, skipResults: true });
    techEditMode = { id: null, previousId: data.id };

    const titleEl = document.querySelector('.eis-page-title');
    if (titleEl) titleEl.textContent = 'Повторный техосмотр (по № ' + data.card_number + ')';

    const actionsBar = document.querySelector('.eis-actions-bar');
    if (actionsBar) {
        actionsBar.innerHTML = `
            <button class="eis-btn eis-btn-secondary" onclick="cancelTechEdit()">Отмена</button>
            <button class="eis-btn eis-btn-success" onclick="saveTechToDB()">Сохранить новый ТО</button>
        `;
    }
}

function fillTechForm(data, opts = {}) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== null && val !== undefined) el.value = val;
    };

    setVal('techCardNumber', data.card_number);
    if (!opts.skipDates) {
        setVal('techValidUntil', data.valid_until ? formatDateForDisplay(data.valid_until) : '');
        setVal('techExpertDate', data.expert_date ? formatDateForDisplay(data.expert_date) : '');
    }
    setVal('techPlateNumber', data.plate_number);
    setVal('techVehicleMakeModel', data.vehicle_make_model);
    setVal('techVIN', data.vin);
    setVal('techCategory', data.category);
    setVal('techYear', data.year);
    setVal('techSTSSeries', data.sts_series);
    setVal('techSTSNumber', data.sts_number);
    setVal('techSTSIssuedBy', data.sts_issued_by);
    setVal('techSTSIssuedDate', data.sts_issued_date ? formatDateForDisplay(data.sts_issued_date) : '');
    setVal('techMassWithoutLoad', data.mass_without_load);
    setVal('techMaxMass', data.max_mass);
    setVal('techEnginePower', data.engine_power);
    setVal('techMileage', data.mileage);
    setVal('techRecheck1', data.recheck_1);
    setVal('techRecheck2', data.recheck_2);
    setVal('techRecheck3', data.recheck_3);
    setVal('techExpertName', data.expert_name);

    if (data.check_type) {
        const r = document.querySelector(`input[name="techCheckType"][value="${data.check_type}"]`);
        if (r) r.checked = true;
    }
    if (!opts.skipResults && data.conclusion) {
        const r = document.querySelector(`input[name="techConclusion"][value="${data.conclusion}"]`);
        if (r) r.checked = true;
    } else if (opts.skipResults) {
        document.querySelectorAll('input[name="techConclusion"]').forEach(r => r.checked = false);
    }

    if (!opts.skipResults && data.items_states) {
        for (const [idx, state] of Object.entries(data.items_states)) techItemStates[idx] = state;
    } else if (opts.skipResults) {
        initTechItemStates();
    }
    document.querySelectorAll('.eis-tech-item').forEach(row => {
        const idx = row.dataset.index;
        row.querySelectorAll('.eis-tech-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.state === techItemStates[idx]);
        });
    });

    generateTech();
}

function cancelTechEdit() {
    window.location.href = 'tech-database.html';
}

function validateTechForm() {
    const problems = [];
    const cardNumber = document.getElementById('techCardNumber')?.value.trim();
    const validUntil = document.getElementById('techValidUntil')?.value.trim();
    const expertName = document.getElementById('techExpertName')?.value.trim();

    if (!cardNumber) problems.push('Регистрационный номер карты');
    if (!validUntil) problems.push('Срок действия');
    if (!expertName) problems.push('ФИО эксперта');
    if (validUntil && !/^\d{2}\.\d{2}\.\d{4}$/.test(validUntil)) problems.push('Срок действия — формат ДД.ММ.ГГГГ');

    return problems;
}

async function saveTechToDB() {
    const saveBtn = document.querySelector('.eis-actions-bar .eis-btn-success');
    const origText = saveBtn ? saveBtn.textContent : '';

    const problems = validateTechForm();
    if (problems.length > 0) { showToast('Заполните: ' + problems.join(', '), 'warning'); return; }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Сохранение...'; }

    let uploadedFileName = null;
    let oldPhotoUrl = techEditMode?.oldPhotoUrl || null;
    let beforeSnapshot = null;

    try {
        const cardNumber = document.getElementById('techCardNumber').value.trim();

        if (techEditMode && techEditMode.id) {
            const { data: b } = await supabaseClient
                .from('tech_inspections').select('*').eq('id', techEditMode.id).single();
            beforeSnapshot = b;
        }

        const wasActive = signatureData.techExpert?.active;
        if (signatureData.techExpert) signatureData.techExpert.active = false;
        await generateTech();

        const canvas = document.getElementById('techCanvas');
        if (!canvas || canvas.width === 0) throw new Error('Не удалось сгенерировать изображение');

        const upload = await uploadTechPhoto(canvas, cardNumber);
        uploadedFileName = upload.fileName;
        const photoUrl = upload.publicUrl;

        if (signatureData.techExpert) {
            signatureData.techExpert.active = wasActive;
            await generateTech();
        }

        const payload = collectTechData(photoUrl);

        let result;
        if (techEditMode && techEditMode.id) {
            result = await supabaseClient
                .from('tech_inspections')
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq('id', techEditMode.id).select().single();
        } else {
            payload.previous_id = techEditMode?.previousId || null;
            result = await supabaseClient
                .from('tech_inspections').insert(payload).select().single();
        }

        if (result.error) throw new Error(result.error.message);

        if (techEditMode?.id && oldPhotoUrl && oldPhotoUrl !== photoUrl) {
            const oldFname = extractStorageFileName(oldPhotoUrl, 'tech-photos');
            if (oldFname) {
                try { await supabaseClient.storage.from('tech-photos').remove([oldFname]); }
                catch (e) { console.warn('Не удалось удалить старый файл:', e); }
            }
        }

        if (techEditMode?.previousId) {
            await supabaseClient
                .from('tech_inspections').update({ is_current: false }).eq('id', techEditMode.previousId);
        }

        // ЛОГИРОВАНИЕ
        if (techEditMode && techEditMode.id && beforeSnapshot) {
            const { data: after } = await supabaseClient
                .from('tech_inspections').select('*').eq('id', techEditMode.id).single();
            await logUpdate('tech_update', 'tech_inspections', techEditMode.id, beforeSnapshot, after, {
                summary_prefix: `Изменил карту ТО № ${cardNumber} (${payload.plate_number || '—'})`
            });
        } else {
            const isClone = !!techEditMode?.previousId;
            await logCreate('tech_create', 'tech_inspections', result.data.id, result.data,
                isClone
                    ? `Повторный осмотр: новая карта ТО № ${cardNumber} (${payload.plate_number || '—'})`
                    : `Создал карту ТО № ${cardNumber} (${payload.plate_number || '—'})`
            );
        }

        showToast('Сохранено', 'success');
        setTimeout(() => window.location.href = 'tech-database.html', 800);

    } catch (e) {
        console.error('[tech-save]', e);
        if (uploadedFileName && !techEditMode?.id) {
            try { await supabaseClient.storage.from('tech-photos').remove([uploadedFileName]); } catch (_) { }
        }
        showToast('Ошибка: ' + e.message, 'error');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = origText || 'Сохранить в базу ЕИС'; }
    }
}

function collectTechData(photoUrl) {
    const getVal = (id) => document.getElementById(id)?.value.trim() || null;
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || null;

    const toISO = (str) => {
        if (!str) return null;
        const p = String(str).trim().split('.');
        if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
        return str;
    };

    const yearVal = getVal('techYear');

    return {
        card_number: getVal('techCardNumber'),
        valid_until: toISO(getVal('techValidUntil')),
        department: '66-я территориальная ВАИ Нижегородского гарнизона',
        check_type: getRadio('techCheckType'),
        plate_number: getVal('techPlateNumber'),
        vehicle_make_model: getVal('techVehicleMakeModel'),
        vin: getVal('techVIN'),
        category: getVal('techCategory'),
        year: yearVal ? parseInt(yearVal.replace(/\D/g, '')) || null : null,
        sts_series: getVal('techSTSSeries'),
        sts_number: getVal('techSTSNumber'),
        sts_issued_by: getVal('techSTSIssuedBy'),
        sts_issued_date: toISO(getVal('techSTSIssuedDate')),
        mass_without_load: getVal('techMassWithoutLoad'),
        max_mass: getVal('techMaxMass'),
        engine_power: getVal('techEnginePower'),
        mileage: getVal('techMileage'),
        items_states: { ...techItemStates },
        conclusion: getRadio('techConclusion'),
        recheck_1: getVal('techRecheck1'),
        recheck_2: getVal('techRecheck2'),
        recheck_3: getVal('techRecheck3'),
        expert_date: toISO(getVal('techExpertDate')),
        expert_name: getVal('techExpertName'),
        photo_url: photoUrl,
        created_by: window.currentUser?.id || null
    };
}

async function uploadTechPhoto(canvas, cardNumber) {
    const safeNumber = String(cardNumber).replace(/\D/g, '') || 'unknown';
    const fileName = `tech_${safeNumber}_${Date.now()}.jpg`;
    const blob = await compressCanvasToJpeg(canvas, 1600, 0.85);

    const { error } = await supabaseClient.storage
        .from('tech-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

    if (error) throw new Error('Не удалось загрузить фото: ' + error.message);

    const { data: { publicUrl } } = supabaseClient.storage.from('tech-photos').getPublicUrl(fileName);
    return { fileName, publicUrl };
}

function compressCanvasToJpeg(sourceCanvas, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const srcW = sourceCanvas.width, srcH = sourceCanvas.height;
        let dstW = srcW, dstH = srcH;
        if (srcW > maxWidth) { dstW = maxWidth; dstH = Math.round(srcH * (maxWidth / srcW)); }
        const off = document.createElement('canvas');
        off.width = dstW; off.height = dstH;
        const ctx = off.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, dstW, dstH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sourceCanvas, 0, 0, srcW, srcH, 0, 0, dstW, dstH);
        off.toBlob(b => b ? resolve(b) : reject(new Error('Не удалось сжать')), 'image/jpeg', quality);
    });
}

function extractStorageFileName(url, bucket) {
    if (!url) return null;
    const parts = url.split('/' + bucket + '/');
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
}

window.saveTechToDB = saveTechToDB;
window.cancelTechEdit = cancelTechEdit;
window.loadTechForEdit = loadTechForEdit;
window.loadTechForClone = loadTechForClone;
window.onVehicleSelected = onVehicleSelected;