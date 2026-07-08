// Service Worker — Milionários da Leograf
// Web Push VAPID nativo (sem OneSignal)

const CACHE_NAME = 'milionarios-v8.0';
const STATIC_CACHE = 'milionarios-static-v8.0';
const DYNAMIC_CACHE = 'milionarios-dynamic-v8.0';

// URL do app hardcodada — mais confiável que self.location em todos os contextos PWA
const APP_BASE_URL = 'https://delima20k.github.io/milionarios-da-leograf0.1/';

// Recursos essenciais para cache
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './logo-header.png',
  './dinheiro2.mp3'
];

// URLs da API que podem ser cacheadas
const API_CACHE_URLS = [
  /servicebus2\.caixa\.gov\.br\/portaldeloterias\/api\/lotofacil/
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Cache estático aberto');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Recursos essenciais cacheados');
        self.skipWaiting(); // Força ativação imediata
      })
      .catch(err => {
        console.error('[SW] Erro ao cachear recursos:', err);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Remove caches antigos
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado e pronto!');
        self.clients.claim(); // Assume controle imediato
      })
  );
});

// Interceptar requisições com estratégia Cache First para assets estáticos
// e Network First para API calls
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // ✅ CORRIGIDO: verifica se é realmente um dos nossos arquivos estáticos
  // (antes o bug era: './' vira '' e url.includes('') é sempre true,
  //  fazendo Cache First interceptar até chamadas da API da Caixa)
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const staticFiles = CORE_ASSETS
    .filter(a => a !== './')          // remove o './' que causava o bug
    .map(a => a.replace('./', ''));   // ['index.html', 'style.css', ...]
  const isStaticAsset = isSameOrigin && staticFiles.some(f =>
    requestUrl.pathname.endsWith('/' + f) || requestUrl.pathname === '/' + f
  );

  // Estratégia para recursos estáticos (Cache First)
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Revalida em background para próxima visita
            fetch(event.request).then(freshResp => {
              if (freshResp.ok) {
                caches.open(STATIC_CACHE).then(c => c.put(event.request, freshResp));
              }
            }).catch(() => {});
            return cachedResponse;
          }
          return fetch(event.request)
            .then(response => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE).then(cache => cache.put(event.request, responseClone));
              }
              return response;
            });
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        })
    );
  }

  // Estratégia para chamadas da API Lotofácil (Network First — SEMPRE busca dado fresco)
  else if (API_CACHE_URLS.some(pattern => pattern.test(event.request.url))) {
    event.respondWith(
      fetch(event.request)
        .then(async networkResponse => {
          if (networkResponse.ok) {
            const isIndividualConcurso = /\/api\/lotofacil\/\d+/.test(event.request.url);

            if (isIndividualConcurso) {
              // ✅ Só cacheia concurso individual se já tiver resultado (listaDezenas preenchido)
              // Isso evita cachear resultados vazios de concursos futuros
              const clone = networkResponse.clone();
              try {
                const data = await clone.json();
                if (data.listaDezenas && data.listaDezenas.length > 0) {
                  const cached = new Response(JSON.stringify(data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                  });
                  caches.open(DYNAMIC_CACHE).then(c => c.put(event.request, cached));
                }
              } catch (_) {}
            } else {
              // Endpoint sem número (último concurso): sempre cacheia para fallback
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, responseClone));
            }
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[SW] Rede falhou, buscando API do cache...');
          return caches.match(event.request);
        })
    );
  }

  // Para outras requisições, estratégia padrão (network first)
  else {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  }
});

// Sincronização em background (quando a rede voltar)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Executando sincronização em background...');
    event.waitUntil(
      // Aqui você pode implementar lógica para sincronizar dados
      // quando a conexão voltar
      doBackgroundSync()
    );
  }
});

async function doBackgroundSync() {
  try {
    // Implementar sincronização de dados se necessário
    console.log('[SW] Sincronização concluída');
  } catch (error) {
    console.error('[SW] Erro na sincronização:', error);
  }
}

