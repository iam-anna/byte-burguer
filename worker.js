onmessage = function (e) {
    const { tarefa, pedidoId } = e.data;
    setTimeout(() => {
        postMessage({ pedidoId, tarefa });
    }, tarefa.tempo * 1000);
};