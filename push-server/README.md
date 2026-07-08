# 🔔 Push Server — Milionários da Leograf

Servidor de notificações push usando **[web-push](https://github.com/web-push-libs/web-push)** npm.  
Substitui o OneSignal com Web Push VAPID nativo (padrão W3C).

## Chaves VAPID deste projeto

```
VAPID_PUBLIC_KEY  = BF7CTJu4zV4BzsxBG_YKGqMGqHZS26FDppElgcOe8uKyiLht6Q_LOy_02CH7dEK9KUrrzlgfTw3lSXooY71Nr60
VAPID_PRIVATE_KEY = TUbOfUZ1GAakQYzP2RvcbFmyNLLQfLJrnvhT5n8_f_8
```

> ⚠️ **Mantenha a `VAPID_PRIVATE_KEY` em segredo** — nunca comite ela no repositório.  
> A `VAPID_PUBLIC_KEY` é pública e já está hardcoded no `script.js`.

---

## Opção A: GitHub Actions (100% grátis, sem servidor)

O workflow `.github/workflows/push-notifications.yml` roda automaticamente  
de segunda a sábado e verifica se saiu resultado novo.

### Setup (1 vez só):

1. Vá em **Settings → Secrets and variables → Actions → Secrets** no seu repositório
2. Adicione:

| Secret | Valor |
|--------|-------|
| `VAPID_PRIVATE_KEY` | `TUbOfUZ1GAakQYzP2RvcbFmyNLLQfLJrnvhT5n8_f_8` |
| `VAPID_EMAIL` | `mailto:seuemail@gmail.com` |
| `SUBSCRIPTIONS_JSON` | JSON das subscriptions (ver abaixo) |

### Como obter o SUBSCRIPTIONS_JSON:

Cada membro do bolão que quiser receber notificações deve:

1. Abrir o app no celular/computador
2. Clicar em **🔔 Ativar Notificações** e aceitar
3. Abrir o console do navegador (F12 → Console)
4. Executar: `console.log(localStorage.getItem('pushSubscription'))`
5. Copiar o JSON exibido

Para múltiplos membros, junte os JSONs em um array:
```json
[
  { "endpoint": "https://fcm.googleapis.com/...", "keys": {...} },
  { "endpoint": "https://fcm.googleapis.com/...", "keys": {...} }
]
```

Salve todo esse array no secret `SUBSCRIPTIONS_JSON`.

---

## Opção B: Servidor próprio (Railway / Render / Fly.io — plano grátis)

### Setup:

```bash
cd push-server
npm install
```

### Variáveis de ambiente:

```env
VAPID_PUBLIC_KEY=BF7CTJu4zV4BzsxBG_YKGqMGqHZS26FDppElgcOe8uKyiLht6Q_LOy_02CH7dEK9KUrrzlgfTw3lSXooY71Nr60
VAPID_PRIVATE_KEY=TUbOfUZ1GAakQYzP2RvcbFmyNLLQfLJrnvhT5n8_f_8
VAPID_EMAIL=mailto:seuemail@gmail.com
ALLOWED_ORIGIN=https://delima20k.github.io
PORT=3000
```

### Rodar:

```bash
node server.js
```

### Após deploy, configure a URL em `script.js`:

```javascript
// Linha com PUSH_SERVER_URL em script.js:
const PUSH_SERVER_URL = localStorage.getItem('pushServerUrl') || 'https://SEU-APP.railway.app';
```

### Endpoints disponíveis:

| Método | URL | Descrição |
|--------|-----|-----------|
| `GET` | `/` | Health check + contagem de subscriptions |
| `GET` | `/vapid-public-key` | Retorna a chave pública VAPID |
| `POST` | `/subscribe` | Registra nova subscription |
| `POST` | `/unsubscribe` | Remove subscription |
| `POST` | `/send` | Envia push manual (teste) |
| `POST` | `/check-and-send` | Verifica API Lotofácil e envia se houver resultado novo |

---

## Novas chaves VAPID (se necessário):

```bash
node generate-keys.js
```

Substitua as chaves em `script.js` (public key) e nas variáveis de ambiente (private key).
