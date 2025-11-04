@echo off
echo.
echo ========================================
echo  TESTE LOCAL - PWA MILINARIOS DA LEOGRAF
echo ========================================
echo.

echo 🌐 Testando opcoes para servidor local...
echo.

REM Verificar se Node.js está instalado
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js encontrado! Usando npx serve...
    echo.
    echo 📋 INSTRUCOES:
    echo 1. Seu PWA abrira em: http://localhost:3000
    echo 2. Teste todas as funcionalidades
    echo 3. Verifique se o PWA pode ser instalado
    echo 4. Pressione Ctrl+C para parar o servidor
    echo.
    echo ⏰ Iniciando servidor...
    echo.
    npx serve -s . -p 3000
    goto :end
)

REM Verificar se Python está instalado
echo 🔍 Verificando Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python encontrado! Usando servidor HTTP...
    echo.
    echo 📋 INSTRUCOES:
    echo 1. Seu PWA abrira em: http://localhost:8000
    echo 2. Teste todas as funcionalidades
    echo 3. Verifique se o PWA pode ser instalado
    echo 4. Pressione Ctrl+C para parar o servidor
    echo.
    echo ⏰ Iniciando servidor...
    echo.
    python -m http.server 8000
    goto :end
)

REM Se nenhum servidor estiver disponível
echo ❌ Nenhum servidor encontrado!
echo.
echo 💡 ESCOLHA UMA OPCAO:
echo.
echo 1️⃣  INSTALAR NODE.JS (RECOMENDADO):
echo     👉 https://nodejs.org
echo     👉 Baixe e instale a versão LTS
echo     👉 Execute este script novamente
echo.
echo 2️⃣  INSTALAR PYTHON:
echo     👉 https://python.org
echo     👉 Marque "Add to PATH" durante instalação
echo     👉 Execute este script novamente
echo.
echo 3️⃣  USAR VS CODE LIVE SERVER:
echo     👉 Instale extensão "Live Server"
echo     👉 Clique direito em index.html
echo     👉 "Open with Live Server"
echo.
echo 4️⃣  ABRIR ARQUIVO DIRETAMENTE:
echo     👉 Clique duplo em index.html
echo     👉 ⚠️  Algumas funcionalidades podem não funcionar
echo.
echo 5️⃣  HOSPEDAR ONLINE DIRETAMENTE:
echo     👉 Execute: deploy.bat
echo     👉 Siga o guia de hospedagem
echo.

set /p opcao="Digite sua escolha (1-5): "

if "%opcao%"=="1" (
    start https://nodejs.org
    echo 💻 Página do Node.js aberta no navegador
) else if "%opcao%"=="2" (
    start https://python.org
    echo 💻 Página do Python aberta no navegador
) else if "%opcao%"=="3" (
    echo 📝 Como usar Live Server no VS Code:
    echo 1. Abra VS Code
    echo 2. Vá em Extensions (Ctrl+Shift+X)
    echo 3. Procure "Live Server"
    echo 4. Instale a extensão
    echo 5. Abra a pasta do projeto no VS Code
    echo 6. Clique direito em index.html
    echo 7. Selecione "Open with Live Server"
) else if "%opcao%"=="4" (
    echo 🚀 Abrindo PWA diretamente...
    start index.html
    echo ⚠️  Se houver erros, use uma das outras opções
) else if "%opcao%"=="5" (
    deploy.bat
) else (
    echo ❌ Opcao invalida!
)

:end
echo.
echo 🛑 Servidor parado.
echo.
echo 📊 DICAS PARA TESTE:
echo.
echo ✅ O que testar:
echo    - Clique no botão "Verificar Concursos"
echo    - Veja se os resultados aparecem
echo    - Teste a instalação do PWA
echo    - Verifique se funciona offline
echo.
echo � Se houver problemas:
echo    - Abra F12 (Console do navegador)
echo    - Veja se há erros no console
echo    - Teste em modo incógnito
echo.
echo 📱 Para testar instalação PWA:
echo    - No Chrome: Procure ícone de instalação na barra
echo    - No Edge: Menu → "Instalar este site como app"
echo    - No mobile: "Adicionar à tela inicial"
echo.
pause