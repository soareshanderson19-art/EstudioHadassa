import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCxMLHB5bjm0jZNULGhD-8dcxvnaf9_tSk",
  authDomain: "estudio-hadassa.firebaseapp.com",
  projectId: "estudio-hadassa",
  storageBucket: "estudio-hadassa.firebasestorage.app",
  messagingSenderId: "530184812744",
  appId: "1:530184812744:web:79f332f86dfda74171cdfd",
  measurementId: "G-FZ0DG46TN9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SERVICES = [
    { id: 'cabelo', name: 'Cabelo', icon: '💇‍♀️', professional: 'Beatriz' },
    { id: 'unhas', name: 'Unhas', icon: '💅', professional: 'Miriã' },
    { id: 'sobrancelhas', name: 'Sobrancelhas', icon: '👁️', professional: 'Beatriz' },
    { id: 'cilios', name: 'Cílios', icon: '✨', professional: 'Beatriz' }
];

let currentStep = 1;
let selectedService = null;
let selectedDate = '';
let selectedSlot = '';
let serviceSpecifications = {};

document.addEventListener('DOMContentLoaded', () => {
    renderServices();
    renderCalendar();
    setupNavigation();
});

function renderServices() {
    const container = document.getElementById('services-container');
    container.innerHTML = '';
    
    SERVICES.forEach(service => {
        const wrapper = document.createElement('div');
        wrapper.className = 'service-wrapper';
        wrapper.innerHTML = `
            <div class="service-card" id="card-${service.id}">
                <div class="service-info">
                    <h3>${service.icon} ${service.name}</h3>
                    <p class="service-meta">Atendimento com ${service.professional}</p>
                </div>
                <div class="service-select-indicator"></div>
            </div>
            <div class="specs-placeholder" id="placeholder-${service.id}" style="display: none;"></div>
        `;
        
        const card = wrapper.querySelector('.service-card');
        card.addEventListener('click', () => {
            document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
            document.querySelectorAll('.specs-placeholder').forEach(p => {
                p.innerHTML = '';
                p.style.display = 'none';
            });

            card.classList.add('selected');
            selectedService = service;
            selectedSlot = '';
            
            const placeholder = wrapper.querySelector('.specs-placeholder');
            renderDynamicForm(service.id, placeholder);
            placeholder.style.display = 'block';
            
            document.getElementById('btn-next').disabled = false;
        });
        
        container.appendChild(wrapper);
    });
}

