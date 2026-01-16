// DozaTech Service Form Application

// === PASSWORD PROTECTION ===
const APP_PASSWORD = 'dozatech2026'; // Şifreyi buradan değiştirebilirsiniz
const loginScreen = document.getElementById('loginScreen');
const appContainer = document.getElementById('appContainer');
const loginBtn = document.getElementById('loginBtn');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const rememberMe = document.getElementById('rememberMe');

// Check if already logged in (Local Storage OR Session Storage)
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
// === END PASSWORD PROTECTION ===

// PWA Install handling
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'inline-flex';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
}

window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
    deferredPrompt = null;
});

const checklistItems = [
    { id: 'yikama-kollari', label: 'Yıkama Kolları' },
    { id: 'deterjan-pompasi', label: 'Deterjan/Parlatıcı Pompası' },
    { id: 'pompa-mebrani', label: 'Pompa Mebranı Değişimi' },
    { id: 'parlatici-girisi', label: 'Parlatıcı Girişi Değişimi' },
    { id: 'cekvalf', label: 'Çekvalf Değişimi' }
];

let machineCount = 0;
const machineStates = {};
let customers = [];
let selectedCustomerId = null;

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

function init() {
    loadState();
    updateUI();
    renderCustomerSelect();
    setupEventListeners();
    registerServiceWorker();
}

function setupEventListeners() {
    decreaseBtn.addEventListener('click', decreaseMachineCount);
    increaseBtn.addEventListener('click', increaseMachineCount);
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

function convertTurkish(t) {
    return t.replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ç/g, 'c').replace(/Ç/g, 'C');
}

// Helper to get logo data URL
function getLogoDataUrl() {
    const img = document.querySelector('.logo-image');
    if (!img) return null;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
    } catch (e) {
        console.error('Logo conversion error:', e);
        return null;
    }
}

function generatePDFBlob() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const customer = customers.find(c => c.id === selectedCustomerId);
    const date = new Date().toLocaleDateString('tr-TR');
    const time = new Date().toLocaleTimeString('tr-TR');
    const pw = doc.internal.pageSize.width;
    const ph = doc.internal.pageSize.height;

    // Theme Colors
    const colDark = [10, 10, 20];      // #0a0a14
    const colPrimary = [76, 201, 240]; // #4cc9f0
    const colAccent = [67, 97, 238];   // #4361ee

    let y = 0;

    // === HEADER ===
    doc.setFillColor(...colDark);
    doc.rect(0, 0, pw, 45, 'F');

    // Logo (White Container)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 10, 50, 25, 4, 4, 'F');

    const logoData = getLogoDataUrl();
    if (logoData) {
        try {
            const imgProps = doc.getImageProperties(logoData);
            const ratio = imgProps.height / imgProps.width;
            const logoW = 40;
            const logoH = logoW * ratio;
            const logoY = 10 + (25 - logoH) / 2;
            doc.addImage(logoData, 'PNG', 20, logoY, logoW, logoH);
        } catch (e) { console.error(e); }
    } else {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('DozaTech', 25, 25);
    }

    // Title & Date
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVIS FORMU', pw - 15, 22, { align: 'right' });

    doc.setTextColor(...colPrimary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih: ${date}   Saat: ${time}`, pw - 15, 32, { align: 'right' });

    // Decorative Line
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

    // === MACHINES ===
    doc.setTextColor(...colDark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOPLAM ${machineCount} MAKINE KONTROL EDILDI`, 15, y);
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
        doc.text(`Makine ${i}`, 20, y + 5.5);

        y += 12;

        const state = machineStates[i] || {};
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        let xPos = 20;
        let startY = y;

        checklistItems.forEach((item, index) => {
            const checked = state[item.id];

            if (checked) {
                doc.setFillColor(46, 204, 113);
                doc.rect(xPos, y - 3, 4, 4, 'F');
                doc.setTextColor(46, 204, 113);
            } else {
                doc.setDrawColor(200, 200, 200);
                doc.rect(xPos, y - 3, 4, 4, 'S');
                doc.setTextColor(150, 150, 150);
            }

            doc.text(convertTurkish(item.label), xPos + 6, y);

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
    if (y > ph - 60) { doc.addPage(); y = 20; }

    const bottomY = Math.max(y, ph - 70);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);

    // Left: DozaTech
    doc.setTextColor(...colDark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DozaTech Teknik Servis', 30, bottomY + 5, { align: 'center' });
    doc.text('Imza', 30, bottomY + 35, { align: 'center' });
    doc.line(15, bottomY + 40, 60, bottomY + 40);

    // Right: Customer
    doc.text('Musteri Onay', pw - 45, bottomY + 5, { align: 'center' });
    doc.text('Imza', pw - 45, bottomY + 35, { align: 'center' });
    doc.line(pw - 80, bottomY + 40, pw - 15, bottomY + 40);

    // === FOOTER ===
    doc.setFillColor(...colDark);
    doc.rect(0, ph - 15, pw, 15, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('DozaTech - Endustriyel Mutfak Cozumleri', pw / 2, ph - 9, { align: 'center' });
    doc.text('Bu form dijital olarak olusturulmustur.', pw / 2, ph - 5, { align: 'center' });

    const fn = customer ? 'servis_' + convertTurkish(customer.name).replace(/\s+/g, '_') + '_' + date.replace(/\./g, '-') + '.pdf' : 'servis_' + date.replace(/\./g, '-') + '.pdf';
    return { blob: doc.output('blob'), fileName: fn };
}

function handleSavePDF() {
    showToast('PDF oluşturuluyor...');
    try {
        const { blob, fileName } = generatePDFBlob();

        // Always download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 200);

        showToast('PDF indirildi: ' + fileName);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    } catch (error) {
        console.error('PDF Error:', error);
        showToast('Hata: ' + error.message);
    }
}

function handleSendWhatsApp() {
    console.log('WhatsApp clicked');

    if (!selectedCustomerId) {
        alert('Lütfen önce bir müşteri seçin.');
        return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    showToast('WhatsApp hazırlanıyor...');

    try {
        const { blob, fileName } = generatePDFBlob();
        const file = new File([blob], fileName, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                files: [file],
                title: 'DozaTech Servis - ' + customer.name
            })
                .then(() => {
                    showToast('Paylaşım tamamlandı!');
                })
                .catch(err => {
                    if (err.name !== 'AbortError') {
                        console.log('Share failed, opening WhatsApp...');
                        sendWhatsAppText(customer, blob, fileName);
                    }
                });
        } else {
            sendWhatsAppText(customer, blob, fileName);
        }
    } catch (error) {
        console.error('WhatsApp Error:', error);
        showToast('Hata: ' + error.message);
    }
}

function sendWhatsAppText(customer, blob, fileName) {
    // Download PDF
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);

    showToast('PDF indirildi, WhatsApp açılıyor...');

    // Only send notes
    let msg = '';
    if (generalNotes.value.trim()) {
        msg = generalNotes.value.trim();
    } else {
        msg = 'Servis formu ekte.';
    }

    setTimeout(() => { window.open('https://wa.me/' + customer.phone + '?text=' + encodeURIComponent(msg), '_blank'); }, 500);
}

