// Configuração do projeto Firebase Studio Hadassa
const firebaseConfig = {
  apiKey: "AIzaSyCxMLHB5bjm0jZNULGhD-8dcxvnaf9_tSk",
  authDomain: "estudio-hadassa.firebaseapp.com",
  projectId: "estudio-hadassa",
  storageBucket: "estudio-hadassa.firebasestorage.app",
  messagingSenderId: "530184812744",
  appId: "1:530184812744:web:79f332f86dfda74171cdfd",
  measurementId: "G-FZ0DG46TN9"
};

// Inicializa o Firebase no modo compatível seguro
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let activeTab = 'all';
let isInitialLoad = true;

document.addEventListener('DOMContentLoaded', () => {
    // Autolimpeza automática do cache de lançamentos antigos
    let cachedCash = JSON.parse(localStorage.getItem('cashFlow')) || [];
    let cleanCash = cachedCash.filter(tx => tx.id !== 'INITIAL_350' && tx.desc !== 'Lançamento Inicial de Caixa' && tx.value !== 350);
    if (cachedCash.length !== cleanCash.length) {
        localStorage.setItem('cashFlow', JSON.stringify(cleanCash));
    }

    checkLoginState();
    loadConfigs();
    setupTabListeners();
    setupSidebarNavigation();
    setupFinanceManager();
    setupAdminControls();
    
    // Inicia a escuta em tempo real no banco do Firestore
    listenToBookings();

    const cashTypeSelect = document.getElementById('cash-type');
    const paymentMethodWrap = document.getElementById('payment-method-wrap');
    cashTypeSelect.addEventListener('change', () => {
        if (cashTypeSelect.value === 'Saída') {
            paymentMethodWrap.style.display = 'none';
        } else {
            paymentMethodWrap.style.display = 'block';
        }
    });

    document.getElementById('btn-execute-login').addEventListener('click', validateAdminLogin);
    document.getElementById('btn-admin-logout').addEventListener('click', logoutAdmin);
    document.getElementById('btn-mobile-logout').addEventListener('click', logoutAdmin);

    document.getElementById('btn-close-image-preview').addEventListener('click', () => {
        document.getElementById('image-preview-modal').classList.remove('active');
    });

    document.getElementById('btn-new-booking-acknowledge').addEventListener('click', () => {
        document.getElementById('new-booking-alert-modal').classList.remove('active');
    });

    document.getElementById('btn-save-configs').addEventListener('click', () => {
        const beatriz = document.getElementById('admin-beatriz').value.trim();
        const miria = document.getElementById('admin-miria').value.trim();

        if (beatriz && miria) {
            localStorage.setItem('phoneBeatriz', beatriz);
            localStorage.setItem('phoneMiria', miria);
            alert('Configurações de contatos salvas!');
        } else {
            alert('Por favor, informe os números das duas profissionais.');
        }
    });

    document.getElementById('admin-slots-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const date = document.getElementById('admin-date').value;
        const selectedHours = Array.from(document.querySelectorAll('input[name="hours-checked"]:checked')).map(cb => cb.value);

        if (!date) return alert('Escolha uma data.');
        if (selectedHours.length === 0) return alert('Selecione ao menos um horário.');

        try {
            await db.collection("availableSlots").doc(date).set({ times: selectedHours });
            alert(`Agenda configurada para o dia ${date.split('-').reverse().join('/')}!`);
        } catch (err) {
            console.error("Erro ao salvar agenda no Firebase: ", err);
            alert("Não foi possível salvar a agenda.");
        }

        document.querySelectorAll('input[name="hours-checked"]:checked').forEach(cb => cb.checked = false);
    });
});

// ================= LOGIN SESSÃO =================
function checkLoginState() {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        document.getElementById('admin-login-screen').style.display = 'none';
        document.getElementById('admin-main-layout').style.display = 'flex';
    }
}

function validateAdminLogin() {
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    if (user === 'estudiohadassa' && pass === '2402') {
        sessionStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('admin-login-screen').style.display = 'none';
        document.getElementById('admin-main-layout').style.display = 'flex';
    } else {
        alert('Credenciais incorretas! Tente novamente.');
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.reload();
}

// ================= SIDEBAR NAVEGAÇÃO =================
function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-item');
    const sections = document.querySelectorAll('.admin-section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.dataset.target;
            if (!targetId) return;

            menuItems.forEach(m => m.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            document.querySelectorAll(`.sidebar-item[data-target="${targetId}"]`).forEach(el => {
                el.classList.add('active');
            });
            document.getElementById(targetId).classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ================= REAL-TIME: MONITORAMENTO DO BANCO EM TEMPO REAL =================
function listenToBookings() {
    db.collection("bookings").onSnapshot((snapshot) => {
        let newBookingAdded = false;

        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                if (!isInitialLoad) {
                    newBookingAdded = true;
                }
            }
        });

        isInitialLoad = false;

        let bookingsList = [];
        snapshot.forEach(docSnap => {
            bookingsList.push({ id: docSnap.id, ...docSnap.data() });
        });

        bookingsList.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });

        window.lastBookingsSnapshot = bookingsList;

        renderStats(bookingsList);
        renderBookings();

        if (newBookingAdded) {
            triggerNewBookingAlert();
        }
    });
}

