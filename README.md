# Hawker 400 Trainer

Aplicativo web estático para estudo do Hawker/Beechjet 400/400A com modos Treino e Desafio.

## Como rodar
1. Abra `index.html` no navegador.
2. Escolha ou crie um jogador no topo da página.
3. Ajuste categorias, quantidade de questões e tempo.
4. Clique em **Treino** ou **Desafio**.

## Adicionando questões
Os dados residem em `data.js` e seguem o esquema:

```js
export const QUESTIONS = {
  limitations: [ { id, type, question, options?, answer, tolerance?, reference } ],
  memoryItems: [ { id, title, prompt, officialSequence, acceptableKeywords, hint?, reference } ]
};
```

Adicione novas categorias criando novas chaves dentro de `QUESTIONS` e marque-as no dashboard.

## Persistência
O progresso e histórico ficam no `localStorage` usando a chave prefixo `h400.`. Para exportar:

```js
JSON.stringify(localStorage, null, 2);
```

Para importar, cole o JSON no console e atribua às chaves `localStorage` correspondentes.

## Configurações
- Tempo por questão: ilimitado, 15, 30 ou 60 segundos.
- Som: ativar/desativar.
- Filtro por categorias e quantidade de questões.

## Créditos
Material didático. Não substitui AFM/POH/QRH nem treinamento aprovado.
