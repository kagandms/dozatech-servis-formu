// DozaTech Service Form Application V2.5 (Restored Standard Filenames)

const APP_PASSWORD = 'Sam1089071261';
const loginScreen = document.getElementById('loginScreen');
const appContainer = document.getElementById('appContainer');
const loginBtn = document.getElementById('loginBtn');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const rememberMe = document.getElementById('rememberMe');

// Check if already logged in
if (localStorage.getItem('dozatech_auth_permanent') === 'true' || sessionStorage.getItem('dozatech_auth') === 'true') {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appContainer) appContainer.style.display = 'block';
}

if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
}
if (loginPassword) {
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function handleLogin() {
    const pwd = loginPassword.value;
    if (pwd === APP_PASSWORD) {
        sessionStorage.setItem('dozatech_auth', 'true');
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem('dozatech_auth_permanent', 'true');
        }
        loginScreen.classList.add('hidden');
        appContainer.style.display = 'block';
        loginError.textContent = '';
    } else {
        loginError.textContent = 'Yanlış şifre!';
        loginPassword.value = '';
        if (navigator.vibrate) navigator.vibrate(100);
    }
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });

// --- DISHWASHER ITEMS ---
const checklistItems = [
    { id: 'yikama-kollari', label: 'Yıkama Kolları' },
    { id: 'deterjan-pompasi', label: 'Deterjan/Parlatıcı Pompası' },
    { id: 'pompa-mebrani', label: 'Pompa Mebranı Değişimi' },
    { id: 'parlatici-girisi', label: 'Parlatıcı Girişi Değişimi' },
    { id: 'cekvalf', label: 'Çekvalf Değişimi' }
];

// --- DOSAGE PUMP ITEMS ---
const pumpChecklistItems = [
    { id: 'hortum', label: 'Hortum Değişimi' },
    { id: 'mebran', label: 'Mebran Değişimi' },
    { id: 'pompa', label: 'Pompa Değişimi' }
];

let machineCount = 0;
const machineStates = {};

let pumpCount = 0;
const pumpStates = {};

let customers = [];
let selectedCustomerId = null;

// DOM Elements
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');
const countDisplay = document.getElementById('machineCount');
const machinesContainer = document.getElementById('machinesContainer');

const generalNotes = document.getElementById('generalNotes');
const customerSelect = document.getElementById('customerSelect');
const saveBtn = document.getElementById('saveBtn');
const sendBtn = document.getElementById('sendBtn');
const customerModal = document.getElementById('customerModal');
const editCustomerModal = document.getElementById('editCustomerModal');
const manageCustomersBtn = document.getElementById('manageCustomersBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const addCustomerBtn = document.getElementById('addCustomerBtn');
const saveEditCustomerBtn = document.getElementById('saveEditCustomerBtn');
const customerNameInput = document.getElementById('customerName');
const customerPhoneInput = document.getElementById('customerPhone');
const editCustomerIdInput = document.getElementById('editCustomerId');
const editCustomerNameInput = document.getElementById('editCustomerName');
const editCustomerPhoneInput = document.getElementById('editCustomerPhone');
const customerListContainer = document.getElementById('customerList');

// Dynamic elements
let decreasePumpBtn, increasePumpBtn, pumpCountDisplay, pumpsContainer;

function init() {
    // Inject Pump HTML if not exists
    if (!document.getElementById('pumpsSection')) {
        const pumpHTML = `
        <div class="counter-section" id="pumpsSection" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
            <div class="counter-header">
                <div class="counter-title">
                    <div class="icon-box">💦</div>
                    <h2>Dozaj Pompası</h2>
                </div>
                <div class="counter-controls">
                    <button class="control-btn" id="decreasePumpBtn" disabled>−</button>
                    <span class="count-display" id="pumpCount">0</span>
                    <button class="control-btn" id="increasePumpBtn">+</button>
                </div>
            </div>
            <div class="machines-container" id="pumpsContainer">
                <div class="empty-state">
                    <div class="empty-state-icon">💦</div>
                    <p class="empty-state-text">Pompa eklemek için + tıklayın</p>
                </div>
            </div>
        </div>
        `;
        machinesContainer.insertAdjacentHTML('afterend', pumpHTML);
    }

    decreasePumpBtn = document.getElementById('decreasePumpBtn');
    increasePumpBtn = document.getElementById('increasePumpBtn');
    pumpCountDisplay = document.getElementById('pumpCount');
    pumpsContainer = document.getElementById('pumpsContainer');

    loadState();
    updateUI();
    updatePumpUI();
    renderCustomerSelect();
    setupEventListeners();
    registerServiceWorker();
}

function setupEventListeners() {
    decreaseBtn.addEventListener('click', decreaseMachineCount);
    increaseBtn.addEventListener('click', increaseMachineCount);

    decreasePumpBtn.addEventListener('click', decreasePumpCount);
    increasePumpBtn.addEventListener('click', increasePumpCount);

    generalNotes.addEventListener('input', saveState);
    customerSelect.addEventListener('change', e => { selectedCustomerId = e.target.value || null; saveState(); });
    saveBtn.addEventListener('click', handleSavePDF);
    sendBtn.addEventListener('click', handleSendWhatsApp);
    manageCustomersBtn.addEventListener('click', () => { customerModal.classList.add('show'); renderCustomerList(); });
    closeModalBtn.addEventListener('click', () => { customerModal.classList.remove('show'); });
    addCustomerBtn.addEventListener('click', addCustomer);
    closeEditModalBtn.addEventListener('click', () => { editCustomerModal.classList.remove('show'); });
    saveEditCustomerBtn.addEventListener('click', saveEditedCustomer);
    customerModal.addEventListener('click', e => { if (e.target === customerModal) customerModal.classList.remove('show'); });
    editCustomerModal.addEventListener('click', e => { if (e.target === editCustomerModal) editCustomerModal.classList.remove('show'); });
}

function addCustomer() {
    const name = customerNameInput.value.trim();
    let phone = customerPhoneInput.value.trim();
    if (!name || !phone) { alert('Lütfen tüm alanları doldurun.'); return; }
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('90')) phone = '90' + phone;
    customers.push({ id: Date.now().toString(), name, phone });
    saveState();
    renderCustomerList();
    renderCustomerSelect();
    customerNameInput.value = '';
    customerPhoneInput.value = '';
}

