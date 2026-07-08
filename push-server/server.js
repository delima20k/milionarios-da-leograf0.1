/**
 * 🔔 Milionários da Leograf — Push Notification Server
 * Usa web-push npm para enviar notificações VAPID reais.
 *
 * Deploy gratuito: Railway.app / Render.com / Fly.io
 *   1. npm install
 *   2. Defina as variáveis de ambiente (ver abaixo)
 *   3. node server.js
 *
 * Variáveis de ambiente necessárias:
 *   VAPID_PUBLIC_KEY   = BF7CTJu4zV4BzsxBG_YKGqMGqHZS26FDppElgcOe8uKyiLht6Q_LOy_02CH7dEK9KUrrzlgfTw3lSXooY71Nr60
 *   VAPID_PRIVATE_KEY  = TUbOfUZ1GAakQYzP2RvcbFmyNLLQfLJrnvhT5n8_f_8
 *   VAPID_EMAIL        = mailto:seuemail@gmail.com
 *   PORT               = 3000  (opcional, padrão 3000)
 *   ALLOWED_ORIGIN     = https://delima20k.github.io  (origem do PWA)
 */

const express = require('express');
const webpush  = require('web-push');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');

const app = express();

// ── Configuração ──────────────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  || 'BF7CTJu4zV4BzsxBG_YKGqMGqHZS26FDppElgcOe8uKyiLht6Q_LOy_02CH7dEK9KUrrzlgfTw3lSXooY71Nr60';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'TUbOfUZ1GAakQYzP2RvcbFmyNLLQfLJrnvhT5n8_f_8';
const VAPID_EMAIL       = process.env.VAPID_EMAIL       || 'mailto:contato@milionariosdaleograf.com';
const ALLOWED_ORIGIN    = process.env.ALLOWED_ORIGIN    || 'https://delima20k.github.io';
const PORT              = parseInt(process.env.PORT     || '3000', 10);

// Arquivo para persistir subscriptions entre reinícios do servidor
const SUBS_FILE = path.join(__dirname, 'subscriptions.json');

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// ── Helpers de persistência ───────────────────────────────────────────────────
function carregarSubscriptions() {
    try {
        if (fs.existsSync(SUBS_FILE)) {
            return new Map(JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8')));
        }
    } catch (_) {}
    return new Map();
}

function salvarSubscriptions(mapa) {
    try {
        fs.writeFileSync(SUBS_FILE, JSON.stringify([...mapa]), 'utf8');
    } catch (err) {
        console.error('[Subscriptions] Erro ao salvar:', err.message);
    }
}

const subscriptions = carregarSubscriptions();
console.log(`[Server] ${subscriptions.size} subscription(s) carregada(s).`);

// ── Rotas ─────────────────────────────────────────────────────────────────────

// Health check
app.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        subscriptions: subscriptions.size,
        vapidPublicKey: VAPID_PUBLIC_KEY
    });
});

// Retorna a chave pública VAPID para o browser criar a subscription
app.get('/vapid-public-key', (_req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Registra nova subscription
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Subscription inválida' });
    }
    subscriptions.set(subscription.endpoint, subscription);
    salvarSubscriptions(subscriptions);
    console.log(`[Subscribe] Nova subscription: ${subscription.endpoint.slice(0, 60)}...`);
    res.status(201).json({ message: 'Subscription registrada com sucesso!' });
});

// Remove subscription
app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (endpoint && subscriptions.has(endpoint)) {
        subscriptions.delete(endpoint);
        salvarSubscriptions(subscriptions);
        console.log(`[Unsubscribe] Subscription removida.`);
    }
    res.json({ message: 'OK' });
});

