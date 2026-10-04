// ========== УПРАВЛЕНИЕ ПОДПИСЯМИ ==========

const signatureData = {
    examiner: {
        image: null,
        src: null,
        scale: 1,
        rotation: 0,
        x: 0.5,
        y: 0.5,
        active: false,
        imageData: null
    },
    candidate: {
        image: null,
        src: null,
        scale: 1,
        rotation: 0,
        x: 0.5,
        y: 0.5,
        active: false,
        imageData: null
    },
    techExpert: {
        image: null,
        src: null,
        scale: 1,
        rotation: 0,
        x: 0.5,
        y: 0.5,
        active: false,
        imageData: null
    },
    // === Подписи для протокола ===
    official: {
        image: null,
        src: null,
        scale: 1,
        rotation: 0,
        x: 0.5,
        y: 0.5,
        active: false,
        imageData: null
    },
    violator: {
        image: null,
        src: null,
        scale: 1,
        rotation: 0,
        x: 0.5,
        y: 0.5,
        active: false,
        imageData: null
    },
    witness: {
        image: null,
        src: null,
        scale: 1,
        rotation: 0,
        x: 0.5,
        y: 0.5,
        active: false,
        imageData: null
    },
    victim: {
        image: null,
        src: null,
        scale: 1,
        rotation: 0,
        x: 0.5,
        y: 0.5,
        active: false,
        imageData: null
    },
    // === Подписи для ДТП ===
    driverA: {
        image: null, src: null, scale: 1, rotation: 0,
        x: 0.5, y: 0.5, active: false, imageData: null
    },
    driverB: {
        image: null, src: null, scale: 1, rotation: 0,
        x: 0.5, y: 0.5, active: false, imageData: null
    },
    p2Officer: {
        image: null, src: null, scale: 1, rotation: 0,
        x: 0.5, y: 0.5, active: false, imageData: null
    },
    // === ★ НОВОЕ: подпись составителя схемы ДТП (3-й лист) ===
    p3Officer: {
        image: null, src: null, scale: 1, rotation: 0,
        x: 0.5, y: 0.5, active: false, imageData: null
    }
};

const ALL_SIGNATURE_TYPES = [
    'examiner', 'candidate', 'techExpert',
    'official', 'violator', 'witness', 'victim',
    'driverA', 'driverB', 'p2Officer',
    'p3Officer'
];

// Типы, которые нужно перерисовывать на своих канвасах
const SIGNATURE_CANVAS_MAP = {
    examiner: 'examCanvas2',
    candidate: 'examCanvas2',
    techExpert: 'techCanvas',
    official: 'protocolCanvas2',
    violator: 'protocolCanvas2',
    witness: 'protocolCanvas2',
    victim: 'protocolCanvas2',
    driverA: 'dtpCanvas1',
    driverB: 'dtpCanvas1',
    p2Officer: 'dtpCanvas2',
    p3Officer: 'dtpCanvas3'
};

let activeSignatureType = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isScaling = false;
let isRotating = false;
let selectedSignature = null;

// ========== ЗАГРУЗКА ПОДПИСИ ==========
function loadSignature(type, input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0);

            const imageData = tempCtx.getImageData(0, 0, img.width, img.height);

            signatureData[type].image = img;
            signatureData[type].src = e.target.result;
            signatureData[type].imageData = imageData;
            signatureData[type].scale = 1;
            signatureData[type].rotation = 0;
            signatureData[type].x = 0.5;
            signatureData[type].y = 0.5;

            showSignaturePreview(type);

            deactivateSignatures();
            activateSignature(type);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ========== АКТИВАЦИЯ РЕДАКТИРОВАНИЯ ==========
function activateSignature(type) {
    for (const t of ALL_SIGNATURE_TYPES) {
        if (t !== type) {
            signatureData[t].active = false;
        }
    }

    const data = signatureData[type];
    if (data && data.image) {
        data.active = true;
        activeSignatureType = type;

        // Хук: уведомить внешние модули (dtp.js выключает режим рисования)
        if (typeof window.onSignatureActivated === 'function') {
            window.onSignatureActivated(type);
        }

        const controls = document.getElementById('signatureControls');
        if (controls) controls.style.display = 'flex';

        updateSignatureInfo(type);
        regenerateAll();
    }
}

