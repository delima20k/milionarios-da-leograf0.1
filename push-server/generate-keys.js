/**
 * generate-keys.js
 * Gera um novo par de chaves VAPID para Web Push.
 * Execute apenas uma vez e guarde as chaves com segurança.
 *
 * Uso: node generate-keys.js
 */
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('=== 🔑 Chaves VAPID Geradas ===');
console.log('VAPID_PUBLIC_KEY =', keys.publicKey);
console.log('VAPID_PRIVATE_KEY =', keys.privateKey);
console.log('');
console.log('1. Copie VAPID_PUBLIC_KEY para script.js → const VAPID_PUBLIC_KEY');
console.log('2. Configure VAPID_PRIVATE_KEY como variável de ambiente no servidor/GitHub Actions');