// ============================================
// ============================================
// 🔄 PERIODIC BACKGROUND SYNC
// ============================================

self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-lotofacil-resultado') {
    event.waitUntil(Promise.all([
      verificarNovoResultadoSW(),
      verificarHorariosSW()
    ]));
  }
});

// Lê o total acumulado salvo pelo app no Cache Storage
async function lerTotalAcumuladoSW() {
  try {
    const appCache = await caches.open('milionarios-app-data-v1');
    const resp = await appCache.match('total-acumulado');
    if (!resp) return 0;
    const dados = await resp.json();
    return dados.valor || 0;
  } catch (_) { return 0; }
}

// Formata valor como moeda BRL (disponível no SW moderno)
function formatarMoedaSW(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Verifica se saiu resultado novo e notifica
async function verificarNovoResultadoSW() {
  try {
    const resp = await fetch('https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil', {
      cache: 'no-store'
    });
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.numero || !data.listaDezenas || data.listaDezenas.length === 0) return;

    const store = await caches.open('milionarios-notifications-v1');
    const savedResp = await store.match('ultimo-concurso-notificado');
    const ultimoNotificado = savedResp ? parseInt(await savedResp.text()) : 0;

    if (data.numero > ultimoNotificado) {
      await store.put('ultimo-concurso-notificado', new Response(String(data.numero)));

      // Avisas as abas/janelas do PWA já abertas para auto-verificar sem precisar clicar
      try {
        const allClients = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
        for (const client of allClients) {
          client.postMessage({ type: 'NOVO_RESULTADO', concurso: data.numero });
        }
        console.log(`[SW] Mensagem NOVO_RESULTADO enviada para ${allClients.length} cliente(s) aberto(s)`);
      } catch (_) {}

      const numeros = data.listaDezenas.join(' - ');
      const dataApuracao = data.dataApuracao || '';
      const totalAcumulado = await lerTotalAcumuladoSW();
      const totalTexto = totalAcumulado > 0
        ? `\n💰 Total acumulado: ${formatarMoedaSW(totalAcumulado)}`
        : '';

      await self.registration.showNotification('🍀 Novo Resultado Lotofácil!', {
        body: `Concurso ${data.numero} • ${dataApuracao}\n🎲 ${numeros}${totalTexto}`,
        icon: APP_BASE_URL + 'logo-header.png',
        badge: APP_BASE_URL + 'logo-header.png',
        tag: 'lotofacil-resultado',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url: APP_BASE_URL + '?autoVerificar=1' },
        actions: [
          { action: 'view', title: '👁️ Ver Resultado' },
          { action: 'close', title: '✖ Fechar' }
        ]
      });
    }
  } catch (err) {
    console.error('[SW] Erro ao verificar resultado:', err);
  }
}

