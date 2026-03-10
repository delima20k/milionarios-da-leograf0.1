# 🏆 Milionários da Leograf - PWA

Progressive Web App para verificação automática dos jogos da Lotofácil do bolão **"Milionários da Leograf"**.

## 🌟 Funcionalidades

- ✅ **Verificação Automática**: Todos os concursos desde o 3619 (23/02/2026)
- ✅ **Teimosinha 24x**: 20 jogos por 24 sorteios
- ✅ **Detecção Inteligente**: Encontra jogos com 11, 12, 13, 14 ou 15 pontos
- ✅ **Cálculo de Prêmios**: Valores reais da API da Caixa
- ✅ **Interface Responsiva**: Funciona perfeitamente em mobile e desktop
- ✅ **Offline**: Funciona sem internet após instalação
- ✅ **Atualização Automática**: Service Worker mantém o app sempre atual
- ✅ **Dados em Tempo Real**: Integração com API oficial da Lotofácil

## 🎯 Como Funciona

1. **Clique em "Verificar Todos os Concursos"**
2. **Sistema busca automaticamente**: Do concurso 3619 até o mais atual
3. **Análise completa**: Verifica os 20 jogos do bolão em cada sorteio
4. **Relatório detalhado**: Mostra acertos, prêmios e totais acumulados

## 📱 Instalação

### **Android:**
1. Abra no **Chrome**
2. Toque em **"Adicionar à tela inicial"**
3. Confirme a instalação

### **iPhone:**
1. Abra no **Safari**
2. Toque no ícone de **compartilhar**
3. Selecione **"Adicionar à Tela de Início"**

### **Desktop:**
1. Abra no **Chrome/Edge**
2. Clique no **ícone de instalação** na barra
3. Confirme **"Instalar"**

## 🚀 Deploy e Hospedagem

### **Opção 1: GitHub Pages (Recomendado)**
```bash
# Execute o script automatizado
deploy.bat

# Ou siga o guia completo
HOSPEDAGEM-GUIA.md
```

### **Opção 2: Teste Local**
```bash
# Testar antes de hospedar
testar-local.bat

# Abrirá em: http://localhost:8000
```

## 🎲 Jogos do Bolão

O sistema verifica automaticamente estes **20 jogos** (Teimosinha 24x a partir de 23/02/2026):

1. `[02,04,05,08,09,10,11,14,15,18,19,20,21,22,23]`
2. `[01,03,05,06,07,10,11,13,14,17,20,21,22,23,25]`
3. `[01,02,03,06,09,10,11,13,14,15,17,18,19,21,25]`
4. `[02,04,05,06,07,09,11,12,15,17,19,20,21,22,25]`
5. `[01,02,04,06,09,10,11,14,15,16,17,20,22,23,25]`
6. `[01,04,05,07,09,10,11,12,15,17,18,20,21,22,25]`
7. `[01,02,03,05,06,07,10,11,13,14,17,18,20,21,22]`
8. `[02,03,04,06,09,10,13,14,17,19,20,21,22,23,25]`
9. `[02,03,04,07,09,10,11,13,14,15,17,18,20,21,25]`
10. `[01,02,04,06,08,09,11,12,15,16,17,18,20,22,23]`
11. `[01,02,03,05,06,09,11,12,14,18,19,20,21,23,24]`
12. `[01,03,04,06,08,12,13,15,16,17,19,20,21,23,24]`
13. `[01,04,05,06,07,08,11,12,15,16,19,20,21,22,23]`
14. `[01,02,04,06,07,09,11,14,15,16,17,20,21,22,25]`
15. `[01,04,05,06,07,10,11,12,15,17,18,20,22,23,25]`
16. `[02,04,05,07,08,09,11,14,15,18,19,20,21,22,23]`
17. `[01,02,04,07,08,10,11,12,15,16,18,20,22,23,25]`
18. `[01,04,05,08,09,10,11,14,15,16,19,20,21,22,23]`
19. `[02,03,04,05,06,07,10,11,13,14,17,19,20,21,23]`
20. `[01,03,04,07,09,10,13,14,15,17,18,19,21,22,23]`

## 📊 Premiação

O sistema calcula automaticamente:
- **15 pontos**: Prêmio máximo (sena)
- **14 pontos**: Segunda faixa
- **13 pontos**: Terceira faixa  
- **12 pontos**: Quarta faixa
- **11 pontos**: Quinta faixa

## 🔧 Arquivos do Projeto

```
📁 milinarios-da-leograf001/
├── 📄 index.html          # Interface principal
├── 📄 manifest.json       # Configuração PWA
├── 📄 script.js           # Lógica de verificação
├── 📄 service-worker.js   # Cache e offline
├── 📄 style.css           # Estilos e animações
├── 🖼️ logo.svg            # Logo com leão e trevos
├── 🖼️ icon-192.png        # Ícone PWA 192x192
├── 🖼️ icon-512.png        # Ícone PWA 512x512
├── 📄 deploy.bat          # Script de deploy
├── 📄 testar-local.bat    # Servidor local
└── 📄 HOSPEDAGEM-GUIA.md  # Guia completo
```

## 🍀 Sobre o Bolão

**"Milionários da Leograf"** - Grupo de apostadores unidos pela sorte!

- 🗓️ **Início da Teimosinha**: 23/02/2026 (Concurso 3619)
- 🎲 **Teimosinha**: 24 sorteios (até 21/03/2026 - Concurso 3642)
- 🎯 **20 jogos por concurso**: Sempre os mesmos números
- 📱 **Verificação automática**: Nunca mais perca um prêmio
- 💰 **Transparência total**: Todos os valores são oficiais

## 🆘 Suporte

- 📖 **Guia completo**: `HOSPEDAGEM-GUIA.md`
- 🔧 **Deploy automatizado**: `deploy.bat`
- 🧪 **Teste local**: `testar-local.bat`
- 💻 **Console do navegador**: F12 para logs detalhados

---

**🎊 Boa sorte nos sorteios! Que os números estejam sempre a nosso favor! �**
