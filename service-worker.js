const CACHE_NAME = 'milionarios-v3.0';
const STATIC_CACHE = 'milionarios-static-v3.0';
const DYNAMIC_CACHE = 'milionarios-dynamic-v3.0';

// Recursos essenciais para cache
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './logo.svg'
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
  
  // Estratégia para recursos estáticos (Cache First)
  if (CORE_ASSETS.some(asset => event.request.url.includes(asset.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('[SW] Servindo do cache:', event.request.url);
            return cachedResponse;
          }
          
          // Se não estiver no cache, busca da rede e cacheia
          return fetch(event.request)
            .then(response => {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
              return response;
            });
        })
        .catch(() => {
          // Fallback para página offline se disponível
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        })
    );
  }
  
  // Estratégia para chamadas da API (Network First com cache de backup)
  else if (API_CACHE_URLS.some(pattern => pattern.test(event.request.url))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Se a resposta for bem-sucedida, armazena no cache dinâmico
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Se a rede falhar, tenta buscar do cache dinâmico
          console.log('[SW] Rede falhou, buscando API do cache...');
          return caches.match(event.request);
        })
    );
  }
  
  // Para outras requisições, estratégia padrão
  else {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
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
// 🔔 NOTIFICAÇÕES PUSH
// ============================================

self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: './logo.svg',
      badge: './logo.svg',
      tag: 'lotofacil-resultado',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: './' },
      actions: [
        { action: 'view', title: '👁️ Ver Resultado' },
        { action: 'close', title: '✖ Fechar' }
      ]
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Clique em notificações
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action !== 'close') {
    const urlAlvo = (event.notification.data && event.notification.data.url) || './';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        for (const client of windowClients) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow(urlAlvo);
      })
    );
  }
});

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

      const numeros = data.listaDezenas.join(' - ');
      const dataApuracao = data.dataApuracao || '';
      const totalAcumulado = await lerTotalAcumuladoSW();
      const totalTexto = totalAcumulado > 0
        ? `\n💰 Total acumulado: ${formatarMoedaSW(totalAcumulado)}`
        : '';

      await self.registration.showNotification('🍀 Novo Resultado Lotofácil!', {
        body: `Concurso ${data.numero} • ${dataApuracao}\n🎲 ${numeros}${totalTexto}`,
        icon: './logo.svg',
        badge: './logo.svg',
        tag: 'lotofacil-resultado',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url: './' },
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

// Verifica se está na hora das notificações agendadas (10:00, 12:30, 15:00 BRT)
async function verificarHorariosSW() {
  try {
    const agora = new Date();

    // Hora e data no fuso de Brasília (com suporte a horário de verão via Intl)
    const horaBR = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(agora); // ex: "10:00"

    const dataBR = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', dateStyle: 'short'
    }).format(agora); // ex: "10/03/2026"

    const HORARIOS = [
      { chave: '10_00', horario: '10:00' },
      { chave: '12_30', horario: '12:30' },
      { chave: '15_00', horario: '15:00' }
    ];

    const store = await caches.open('milionarios-notifications-v1');
    const totalAcumulado = await lerTotalAcumuladoSW();
    const totalFormatado = totalAcumulado > 0 ? formatarMoedaSW(totalAcumulado) : null;

    for (const h of HORARIOS) {
      if (horaBR === h.horario) {
        const chaveCache = `notif-horario-${h.chave}`;
        const savedResp = await store.match(chaveCache);
        const ultimaData = savedResp ? await savedResp.text() : '';

        if (ultimaData !== dataBR) {
          await store.put(chaveCache, new Response(dataBR));

          const corpo = totalFormatado
            ? `💰 Total acumulado: ${totalFormatado}`
            : '📱 Abra o app para verificar os resultados!';

          await self.registration.showNotification('🦁 Milionários da Leograf', {
            body: `⏰ ${h.horario}h — ${corpo}`,
            icon: './logo.svg',
            badge: './logo.svg',
            tag: `horario-${h.chave}`,
            vibrate: [100, 50, 100],
            data: { url: './' },
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
console.log('[SW] Versão:', CACHE_NAME);
console.log('[SW] Recursos principais:', CORE_ASSETS);