// Envia notificação manualmente (rota de teste — proteja com token em produção)
app.post('/send', async (req, res) => {
    const payload = JSON.stringify(req.body || {
        titulo: '🍀 Resultado Lotofácil!',
        corpo: 'Novo resultado disponível — abra o app!',
        url: 'https://delima20k.github.io/milionarios-da-leograf0.1/?autoVerificar=1'
    });

    const resultados = [];
    const invalidos  = [];

    for (const [endpoint, sub] of subscriptions) {
        try {
            await webpush.sendNotification(sub, payload);
            resultados.push({ endpoint: endpoint.slice(0, 40) + '…', status: 'enviado' });
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                // Subscription expirou — remove automaticamente
                invalidos.push(endpoint);
                resultados.push({ endpoint: endpoint.slice(0, 40) + '…', status: 'removida (expirada)' });
            } else {
                resultados.push({ endpoint: endpoint.slice(0, 40) + '…', status: `erro: ${err.message}` });
            }
        }
    }

    invalidos.forEach(ep => subscriptions.delete(ep));
    if (invalidos.length > 0) salvarSubscriptions(subscriptions);

    console.log(`[Send] Enviado para ${subscriptions.size} subscription(s). Removidas: ${invalidos.length}`);
    res.json({ enviadas: resultados.filter(r => r.status === 'enviado').length, resultados });
});

// ── Verificação automática da API Lotofácil + envio de push ──────────────────

async function verificarEEnviarResultado() {
    try {
        const resp = await fetch('https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!resp.ok) return null;
        const data = await resp.json();

        if (!data.numero || !data.listaDezenas || data.listaDezenas.length === 0) {
            console.log('[AutoSend] Resultado ainda não publicado pela Caixa.');
            return null;
        }

        // Lê o último concurso notificado (persistido em arquivo)
        const estadoFile = path.join(__dirname, 'ultimo-notificado.json');
        let ultimoNotificado = 0;
        try {
            if (fs.existsSync(estadoFile)) {
                ultimoNotificado = JSON.parse(fs.readFileSync(estadoFile, 'utf8')).numero || 0;
            }
        } catch (_) {}

        if (data.numero <= ultimoNotificado) {
            console.log(`[AutoSend] Concurso ${data.numero} já notificado.`);
            return null;
        }

        // Salva novo estado
        fs.writeFileSync(estadoFile, JSON.stringify({ numero: data.numero, data: new Date().toISOString() }));

        const numeros = data.listaDezenas.slice().sort((a, b) => parseInt(a) - parseInt(b)).join(' - ');
        const payload = JSON.stringify({
            titulo: '🍀 Novo Resultado Lotofácil!',
            corpo: `Concurso ${data.numero} • ${data.dataApuracao || ''}\n🎲 ${numeros}\n\nToque para ver seus jogos conferidos!`,
            tag: 'lotofacil-resultado',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            url: 'https://delima20k.github.io/milionarios-da-leograf0.1/?autoVerificar=1'
        });

        let enviadas = 0;
        const invalidos = [];
        for (const [endpoint, sub] of subscriptions) {
            try {
                await webpush.sendNotification(sub, payload);
                enviadas++;
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) invalidos.push(endpoint);
            }
        }
        invalidos.forEach(ep => subscriptions.delete(ep));
        if (invalidos.length > 0) salvarSubscriptions(subscriptions);

        console.log(`[AutoSend] Concurso ${data.numero} notificado para ${enviadas} dispositivo(s).`);
        return data.numero;
    } catch (err) {
        console.error('[AutoSend] Erro:', err.message);
        return null;
    }
}

// Rota para disparar verificação (usada pelo GitHub Actions cron)
app.post('/check-and-send', async (req, res) => {
    const resultado = await verificarEEnviarResultado();
    if (resultado) {
        res.json({ message: `Concurso ${resultado} notificado com sucesso!` });
    } else {
        res.json({ message: 'Nenhum novo resultado para enviar.' });
    }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[Server] 🚀 Push server rodando na porta ${PORT}`);
    console.log(`[Server] VAPID email: ${VAPID_EMAIL}`);
    console.log(`[Server] Allowed origin: ${ALLOWED_ORIGIN}`);
});

module.exports = app;