function triggerNewBookingAlert() {
    const modal = document.getElementById('new-booking-alert-modal');
    modal.classList.add('active');

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
        console.log("AudioContext bloqueado ou não suportado", e);
    }
}

// ================= GESTÃO FINANCEIRA (CAIXA) =================
function setupFinanceManager() {
    renderFinance();

    document.getElementById('btn-add-cash-flow').addEventListener('click', async () => {
        const desc = document.getElementById('cash-desc').value.trim();
        const type = document.getElementById('cash-type').value;
        const method = type === 'Entrada' ? document.getElementById('cash-payment-method').value : 'Nenhum';
        const val = parseFloat(document.getElementById('cash-value').value);

        if (!desc || isNaN(val) || val <= 0) {
            alert('Por favor, preencha a descrição e insira um valor válido maior que zero.');
            return;
        }

        const newTx = {
            desc,
            type,
            paymentMethod: method,
            value: val,
            date: new Date().toLocaleDateString('pt-BR'),
            timestamp: Date.now()
        };

        try {
            await db.collection("cashFlow").add(newTx);
            document.getElementById('cash-desc').value = '';
            document.getElementById('cash-value').value = '';
            renderFinance();
        } catch (err) {
            console.error("Erro ao registrar no caixa: ", err);
        }
    });
}

async function renderFinance() {
    let revenueSum = 0;
    let expenseSum = 0;

    const listContainer = document.getElementById('cash-flow-list');
    listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 25px 0;">Sincronizando caixa...</p>';

    let cashFlow = [];
    try {
        const querySnapshot = await db.collection("cashFlow").orderBy("timestamp", "desc").get();
        querySnapshot.forEach((doc) => {
            cashFlow.push({ id: doc.id, ...doc.data() });
        });
    } catch (err) {
        console.error("Erro ao ler caixa: ", err);
    }

    listContainer.innerHTML = '';

    if (cashFlow.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 25px 0;">Nenhum lançamento no caixa.</p>';
    } else {
        cashFlow.forEach(tx => {
            if (tx.type === 'Entrada') {
                revenueSum += tx.value;
            } else {
                expenseSum += tx.value;
            }

            const txRow = document.createElement('div');
            txRow.style.padding = '12px 0';
            txRow.style.borderBottom = '1px solid #f2ebe0';
            txRow.style.display = 'flex';
            txRow.style.justifyContent = 'space-between';
            txRow.style.alignItems = 'center';
            txRow.style.fontSize = '0.8rem';

            const color = tx.type === 'Entrada' ? '#2e7d32' : '#c62828';
            const symbol = tx.type === 'Entrada' ? '+' : '-';
            const methodTag = tx.type === 'Entrada' ? ` <span style="background:#e8f9ee; color:#2e7d32; font-size:0.65rem; padding:2px 6px; border-radius:4px; font-weight:bold; margin-left:4px;">${tx.paymentMethod}</span>` : '';

            txRow.innerHTML = `
                <div>
                    <strong>${tx.desc}</strong> ${methodTag}
                    <p style="color: var(--text-muted); font-size: 0.7rem; margin-top: 2px;">${tx.date}</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-weight: bold; color: ${color};">
                        ${symbol} R$ ${tx.value.toFixed(2)}
                    </span>
                    <button class="btn-delete-sleek" onclick="window.deleteTransaction('${tx.id}')" style="padding: 2px 6px; font-size: 0.65rem;">Excluir</button>
                </div>
            `;
            listContainer.appendChild(txRow);
        });
    }

    const netBalance = revenueSum - expenseSum;

    document.getElementById('finance-total-revenue').innerText = revenueSum.toFixed(2);
    document.getElementById('finance-total-expense').innerText = expenseSum.toFixed(2);
    document.getElementById('finance-current-balance').innerText = netBalance.toFixed(2);
    
    const balanceCardValue = document.getElementById('finance-current-balance');
    if (netBalance >= 0) {
        balanceCardValue.style.color = '#2e7d32';
    } else {
        balanceCardValue.style.color = '#c62828';
    }
}

