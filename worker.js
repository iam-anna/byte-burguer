let tarefaAtual = null;
let pedidoIdAtual = null;
let cancelado = false;

self.onmessage = function(e) {
    const { tarefa, pedidoId, comando } = e.data;
    console.log(`Recebido pedido ID: ${pedidoId}`);
    if (comando === 'cancelar') {
        if (pedidoIdAtual === pedidoId) {
            cancelado = true;
            console.log(`Pedido ${pedidoId} cancelado.`);
        } else {
        }
        return;
    }
    if (tarefa) {
        tarefaAtual = tarefa;
        pedidoIdAtual = pedidoId;
        cancelado = false;
        const tempoSimulacao = tarefa.tempo * 1000;
        let tempoDecorrido = 0;

        const interval = setInterval(() => {
            if (cancelado) {
                clearInterval(interval);
                return;
            }
            tempoDecorrido += 100;
            if (tempoDecorrido >= tempoSimulacao) {
                clearInterval(interval);
                self.postMessage({ pedidoId, tarefa });
            }
        }, 100);
    }
};