function increaseMachineCount() {
    machineCount++;
    if (!machineStates[machineCount]) {
        machineStates[machineCount] = {};
        checklistItems.forEach(it => { machineStates[machineCount][it.id] = false; });
    }
    updateUI();
    saveState();
}

function decreaseMachineCount() {
    if (machineCount > 0) {
        delete machineStates[machineCount];
        machineCount--;
        updateUI();
        saveState();
    }
}

function updateUI() {
    countDisplay.textContent = machineCount;
    decreaseBtn.disabled = machineCount === 0;
    renderMachineCards();
}

function renderMachineCards() {
    if (machineCount === 0) {
        machinesContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🍽️</div><p class="empty-state-text">Makine eklemek için + tıklayın</p></div>';
        return;
    }
    let html = '';
    for (let i = 1; i <= machineCount; i++) {
        const st = machineStates[i] || {};
        let cl = checklistItems.map(it => `
            <div class="checklist-item ${st[it.id] ? 'checked' : ''}" data-machine="${i}" data-item="${it.id}">
                <div class="checklist-checkbox"></div>
                <span class="checklist-label">${it.label}</span>
            </div>
        `).join('');
        html += `<div class="machine-card"><div class="machine-header"><div class="machine-number">${i}</div><h3 class="machine-title">Makine ${i}</h3></div><div class="checklist">${cl}</div></div>`;
    }
    machinesContainer.innerHTML = html;
    document.querySelectorAll('.checklist-item').forEach(el => {
        el.addEventListener('click', function () {
            const m = parseInt(this.dataset.machine);
            const it = this.dataset.item;
            if (!machineStates[m]) machineStates[m] = {};
            machineStates[m][it] = !machineStates[m][it];
            this.classList.toggle('checked');
            saveState();
            if (navigator.vibrate) navigator.vibrate(50);
        });
    });
}

function saveState() {
    localStorage.setItem('servisFormuState', JSON.stringify({
        machineCount, machineStates, customers, selectedCustomerId,
        generalNotes: generalNotes.value, lastSaved: new Date().toISOString()
    }));
}

function loadState() {
    const s = localStorage.getItem('servisFormuState');
    if (s) {
        try {
            const st = JSON.parse(s);
            machineCount = st.machineCount || 0;
            Object.assign(machineStates, st.machineStates || {});
            customers = st.customers || [];
            selectedCustomerId = st.selectedCustomerId || null;
            generalNotes.value = st.generalNotes || '';
        } catch (e) { console.error(e); }
    }
}

function showToast(msg) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast show';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2500);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(e => console.log(e));
    }
}

init();
