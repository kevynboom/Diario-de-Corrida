// --- Configuração ---
const API_CORRIDAS_URL = 'http://localhost:5184/api/Corridas';

let editMode = false;
let editId = null;

// Variáveis para controle de listagem e filtro
let todasAsCorridas = [];
let ordemDecrescente = true; // Padrão: Mais recente/maior primeiro

// --- Elementos do DOM ---
const form = document.getElementById('form-corrida');
const listaCorridas = document.getElementById('lista-corridas');
const loadingDiv = document.getElementById('loading');
const errorMessageDiv = document.getElementById('error-message');
const inputData = document.getElementById('data');
const inputDistancia = document.getElementById('distancia');
const inputTempo = document.getElementById('tempo');
const inputLocal = document.getElementById('local');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');

// Elementos de Filtro
const filtroSelect = document.getElementById('filtroSelect');
const btnOrdem = document.getElementById('btnOrdem');

// --- Funções Auxiliares ---
function showError(message) {
    errorMessageDiv.textContent = `Erro: ${message}.`;
    errorMessageDiv.style.display = 'block';
    loadingDiv.style.display = 'none';
}

function clearError() {
    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-PT', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
}

function calcularPace(distancia, tempo) {
    if (distancia <= 0 || tempo <= 0) return "N/A";
    const paceDecimal = tempo / distancia;
    const paceMinutos = Math.floor(paceDecimal);
    const paceSegundos = Math.round((paceDecimal - paceMinutos) * 60);
    const segundosFormatados = paceSegundos.toString().padStart(2, '0');
    return `${paceMinutos}:${segundosFormatados} min/km`;
}

function resetFormToCreateMode() {
    form.reset();
    editMode = false;
    editId = null;
    btnSalvar.textContent = 'Guardar Corrida';
    btnSalvar.style.backgroundColor = 'var(--cor-destaque)';
    btnCancelar.style.display = 'none';
}

// --- Lógica de Ordenação e Renderização ---

function aplicarOrdenacao() {
    const criterio = filtroSelect.value;
    
    // Cria cópia do array para ordenar
    let listaOrdenada = [...todasAsCorridas];

    listaOrdenada.sort((a, b) => {
        let valorA, valorB;

        switch (criterio) {
            case 'distancia':
                valorA = a.distanciaKm;
                valorB = b.distanciaKm;
                break;
            case 'tempo':
                valorA = a.tempoMinutos;
                valorB = b.tempoMinutos;
                break;
            case 'pace':
                // Evita divisão por zero
                valorA = (a.distanciaKm > 0) ? (a.tempoMinutos / a.distanciaKm) : 0;
                valorB = (b.distanciaKm > 0) ? (b.tempoMinutos / b.distanciaKm) : 0;
                break;
            case 'data':
            default:
                valorA = new Date(a.data).getTime();
                valorB = new Date(b.data).getTime();
                break;
        }

        if (valorA < valorB) return ordemDecrescente ? 1 : -1;
        if (valorA > valorB) return ordemDecrescente ? -1 : 1;
        return 0;
    });

    renderCorridas(listaOrdenada);
}

function renderCorridas(corridas) {
    listaCorridas.innerHTML = ''; 

    if (corridas.length === 0) {
        listaCorridas.innerHTML = '<p style="text-align:center;">Nenhuma corrida registada ainda.</p>';
        return;
    }

    corridas.forEach(corrida => {
        const item = document.createElement('li');
        item.className = 'corrida-item';
        const pace = calcularPace(corrida.distanciaKm, corrida.tempoMinutos);
        item.innerHTML = `
            <div class="corrida-info">
                <strong>${formatarData(corrida.data)}</strong>
                <p>${corrida.local || 'Local não informado'}</p>
            </div>
            <div class="corrida-stats">
                <span>${corrida.distanciaKm.toFixed(2)} km</span> / 
                <span>${corrida.tempoMinutos} min</span>
                <p class="pace">Pace: ${pace}</p>
            </div>
            <div class="corrida-acoes">
                <button class="btn-editar" data-id="${corrida.id}">Editar</button>
                <button class="btn-excluir" data-id="${corrida.id}">Excluir</button>
            </div>
        `;
        listaCorridas.appendChild(item);
    });
}

// --- Lógica da Aplicação (Consumo da API) ---
async function fetchCorridas() {
    clearError();
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch(API_CORRIDAS_URL);
        if (!response.ok) throw new Error(`Falha na rede: ${response.statusText}`);

        const dados = await response.json();
        
        // Atualiza estado global e aplica ordenação inicial
        todasAsCorridas = dados;
        aplicarOrdenacao();

    } catch (error) {
        showError(error.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault(); 
    clearError();
    const corridaData = {
        data: inputData.value,
        distanciaKm: parseFloat(inputDistancia.value),
        tempoMinutos: parseInt(inputTempo.value, 10),
        local: inputLocal.value || null
    };

    try {
        let response;
        if (editMode) {
            const corridaAtualizada = { ...corridaData, id: editId }; 
            response = await fetch(`${API_CORRIDAS_URL}/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(corridaAtualizada)
            });
        } else {
            response = await fetch(API_CORRIDAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(corridaData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.title || 'Erro ao processar solicitação');
        }

        resetFormToCreateMode();
        await fetchCorridas(); // Recarrega e reordena

    } catch (error) {
        showError(error.message);
    }
}

async function handleDeleteClick(id) {
    clearError();
    if (!confirm('Tem a certeza que deseja eliminar esta corrida?')) return;

    try {
        const response = await fetch(`${API_CORRIDAS_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Falha ao eliminar a corrida.');
        await fetchCorridas();
    } catch (error) {
        showError(error.message);
    }
}

async function handleEditClick(id) {
    clearError();
    try {
        const response = await fetch(`${API_CORRIDAS_URL}/${id}`);
        if (!response.ok) throw new Error('Falha ao buscar dados para edição.');

        const corrida = await response.json();
        const dataLocal = new Date(corrida.data);
        const dataParaInput = new Date(dataLocal.getTime() - (dataLocal.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        
        inputData.value = dataParaInput;
        inputDistancia.value = corrida.distanciaKm;
        inputTempo.value = corrida.tempoMinutos;
        inputLocal.value = corrida.local;
        
        editMode = true;
        editId = corrida.id;
        
        btnSalvar.textContent = 'Salvar Alterações';
        btnSalvar.style.backgroundColor = '#FFB800';
        btnCancelar.style.display = 'inline-block';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        showError(error.message);
    }
}

async function handleListClick(event) {
    const id = event.target.dataset.id;
    if (event.target.classList.contains('btn-excluir')) {
        await handleDeleteClick(id);
    } else if (event.target.classList.contains('btn-editar')) {
        await handleEditClick(id);
    }
}

// --- Event Listeners dos Filtros ---
filtroSelect.addEventListener('change', aplicarOrdenacao);

btnOrdem.addEventListener('click', () => {
    ordemDecrescente = !ordemDecrescente; // Inverte estado
    btnOrdem.innerText = ordemDecrescente ? "⬇" : "⬆";
    aplicarOrdenacao(); // Reordena visualmente
});

// --- Inicialização ---
form.addEventListener('submit', handleFormSubmit);
listaCorridas.addEventListener('click', handleListClick);
btnCancelar.addEventListener('click', resetFormToCreateMode);

document.addEventListener('DOMContentLoaded', () => {
    fetchCorridas();
    resetFormToCreateMode();
});