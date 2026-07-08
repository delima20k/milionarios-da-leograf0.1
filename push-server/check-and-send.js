/**
 * check-and-send.js
 * Script standalone para verificar a API Lotofácil e enviar push notifications.
 * Pode ser executado pelo GitHub Actions ou manualmente.
 *
 * Uso:
 *   node check-and-send.js
 *
 * Variáveis de ambiente:
 *   VAPID_PUBLIC_KEY   = BF7CTJu4...
 *   VAPID_PRIVATE_KEY  = TUbOfUZ1...
 *   VAPID_EMAIL        = mailto:seuemail@gmail.com
 *   SUBSCRIPTIONS_JSON = '[{"endpoint":...}]'  ← JSON da lista de subscriptions
 *                        (usado pelo GitHub Actions via secret)
 */

const webpush = require('web-push');
const fs      = require('fs');
const path    = require('path');

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  || 'BF7CTJu4zV4BzsxBG_YKGqMGqHZS26FDppElgcOe8uKyiLht6Q_LOy_02CH7dEK9KUrrzlgfTw3lSXooY71Nr60';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'TUbOfUZ1GAakQYzP2RvcbFmyNLLQfLJrnvhT5n8_f_8';
const VAPID_EMAIL       = process.env.VAPID_EMAIL       || 'mailto:contato@milionariosdaleograf.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Carrega subscriptions — de variável de ambiente (GitHub Actions) ou arquivo local
function carregarSubscriptions() {
    // 1. Via variável de ambiente SUBSCRIPTIONS_JSON (GitHub Actions secret)
    if (process.env.SUBSCRIPTIONS_JSON) {
        try {
            const arr = JSON.parse(process.env.SUBSCRIPTIONS_JSON);
            console.log(`[check-and-send] ${arr.length} subscription(s) da variável de ambiente.`);
            return arr;
        } catch (err) {
            console.error('[check-and-send] SUBSCRIPTIONS_JSON inválida:', err.message);
        }
    }

    // 2. Via arquivo local subscriptions.json (servidor local)
    const subsFile = path.join(__dirname, 'subscriptions.json');
    if (fs.existsSync(subsFile)) {
        try {
            const entries = JSON.parse(fs.readFileSync(subsFile, 'utf8'));
            const arr = entries.map(([, sub]) => sub);
            console.log(`[check-and-send] ${arr.length} subscription(s) do arquivo local.`);
            return arr;
        } catch (err) {
            console.error('[check-and-send] Erro ao ler subscriptions.json:', err.message);
        }
    }

    console.warn('[check-and-send] Nenhuma subscription encontrada. Configure SUBSCRIPTIONS_JSON ou subscriptions.json.');
    return [];
}

async function main() {
    // 1. Busca o resultado mais recente na API
    console.log('[check-and-send] Buscando resultado da Lotofácil...');
    let data;
    try {
        const resp = await fetch('https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        data = await resp.json();
    } catch (err) {
        console.error('[check-and-send] Erro ao buscar API:', err.message);
        process.exit(1);
    }

    if (!data.numero || !data.listaDezenas || data.listaDezenas.length === 0) {
        console.log('[check-and-send] Resultado ainda não publicado. Tente mais tarde.');
        process.exit(0);
    }

    console.log(`[check-and-send] Concurso encontrado: ${data.numero} — ${data.dataApuracao}`);

    // 2. Verifica se já notificamos este concurso
    const estadoFile = path.join(__dirname, 'ultimo-notificado.json');
    let ultimoNotificado = 0;
    try {
        if (fs.existsSync(estadoFile)) {
            ultimoNotificado = JSON.parse(fs.readFileSync(estadoFile, 'utf8')).numero || 0;
        }
    } catch (_) {}

    if (data.numero <= ultimoNotificado) {
        console.log(`[check-and-send] Concurso ${data.numero} já foi notificado (último: ${ultimoNotificado}).`);
        process.exit(0);
    }

    // 3. Monta payload da notificação
    const numeros = data.listaDezenas.slice().sort((a, b) => parseInt(a) - parseInt(b)).join(' - ');
    const payload = JSON.stringify({
        titulo: '🍀 Novo Resultado Lotofácil!',
        corpo:  `Concurso ${data.numero} • ${data.dataApuracao || ''}\n🎲 ${numeros}\n\nToque para ver seus jogos conferidos!`,
        tag: 'lotofacil-resultado',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        url: 'https://delima20k.github.io/milionarios-da-leograf0.1/?autoVerificar=1'
    });

    // 4. Envia para todas as subscriptions
    const subscriptions = carregarSubscriptions();
    if (subscriptions.length === 0) {
        console.log('[check-and-send] Sem subscriptions — nada a enviar.');
        process.exit(0);
    }

    let enviadas = 0;
    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(sub, payload);
            enviadas++;
            console.log(`[check-and-send] ✅ Enviado: ${sub.endpoint.slice(0, 50)}…`);
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                console.log(`[check-and-send] ⚠️ Subscription expirada (removida): ${sub.endpoint.slice(0, 50)}…`);
            } else {
                console.error(`[check-and-send] ❌ Erro ao enviar: ${err.message}`);
            }
        }
    }

    // 5. Salva estado do último concurso notificado
    fs.writeFileSync(estadoFile, JSON.stringify({
        numero: data.numero,
        data: data.dataApuracao,
        notificadoEm: new Date().toISOString()
    }));

    console.log(`[check-and-send] ✅ Concurso ${data.numero} notificado para ${enviadas}/${subscriptions.length} dispositivo(s).`);
    process.exit(0);
}

main().catch(err => {
    console.error('[check-and-send] Erro fatal:', err);
    process.exit(1);
});
