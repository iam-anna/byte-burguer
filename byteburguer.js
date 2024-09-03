// Restaurante Digital  ByteBurger - Web Workers Generalistas (Abordagem II) - Kauê
 
const tempoProduto = {
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

const quantidadeMax = 15;
const grelharMax = 4; 
const ingredienteMax = 7; 
const bebidaMax = 1;

let grelhando = 0;
let cortando = 0;
let preparandoBebidas = 0;

let pedidos = [];
let proximoId = 1;
let workers = [
    { id: 1, ocupado: false, tarefaAtual: null, pedidoId: null },
    { id: 2, ocupado: false, tarefaAtual: null, pedidoId: null },
    { id: 3, ocupado: false, tarefaAtual: null, pedidoId: null },
    { id: 4, ocupado: false, tarefaAtual: null, pedidoId: null }
    ];

const workerScripts = Array.from({ length: workers.length }, (_, i) => new Worker('worker.js'));

document.getElementById('addOrder').addEventListener('click', criarPedido);
document.getElementById('clearOrders').addEventListener('click', limparHistorico);
document.getElementById('clearCompleted').addEventListener('click', limparConcluidos);
document.querySelectorAll('.products button input').forEach(input => {
        input.addEventListener('input', validarQuantidade);
});


function validarQuantidade(event) {
        const input = event.target;
        const quantidade = parseInt(input.value) || 0;
        if (quantidade > quantidadeMax) {
            input.value = quantidadeMax;
            mostrarAlerta(`A quantidade máxima permitida para ${input.parentElement.getAttribute('data-product')} é ${quantidadeMax}.`);
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
            if (produto.quantidade > quantidadeMax) {
                mostrarAlerta(`A quantidade máxima permitida para ${produto.nome} é ${quantidadeMax}.`);
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
    let filaGrelharPrioritaria = 0;
    let filaCortarPrioritaria = 0;
    let filaMontarPrioritaria = 0;
    let filaPrepararPrioritaria = 0;

    let filaGrelharNormal = 0;
    let filaCortarNormal = 0;
    let filaMontarNormal = 0;
    let filaPrepararNormal = 0;

    pedidos.forEach(pedido => {
        if (pedido.status === 'pronto' || pedido.status === 'cancelado') return;

        pedido.produtos.forEach(produto => {
            const tempos = tempoProduto[produto.nome];
            if (tempos) {
                if (pedido.prioridade) {
                    filaCortarPrioritaria += tempos.cortar ? tempos.cortar * produto.quantidade : 0;
                    filaGrelharPrioritaria += tempos.grelhar ? tempos.grelhar * produto.quantidade : 0;
                    filaMontarPrioritaria += tempos.montar ? tempos.montar * produto.quantidade : 0;
                    filaPrepararPrioritaria += tempos.preparar ? tempos.preparar * produto.quantidade : 0;
                } else {
                    filaCortarNormal += tempos.cortar ? tempos.cortar * produto.quantidade : 0;
                    filaGrelharNormal += tempos.grelhar ? tempos.grelhar * produto.quantidade : 0;
                    filaMontarNormal += tempos.montar ? tempos.montar * produto.quantidade : 0;
                    filaPrepararNormal += tempos.preparar ? tempos.preparar * produto.quantidade : 0;
                }
            }
        });
    });
    produtos.forEach(produto => {
        const tempos = tempoProduto[produto.nome];
        if (tempos) {
            if (tempos.cortar) {
                const tempoEsperaCorte = (filaCortarPrioritaria / ingredienteMax) + (filaCortarNormal / ingredienteMax);
                tempoTotal += tempoEsperaCorte + (tempos.cortar * produto.quantidade);
            }
            if (tempos.grelhar) {
                const tempoEsperaGrelhar = (filaGrelharPrioritaria / grelharMax) + (filaGrelharNormal / grelharMax);
                tempoTotal += tempoEsperaGrelhar + (tempos.grelhar * produto.quantidade);
            }
            if (tempos.montar) {
                const tempoEsperaMontar = (filaMontarPrioritaria / ingredienteMax) + (filaMontarNormal / ingredienteMax);
                tempoTotal += tempoEsperaMontar + (tempos.montar * produto.quantidade);
            }
            if (tempos.preparar) {
                const tempoEsperaPreparar = (filaPrepararPrioritaria / bebidaMax) + (filaPrepararNormal / bebidaMax);
                tempoTotal += tempoEsperaPreparar + (tempos.preparar * produto.quantidade);
            }
        }
    });

    return tempoTotal;
}


function formatarTempo(tempoEmSegundos) {
    const minutos = Math.floor(tempoEmSegundos / 60);
    const segundos = Math.ceil(tempoEmSegundos % 60);

    if (minutos > 0) {
        return `${minutos} minuto(s) e ${segundos} segundo(s)`;
    } else {
        return `${segundos} segundo(s)`;
    }
}


function verificarConclusaoPedido(pedidoId) {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) return false;
        const todasTarefasConcluidas = pedido.produtos.every(produto => {
            const acoesProduto = Object.keys(tempoProduto[produto.nome] || {});
            return acoesProduto.every(acao => pedido.progresso[acao] >= 100);
        });
        if (todasTarefasConcluidas) {
            pedido.status = 'pronto';
            pedido.tempoRestante = 0;
            workers.forEach(worker => {
                if (worker.pedidoId === pedidoId) {
                    worker.ocupado = false;
                    worker.tarefaAtual = null;
                    worker.pedidoId = null;
                }
            });
        }
        return pedido.status === 'pronto';
}


function atualizarInterface() {
        const ordersContainer = document.querySelector('.orders');
        ordersContainer.innerHTML = '';
        pedidos.forEach(pedido => {
            if (pedido.status === 'cancelado') return;
            const card = document.createElement('div');
            card.className = `order-item ${pedido.status}`;
            const todasAcoes = new Set();
            pedido.produtos.forEach(produto => {
                const acoesProduto = Object.keys(tempoProduto[produto.nome] || {});
                acoesProduto.forEach(acao => todasAcoes.add(acao));
            });
            const header = document.createElement('div');
            header.className = 'header';
            header.innerHTML = `
                <h3>Pedido #${pedido.id}</h3>
                <button class="delete-btn" onclick="cancelarPedido(${pedido.id})">X</button>
                ${pedido.status === 'pronto' ? '<div class="status"><i class="fas fa-check-circle"></i> <strong>Concluído</strong></div>' : ''}
                <p>Tempo Estimado: ${formatarTempo(pedido.tempoEstimado)} (a partir do início da execução)</p>
                ${pedido.prioridade ? '<p>- <u>Alta Prioridade</u></p>' : ''}`;

            const progress = document.createElement('div');
            progress.className = 'progress';
            todasAcoes.forEach(acao => {
                const progresso = pedido.progresso[acao] || 0;
                const tarefaClass = progresso >= 100 ? 'complete' : '';
                progress.innerHTML += `
                    <div class="progress-task ${tarefaClass}">
                        <p><strong>${primeiraLetra(acao)}</strong></p>
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


function resetarFormulario() {
        document.querySelectorAll('.products button input').forEach(input => input.value = '0');
        document.getElementById('prioridade').checked = false;
}


function atualizarMonitoramentoWorkers() {
        const workerStatusContainer = document.getElementById('workerStatus');
        workerStatusContainer.innerHTML = '';
        workers.forEach(worker => {
            const status = worker.ocupado ? 'Ocupado' : 'Livre';
            const tarefa = worker.tarefaAtual ? primeiraLetra(worker.tarefaAtual) : 'Nenhuma';
            const pedidoId = worker.pedidoId !== null ? worker.pedidoId : 'Nenhum';

            const li = document.createElement('li');
            li.className = 'worker-status';
            li.innerHTML = `
                <span>Worker ${worker.id}:</span>
                <span>Status: ${status}</span>
                <span>Tarefa: ${tarefa}</span>
                <span>Pedido ID: ${pedidoId}</span>`;

            workerStatusContainer.appendChild(li);
        });
}

setInterval(atualizarMonitoramentoWorkers, 1000);

async function executarTarefa(worker, tarefa) {
        return new Promise(resolve => {
            worker.ocupado = true;
            worker.tarefaAtual = tarefa.acao;
            worker.pedidoId = tarefa.pedidoId;

            workerScripts[worker.id - 1].postMessage({
                tarefa: {
                    acao: tarefa.acao,
                    tempo: tarefa.tempo
                },
                pedidoId: tarefa.pedidoId
            });

            workerScripts[worker.id - 1].onmessage = function (e) {
                const { pedidoId, tarefa, cancelado } = e.data;

                if (cancelado) {
                    worker.ocupado = false;
                    worker.tarefaAtual = null;
                    worker.pedidoId = null;
                    resolve();
                    return;
                }

                console.log(`Worker ${worker.id} concluiu a tarefa ${tarefa.acao} para o pedido ${pedidoId}`);
                const pedido = pedidos.find(p => p.id === pedidoId);
                if (pedido) {
                    if (pedido.status === 'em espera') {
                        pedido.progresso[tarefa.acao] += 100 / pedido.produtos.length;
                        pedido.tempoRestante -= tarefa.tempo;

                        if (verificarConclusaoPedido(pedido.id)) {
                            pedido.tempoRestante = 0;
                        }

                        atualizarInterface();
                    }
                }
                worker.ocupado = false;
                worker.tarefaAtual = null;
                worker.pedidoId = null;
                resolve();
            };

            workerScripts[worker.id - 1].onerror = function (e) {
                console.error(`Erro no Worker ${worker.id}: ${e.message}`);
                worker.ocupado = false;
                worker.tarefaAtual = null;
                worker.pedidoId = null;
                resolve();
            };
        });
}


function cancelarPedido(idPedido) {
        console.log(`Iniciando cancelamento do pedido #${idPedido}`);
        const pedido = pedidos.find(p => p.id === idPedido);
        if (!pedido) {
            return;
        }
        pedidos = pedidos.filter(p => p.id !== idPedido);
        console.log(`Pedido #${idPedido} removido da lista de pedidos.`);
        workers.forEach(worker => {
            if (worker.pedidoId === idPedido) {
                console.log(`Liberando worker ${worker.id} que estava processando o pedido #${idPedido}`);
                workerScripts[worker.id - 1].postMessage({ comando: 'cancelar', pedidoId: idPedido });
                worker.ocupado = false;
                worker.tarefaAtual = null;
                worker.pedidoId = null;
                console.log(`Comando de cancelamento enviado ao worker ${worker.id} para o pedido #${idPedido}`);
            }
        });
        atualizarInterface();
        const pedidosPendentes = pedidos.filter(pedido => pedido.status === 'em espera');
        if (pedidosPendentes.length > 0) {
            processarPedidos();
        }
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
            const acoesProduto = Object.keys(tempoProduto[produto.nome] || {});
            acoesProduto.forEach(acao => {
                if (acao === 'grelhar' && grelhando >= grelharMax) return;
                if (acao === 'cortar' && cortando >= ingredienteMax) return;
                if (acao === 'preparar' && preparandoBebidas >= bebidaMax) return;
                for (let i = 0; i < produto.quantidade; i++) {
                    tarefas[acao].push({ produto, tempo: tempoProduto[produto.nome][acao], pedidoId: pedido.id, acao });
                }
            });
        });
    });

    for (const tipo in tarefas) {
        tarefas[tipo] = tarefas[tipo].filter(tarefa => 
            !pedidos.some(pedido => pedido.id === tarefa.pedidoId && (pedido.status === 'cancelado' || pedido.status === 'pronto'))
        );
    }

    const todasTarefas = [
        ...tarefas.grelhar,
        ...tarefas.cortar,
        ...tarefas.preparar,
        ...tarefas.montar
    ];

    const tarefasPorTipo = {
        cortar: Math.min(todasTarefas.filter(tarefa => tarefa.acao === 'cortar').length, ingredienteMax),
        grelhar: Math.min(todasTarefas.filter(tarefa => tarefa.acao === 'grelhar').length, grelharMax),
        montar: Math.min(todasTarefas.filter(tarefa => tarefa.acao === 'montar').length, ingredienteMax),
        preparar: Math.min(todasTarefas.filter(tarefa => tarefa.acao === 'preparar').length, bebidaMax)
    };

    let prepararEmAndamento = 0;

    for (const tarefa of todasTarefas) {
        if (tarefasPorTipo[tarefa.acao] <= 0) {
            continue;
        }
        if (tarefa.acao === 'preparar' && prepararEmAndamento >= bebidaMax) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return processarPedidos(); 
        }
        const worker = workers.find(w => !w.ocupado);
        if (worker) {
            await executarTarefa(worker, tarefa);
            if (tarefa.acao === 'preparar') {
                prepararEmAndamento++;
            }
            tarefasPorTipo[tarefa.acao]--;
        }
    }
    if (pedidosPendentes.length > 0) {
        processarPedidos();
    }
}


function limparHistorico() {
        pedidos.forEach(pedido => {
            workers.forEach(worker => {
                if (worker.pedidoId === pedido.id) {
                    workerScripts[worker.id - 1].postMessage({ comando: 'cancelar', pedidoId: pedido.id });
                    worker.ocupado = false;
                    worker.tarefaAtual = null;
                    worker.pedidoId = null;
                }
            });
        });
        pedidos = [];
        atualizarInterface();
}


function limparConcluidos() {
        pedidos = pedidos.filter(pedido => pedido.status !== 'pronto');
        atualizarInterface();
}


function primeiraLetra(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
}