// Restaurante Digital  ByteBurger - Web Workers Generalistas (Abordagem II) - Kauê

const TEMPO_PRODUTOS = {
    "Callback Burger": { cortar: 3, grelhar: 8, montar: 2 },
    "Null-Burguer (veg)": { cortar: 4, grelhar: 7, montar: 2 },
    "Crispy Turing": { cortar: 2, grelhar: 10, montar: 1 },
    "Mongo Melt": { cortar: 1, grelhar: 3 },
    "Webwrap": { cortar: 4, montar: 2 },
    "NPM Nuggets": { grelhar: 4 },
    "Float Juice": { cortar: 4, preparar: 3 },
    "Array Apple": { cortar: 4, preparar: 3 },
    "Async Berry": { cortar: 2, preparar: 2 }
};

const MAX_QUANTIDADE = 15;
const MAX_GRELHAR = 4; 
const MAX_INGREDIENTES_CORTADOS = 7; 
const MAX_BEBIDAS_PREPARADAS = 1;

let pedidos = [];
let proximoId = 1;
let workers = [
    { id: 1, ocupado: false, tarefaAtual: null, pedidoId: null },
    { id: 2, ocupado: false, tarefaAtual: null, pedidoId: null },
    { id: 3, ocupado: false, tarefaAtual: null, pedidoId: null },
    { id: 4, ocupado: false, tarefaAtual: null, pedidoId: null }
];

document.getElementById('addOrder').addEventListener('click', criarPedido);
document.getElementById('clearOrders').addEventListener('click', limparHistorico);
document.getElementById('clearCompleted').addEventListener('click', limparConcluidos);

document.querySelectorAll('.products button input').forEach(input => {
    input.addEventListener('input', validarQuantidade);
});

function validarQuantidade(event) {
    const input = event.target;
    const quantidade = parseInt(input.value) || 0;
    if (quantidade > MAX_QUANTIDADE) {
        input.value = MAX_QUANTIDADE;
        mostrarAlerta(`A quantidade máxima permitida para ${input.parentElement.getAttribute('data-product')} é ${MAX_QUANTIDADE}.`);
    }
}

function mostrarAlerta(mensagem) {
    const alerta = document.createElement('div');
    alerta.className = 'alerta';
    alerta.textContent = mensagem;
    document.body.appendChild(alerta);
    setTimeout(() => alerta.remove(), 3000);
}

function criarPedido() {
    const produtos = Array.from(document.querySelectorAll('.products button'))
        .map(button => {
            const nome = button.getAttribute('data-product');
            const quantidade = parseInt(button.querySelector('input').value) || 0;
            return { nome, quantidade };
        })
        .filter(produto => produto.quantidade > 0);

    for (const produto of produtos) {
        if (produto.quantidade > MAX_QUANTIDADE) {
            mostrarAlerta(`A quantidade máxima permitida para ${produto.nome} é ${MAX_QUANTIDADE}.`);
            return;
        }
    }

    if (produtos.length === 0) {
        mostrarAlerta('Adicione produtos ao pedido!');
        return;
    }

    const prioridade = document.getElementById('prioridade').checked;
    const idPedido = proximoId++;
    const tempoEstimado = calcularTempoEstimado(produtos);

    const pedido = {
        id: idPedido,
        produtos,
        tempoEstimado,
        prioridade,
        status: 'em espera',
        tempoRestante: tempoEstimado,
        progresso: {
            cortar: 0,
            grelhar: 0,
            montar: 0,
            preparar: 0
        }
    };

    pedidos.push(pedido);
    atualizarInterface();
    processarPedidos();
    resetarFormulario();
}

function calcularTempoEstimado(produtos) {
    let tempoTotal = 0;
    produtos.forEach(produto => {
        const tempos = TEMPO_PRODUTOS[produto.nome];
        if (tempos) {
            if (tempos.cortar) tempoTotal += tempos.cortar * produto.quantidade;
            if (tempos.grelhar) tempoTotal += tempos.grelhar * produto.quantidade;
            if (tempos.montar) tempoTotal += tempos.montar * produto.quantidade;
            if (tempos.preparar) tempoTotal += tempos.preparar * produto.quantidade;
        }
    });
    return tempoTotal;
}

