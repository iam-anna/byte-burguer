# byte-burguer

Você é o gerente de um restaurante digital chamado ByteBurger. No ByteBurger, você tem várias tarefas que precisam ser executadas para preparar um pedido, como cortar ingredientes, grelhar hambúrgueres e montar os pratos. Para garantir que os pedidos sejam preparados de forma eficiente e rápida, você pode contratar "funcionários digitais" (Web Workers) para cada tipo de tarefa.

## Tarefa:
Implementar um sistema em JavaScript usando Web Workers. Cada worker deve lidar com uma tarefa específica e todas as tarefas devem ser coordenadas para completar os pedidos de forma eficiente e rápida.

## Instruções:
### 1. Implementação:
- **Abordagens:** Um dos integrantes da dupla deve implementar a estratégia I enquanto o outro integrante implementa a estratégia II

I. Crie um Web Worker para cada tarefa: cortar, montar, grelhar e fazer bebidas; 

II. Crie 4 Web Workers que podem fazer qualquer uma das tarefas;

  - O script principal deve enviar pedidos aos workers e coordenar a
sequência de tarefas.
  - Utilize postMessage para enviar tarefas aos workers e onmessage para
receber notificações de conclusão.
  - Faça a geração e teste de pedidos para verificar o funcionamento da
aplicação;

### 2. Mecanismos de gerenciamento:
- Múltiplos pedidos: Adicione um mecanismo para lidar com múltiplos pedidos simultaneamente;
- Status do pedido: calcular o tempo total de preparação e apresentar essa estimativa para o ‘cliente’;
- Priorização de pedidos: Adicionar uma prioridade aos pedidos para processar pedidos importantes mais rapidamente;
- Cancelamento de pedidos: Adicionar um mecanismo de cancelamento de pedido fazendo com que o preparo do pedido seja interrompido;

### 3. Limitações:
- Grelha: é possível grelhar apenas 4 hamburguers simultaneamente;
- Corte: só há espaço para armazenar ingredientes cortados para 7
lanches ou bebidas;
- Bebidas: as bebidas são preparadas uma por vez.

## Menu:
### 1. Callback Burguer:
  - Cortar ingredientes: 3 segundos   
  - Grelhar: 8 segundos   
  - Montar o prato: 2 segundos
### 2. Null-Burguer (veg):
  - Cortar ingredientes: 4 segundos
  - Grelhar: 7 segundos
  - Montar o prato: 2 segundos
### 3. Crispy Turing:
  - Cortar ingredientes: 2 segundos
  - Grelhar: 10 segundos
  - Montar o prato: 1 segundos
### 4. Mongo Melt:
  - Cortar ingredientes: 1 segundo;
  - Grelhar: 3 segundos
### 5. Webwrap:
  - Cortar ingredientes: 4 segundos
  - Montar o prato: 2 segundos
### 6. NPM Nuggets:
  - Fritar: 4 segundos
### 7. Float Juice:
  - Cortar ingredientes: 4 segundos
  - Preparar Bebida: 3 segundos
### 8. Array Apple: perfeita.
  - Cortar ingredientes: 4 segundos
  - Preparar bebida: 3 segundos
### 9. Async Berry: Um suco de frutas vermelhas com um toque assíncrono.
  - Cortar ingredientes: 2 segundos;
  - Preparar bebida: 2 segundos;