function renderDynamicForm(serviceId, targetElement) {
    if (serviceId === 'cabelo') {
        targetElement.innerHTML = `
            <h4>Especificações do Cabelo</h4>
            <div class="form-group">
                <label>Tipo de Cabelo</label>
                <select id="spec-tipo-cabelo" class="form-control">
                    <option value="Liso">Liso</option>
                    <option value="Ondulado">Ondulado</option>
                    <option value="Cacheado">Cacheado</option>
                    <option value="Crespo">Crespo</option>
                </select>
            </div>
            <div class="form-group">
                <label>Comprimento/Tamanho</label>
                <select id="spec-tamanho-cabelo" class="form-control">
                    <option value="Curto">Curto (Acima do ombro)</option>
                    <option value="Médio">Médio (Na altura do ombro)</option>
                    <option value="Longo">Longo (Abaixo do ombro)</option>
                    <option value="Extra Longo">Extra Longo</option>
                </select>
            </div>
            <div class="form-group">
                <label>O que deseja realizar?</label>
                <select id="spec-procedimento-cabelo" class="form-control">
                    <option value="Corte">Corte</option>
                    <option value="Escova / Tratamento">Escova / Tratamento</option>
                    <option value="Progressiva / Selagem">Progressiva / Selagem</option>
                    <option value="Tintura / Coloração">Tintura / Coloração</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Mensagem / Detalhes Adicionais</label>
                <textarea id="spec-obs" class="textarea-premium" placeholder="Descreva o estado atual do seu cabelo e o que deseja..."></textarea>
            </div>
        `;
    } else if (serviceId === 'unhas') {
        targetElement.innerHTML = `
            <h4>Especificações das Unhas</h4>
            <div class="form-group">
                <label>Tipo de Atendimento</label>
                <select id="spec-tipo-atendimento" class="form-control">
                    <option value="Pé e Mão">Pé e Mão</option>
                    <option value="Apenas Mão">Apenas Mão</option>
                    <option value="Apenas Pé">Apenas Pé</option>
                </select>
            </div>
            <div class="form-group">
                <label>Técnica ou Cobertura</label>
                <select id="spec-tecnica-unha" class="form-control">
                    <option value="Esmaltação Comum">Esmaltação Comum</option>
                    <option value="Esmaltação em Gel (Secagem na Cabine)">Esmaltação em Gel (Secagem na Cabine)</option>
                    <option value="Blindagem (Fortalecimento)">Blindagem (Fortalecimento)</option>
                    <option value="Banho de Gel / Banho de Acrílico">Banho de Gel / Banho de Acrílico</option>
                </select>
            </div>
            <div class="form-group">
                <label>Alongamento de Unhas</label>
                <select id="spec-alongamento" class="form-control">
                    <option value="Nenhum (Uso minha unha natural)">Nenhum (Uso minha unha natural)</option>
                    <option value="Fibra de Vidro">Fibra de Vidro</option>
                    <option value="Acrigel">Acrigel</option>
                    <option value="Molde F1 / Poligel">Molde F1 / Poligel</option>
                </select>
            </div>
            <div class="form-group">
                <label>Decoração (Nail Art)</label>
                <select id="spec-decoracao" class="form-control">
                    <option value="Nenhuma (Esmaltação Cor Sólida)">Nenhuma (Esmaltação Cor Sólida)</option>
                    <option value="Francesinha Clássica">Francesinha Clássica</option>
                    <option value="Decoração Simples (Filha Única)">Decoração Simples (Filha Única)</option>
                    <option value="Decoração Completa (Pedrarias / Jóias / Desenhos)">Decoração Completa (Pedrarias / Jóias / Desenhos)</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Preferência de Produtos, Marcas ou Alergias</label>
                <textarea id="spec-obs" class="textarea-premium" placeholder="Ex: prefiro esmaltes hipoalergênicos, tenho alergia a gel, etc..."></textarea>
            </div>
        `;
    } else if (serviceId === 'sobrancelhas') {
        targetElement.innerHTML = `
            <h4>Especificações da Sobrancelha</h4>
            <div class="form-group">
                <label>Tipo de Design</label>
                <select id="spec-tipo-sobrancelha" class="form-control">
                    <option value="Design Simples (Pinça/Linha)">Design Simples (Pinça/Linha)</option>
                    <option value="Design com Aplicação de Henna">Design com Aplicação de Henna</option>
                    <option value="Brow Lamination">Brow Lamination</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Observações</label>
                <textarea id="spec-obs" class="textarea-premium" placeholder="Ex: tenho alergia a henna, quero apenas limpar..."></textarea>
            </div>
        `;
    } else if (serviceId === 'cilios') {
        targetElement.innerHTML = `
            <h4>Especificações de Cílios</h4>
            <div class="form-group">
                <label>Tipo de Extensão</label>
                <select id="spec-tipo-cilios" class="form-control">
                    <option value="Extensão Fio a Fio clássica">Extensão Fio a Fio clássica</option>
                    <option value="Volume Russo">Volume Russo</option>
                    <option value="Efeito Rimel / Híbrido">Efeito Rímel / Híbrido</option>
                    <option value="Lash Lifting / Tintura">Lash Lifting / Tintura</option>
                    <option value="Manutenção de Extensão">Manutenção de Extensão</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Observações</label>
                <textarea id="spec-obs" class="textarea-premium" placeholder="Informe se já tem extensão de outro local..."></textarea>
            </div>
        `;
    }
}

function saveSpecifications() {
    serviceSpecifications = {};
    const obsVal = document.getElementById('spec-obs') ? document.getElementById('spec-obs').value.trim() : '';
    serviceSpecifications['Observações / Preferências'] = obsVal || 'Nenhuma';

    if (selectedService.id === 'cabelo') {
        serviceSpecifications['Tipo de Cabelo'] = document.getElementById('spec-tipo-cabelo').value;
        serviceSpecifications['Tamanho'] = document.getElementById('spec-tamanho-cabelo').value;
        serviceSpecifications['Procedimento'] = document.getElementById('spec-procedimento-cabelo').value;
    } else if (selectedService.id === 'unhas') {
        serviceSpecifications['Atendimento'] = document.getElementById('spec-tipo-atendimento').value;
        serviceSpecifications['Técnica / Cobertura'] = document.getElementById('spec-tecnica-unha').value;
        serviceSpecifications['Alongamento'] = document.getElementById('spec-alongamento').value;
        serviceSpecifications['Decoração'] = document.getElementById('spec-decoracao').value;
    } else if (selectedService.id === 'sobrancelhas') {
        serviceSpecifications['Procedimento'] = document.getElementById('spec-tipo-sobrancelha').value;
    } else if (selectedService.id === 'cilios') {
        serviceSpecifications['Procedimento'] = document.getElementById('spec-tipo-cilios').value;
    }
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    container.innerHTML = '';
    
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + i);
        
        const dayStr = futureDate.toISOString().split('T')[0];
        const dayWeek = weekdays[futureDate.getDay()];
        const dayNum = futureDate.getDate();
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.dataset.date = dayStr;
        dayDiv.innerHTML = `
            <span class="day-week">${dayWeek}</span>
            <span class="day-number">${dayNum}</span>
        `;
        
        dayDiv.addEventListener('click', () => {
            document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
            dayDiv.classList.add('active');
            selectedDate = dayStr;
            selectedSlot = '';
            renderSlots(dayStr);
        });
        
        container.appendChild(dayDiv);
    }
}