// ========== ДЕАКТИВАЦИЯ РЕДАКТИРОВАНИЯ ==========
function deactivateSignatures() {
    for (const type of ALL_SIGNATURE_TYPES) {
        const data = signatureData[type];
        if (data) {
            data.active = false;
        }
    }
    activeSignatureType = null;

    const controls = document.getElementById('signatureControls');
    if (controls) controls.style.display = 'none';

    regenerateAll();
}

// ========== ПЕРЕРИСОВКА ВСЕХ КАНВАСОВ ==========
function regenerateAll() {
    if (typeof generateExam === 'function') generateExam();
    if (typeof generateTech === 'function') generateTech();
    if (typeof generateProtocol === 'function') generateProtocol();
    if (typeof generateDTP === 'function') generateDTP();
}

// ========== ПРЕВЬЮ ==========
function showSignaturePreview(type) {
    const preview = document.getElementById(`signature${capitalize(type)}Preview`);
    if (!preview) return;

    const data = signatureData[type];
    if (!data.image) {
        preview.innerHTML = '<div style="color: #555; font-size: 12px;">Подпись не загружена</div>';
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = data.image;
    const aspect = img.width / img.height;
    let w = canvas.width * 0.8;
    let h = w / aspect;
    if (h > canvas.height * 0.8) {
        h = canvas.height * 0.8;
        w = h * aspect;
    }
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);

    preview.innerHTML = '';
    preview.appendChild(canvas);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========== ОБНОВЛЕНИЕ ИНФОРМАЦИИ ==========
function updateSignatureInfo(type) {
    const data = signatureData[type];
    if (!data) return;

    const info = document.getElementById('signatureInfo');
    if (info) {
        const labels = {
            examiner: 'Экзаменатор',
            candidate: 'Кандидат',
            techExpert: 'Технический эксперт',
            official: 'Должностное лицо',
            violator: 'Нарушитель',
            witness: 'Свидетель',
            victim: 'Потерпевший',
            driverA: 'Водитель ТС «A»',
            driverB: 'Водитель ТС «B»',
            p2Officer: 'Сотрудник (2-й лист)',
            p3Officer: 'Составитель схемы'
        };
        const label = labels[type] || type;
        info.textContent = `${label}: Масштаб ${Math.round(data.scale * 100)}% | Поворот ${Math.round(data.rotation)}°`;
    }
}

// ========== УПРАВЛЕНИЕ ТРАНСФОРМАЦИЯМИ ==========
function adjustSignature(action, value) {
    if (!activeSignatureType) return;
    const data = signatureData[activeSignatureType];
    if (!data || !data.image) return;

    switch (action) {
        case 'scale':
            data.scale = Math.max(0.1, Math.min(3, data.scale + value));
            break;
        case 'rotate':
            data.rotation = (data.rotation + value) % 360;
            break;
        case 'reset':
            data.scale = 1;
            data.rotation = 0;
            data.x = 0.5;
            data.y = 0.5;
            break;
    }

    updateSignatureInfo(activeSignatureType);
    regenerateAll();
}

// ========== ОБРАБОТЧИКИ МЫШИ ==========
function handleCanvasMouseDown(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    for (const type of ALL_SIGNATURE_TYPES) {
        if (SIGNATURE_CANVAS_MAP[type] !== canvas.id) continue;

        const data = signatureData[type];
        if (!data.image || !data.active) continue;

        const sigX = data.x * canvas.width;
        const sigY = data.y * canvas.height;
        const sigSize = Math.min(canvas.width, canvas.height) * 0.08 * data.scale;
        const halfW = (data.image.width / data.image.height) * sigSize / 2;
        const halfH = sigSize / 2;

        if (mouseX >= sigX - halfW && mouseX <= sigX + halfW &&
            mouseY >= sigY - halfH && mouseY <= sigY + halfH) {

            const cornerX = sigX + halfW;
            const cornerY = sigY - halfH;
            const cornerDist = Math.sqrt((mouseX - cornerX) ** 2 + (mouseY - cornerY) ** 2);

            if (cornerDist < 20) {
                isRotating = true;
                selectedSignature = type;
                return;
            }

            const scaleCornerX = sigX + halfW;
            const scaleCornerY = sigY + halfH;
            const scaleDist = Math.sqrt((mouseX - scaleCornerX) ** 2 + (mouseY - scaleCornerY) ** 2);

            if (scaleDist < 20) {
                isScaling = true;
                selectedSignature = type;
                return;
            }

            isDragging = true;
            selectedSignature = type;
            dragOffsetX = mouseX - sigX;
            dragOffsetY = mouseY - sigY;
            return;
        }
    }
}

function handleCanvasMouseMove(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (isDragging && selectedSignature) {
        const data = signatureData[selectedSignature];
        if (data && data.image) {
            data.x = Math.max(0.05, Math.min(0.95, (mouseX - dragOffsetX) / canvas.width));
            data.y = Math.max(0.05, Math.min(0.95, (mouseY - dragOffsetY) / canvas.height));
            regenerateAll();
        }
        return;
    }

    if (isScaling && selectedSignature) {
        const data = signatureData[selectedSignature];
        if (data && data.image) {
            const sigX = data.x * canvas.width;
            const sigY = data.y * canvas.height;
            const dist = Math.sqrt((mouseX - sigX) ** 2 + (mouseY - sigY) ** 2);
            const baseSize = Math.min(canvas.width, canvas.height) * 0.08;
            const newScale = Math.max(0.1, Math.min(3, dist / baseSize));
            data.scale = newScale;
            updateSignatureInfo(selectedSignature);
            regenerateAll();
        }
        return;
    }

    if (isRotating && selectedSignature) {
        const data = signatureData[selectedSignature];
        if (data && data.image) {
            const sigX = data.x * canvas.width;
            const sigY = data.y * canvas.height;
            const angle = Math.atan2(mouseY - sigY, mouseX - sigX) * 180 / Math.PI;
            data.rotation = (angle + 90) % 360;
            updateSignatureInfo(selectedSignature);
            regenerateAll();
        }
        return;
    }

    let cursor = 'default';
    for (const type of ALL_SIGNATURE_TYPES) {
        if (SIGNATURE_CANVAS_MAP[type] !== canvas.id) continue;

        const data = signatureData[type];
        if (!data.image || !data.active) continue;

        const sigX = data.x * canvas.width;
        const sigY = data.y * canvas.height;
        const sigSize = Math.min(canvas.width, canvas.height) * 0.08 * data.scale;
        const halfW = (data.image.width / data.image.height) * sigSize / 2;
        const halfH = sigSize / 2;

        if (mouseX >= sigX - halfW && mouseX <= sigX + halfW &&
            mouseY >= sigY - halfH && mouseY <= sigY + halfH) {

            const cornerX = sigX + halfW;
            const cornerY = sigY - halfH;
            if (Math.sqrt((mouseX - cornerX) ** 2 + (mouseY - cornerY) ** 2) < 20) {
                cursor = 'pointer';
                break;
            }

            const scaleCornerX = sigX + halfW;
            const scaleCornerY = sigY + halfH;
            if (Math.sqrt((mouseX - scaleCornerX) ** 2 + (mouseY - scaleCornerY) ** 2) < 20) {
                cursor = 'nwse-resize';
                break;
            }

            cursor = 'grab';
            break;
        }
    }
    canvas.style.cursor = cursor;
}

function handleCanvasMouseUp() {
    isDragging = false;
    isScaling = false;
    isRotating = false;
    selectedSignature = null;

    const canvases = ['examCanvas2', 'techCanvas', 'protocolCanvas2', 'dtpCanvas1', 'dtpCanvas2', 'dtpCanvas3'];
    canvases.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) canvas.style.cursor = 'default';
    });
}

