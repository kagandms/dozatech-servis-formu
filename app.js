// DozaTech Service Form Application

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

function generatePDFBlob() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const customer = customers.find(c => c.id === selectedCustomerId);
    const date = new Date().toLocaleDateString('tr-TR');
    const time = new Date().toLocaleTimeString('tr-TR');
    const pw = doc.internal.pageSize.width;
    const ph = doc.internal.pageSize.height;

    let y = 0;
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pw, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DozaTech', pw / 2, 16, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Servis Formu', pw / 2, 26, { align: 'center' });
    doc.setTextColor(76, 201, 240);
    doc.setFontSize(8);
    doc.text(date + ' - ' + time, pw / 2, 34, { align: 'center' });

    y = 48;

    if (customer) {
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(15, y, pw - 30, 22, 3, 3, 'F');
        doc.setTextColor(67, 97, 238);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('MUSTERI', 20, y + 6);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(convertTurkish(customer.name), 20, y + 14);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(customer.phone, 20, y + 20);
        y += 28;
    }

    doc.setFillColor(67, 97, 238);
    doc.roundedRect(15, y, pw - 30, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOPLAM: ' + machineCount + ' MAKINE', pw / 2, y + 6, { align: 'center' });
    y += 14;

    for (let i = 1; i <= machineCount; i++) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFillColor(76, 201, 240);
        doc.roundedRect(15, y, pw - 30, 7, 2, 2, 'F');
        doc.setTextColor(26, 26, 46);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Makine ' + i, 20, y + 5);
        y += 10;
        const state = machineStates[i] || {};
        doc.setFontSize(8);
        checklistItems.forEach(item => {
            const checked = state[item.id];
            if (checked) {
                doc.setFillColor(6, 214, 160);
                doc.roundedRect(20, y - 3, 4, 4, 1, 1, 'F');
                doc.setTextColor(6, 214, 160);
            } else {
                doc.setDrawColor(160, 160, 160);
                doc.roundedRect(20, y - 3, 4, 4, 1, 1, 'S');
                doc.setTextColor(100, 100, 100);
            }
            doc.setFont('helvetica', 'normal');
            doc.text(convertTurkish(item.label), 27, y);
            y += 5;
        });
        y += 4;
    }

    if (generalNotes.value.trim()) {
        if (y > 240) { doc.addPage(); y = 20; }
        const txt = convertTurkish(generalNotes.value);
        const lines = doc.splitTextToSize(txt, pw - 50);
        const bh = Math.max(18, 10 + lines.length * 4);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(15, y, pw - 30, bh, 3, 3, 'F');
        doc.setTextColor(67, 97, 238);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('NOTLAR', 20, y + 6);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        let ny = y + 11;
        lines.forEach(l => { doc.text(l, 20, ny); ny += 4; });
    }

    doc.setFillColor(26, 26, 46);
    doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(6);
    doc.text('DozaTech Servis', pw / 2, ph - 4, { align: 'center' });

    const fn = customer ? 'servis_' + convertTurkish(customer.name).replace(/\s+/g, '_') + '_' + date.replace(/\./g, '-') + '.pdf' : 'servis_' + date.replace(/\./g, '-') + '.pdf';
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
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
        showToast('PDF indirildi: ' + fileName);
    } catch (e) {
        console.error(e);
        showToast('Hata: ' + e.message);
    }
}

function handleSendWhatsApp() {
    if (!selectedCustomerId) { alert('Lütfen önce bir müşteri seçin.'); return; }
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    showToast('Hazırlanıyor...');
    try {
        const { blob, fileName } = generatePDFBlob();
        const file = new File([blob], fileName, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'DozaTech Servis - ' + customer.name })
                .then(() => showToast('Paylaşım tamamlandı!'))
                .catch(err => { if (err.name !== 'AbortError') sendWhatsAppText(customer, blob, fileName); });
        } else {
            sendWhatsAppText(customer, blob, fileName);
        }
    } catch (e) {
        console.error(e);
        showToast('Hata: ' + e.message);
    }
}

function sendWhatsAppText(customer, blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);

    showToast('PDF indirildi, WhatsApp açılıyor...');

    let msg = '*DozaTech Servis*\n' + new Date().toLocaleDateString('tr-TR') + '\n\n';
    msg += 'Müşteri: ' + customer.name + '\n';
    msg += 'Makine: ' + machineCount + '\n\n';
    for (let i = 1; i <= machineCount; i++) {
        msg += 'Makine ' + i + ':\n';
        const st = machineStates[i] || {};
        checklistItems.forEach(it => { msg += (st[it.id] ? '✓ ' : '○ ') + it.label + '\n'; });
        msg += '\n';
    }
    if (generalNotes.value.trim()) msg += 'Not: ' + generalNotes.value;

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