async function renderSlots(date) {
    const container = document.getElementById('slots-container');
    container.innerHTML = '<p style="grid-column: span 3; color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 20px;">Verificando agenda...</p>';
    
    if (!selectedService) return;

    const targetProfessional = selectedService.professional;
    const docId = `${date}_${targetProfessional}`;
    const docRef = doc(db, "availableSlots", docId);
    let dayHours = [];
    
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            dayHours = docSnap.data().times || [];
        } else {
            // Fallback para ler a escala antiga de data geral (se houver)
            const fallbackRef = doc(db, "availableSlots", date);
            const fallbackSnap = await getDoc(fallbackRef);
            if (fallbackSnap.exists()) {
                dayHours = fallbackSnap.data().times || [];
            }
        }
    } catch (err) {
        console.error("Erro ao ler escala: ", err);
    }

    container.innerHTML = '';
    if (dayHours.length === 0) {
        container.innerHTML = '<p style="grid-column: span 3; color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 20px;">Não há horários disponíveis para este dia.</p>';
        return;
    }

    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("date", "==", date), where("professional", "==", targetProfessional));
    
    let bookedTimes = [];
    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            bookedTimes.push(doc.data().time);
        });
    } catch (err) {
        console.error(err);
    }

    dayHours.forEach(time => {
        const btn = document.createElement('div');
        btn.className = 'slot-btn';
        btn.innerText = time;

        const isConflict = bookedTimes.includes(time);

        if (isConflict) {
            btn.classList.add('disabled');
        } else {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.slot-btn').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                selectedSlot = time;
                document.getElementById('btn-next').disabled = false;
            });
        }
        
        container.appendChild(btn);
    });
}