// ========== ОТРИСОВКА ПОДПИСИ НА CANVAS ==========
function drawSignatureOnCanvas(ctx, type, canvas, showEditMode) {
    const data = signatureData[type];
    if (!data || !data.image) return false;

    const img = data.image;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const baseSize = Math.min(canvasWidth, canvasHeight) * 0.08;
    const size = baseSize * data.scale;

    const aspect = img.width / img.height;
    const drawWidth = size * aspect;
    const drawHeight = size;

    const x = data.x * canvasWidth;
    const y = data.y * canvasHeight;

    if (data.imageData) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((data.rotation * Math.PI) / 180);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(data.imageData, 0, 0);

        const scaleX = drawWidth / img.width;
        const scaleY = drawHeight / img.height;
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(tempCanvas, -img.width / 2, -img.height / 2);
        ctx.restore();
    } else {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((data.rotation * Math.PI) / 180);
        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
    }

    if (data.active && showEditMode !== false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((data.rotation * Math.PI) / 180);

        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.setLineDash([]);

        const cornerSize = 12;
        const cornerX = drawWidth / 2;
        const cornerY = -drawHeight / 2;
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(cornerX, cornerY, cornerSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↻', cornerX, cornerY);

        const scaleCornerX = drawWidth / 2;
        const scaleCornerY = drawHeight / 2;
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(scaleCornerX, scaleCornerY, cornerSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↕', scaleCornerX, scaleCornerY);

        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#4caf50';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const labels = {
            examiner: 'Экзаменатор',
            candidate: 'Кандидат',
            techExpert: 'Технический эксперт',
            official: 'Должностное лицо',
            violator: 'Нарушитель',
            witness: 'Свидетель',
            victim: 'Потерпевший',
            driverA: 'Водитель ТС «A»',
            driverB: 'Водитель ТС «B»',
            p2Officer: 'Сотрудник (2-й лист)',
            p3Officer: 'Составитель схемы'
        };
        const label = labels[type] || type;
        ctx.fillText(label, x, y - drawHeight / 2 - 5);
        ctx.restore();
    }

    return true;
}