function formatarTempo(tempoEmSegundos) {
    if (tempoEmSegundos < 60) {
        return `${tempoEmSegundos} segundos`;
    } else {
        const minutos = Math.floor(tempoEmSegundos / 60);
        const segundos = tempoEmSegundos % 60;
        return `${minutos} minuto(s) ${segundos} segundo(s)`;
    }
}

function verificarConclusaoPedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return false;

    const todasAsTarefasConcluidas = pedido.produtos.every(produto => {
        const acoesProduto = Object.keys(TEMPO_PRODUTOS[produto.nome] || {});
        return acoesProduto.every(acao => pedido.progresso[acao] >= 100);
    });

    if (todasAsTarefasConcluidas) {
        pedido.status = 'pronto';
        pedido.tempoRestante = 0;
    }

    return pedido.status === 'pronto';
}

function atualizarInterface() {
    const ordersContainer = document.querySelector('.orders');
    ordersContainer.innerHTML = '';

    pedidos.forEach(pedido => {
        const card = document.createElement('div');
        card.className = `order-item ${pedido.status}`;

        const todasAsAcoes = new Set();
        pedido.produtos.forEach(produto => {
            const acoesProduto = Object.keys(TEMPO_PRODUTOS[produto.nome] || {});
            acoesProduto.forEach(acao => todasAsAcoes.add(acao));
        });

        const header = document.createElement('div');
        header.className = 'header';
        header.innerHTML = `
            <h3>Pedido #${pedido.id}</h3>
            <button class="delete-btn" onclick="cancelarPedido(${pedido.id})">X</button>
            ${pedido.status === 'pronto' ? '<div class="status"><i class="fas fa-check-circle"></i> <strong>Concluído</strong></div>' : ''}
            <p>Tempo Estimado: ${formatarTempo(pedido.tempoEstimado)}</p>
            ${pedido.prioridade ? '<p>- <u>Alta Prioridade</u></p>' : ''}`;

        const progress = document.createElement('div');
        progress.className = 'progress';
        todasAsAcoes.forEach(acao => {
            const progresso = pedido.progresso[acao] || 0;
            const tarefaClass = progresso >= 100 ? 'complete' : '';
            progress.innerHTML += `
                <div class="progress-task ${tarefaClass}">
                    <p><strong>${capitalizeFirstLetter(acao)}</strong></p>
                    ${progresso >= 100 ? '<span class="checkmark">&#10003;</span>' : ''}
                </div>`;
        });

        const produtos = document.createElement('div');
        produtos.innerHTML = `
            <div>Produtos:</div>
            <ul>
                ${pedido.produtos.map(p => `<li>${p.nome} - ${p.quantidade} unidade(s)</li>`).join('')}
            </ul>`;

        card.appendChild(header);
        card.appendChild(progress);
        card.appendChild(produtos);
        ordersContainer.appendChild(card);
    });

    atualizarMonitoramentoWorkers();
}

async function executarTarefa(worker, tarefa) {
    return new Promise(resolve => {
        worker.ocupado = true;
        worker.tarefaAtual = tarefa.acao;
        worker.pedidoId = tarefa.pedidoId;

        atualizarMonitoramentoWorkers();

        const intervalo = setInterval(() => {
            const pedido = pedidos.find(p => p.id === tarefa.pedidoId);

            if (!pedido || pedido.status === 'cancelado') {
                clearInterval(intervalo);
                worker.ocupado = false;
                worker.tarefaAtual = null;
                worker.pedidoId = null;
                atualizarMonitoramentoWorkers();
                resolve();
                return;
            }
        }, 100);

        setTimeout(() => {
            clearInterval(intervalo);
            const pedido = pedidos.find(p => p.id === tarefa.pedidoId);

            if (pedido && pedido.status !== 'cancelado' && pedido.status !== 'pronto') {
                pedido.progresso[tarefa.acao] += 100 / pedido.produtos.length;
                pedido.tempoRestante -= tarefa.tempo;
                if (verificarConclusaoPedido(pedido.id)) {
                    pedido.tempoRestante = 0;
                }
                atualizarInterface();
            }

            worker.ocupado = false;
            worker.tarefaAtual = null;
            worker.pedidoId = null;
            atualizarMonitoramentoWorkers();
            resolve();
        }, tarefa.tempo * 1000);
    });
}

function resetarFormulario() {
    document.querySelectorAll('.products button input').forEach(input => input.value = '0');
    document.getElementById('prioridade').checked = false;
}