function setupNavigation() {
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');

    btnNext.disabled = true;

    btnNext.addEventListener('click', () => {
        if (currentStep === 1 && selectedService) {
            saveSpecifications();
            goToStep(2);
        } else if (currentStep === 2 && selectedSlot) {
            goToStep(3);
        } else if (currentStep === 3) {
            openConfirmationModal();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    });

    document.getElementById('btn-modal-cancel').addEventListener('click', () => {
        document.getElementById('confirmation-modal').classList.remove('active');
    });

    document.getElementById('btn-modal-confirm').addEventListener('click', executeFinalBooking);
}

function goToStep(step) {
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.getElementById(`step-indicator-${currentStep}`).classList.remove('active');
    if (currentStep < step) {
        document.getElementById(`step-indicator-${currentStep}`).classList.add('completed');
    } else {
        document.getElementById(`step-indicator-${step}`).classList.remove('completed');
    }

    currentStep = step;

    document.getElementById(`step-${currentStep}`).classList.add('active');
    document.getElementById(`step-indicator-${currentStep}`).classList.add('active');

    document.getElementById('btn-prev').disabled = (currentStep === 1);
    
    if (currentStep === 1) {
        btnTextAndStatus('Avançar', !selectedService);
    } else if (currentStep === 2) {
        btnTextAndStatus('Avançar', !selectedSlot);
    } else if (currentStep === 3) {
        btnTextAndStatus('Verificar', false);
    }
}

function btnTextAndStatus(text, disabled) {
    const btn = document.getElementById('btn-next');
    btn.innerText = text;
    btn.disabled = disabled;
}

function getFormattedSpecsText() {
    let text = '';
    for (const [key, value] of Object.entries(serviceSpecifications)) {
        text += `• *${key}:* ${value}\n`;
    }
    return text;
}

function openConfirmationModal() {
    const clientName = document.getElementById('client-name').value.trim();
    const clientPhone = document.getElementById('client-phone').value.trim();

    if (!clientName || !clientPhone) {
        alert('Por favor, informe seu nome e contato para prosseguir.');
        return;
    }

    const formattedDate = selectedDate.split('-').reverse().join('/');

    document.getElementById('summary-name').innerText = clientName;
    document.getElementById('summary-service').innerText = selectedService.name;
    document.getElementById('summary-prof').innerText = selectedService.professional;
    document.getElementById('summary-date').innerText = formattedDate;
    document.getElementById('summary-time').innerText = selectedSlot + ' horas';

    const inspirationFile = document.getElementById('file-inspiration')?.files?.[0];
    const currentFile = document.getElementById('file-current')?.files?.[0];
    let fileSummary = 'Fotos não selecionadas.';
    
    if (inspirationFile || currentFile) {
        fileSummary = '';
        if (inspirationFile) fileSummary += `📸 Inspiração: ${inspirationFile.name}\n`;
        if (currentFile) fileSummary += `📸 Atual: ${currentFile.name}`;
    }
    document.getElementById('summary-files').innerText = fileSummary;

    let detailsHtml = '';
    for (const [key, value] of Object.entries(serviceSpecifications)) {
        detailsHtml += `<strong>${key}:</strong> ${value}\n`;
    }
    document.getElementById('summary-details').innerHTML = detailsHtml;

    document.getElementById('confirmation-modal').classList.add('active');
}

function compressImage(file, maxWidth = 300, maxHeight = 300, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

async function executeFinalBooking() {
    const clientName = document.getElementById('client-name').value.trim();
    const clientPhone = document.getElementById('client-phone').value.trim();
    const formattedDate = selectedDate.split('-').reverse().join('/');
    const professional = selectedService.professional;

    const telBeatriz = localStorage.getItem('phoneBeatriz') || '5551986286970';
    const telMiria = localStorage.getItem('phoneMiria') || '5551994922911';
    const targetWhatsapp = (professional === 'Beatriz') ? telBeatriz : telMiria;

    document.getElementById('btn-modal-confirm').disabled = true;
    document.getElementById('summary-files').innerText = "Comprimindo e salvando fotos no Firestore...";

    let inspirationBase64 = "";
    let currentBase64 = "";

    const fileInspiration = document.getElementById('file-inspiration')?.files?.[0];
    const fileCurrent = document.getElementById('file-current')?.files?.[0];

    try {
        if (fileInspiration) {
            inspirationBase64 = await compressImage(fileInspiration);
        }
        if (fileCurrent) {
            currentBase64 = await compressImage(fileCurrent);
        }
    } catch (err) {
        console.error("Erro ao comprimir fotos: ", err);
        alert("Ocorreu um erro na compressão rápida das imagens. Continuaremos mesmo assim.");
    }

    const newBooking = {
        clientName,
        clientPhone,
        service: selectedService.name,
        date: selectedDate,
        time: selectedSlot,
        professional: professional,
        specifications: serviceSpecifications,
        inspirationUrl: inspirationBase64,
        currentUrl: currentBase64
    };

    try {
        await addDoc(collection(db, "bookings"), newBooking);
    } catch (err) {
        console.error("Erro ao salvar agendamento no Firestore: ", err);
    }

    document.getElementById('btn-modal-confirm').disabled = false;
    document.getElementById('confirmation-modal').classList.remove('active');

    const message = `✨ *SOLICITAÇÃO DE AGENDAMENTO* ✨\n\n` +
                    `*Studio Hadassa* — Onde sua beleza floresce\n\n` +
                    `• *Cliente:* ${clientName}\n` +
                    `• *WhatsApp:* ${clientPhone}\n` +
                    `• *Procedimento:* ${selectedService.name}\n` +
                    `• *Data:* ${formattedDate}\n` +
                    `• *Horário:* ${selectedSlot}\n` +
                    `• *Profissional:* ${professional}\n\n` +
                    `📋 *ESPECIFICAÇÕES DO PEDIDO:*\n` +
                    getFormattedSpecsText() + `\n` +
                    `🖼️ *MÍDIAS ANEXADAS:*\n` +
                    `• *Foto de Inspiração:* ${fileInspiration ? "Anexada (Visualizar no Painel Admin)" : "Não enviada"}\n` +
                    `• *Foto Atual:* ${fileCurrent ? "Anexada (Visualizar no Painel Admin)" : "Não enviada"}\n\n` +
                    `_Por favor, avalie as especificações para me retornar com o valor e o tempo estimado de duração do procedimento!_`;

    window.open(`https://api.whatsapp.com/send?phone=${targetWhatsapp}&text=${encodeURIComponent(message)}`, '_blank');
    
    selectedService = null;
    selectedDate = '';
    selectedSlot = '';
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    if (document.getElementById('file-inspiration')) document.getElementById('file-inspiration').value = '';
    if (document.getElementById('file-current')) document.getElementById('file-current').value = '';
    
    const placeholders = document.querySelectorAll('.specs-placeholder');
    placeholders.forEach(p => { p.innerHTML = ''; p.style.display = 'none'; });
    
    document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
    goToStep(1);
}
