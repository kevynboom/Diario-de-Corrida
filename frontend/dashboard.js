// --- Configuração ---
const API_CORRIDAS_URL = 'http://localhost:5184/api/Corridas';

let editMode = false;
let editId = null;

// Controle de Listagem e Paginação
let todasAsCorridas = []; // Array completo original
let listaFiltrada = [];   // Array ordenado/filtrado
let ordemDecrescente = true;

// Paginação
let paginaAtual = 1;
const itensPorPagina = 10;

// --- Elementos do DOM ---
const form = document.getElementById('form-corrida');
const listaCorridas = document.getElementById('lista-corridas');
const loadingDiv = document.getElementById('loading');
const errorMessageDiv = document.getElementById('error-message');

// Inputs
const inputData = document.getElementById('data');
const inputDistancia = document.getElementById('distancia');
const inputTempo = document.getElementById('tempo');
const inputLocal = document.getElementById('local');

// Botões Form
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');

// Filtro e Paginação
const filtroSelect = document.getElementById('filtroSelect');
const btnOrdem = document.getElementById('btnOrdem');
const divPaginacao = document.getElementById('paginacao');
const btnAnt = document.getElementById('btn-ant');
const btnProx = document.getElementById('btn-prox');
const infoPagina = document.getElementById('info-pagina');

// Stats
const statTotalCorridas = document.getElementById('stat-total-corridas');
const statTotalDistancia = document.getElementById('stat-total-distancia');
const statPaceMedio = document.getElementById('stat-pace-medio');

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
    if (distancia <= 0 || tempo <= 0) return "0:00 min/km";
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
    
    // Limpar validações visuais
    [inputData, inputDistancia, inputTempo].forEach(input => {
        input.classList.remove('invalido');
        document.getElementById(`erro-${input.id}`).textContent = '';
    });
    btnSalvar.disabled = false;

    btnSalvar.textContent = 'Guardar Corrida';
    btnSalvar.style.backgroundColor = 'var(--cor-destaque)';
    btnCancelar.style.display = 'none';
}

// --- 1. Lógica do Dashboard (Estatísticas) ---
function atualizarDashboard(corridas) {
    const totalCorridas = corridas.length;
    
    const totalDistancia = corridas.reduce((acc, curr) => acc + curr.distanciaKm, 0);
    const totalTempo = corridas.reduce((acc, curr) => acc + curr.tempoMinutos, 0);

    statTotalCorridas.textContent = totalCorridas;
    statTotalDistancia.textContent = totalDistancia.toFixed(2);
    
    // Pace Médio Geral = Tempo Total / Distância Total
    statPaceMedio.textContent = calcularPace(totalDistancia, totalTempo);
}

// --- 2. Lógica de Validação Visual ---
function setupValidacao() {
    const validarInputs = () => {
        let formValido = true;

        // Data não pode ser futura
        const dataSelecionada = new Date(inputData.value);
        const agora = new Date();
        const erroData = document.getElementById('erro-data');
        if (inputData.value && dataSelecionada > agora) {
            inputData.classList.add('invalido');
            erroData.textContent = 'Data não pode ser no futuro.';
            formValido = false;
        } else {
            inputData.classList.remove('invalido');
            erroData.textContent = '';
        }

        // Distância deve ser positiva
        const erroDist = document.getElementById('erro-distancia');
        if (inputDistancia.value && parseFloat(inputDistancia.value) <= 0) {
            inputDistancia.classList.add('invalido');
            erroDist.textContent = 'Distância deve ser maior que 0.';
            formValido = false;
        } else {
            inputDistancia.classList.remove('invalido');
            erroDist.textContent = '';
        }

        // Tempo deve ser positivo
        const erroTempo = document.getElementById('erro-tempo');
        if (inputTempo.value && parseFloat(inputTempo.value) <= 0) {
            inputTempo.classList.add('invalido');
            erroTempo.textContent = 'Tempo deve ser maior que 0.';
            formValido = false;
        } else {
            inputTempo.classList.remove('invalido');
            erroTempo.textContent = '';
        }

        btnSalvar.disabled = !formValido;
    };

    inputData.addEventListener('input', validarInputs);
    inputDistancia.addEventListener('input', validarInputs);
    inputTempo.addEventListener('input', validarInputs);
}

// --- 3. Lógica de Ordenação e Paginação ---

function aplicarOrdenacao() {
    const criterio = filtroSelect.value;
    
    // Ordena sobre a cópia global
    listaFiltrada = [...todasAsCorridas];

    listaFiltrada.sort((a, b) => {
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

    // Atualiza dashboard com os totais (baseado na lista atual/filtrada se houvesse filtro)
    atualizarDashboard(listaFiltrada);

    // Resetar para página 1 ao reordenar
    paginaAtual = 1;
    renderCorridasPaginadas();
}

function renderCorridasPaginadas() {
    listaCorridas.innerHTML = ''; 

    if (listaFiltrada.length === 0) {
        listaCorridas.innerHTML = '<p style="text-align:center;">Nenhuma corrida encontrada.</p>';
        divPaginacao.style.display = 'none';
        return;
    }

    // Cálculo da fatia (Slice)
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const corridasPagina = listaFiltrada.slice(inicio, fim);
    const totalPaginas = Math.ceil(listaFiltrada.length / itensPorPagina);

    // Renderiza itens
    corridasPagina.forEach(corrida => {
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

    // Atualiza controles de paginação
    if (listaFiltrada.length > itensPorPagina) {
        divPaginacao.style.display = 'flex';
        infoPagina.textContent = `Pág ${paginaAtual} de ${totalPaginas}`;
        btnAnt.disabled = paginaAtual === 1;
        btnProx.disabled = paginaAtual === totalPaginas;
    } else {
        divPaginacao.style.display = 'none';
    }
}

// Event Listeners Paginação
btnAnt.addEventListener('click', () => {
    if (paginaAtual > 1) {
        paginaAtual--;
        renderCorridasPaginadas();
    }
});

btnProx.addEventListener('click', () => {
    const totalPaginas = Math.ceil(listaFiltrada.length / itensPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        renderCorridasPaginadas();
    }
});

// --- API Functions ---

async function fetchCorridas() {
    clearError();
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch(API_CORRIDAS_URL);
        if (!response.ok) throw new Error(`Falha na rede: ${response.statusText}`);

        const dados = await response.json();
        
        todasAsCorridas = dados;
        aplicarOrdenacao(); // Isso chama renderCorridasPaginadas e atualizarDashboard

    } catch (error) {
        showError(error.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault(); 
    clearError();

    // Validação extra antes de enviar
    if (parseFloat(inputDistancia.value) <= 0 || parseFloat(inputTempo.value) <= 0) {
        alert("Verifique os valores inseridos.");
        return;
    }

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
        await fetchCorridas(); 

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
        
        // Remove validações antigas ao entrar em modo edição
        [inputData, inputDistancia, inputTempo].forEach(i => i.classList.remove('invalido'));
        document.querySelectorAll('.msg-erro').forEach(s => s.textContent = '');
        btnSalvar.disabled = false;

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
    ordemDecrescente = !ordemDecrescente; 
    btnOrdem.innerText = ordemDecrescente ? "⬇" : "⬆";
    aplicarOrdenacao(); 
});

// --- Inicialização ---
form.addEventListener('submit', handleFormSubmit);
listaCorridas.addEventListener('click', handleListClick);
btnCancelar.addEventListener('click', resetFormToCreateMode);

document.addEventListener('DOMContentLoaded', () => {
    setupValidacao(); // Ativa os listeners de validação
    fetchCorridas();
    resetFormToCreateMode();
});