function deleteCustomer(id) {
    if (confirm('Silmek istediğinize emin misiniz?')) {
        customers = customers.filter(c => c.id !== id);
        if (selectedCustomerId === id) { selectedCustomerId = null; customerSelect.value = ''; }
        saveState();
        renderCustomerList();
        renderCustomerSelect();
    }
}

function openEditCustomerModal(id) {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    editCustomerIdInput.value = c.id;
    editCustomerNameInput.value = c.name;
    editCustomerPhoneInput.value = c.phone;
    editCustomerModal.classList.add('show');
}

function saveEditedCustomer() {
    const id = editCustomerIdInput.value;
    const name = editCustomerNameInput.value.trim();
    let phone = editCustomerPhoneInput.value.trim();
    if (!name || !phone) { alert('Lütfen tüm alanları doldurun.'); return; }
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('90')) phone = '90' + phone;
    const idx = customers.findIndex(c => c.id === id);
    if (idx > -1) {
        customers[idx] = { id, name, phone };
        saveState();
        renderCustomerList();
        renderCustomerSelect();
        editCustomerModal.classList.remove('show');
    }
}

function renderCustomerList() {
    if (customers.length === 0) {
        customerListContainer.innerHTML = '<div class="customer-list-empty"><p>Henüz müşteri yok</p></div>';
        return;
    }
    customerListContainer.innerHTML = customers.map(c => `
        <div class="customer-item">
            <div class="customer-info">
                <div class="customer-name">${c.name}</div>
                <div class="customer-phone">${c.phone}</div>
            </div>
            <div class="customer-actions">
                <button class="customer-action-btn edit" onclick="openEditCustomerModal('${c.id}')">✏️</button>
                <button class="customer-action-btn delete" onclick="deleteCustomer('${c.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function renderCustomerSelect() {
    let html = '<option value="">-- Seçin --</option>';
    customers.forEach(c => {
        html += `<option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${c.name}</option>`;
    });
    customerSelect.innerHTML = html;
}

// === SAFE MODE: CHARACTER MAPPING ===
function convertTurkish(t) {
    if (!t) return '';
    return t.replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
}

function getImageDataUrl(selector) {
    const img = document.querySelector(selector);
    if (!img) return null;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
    } catch (e) {
        return null; // Ignore errors
    }
}

function generatePDFBlob() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Using Standard Helvetica
    doc.setFont('helvetica');

    const customer = customers.find(c => c.id === selectedCustomerId);
    const date = new Date().toLocaleDateString('tr-TR');
    const time = new Date().toLocaleTimeString('tr-TR');
    const pw = doc.internal.pageSize.width;
    const ph = doc.internal.pageSize.height;

    const colDark = [10, 10, 20];
    const colPrimary = [76, 201, 240];
    const colAccent = [67, 97, 238];

    let y = 0;

    // === HEADER ===
    doc.setFillColor(...colDark);
    doc.rect(0, 0, pw, 45, 'F');

    // Logo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 10, 50, 25, 4, 4, 'F');
    const logoData = getImageDataUrl('.logo-image');
    if (logoData) {
        try {
            const imgProps = doc.getImageProperties(logoData);
            const ratio = imgProps.height / imgProps.width;
            const logoW = 40;
            const logoH = logoW * ratio;
            const logoY = 10 + (25 - logoH) / 2;
            doc.addImage(logoData, 'PNG', 20, logoY, logoW, logoH);
        } catch (e) { }
    }

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVIS FORMU', pw - 15, 22, { align: 'right' });

    doc.setTextColor(...colPrimary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih: ${date}   Saat: ${time}`, pw - 15, 32, { align: 'right' });

    doc.setDrawColor(...colPrimary);
    doc.setLineWidth(0.5);
    doc.line(15, 45, pw - 15, 45);

    y = 60;

    // === CUSTOMER INFO ===
    if (customer) {
        doc.setDrawColor(...colAccent);
        doc.setLineWidth(0.3);
        doc.setFillColor(250, 250, 255);
        doc.roundedRect(15, y, pw - 30, 25, 2, 2, 'FD');
        doc.setFillColor(...colAccent);
        doc.circle(24, y + 12, 5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('M', 24, y + 13.5, { align: 'center' });
        doc.setTextColor(...colDark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(convertTurkish(customer.name), 34, y + 10);
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(customer.phone, 34, y + 18);
        y += 35;
    } else {
        y += 10;
    }

    // === SECTION: DISHWASHERS ===
    if (machineCount > 0) {
        doc.setTextColor(...colDark);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`BULASIK MAKINELERI (${machineCount})`, 15, y);
        doc.setDrawColor(...colPrimary);
        doc.line(15, y + 3, 100, y + 3);
        y += 15;

        for (let i = 1; i <= machineCount; i++) {
            if (y > 230) { doc.addPage(); y = 20; }

            doc.setFillColor(...colPrimary);
            doc.roundedRect(15, y, pw - 30, 8, 2, 2, 'F');
            doc.setTextColor(...colDark);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Bulasik Makinesi ${i}`, 20, y + 5.5);

            y += 12;

            const state = machineStates[i] || {};
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            let xPos = 20;

            checklistItems.forEach((item, index) => {
                const status = state[item.id];

                // Icon
                doc.setFillColor(255, 255, 255);
                if (status === 'ok') doc.setFillColor(46, 204, 113);
                if (status === 'fail') doc.setFillColor(239, 71, 111);

                if (status) {
                    doc.circle(xPos + 2, y - 1, 3, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(7);
                    const mark = status === 'ok' ? 'V' : 'X';
                    doc.text(mark, xPos + 2, y, { align: 'center' });
                } else {
                    doc.setDrawColor(200, 200, 200);
                    doc.circle(xPos + 2, y - 1, 3, 'S');
                }

                doc.setTextColor(80, 80, 80);
                doc.setFontSize(9);
                doc.text(convertTurkish(item.label), xPos + 7, y);

                if (index % 2 === 0) {
                    xPos = pw / 2 + 5;
                } else {
                    xPos = 20;
                    y += 6;
                }
            });
            if (checklistItems.length % 2 !== 0) y += 6;
            y += 8;
        }
        y += 10;
    }

    // === SECTION: DOSAGE PUMPS ===
    if (pumpCount > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setTextColor(...colDark);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`DOZAJ POMPALARI (${pumpCount})`, 15, y);
        doc.setDrawColor(...colPrimary);
        doc.line(15, y + 3, 100, y + 3);
        y += 15;

        for (let i = 1; i <= pumpCount; i++) {
            if (y > 230) { doc.addPage(); y = 20; }

            doc.setFillColor(...colAccent);
            doc.roundedRect(15, y, pw - 30, 8, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Dozaj Pompasi ${i}`, 20, y + 5.5);

            y += 12;

            const state = pumpStates[i] || {};
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            let xPos = 20;

            pumpChecklistItems.forEach((item, index) => {
                const status = state[item.id];

                doc.setFillColor(255, 255, 255);
                if (status === 'ok') doc.setFillColor(46, 204, 113);
                if (status === 'fail') doc.setFillColor(239, 71, 111);

                if (status) {
                    doc.circle(xPos + 2, y - 1, 3, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(7);
                    const mark = status === 'ok' ? 'V' : 'X';
                    doc.text(mark, xPos + 2, y, { align: 'center' });
                } else {
                    doc.setDrawColor(200, 200, 200);
                    doc.circle(xPos + 2, y - 1, 3, 'S');
                }

                doc.setTextColor(80, 80, 80);
                doc.setFontSize(9);
                doc.text(convertTurkish(item.label), xPos + 7, y);

                if (index % 2 === 0) {
                    xPos = pw / 2 + 5;
                } else {
                    xPos = 20;
                    y += 6;
                }
            });
            if (pumpChecklistItems.length % 2 !== 0) y += 6;
            y += 8;
        }
    }

    // === NOTES ===
    if (generalNotes.value.trim()) {
        if (y > 220) { doc.addPage(); y = 20; }
        const txt = convertTurkish(generalNotes.value);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...colDark);
        doc.text('NOTLAR:', 15, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(txt, pw - 30);
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(230, 230, 230);
        const boxH = Math.max(15, lines.length * 5 + 10);
        doc.rect(15, y, pw - 30, boxH, 'FD');
        doc.setTextColor(50, 50, 50);
        doc.text(lines, 20, y + 6);
        y += boxH + 15;
    } else {
        y += 10;
    }

    // === SIGNATURES ===
    if (y > ph - 70) { doc.addPage(); y = 20; }
    const bottomY = Math.max(y, ph - 80);

    // Left: DozaTech + Stamp
    doc.setTextColor(...colDark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DozaTech Teknik Servis', 40, bottomY + 5, { align: 'center' });

    // Stamp
    const stampData = getImageDataUrl('#kaseImage');
    if (stampData) {
        try {
            const sProps = doc.getImageProperties(stampData);
            const sRatio = sProps.height / sProps.width;
            const sW = 40;
            const sH = sW * sRatio;
            doc.addImage(stampData, 'JPEG', 20, bottomY + 8, sW, sH);
        } catch (e) { }
    } else {
        doc.text('Imza / Kase', 40, bottomY + 30, { align: 'center' });
    }

    // Right: Customer
    doc.text('Musteri', pw - 45, bottomY + 5, { align: 'center' });
    if (customer) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(convertTurkish(customer.name), pw - 45, bottomY + 30, { align: 'center' });
    }
    doc.setDrawColor(150, 150, 150);
    doc.line(pw - 70, bottomY + 35, pw - 20, bottomY + 35);

    // === FOOTER ===
    doc.setFillColor(...colDark);
    doc.rect(0, ph - 15, pw, 15, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    // Filename: servisformu_...
    const safeName = customer ? convertTurkish(customer.name).replace(/\s+/g, '_') : 'Musteri';
    const fn = `servisformu_${safeName}_${date.replace(/\./g, '-')}.pdf`;

    doc.text('DozaTech - Endustriyel Mutfak Cozumleri', pw / 2, ph - 9, { align: 'center' });
    doc.text('Bu form dijital olarak olusturulmustur.', pw / 2, ph - 5, { align: 'center' });

    return { blob: doc.output('blob'), fileName: fn };
}

function handleSavePDF() {
    showToast('PDF oluşturuluyor...');
    try {
        const { blob, fileName } = generatePDFBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
        showToast('PDF indirildi.');
    } catch (error) {
        console.error(error);
        showToast('Hata: ' + error.message);
    }
}

function handleSendWhatsApp() {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) { alert('Lütfen müşteri seçin.'); return; }

    try {
        const { blob, fileName } = generatePDFBlob();
        const file = new File([blob], fileName, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            const noteText = customer.name;
            navigator.share({
                files: [file],
                title: noteText,
                text: noteText
            }).catch(e => { if (e.name !== 'AbortError') openWA(customer, blob, fileName); });
        } else {
            openWA(customer, blob, fileName);
        }
    } catch (error) {
        showToast('Hata: ' + error.message);
    }
}

function openWA(customer, blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);

    const msg = customer.name;
    setTimeout(() => { window.open('https://wa.me/' + customer.phone + '?text=' + encodeURIComponent(msg), '_blank'); }, 500);
}

// Global Exports
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(e => console.log(e));
    }
}

// Global Exports
window.increaseMachineCount = increaseMachineCount;
window.decreaseMachineCount = decreaseMachineCount;
window.increasePumpCount = increasePumpCount;
window.decreasePumpCount = decreasePumpCount;
window.setCheck = setCheck;
window.addCustomer = addCustomer;
window.deleteCustomer = deleteCustomer;
window.openEditCustomerModal = openEditCustomerModal;
window.saveEditedCustomer = saveEditedCustomer;

init();
