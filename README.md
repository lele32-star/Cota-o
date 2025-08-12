# Hawker 400 Trainer

Aplicativo web estático para estudo de flash cards e memory items do Hawker/Beechjet 400/400A.

## Como usar
1. Abra `index.html` no navegador.
2. Selecione o modo desejado em **Treino**: Flash Cards ou Memory Items.
3. Para alterar tempo por pergunta ou tolerância numérica, acesse a aba **Config**.

## Banco de dados
Os dados estão em `data/hawker400.json`. Troque ou acrescente questões editando esse arquivo. Mantenha o esquema:

```json
{
  "flash": [ { "id": "...", "front": "...", "back": "...", "tags": [], "source": {...} } ],
  "memory": [ { "id": "...", "title": "...", "steps": ["..."], "tags": [], "source": {...} } ]
}
```

## Firebase (opcional)
O modo online ainda não está implementado. Para futuras integrações, adicione a configuração Firebase em `app.js` no objeto `firebaseConfig`.

## Offline
Todos os arquivos são estáticos; basta abrir `index.html` para funcionar offline.