function atualizarMonitoramentoWorkers() {
    const workerStatusContainer = document.getElementById('workerStatus');
    workerStatusContainer.innerHTML = '';

    workers.forEach(worker => {
        const status = worker.ocupado ? 'Ocupado' : 'Livre';
        const tarefa = worker.tarefaAtual ? capitalizeFirstLetter(worker.tarefaAtual) : 'Nenhuma';
        const pedidoId = worker.pedidoId !== null ? worker.pedidoId : 'Nenhum';

        const li = document.createElement('li');
        li.className = 'worker-status';
        li.innerHTML = `
            <span>Worker ${worker.id}:</span>
            <span>Status: ${status}</span>
            <span>Tarefa: ${tarefa}</span>
            <span>Pedido ID: ${pedidoId}</span>`
        ;

        workerStatusContainer.appendChild(li);
    });
}

async function processarPedidos() {
    const pedidosPendentes = pedidos
        .filter(pedido => pedido.status === 'em espera')
        .sort((a, b) => b.prioridade - a.prioridade);

    const tarefas = {
        cortar: [],
        grelhar: [],
        montar: [],
        preparar: []
    };

    pedidosPendentes.forEach(pedido => {
        pedido.produtos.forEach(produto => {
            const acoesProduto = Object.keys(TEMPO_PRODUTOS[produto.nome] || {});
            acoesProduto.forEach(acao => {
                for (let i = 0; i < produto.quantidade; i++) {
                    tarefas[acao].push({ produto, tempo: TEMPO_PRODUTOS[produto.nome][acao], pedidoId: pedido.id });
                }
            });
        });
    });

    const tarefasGrelhar = tarefas.grelhar.slice(0, MAX_GRELHAR);
    const tarefasCortar = tarefas.cortar.slice(0, MAX_INGREDIENTES_CORTADOS);
    const tarefasPreparar = tarefas.preparar.slice(0, MAX_BEBIDAS_PREPARADAS);
    const tarefasMontar = tarefas.montar;

    const todasTarefas = [
        ...tarefasGrelhar.map(tarefa => ({ ...tarefa, acao: 'grelhar' })),
        ...tarefasCortar.map(tarefa => ({ ...tarefa, acao: 'cortar' })),
        ...tarefasPreparar.map(tarefa => ({ ...tarefa, acao: 'preparar' })),
        ...tarefasMontar.map(tarefa => ({ ...tarefa, acao: 'montar' }))
    ];

    for (const tarefa of todasTarefas) {
        const worker = workers.find(w => !w.ocupado);
        if (worker) {
            await executarTarefa(worker, tarefa);
        }
    }

    if (pedidos.some(pedido => pedido.status === 'em espera')) {
        processarPedidos();
    }
}

function limparHistorico() {
    pedidos = [];
    atualizarInterface();
}

function limparConcluidos() {
    pedidos = pedidos.filter(pedido => pedido.status !== 'pronto');
    atualizarInterface();
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function cancelarPedido(idPedido) {
    const pedido = pedidos.find(p => p.id === idPedido);

    if (!pedido) {
        return; 
    }

    pedidos = pedidos.filter(p => p.id !== idPedido);
    
    workers.forEach(worker => {
        if (worker.pedidoId === idPedido) {
            worker.ocupado = false;
            worker.tarefaAtual = null;
            worker.pedidoId = null;
        }
    });

    atualizarInterface();
}

function fecharModal() {
    document.getElementById('confirmationModal').style.display = 'none';
    pedidoParaExcluir = null; 
}

function confirmarExclusao() {
    if (pedidoParaExcluir !== null) {
        pedidos = pedidos.filter(p => p.id !== pedidoParaExcluir);
        workers.forEach(worker => {
            if (worker.pedidoId === pedidoParaExcluir) {
                worker.ocupado = false;
                worker.tarefaAtual = null;
                worker.pedidoId = null;
            }
        });
        atualizarInterface();
    }
    fecharModal();
}

function mostrarConfirmacao(mensagem, idPedido) {
    return new Promise((resolve) => {
        pedidoParaExcluir = idPedido;
        document.getElementById('confirmationMessage').textContent = mensagem;
        document.getElementById('confirmationModal').style.display = 'block';

        document.getElementById('confirmButton').onclick = () => {
            confirmarExclusao();
            resolve();
        };

        document.getElementById('cancelButton').onclick = () => {
            fecharModal();
            resolve();
        };
    });
}