// Verifica se está na hora das notificações agendadas (10:00, 13:05, 15:00 BRT)
async function verificarHorariosSW() {
  try {
    const agora = new Date();

    // Calcula minutos totais desde meia-noite no fuso de Brasília
    const partes = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(agora);

    let horaBR = 0, minBR = 0;
    partes.forEach(p => {
      if (p.type === 'hour')   horaBR = parseInt(p.value, 10);
      if (p.type === 'minute') minBR  = parseInt(p.value, 10);
    });
    const minutosBR = horaBR * 60 + minBR;

    const dataBR = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', dateStyle: 'short'
    }).format(agora);

    const HORARIOS = [
      { chave: '10_00', label: '10:00', minutos: 600 },
      { chave: '15_00', label: '15:00', minutos: 900 },
      { chave: '18_00', label: '18:00', minutos: 1080 },
      { chave: '21_30', label: '21:30', minutos: 1290, ehSorteio: true }
    ];

    const store = await caches.open('milionarios-notifications-v1');
    const totalAcumulado = await lerTotalAcumuladoSW();
    const totalFormatado = totalAcumulado > 0 ? formatarMoedaSW(totalAcumulado) : null;

    for (const h of HORARIOS) {
      // Janela de 59 minúsculo: dispara se chegamos a qualquer minuto do horário
      if (minutosBR >= h.minutos && minutosBR < h.minutos + 59) {
        const chaveCache = `notif-horario-${h.chave}`;
        const savedResp = await store.match(chaveCache);
        const ultimaData = savedResp ? await savedResp.text() : '';

        if (ultimaData !== dataBR) {
          await store.put(chaveCache, new Response(dataBR));

          // Às 21:30 (horário do sorteio), tenta buscar o resultado diretamente
          if (h.ehSorteio) {
            await verificarNovoResultadoSW();
            continue;
          }

          const corpo = totalFormatado
            ? `💰 Total acumulado: ${totalFormatado}`
            : '📱 Abra o app para verificar os resultados!';

          await self.registration.showNotification('🦁 Milionários da Leograf', {
            body: `⏰ ${h.label}h — ${corpo}`,
            icon: APP_BASE_URL + 'logo-header.png',
            badge: APP_BASE_URL + 'logo-header.png',
            tag: `horario-${h.chave}`,
            vibrate: [100, 50, 100],
            data: { url: APP_BASE_URL + '?autoVerificar=1' },
            actions: [
              { action: 'view', title: '🔍 Ver no App' },
              { action: 'close', title: '✖ Fechar' }
            ]
          });
        }
      }
    }
  } catch (err) {
    console.error('[SW] Erro ao verificar horários agendados:', err);
  }
}

// Log de informações do SW
console.log('[SW] Service Worker Milionários da Leograf carregado!');

// ============================================
// � PUSH EVENT — Recebe notificações via VAPID Web Push (web-push npm)
// ============================================
self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = {
      titulo: '🦁 Milionários da Leograf',
      corpo: event.data ? event.data.text() : 'Novo resultado disponível!'
    };
  }

  const titulo = payload.titulo || '🍀 Novo Resultado Lotofácil!';
  const opcoes = {
    body: payload.corpo || 'Toque para verificar seus jogos!',
    icon: APP_BASE_URL + 'logo-header.png',
    badge: APP_BASE_URL + 'logo-header.png',
    tag: payload.tag || 'push-milionarios',
    requireInteraction: payload.requireInteraction !== false,
    vibrate: payload.vibrate || [200, 100, 200],
    data: { url: payload.url || (APP_BASE_URL + '?autoVerificar=1') },
    actions: [
      { action: 'view', title: '👁️ Ver Resultado' },
      { action: 'close', title: '✖ Fechar' }
    ]
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

// ============================================
// �🔔 CLIQUE NA NOTIFICAÇÃO — Abre o app e auto-verifica
// ============================================
self.addEventListener('notificationclick', event => {
  event.stopImmediatePropagation();
  event.notification.close();

  if (event.action === 'close') return;

  // URL vem do payload da notificação ou usa o padrão do app
  const notifData = event.notification.data;
  const targetUrl = (notifData && notifData.url)
    ? notifData.url
    : APP_BASE_URL + '?autoVerificar=1';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async windowClients => {
      // Procura janela/aba do PWA já aberta
      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url);
          const baseUrl   = new URL(APP_BASE_URL);
          if (clientUrl.origin === baseUrl.origin &&
              clientUrl.pathname.startsWith(baseUrl.pathname)) {
            // Navega para a URL com autoVerificar e foca
            if ('navigate' in client) {
              await client.navigate(targetUrl);
            }
            await client.focus();
            return;
          }
        } catch (_) {}
      }
      // App fechado — abre nova janela
      return clients.openWindow(targetUrl);
    })
  );
});
console.log('[SW] Versão:', CACHE_NAME);
console.log('[SW] Recursos principais:', CORE_ASSETS);
// Web Push VAPID ativo — sem OneSignal