// ========== СБРОС ПОДПИСИ ==========
function resetSignature(type) {
    signatureData[type].image = null;
    signatureData[type].src = null;
    signatureData[type].imageData = null;
    signatureData[type].scale = 1;
    signatureData[type].rotation = 0;
    signatureData[type].x = 0.5;
    signatureData[type].y = 0.5;
    signatureData[type].active = false;

    const preview = document.getElementById(`signature${capitalize(type)}Preview`);
    if (preview) preview.innerHTML = '<div style="color: #555; font-size: 12px;">Подпись не загружена</div>';

    const input = document.getElementById(`signature${capitalize(type)}Input`);
    if (input) input.value = '';

    if (activeSignatureType === type) {
        activeSignatureType = null;
        const controls = document.getElementById('signatureControls');
        if (controls) controls.style.display = 'none';
    }

    regenerateAll();
}

// ================================================================
// ★ НОВОЕ: временное скрытие рамок подписей при сохранении
// ================================================================
async function withSignaturesHidden(types, fn) {
    const wasActive = {};
    types.forEach(t => {
        if (signatureData[t]) {
            wasActive[t] = signatureData[t].active;
            signatureData[t].active = false;
        }
    });

    try {
        await fn();
    } finally {
        types.forEach(t => {
            if (signatureData[t]) signatureData[t].active = wasActive[t];
        });
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function () {
    const canvases = ['examCanvas2', 'techCanvas', 'protocolCanvas2', 'dtpCanvas1', 'dtpCanvas2', 'dtpCanvas3'];
    canvases.forEach(id => {
        const canvas = document.getElementById(id);
        if (!canvas) return;

        canvas.addEventListener('mousedown', function (e) {
            handleCanvasMouseDown(e, this);
        });

        canvas.addEventListener('mousemove', function (e) {
            handleCanvasMouseMove(e, this);
        });

        canvas.addEventListener('mouseup', handleCanvasMouseUp);
        canvas.addEventListener('mouseleave', handleCanvasMouseUp);
    });
});

// ========== ЭКСПОРТ ==========
window.loadSignature = loadSignature;
window.resetSignature = resetSignature;
window.adjustSignature = adjustSignature;
window.drawSignatureOnCanvas = drawSignatureOnCanvas;
window.activateSignature = activateSignature;
window.deactivateSignatures = deactivateSignatures;
window.withSignaturesHidden = withSignaturesHidden;