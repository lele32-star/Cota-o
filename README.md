# Hawker 400 Study App

Aplicativo web estático para estudo do Hawker 400. Funciona em qualquer navegador moderno abrindo o `index.html` diretamente (sem servidor) e roda offline após o primeiro carregamento.

## Como abrir
1. Coloque `index.html`, `styles.css`, `app.js` e um arquivo `data.json` na mesma pasta.
2. Abra o arquivo `index.html` no navegador.
3. Todo o progresso fica salvo no `localStorage` do navegador.

## Dados (data.json)
- Substitua o `data.json` pelo novo arquivo ou use **Importar JSON** na aba **Conteúdo** para fazer merge dos dados.
- O arquivo deve seguir este formato:

```json
{
  "memory": [],
  "flash": [
    { "id": "fc-0001", "front": "Pergunta", "back": "Resposta" }
  ]
}
```

## Flashcards e revisão espaçada
- A aba **Flashcards** usa o algoritmo SM-2 simplificado.
- Após ver a frente, clique em **Mostrar resposta** e depois em **Difícil**, **Ok** ou **Fácil**.
- Os cartões são reexibidos com base no intervalo calculado: respostas mais fáceis aumentam o intervalo; difíceis voltam mais cedo.

## Memory Items
- A aba **Memory Items** apresenta um cenário por vez.
- Clique nos passos na ordem correta para montar a sequência.
- Use **Checar** para ver o resultado, **Refazer** para tentar novamente ou **Próximo** para outro cenário.
- Um timer opcional (definido em Config) reduz pontos se o tempo acabar.

## Conteúdo
- **Exportar JSON** baixa todo o conteúdo atual (sem progresso de estudo).
- **Importar JSON** permite adicionar/atualizar cartões.
- **Limpar progresso** zera apenas os dados de revisão espaçada e pontuações.

## Config
- Ajuste o tempo do jogo de Memory Items e a meta diária de flashcards.
- Clique em **Salvar** para gravar no navegador.

## Privacidade
Todo o conteúdo e progresso ficam apenas no seu navegador. Nenhuma informação é enviada a servidores.