// ================= PARÂMETROS GLOBAIS DE LIMPEZA =================
function setupAdminControls() {
    document.getElementById('btn-clear-history').addEventListener('click', async () => {
        const todayStr = new Date().toISOString().split('T')[0];

        if (confirm('Deseja excluir do Firebase apenas o histórico de agendamentos passados (anteriores a hoje)? Isso reciclará seu armazenamento grátis.')) {
            try {
                const querySnapshot = await db.collection("bookings").get();
                let deletedCount = 0;
                const batch = db.batch();
                
                querySnapshot.forEach((documentSnap) => {
                    const bookingData = documentSnap.data();
                    if (bookingData.date < todayStr) {
                        batch.delete(db.collection("bookings").doc(documentSnap.id));
                        deletedCount++;
                    }
                });

                await batch.commit();
                alert(`Sucesso! ${deletedCount} agendamentos antigos foram reciclados da nuvem.`);
            } catch (err) {
                console.error("Erro ao limpar histórico: ", err);
            }
        }
    });

    document.getElementById('btn-clear-bookings').addEventListener('click', async () => {
        if (confirm('Atenção: Deseja apagar permanentemente todas as agendas de clientes salvas no Firebase?')) {
            try {
                const querySnapshot = await db.collection("bookings").get();
                const batch = db.batch();
                querySnapshot.forEach((documentSnap) => {
                    batch.delete(db.collection("bookings").doc(documentSnap.id));
                });
                await batch.commit();
                alert('Banco de dados de reservas limpo!');
            } catch (err) {
                console.error(err);
            }
        }
    });

    document.getElementById('btn-clear-slots').addEventListener('click', async () => {
        if (confirm('Atenção: Deseja redefinir permanentemente as agendas do Firebase?')) {
            try {
                const querySnapshot = await db.collection("availableSlots").get();
                const batch = db.batch();
                querySnapshot.forEach((documentSnap) => {
                    batch.delete(db.collection("availableSlots").doc(documentSnap.id));
                });
                await batch.commit();
                alert('Toda a agenda do salão foi redefinida!');
            } catch (err) {
                console.error(err);
            }
        }
    });
}

// ================= AUXILIARES DASHBOARD =================
function loadConfigs() {
    document.getElementById('admin-beatriz').value = localStorage.getItem('phoneBeatriz') || '5551986286970';
    document.getElementById('admin-miria').value = localStorage.getItem('phoneMiria') || '5551994922911';
}

function renderStats(bookings) {
    const countBeatriz = bookings.filter(b => b.professional === 'Beatriz').length;
    const countMiria = bookings.filter(b => b.professional === 'Miriã').length;

    document.getElementById('stat-total').innerText = bookings.length;
    document.getElementById('stat-beatriz').innerText = countBeatriz;
    document.getElementById('stat-miria').innerText = countMiria;
}

function setupTabListeners() {
    const tabs = [
        { id: 'tab-all', val: 'all' },
        { id: 'tab-beatriz', val: 'Beatriz' },
        { id: 'tab-miria', val: 'Miriã' }
    ];

    tabs.forEach(t => {
        document.getElementById(t.id).addEventListener('click', () => {
            tabs.forEach(tab => document.getElementById(tab.id).classList.remove('active'));
            document.getElementById(t.id).classList.add('active');
            activeTab = t.val;
            renderBookings();
        });
    });
}

// LIMPADOR DE NÚMERO TELEFÔNICO INCORPORADO
function cleanPhoneNumber(phone) {
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 11 && !clean.startsWith('55')) {
        clean = '55' + clean;
    }
    return clean;
}

function renderBookings() {
    const container = document.getElementById('admin-bookings-container');
    const bookings = window.lastBookingsSnapshot || [];

    const filteredBookings = activeTab === 'all' 
        ? bookings 
        : bookings.filter(b => b.professional === activeTab);

    if (filteredBookings.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 25px 0;">Nenhum atendimento na lista.</p>';
        return;
    }

    container.innerHTML = '';
    
    filteredBookings.forEach((booking) => {
        const formattedDate = booking.date.split('-').reverse().join('/');
        const item = document.createElement('div');
        item.className = 'admin-list-item';
        
        const cleanPhone = cleanPhoneNumber(booking.clientPhone);
        
        let specsHtml = '';
        if (booking.specifications) {
            specsHtml += '<div class="booking-specs-box">';
            for (const [key, value] of Object.entries(booking.specifications)) {
                specsHtml += `<p><strong>${key}:</strong> ${value}</p>`;
            }
            specsHtml += '</div>';
        }

        let photosHtml = '';
        if (booking.inspirationUrl || booking.currentUrl) {
            photosHtml += '<div style="display: flex; gap: 12px; margin-top: 12px; border-top: 1px dashed #f2ebe0; padding-top: 8px;">';
            
            if (booking.inspirationUrl) {
                photosHtml += `
                    <div style="flex: 1;">
                        <span style="font-size: 0.65rem; font-weight: bold; color: var(--text-muted); display: block; margin-bottom: 4px; letter-spacing:0.5px;">INSPIRAÇÃO:</span>
                        <div onclick="window.previewImage('${booking.inspirationUrl}')" style="cursor: pointer;">
                            <img src="${booking.inspirationUrl}" style="width: 100%; max-width: 120px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);" alt="Inspiração">
                        </div>
                    </div>
                `;
            }
            
            if (booking.currentUrl) {
                photosHtml += `
                    <div style="flex: 1;">
                        <span style="font-size: 0.65rem; font-weight: bold; color: var(--text-muted); display: block; margin-bottom: 4px; letter-spacing:0.5px;">CABELO/UNHA ATUAL:</span>
                        <div onclick="window.previewImage('${booking.currentUrl}')" style="cursor: pointer;">
                            <img src="${booking.currentUrl}" style="width: 100%; max-width: 120px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);" alt="Foto Atual">
                        </div>
                    </div>
                `;
            }
            
            photosHtml += '</div>';
        }

        const defaultContactText = encodeURIComponent(`Olá, ${booking.clientName}! Entro em contato a respeito do seu agendamento de ${booking.service} no Studio Hadassa para o dia ${formattedDate} às ${booking.time}h.`);

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                <div style="flex-grow: 1;">
                    <h3 style="font-size: 0.9rem; font-weight: 600; color: var(--dark-charcoal);">${booking.clientName}</h3>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 3px; display: flex; align-items: center;">
                        <span>📞 ${booking.clientPhone}</span>
                        <a href="https://api.whatsapp.com/send?phone=${cleanPhone}&text=${defaultContactText}" target="_blank" class="whatsapp-contact-link" title="Falar no WhatsApp">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#25D366" d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.76.46 3.42 1.258 4.892l-1.334 4.87 4.99-1.31A9.957 9.957 0 0 0 12.005 22c5.52 0 10-4.48 10-10.004C22.005 6.48 17.524 2 12.004 2zm5.74 14.1c-.24.67-1.385 1.24-1.916 1.3-1.46.16-3.23-.46-4.9-2.126-1.666-1.667-2.288-3.438-2.128-4.9.06-.53.63-1.677 1.302-1.917.2-.07.41-.09.61-.09l.48.01c.15 0 .3.02.43.32.18.42.61 1.49.66 1.59.05.1.09.22.02.35-.07.13-.15.28-.24.38l-.34.39c-.11.12-.22.25-.09.47.45.77 1.01 1.42 1.68 1.95.22.18.35.15.48-.01.13-.16.53-.61.67-.82.14-.21.28-.18.47-.11l1.49.7c.2.09.33.15.38.24.05.09.05.53-.19 1.2z"/>
                            </svg>
                        </a>
                    </p>
                    <p style="font-size: 0.75rem; font-weight: 700; color: var(--gold-dark); margin-top: 5px;">
                        🏷️ ${booking.service} — com ${booking.professional}
                    </p>
                    <p style="font-size: 0.75rem; color: var(--dark-charcoal); font-weight: 600; margin-top: 2px;">
                        📅 ${formattedDate} às ${booking.time}h
                    </p>
                    ${specsHtml}
                    <!-- Fotos inline do Firestore -->
                    ${photosHtml}
                </div>
                <button class="btn-delete-sleek" onclick="window.deleteBooking('${booking.id}')">Excluir</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// ================= GESTÃO DOS POPUPS DE PREVISUALIZAÇÃO =================
window.previewImage = function(base64) {
    const modal = document.getElementById('image-preview-modal');
    const img = document.getElementById('preview-modal-img');
    img.src = base64;
    modal.classList.add('active');
};

window.deleteBooking = async function(docId) {
    if (confirm('Deseja cancelar esse agendamento? Ele será excluído permanentemente da nuvem do Firebase.')) {
        try {
            await db.collection("bookings").doc(docId).delete();
        } catch (err) {
            console.error("Erro ao deletar: ", err);
        }
    }
};

window.deleteTransaction = async function(docId) {
    if (confirm('Deseja excluir permanentemente este lançamento do caixa?')) {
        try {
            await db.collection("cashFlow").doc(docId).delete();
            renderFinance();
        } catch (err) {
            console.error("Erro ao deletar transação: ", err);
        }
    }
};