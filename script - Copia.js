// Elementos
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('sideMenu');

// Criar overlay
const overlay = document.createElement('div');
overlay.className = 'overlay';
document.body.appendChild(overlay);

// Toggle do menu
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
});

// Fechar menu ao clicar no overlay
overlay.addEventListener('click', () => {
    hamburger.classList.remove('active');
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
});

// Adicionar evento de clique aos itens do menu
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        console.log(`Selecionado: ${item.textContent}`);
        // Aqui você pode adicionar mais funcionalidades quando clicar em um nome
    });
});

// ============================================
// BUSCAR RESULTADO DA LOTOFÁCIL
// ============================================

// Jogos do bolão
const jogos = [
    [2, 3, 6, 9, 10, 12, 13, 16, 17, 18, 19, 21, 23, 24, 25],
    [1, 2, 5, 7, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23],
    [2, 3, 6, 8, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23],
    [3, 4, 7, 9, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24],
    [1, 4, 5, 7, 8, 14, 16, 17, 18, 19, 20, 22, 23, 24, 25],
    [2, 5, 6, 7, 8, 10, 11, 12, 13, 14, 16, 17, 18, 19, 21],
    [3, 6, 7, 8, 11, 12, 13, 14, 17, 19, 20, 21, 22, 23, 24],
    [2, 4, 5, 6, 8, 9, 11, 12, 13, 14, 19, 20, 21, 22, 23],
    [1, 3, 7, 8, 9, 12, 13, 14, 15, 17, 18, 19, 23, 24, 25],
    [5, 6, 7, 9, 10, 12, 13, 14, 16, 17, 19, 20, 21, 22, 24]
];

// Mapeamento de concursos - DINÂMICO desde o 3525 até o atual
// Esta função gera automaticamente todos os concursos desde o início da teimosinha
function gerarConcursosTeimosinha() {
    const concursos = [];
    const dataInicio = new Date('2025-10-29'); // 29/10/2025 - Concurso 3525
    const hoje = new Date();
    
    // Adicionar alguns dias extras para garantir que pegamos o concurso atual
    const dataFim = new Date(hoje);
    dataFim.setDate(dataFim.getDate() + 5); // 5 dias no futuro para garantir
    
    let concursoAtual = 3525;
    let dataAtual = new Date(dataInicio);
    
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    // Gerar concursos desde 29/10/2025 até alguns dias no futuro (máximo 60 concursos)
    while (dataAtual <= dataFim && concursos.length < 60) {
        const diaSemana = dataAtual.getDay();
        
        // Lotofácil não tem sorteio aos domingos
        if (diaSemana !== 0) {
            const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
            const diaTexto = diasSemana[diaSemana];
            
            concursos.push({
                data: dataFormatada,
                concurso: concursoAtual,
                dia: diaTexto
            });
            
            concursoAtual++;
        }
        
        // Avançar para o próximo dia
        dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    console.log(`📅 Gerados ${concursos.length} concursos para verificação (do 3525 até ${concursoAtual - 1})`);
    console.log(`📊 Incluindo até o concurso 3527 (31/10/2025) e posteriores se disponíveis`);
    return concursos;
}

// Gerar lista dinâmica de concursos
const concursosTeimosinha = gerarConcursosTeimosinha();

const btnBuscarResultado = document.getElementById('btnBuscarResultado');
const resultadoContainer = document.getElementById('resultadoContainer');
const verificacaoContainer = document.getElementById('verificacaoContainer');

let todosResultados = [];

btnBuscarResultado.addEventListener('click', async () => {
    try {
        // Mostrar loading no botão
        btnBuscarResultado.textContent = '⏳ Verificando do concurso 3525 até o atual...';
        btnBuscarResultado.disabled = true;

        // Limpar resultados anteriores
        todosResultados = [];

        console.log('🔍 Iniciando busca COMPLETA desde o concurso 3525...');
        console.log(`📊 Total de concursos a verificar: ${concursosTeimosinha.length}`);
        console.log(`📅 Período: ${concursosTeimosinha[0].data} (${concursosTeimosinha[0].concurso}) até ${concursosTeimosinha[concursosTeimosinha.length - 1].data} (${concursosTeimosinha[concursosTeimosinha.length - 1].concurso})`);

        let concursosEncontrados = 0;
        let ultimoConcursoReal = null;
        let errosConsecutivos = 0;

        // Buscar todos os concursos desde o 3525
        for (const concursoInfo of concursosTeimosinha) {
            try {
                console.log(`📊 Buscando concurso ${concursoInfo.concurso} (${concursoInfo.data} - ${concursoInfo.dia})`);
                
                const response = await fetch(`https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil/${concursoInfo.concurso}`);
                
                if (response.ok) {
                    const dados = await response.json();
                    
                    // Verificar se tem números sorteados
                    if (dados.listaDezenas && dados.listaDezenas.length > 0) {
                        console.log(`✅ Concurso ${concursoInfo.concurso} encontrado e CONFERIDO!`);
                        todosResultados.push({
                            ...concursoInfo,
                            dados: dados,
                            numerosSorteados: dados.listaDezenas.map(n => parseInt(n))
                        });
                        console.log(`📝 Números sorteados: ${dados.listaDezenas.join(', ')}`);
                        concursosEncontrados++;
                        ultimoConcursoReal = concursoInfo.concurso;
                        errosConsecutivos = 0; // Reset contador de erros
                    } else {
                        console.log(`⚠️ Concurso ${concursoInfo.concurso} sem números sorteados`);
                        errosConsecutivos++;
                    }
                } else {
                    console.log(`❌ Concurso ${concursoInfo.concurso} ainda não realizado (status: ${response.status})`);
                    errosConsecutivos++;
                    
                    // Se já temos alguns resultados e encontramos 3 erros consecutivos, provavelmente chegamos no limite
                    if (concursosEncontrados > 0 && errosConsecutivos >= 3) {
                        console.log(`🛑 Parando busca após ${errosConsecutivos} erros consecutivos. Último concurso válido: ${ultimoConcursoReal}`);
                        break;
                    }
                }
            } catch (error) {
                console.log(`⚠️ Erro ao buscar concurso ${concursoInfo.concurso}:`, error.message);
                errosConsecutivos++;
                
                // Se erro na API e já temos alguns resultados e muitos erros consecutivos, parar
                if (concursosEncontrados > 0 && errosConsecutivos >= 5) {
                    console.log(`🛑 Parando busca por muitos erros de API consecutivos (${errosConsecutivos})`);
                    break;
                }
            }

            // Pequeno delay para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        console.log(`📋 RESULTADO DA BUSCA:`);
        console.log(`   ✅ Concursos encontrados: ${todosResultados.length}`);
        console.log(`   📊 Período verificado: Concurso 3525 até ${ultimoConcursoReal || 'atual'}`);
        console.log(`   📅 Datas: ${todosResultados.length > 0 ? `${todosResultados[0].data} até ${todosResultados[todosResultados.length - 1].data}` : 'Nenhuma'}`);

        if (todosResultados.length === 0) {
            // Se não encontrou resultados reais, usar dados simulados para teste
            console.log('⚠️ Nenhum resultado real encontrado. Oferecendo demonstração...');
            
            const confirm = window.confirm(
                'Nenhum resultado oficial foi encontrado ainda.\n\n' +
                '🎯 O sistema buscou desde o concurso 3525 (29/10/2025) até o atual\n\n' +
                'Deseja ver uma demonstração com dados simulados para testar o sistema?\n\n' +
                '(Clique OK para ver a demonstração ou Cancelar para aguardar os resultados oficiais)'
            );
            
            if (confirm) {
                todosResultados = criarDadosSimulados();
                console.log('🎭 Usando dados simulados para demonstração');
            } else {
                alert('⏳ Aguardando resultados oficiais dos concursos.\n\n📊 O sistema verificará automaticamente todos os concursos desde o 3525 quando estiverem disponíveis.');
                btnBuscarResultado.textContent = '🤖 Verificar Todos os Concursos da Teimosinha';
                btnBuscarResultado.disabled = false;
                return;
            }
        }

        // Mostrar o último resultado no card principal
        const ultimoResultado = todosResultados[todosResultados.length - 1];
        mostrarResultadoPrincipal(ultimoResultado);

        // Verificar todos os jogos em todos os concursos
        verificarTodosJogos(todosResultados);
        
        // Scroll suave até o resultado
        resultadoContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Restaurar botão
        btnBuscarResultado.textContent = '🤖 Verificar Todos os Concursos da Teimosinha';
        btnBuscarResultado.disabled = false;

    } catch (error) {
        console.error('❌ Erro geral:', error);
        alert('Erro ao buscar resultados. Verifique o console para mais detalhes.');
        
        // Restaurar botão
        btnBuscarResultado.textContent = '🤖 Verificar Todos os Concursos da Teimosinha';
        btnBuscarResultado.disabled = false;
    }
});

// Função para mostrar o resultado principal (último concurso)
function mostrarResultadoPrincipal(resultado) {
    const dados = resultado.dados;
    
    // Preencher informações
    document.getElementById('numeroConcurso').textContent = `${dados.numero} - ${resultado.dia}`;
    document.getElementById('dataConcurso').textContent = dados.dataApuracao;
    
    // Formatar prêmio
    const premio = new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(dados.valorEstimadoProximoConcurso);
    document.getElementById('valorPremio').textContent = premio;

    // Pegar ganhadores de 15 pontos
    const ganhadores15 = dados.listaRateioPremio.find(item => item.faixa === 1);
    document.getElementById('ganhadores15').textContent = 
        `${ganhadores15.numeroDeGanhadores} ganhador(es) - ${new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(ganhadores15.valorPremio)} cada`;

    // Mostrar números sorteados
    const numerosGrid = document.getElementById('numerosSorteados');
    numerosGrid.innerHTML = '';
    
    const numerosOrdenados = [...resultado.numerosSorteados].sort((a, b) => a - b);
    numerosOrdenados.forEach(numero => {
        const bola = document.createElement('div');
        bola.className = 'numero-bola';
        bola.textContent = numero.toString().padStart(2, '0');
        numerosGrid.appendChild(bola);
    });

    // Mostrar container de resultado
    resultadoContainer.style.display = 'block';
}

// Função para verificar todos os jogos em todos os concursos
function verificarTodosJogos(resultados) {
    console.log('🎯 Iniciando verificação de todos os jogos...');
    
    const resumoPremios = document.getElementById('resumoPremios');
    const jogosVerificados = document.getElementById('jogosVerificados');
    
    // Limpar containers
    resumoPremios.innerHTML = '';
    jogosVerificados.innerHTML = '';
    
    // Contadores gerais de todos os concursos
    const contadoresGerais = {
        15: { qtd: 0, valor: 0 },
        14: { qtd: 0, valor: 0 },
        13: { qtd: 0, valor: 0 },
        12: { qtd: 0, valor: 0 },
        11: { qtd: 0, valor: 0 }
    };
    
    // Array para armazenar prêmios de cada jogo
    const premiosPorJogo = Array(jogos.length).fill(0).map(() => 0);
    
    let totalGeralAcumulado = 0;
    
    console.log(`📊 Verificando ${resultados.length} concurso(s)...`);
    
    // Para cada concurso
    resultados.forEach((resultado, indexConcurso) => {
        console.log(`\n🔍 === CONCURSO ${resultado.concurso} (${resultado.data}) ===`);
        console.log(`📋 Números sorteados: [${resultado.numerosSorteados.join(', ')}]`);
        
        // Criar seção do concurso
        const concursoSection = document.createElement('div');
        concursoSection.style.cssText = 'margin-bottom: 40px; padding: 25px; background: rgba(255, 255, 255, 0.02); border-radius: 15px; border: 2px solid rgba(255, 255, 255, 0.1);';
        
        const concursoTitle = document.createElement('h4');
        concursoTitle.style.cssText = 'color: #f39c12; font-size: 22px; margin-bottom: 20px; text-align: center;';
        concursoTitle.textContent = `📅 ${resultado.dia} - ${resultado.data} - Concurso ${resultado.concurso}`;
        concursoSection.appendChild(concursoTitle);
        
        // Mostrar números sorteados deste concurso
        const numerosDiv = document.createElement('div');
        numerosDiv.style.cssText = 'display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;';
        resultado.numerosSorteados.sort((a, b) => a - b).forEach(num => {
            const numSpan = document.createElement('span');
            numSpan.style.cssText = 'background: #2ecc71; color: #fff; padding: 8px 12px; border-radius: 50%; font-weight: bold; min-width: 35px; text-align: center;';
            numSpan.textContent = num.toString().padStart(2, '0');
            numerosDiv.appendChild(numSpan);
        });
        concursoSection.appendChild(numerosDiv);
        
        let totalConcurso = 0;
        let temJogoComPremio = false;
        
        // Verificar cada jogo neste concurso
        jogos.forEach((jogo, indexJogo) => {
            const acertos = jogo.filter(num => resultado.numerosSorteados.includes(num));
            const totalAcertos = acertos.length;
            
            console.log(`🎲 Jogo ${indexJogo + 1}: [${jogo.join(', ')}]`);
            console.log(`   ✅ Acertos: [${acertos.join(', ')}] = ${totalAcertos} pontos`);
            
            let valorPremioJogo = 0;
            
            // Contar acertos (a partir de 11 pontos)
            if (totalAcertos >= 11) {
                console.log(`   🏆 PRÊMIO! ${totalAcertos} pontos`);
                contadoresGerais[totalAcertos].qtd++;
                
                // Mapear faixas de prêmio da Lotofácil:
                // 15 acertos = faixa 1, 14 acertos = faixa 2, etc.
                const faixa = 16 - totalAcertos; // 15→1, 14→2, 13→3, 12→4, 11→5
                
                console.log(`   💰 Buscando prêmio da faixa ${faixa}...`);
                
                const premio = resultado.dados.listaRateioPremio.find(p => p.faixa === faixa);
                if (premio) {
                    valorPremioJogo = premio.valorPremio;
                    contadoresGerais[totalAcertos].valor += valorPremioJogo;
                    totalConcurso += valorPremioJogo;
                    premiosPorJogo[indexJogo] += valorPremioJogo;
                    temJogoComPremio = true;
                    
                    console.log(`   💎 Valor do prêmio: R$ ${valorPremioJogo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                } else {
                    console.log(`   ⚠️ Prêmio não encontrado para faixa ${faixa}`);
                }
            }
            
            // Criar card do jogo apenas se tiver pelo menos 11 pontos
            if (totalAcertos >= 11) {
                const jogoCard = document.createElement('div');
                jogoCard.className = `jogo-verificado pontos-${totalAcertos}`;
                jogoCard.style.cssText = 'margin-bottom: 15px;';
                
                // Header do jogo
                const jogoHeader = document.createElement('div');
                jogoHeader.className = 'jogo-header';
                
                const jogoNumero = document.createElement('div');
                jogoNumero.className = 'jogo-numero';
                jogoNumero.textContent = `Jogo ${indexJogo + 1}`;
                
                const jogoPontos = document.createElement('div');
                jogoPontos.className = `jogo-pontos acertos-${totalAcertos}`;
                jogoPontos.textContent = `${totalAcertos} acertos`;
                
                jogoHeader.appendChild(jogoNumero);
                jogoHeader.appendChild(jogoPontos);
                
                // Números do jogo
                const numerosContainer = document.createElement('div');
                numerosContainer.className = 'jogo-numeros-container';
                
                jogo.forEach(numero => {
                    const numeroItem = document.createElement('div');
                    numeroItem.className = `jogo-numero-item ${acertos.includes(numero) ? 'acertou' : ''}`;
                    numeroItem.textContent = numero.toString().padStart(2, '0');
                    numerosContainer.appendChild(numeroItem);
                });
                
                jogoCard.appendChild(jogoHeader);
                jogoCard.appendChild(numerosContainer);
                
                // Mostrar prêmio deste concurso
                if (valorPremioJogo > 0) {
                    const premioDiv = document.createElement('div');
                    premioDiv.className = 'jogo-premio';
                    premioDiv.innerHTML = `<div class="jogo-premio-valor">Prêmio neste concurso: ${new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                    }).format(valorPremioJogo)}</div>`;
                    jogoCard.appendChild(premioDiv);
                }
                
                concursoSection.appendChild(jogoCard);
            }
        });
        
        // Total deste concurso
        if (totalConcurso > 0) {
            const totalConcursoDiv = document.createElement('div');
            totalConcursoDiv.style.cssText = 'margin-top: 20px; padding: 15px; background: rgba(46, 204, 113, 0.15); border-radius: 8px; text-align: center; border: 2px solid #2ecc71;';
            totalConcursoDiv.innerHTML = `<div style="color: #fff; font-size: 18px; font-weight: bold;">Total ganho neste concurso: ${new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(totalConcurso)}</div>`;
            concursoSection.appendChild(totalConcursoDiv);
            totalGeralAcumulado += totalConcurso;
            
            console.log(`   💰 TOTAL DO CONCURSO: R$ ${totalConcurso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        } else {
            const semPremioDiv = document.createElement('div');
            semPremioDiv.style.cssText = 'margin-top: 15px; padding: 12px; background: rgba(149, 165, 166, 0.1); border-radius: 8px; text-align: center; color: #95a5a6; font-style: italic;';
            semPremioDiv.textContent = 'Nenhum prêmio neste concurso';
            concursoSection.appendChild(semPremioDiv);
            
            console.log(`   ❌ Nenhum jogo pontuou 11+ neste concurso`);
        }
        
        // Só adicionar seção se teve pelo menos 1 jogo com prêmio ou mostrar que não teve
        jogosVerificados.appendChild(concursoSection);
    });
    
    console.log(`\n🏆 === RESUMO FINAL ===`);
    console.log(`💰 Total Geral Acumulado: R$ ${totalGeralAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`📊 Período verificado: Concurso ${resultados[0].concurso} (${resultados[0].data}) até ${resultados[resultados.length - 1].concurso} (${resultados[resultados.length - 1].data})`);
    console.log(`📅 Total de ${resultados.length} concurso(s) analisados`);
    console.log(`🎯 Resumo por pontuação:`);
    for (let pontos = 15; pontos >= 11; pontos--) {
        console.log(`   ${pontos} pontos: ${contadoresGerais[pontos].qtd} vez(es) - R$ ${contadoresGerais[pontos].valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    
    // Criar resumo geral de TODOS os concursos
    const primeiroResultado = resultados[0];
    const ultimoResultado = resultados[resultados.length - 1];
    
    const resumoHTML = `
        <h4 style="color: #fff; text-align: center; font-size: 24px; margin-bottom: 15px;">📊 RESUMO GERAL - ANÁLISE COMPLETA</h4>
        <div style="background: rgba(52, 152, 219, 0.15); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 2px solid rgba(52, 152, 219, 0.3);">
            <div style="color: #3498db; text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                🗓️ PERÍODO ANALISADO
            </div>
            <div style="color: #fff; text-align: center; font-size: 16px;">
                <strong>Do Concurso ${primeiroResultado.concurso}</strong> (${primeiroResultado.data}) 
                <strong>até o Concurso ${ultimoResultado.concurso}</strong> (${ultimoResultado.data})<br>
                <span style="color: #f39c12;">📈 Total: ${resultados.length} concurso(s) verificado(s)</span>
            </div>
        </div>
        <div class="resumo-item acerto-15">
            <span class="resumo-label">🏆 15 Pontos:</span>
            <span class="resumo-valor">${contadoresGerais[15].qtd} vez(es) - Total: ${new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(contadoresGerais[15].valor)}</span>
        </div>
        <div class="resumo-item acerto-14">
            <span class="resumo-label">⭐ 14 Pontos:</span>
            <span class="resumo-valor">${contadoresGerais[14].qtd} vez(es) - Total: ${new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(contadoresGerais[14].valor)}</span>
        </div>
        <div class="resumo-item acerto-13">
            <span class="resumo-label">💎 13 Pontos:</span>
            <span class="resumo-valor">${contadoresGerais[13].qtd} vez(es) - Total: ${new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(contadoresGerais[13].valor)}</span>
        </div>
        <div class="resumo-item acerto-12">
            <span class="resumo-label">🎯 12 Pontos:</span>
            <span class="resumo-valor">${contadoresGerais[12].qtd} vez(es) - Total: ${new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(contadoresGerais[12].valor)}</span>
        </div>
        <div class="resumo-item acerto-11">
            <span class="resumo-label">✨ 11 Pontos:</span>
            <span class="resumo-valor">${contadoresGerais[11].qtd} vez(es) - Total: ${new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(contadoresGerais[11].valor)}</span>
        </div>
    `;
    
    resumoPremios.innerHTML = resumoHTML;
    
    // ========================================
    // TABELA DE PRÊMIOS POR JOGO
    // ========================================
    const tabelaJogosDiv = document.createElement('div');
    tabelaJogosDiv.style.cssText = 'margin-top: 30px; padding: 25px; background: rgba(52, 152, 219, 0.1); border-radius: 15px; border: 2px solid rgba(52, 152, 219, 0.3);';
    
    const tabelaTitle = document.createElement('h4');
    tabelaTitle.style.cssText = 'color: #3498db; text-align: center; font-size: 22px; margin-bottom: 20px;';
    tabelaTitle.textContent = '💎 TOTAL ACUMULADO POR JOGO';
    tabelaJogosDiv.appendChild(tabelaTitle);
    
    // Criar lista de jogos com totais
    premiosPorJogo.forEach((totalJogo, index) => {
        const jogoItem = document.createElement('div');
        jogoItem.style.cssText = `
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 15px 20px; 
            margin: 10px 0; 
            background: ${totalJogo > 0 ? 'rgba(46, 204, 113, 0.15)' : 'rgba(149, 165, 166, 0.1)'}; 
            border-radius: 8px; 
            border-left: 4px solid ${totalJogo > 0 ? '#2ecc71' : '#95a5a6'};
        `;
        
        const jogoLabel = document.createElement('span');
        jogoLabel.style.cssText = 'color: #fff; font-size: 18px; font-weight: bold;';
        jogoLabel.textContent = `Jogo ${index + 1}`;
        
        const jogoValor = document.createElement('span');
        jogoValor.style.cssText = `color: ${totalJogo > 0 ? '#2ecc71' : '#95a5a6'}; font-size: 20px; font-weight: bold;`;
        jogoValor.textContent = new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(totalJogo);
        
        jogoItem.appendChild(jogoLabel);
        jogoItem.appendChild(jogoValor);
        tabelaJogosDiv.appendChild(jogoItem);
        
        console.log(`🎲 Jogo ${index + 1}: R$ ${totalJogo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    });
    
    resumoPremios.appendChild(tabelaJogosDiv);
    
    // TOTAL GERAL ACUMULADO
    const totalDiv = document.createElement('div');
    totalDiv.style.cssText = 'margin-top: 25px; padding: 25px; background: linear-gradient(135deg, rgba(46, 204, 113, 0.3), rgba(39, 174, 96, 0.3)); border-radius: 15px; text-align: center; border: 3px solid #2ecc71; box-shadow: 0 8px 25px rgba(46, 204, 113, 0.4);';
    totalDiv.innerHTML = `
        <div style="color: #f1c40f; font-size: 18px; margin-bottom: 10px;">💰 TOTAL GERAL ACUMULADO 💰</div>
        <div style="color: #fff; font-size: 36px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(totalGeralAcumulado)}</div>
        <div style="color: #2ecc71; font-size: 16px; margin-top: 10px; font-weight: bold;">
            📊 Período: Concurso ${primeiroResultado.concurso} até ${ultimoResultado.concurso}
        </div>
        <div style="color: #fff; font-size: 16px; margin-top: 5px;">
            📅 ${primeiroResultado.data} até ${ultimoResultado.data} (${resultados.length} concursos)
        </div>
        <div style="color: #f39c12; font-size: 16px; margin-top: 8px; font-weight: bold;">
            🎯 Soma de todos os 10 jogos em TODOS os sorteios
        </div>
    `;
    resumoPremios.appendChild(totalDiv);
    
    // Mostrar container de verificação
    verificacaoContainer.style.display = 'block';
}

// ============================================
// FUNÇÃO PARA CRIAR DADOS SIMULADOS (TESTE)
// ============================================
function criarDadosSimulados() {
    console.log('🎭 Criando dados simulados para demonstração...');
    console.log('📋 Incluindo concursos 3525, 3526 e 3527 (todos já conferidos)');
    
    const dadosSimulados = [
        {
            data: '29/10/2025',
            concurso: 3525,
            dia: 'Quarta-feira',
            numerosSorteados: [1, 2, 3, 6, 7, 8, 9, 12, 13, 14, 16, 17, 18, 19, 21],
            dados: {
                numero: 3525,
                dataApuracao: '29/10/2025',
                valorEstimadoProximoConcurso: 1500000,
                listaDezenas: ['01', '02', '03', '06', '07', '08', '09', '12', '13', '14', '16', '17', '18', '19', '21'],
                listaRateioPremio: [
                    { faixa: 1, numeroDeGanhadores: 0, valorPremio: 0 }, // 15 pontos
                    { faixa: 2, numeroDeGanhadores: 12, valorPremio: 1847.65 }, // 14 pontos
                    { faixa: 3, numeroDeGanhadores: 225, valorPremio: 30 }, // 13 pontos
                    { faixa: 4, numeroDeGanhadores: 8920, valorPremio: 12 }, // 12 pontos
                    { faixa: 5, numeroDeGanhadores: 115000, valorPremio: 6 } // 11 pontos
                ]
            }
        },
        {
            data: '30/10/2025',
            concurso: 3526,
            dia: 'Quinta-feira',
            numerosSorteados: [2, 4, 5, 7, 8, 11, 12, 13, 15, 16, 17, 19, 20, 22, 25],
            dados: {
                numero: 3526,
                dataApuracao: '30/10/2025',
                valorEstimadoProximoConcurso: 1600000,
                listaDezenas: ['02', '04', '05', '07', '08', '11', '12', '13', '15', '16', '17', '19', '20', '22', '25'],
                listaRateioPremio: [
                    { faixa: 1, numeroDeGanhadores: 1, valorPremio: 1200000 }, // 15 pontos
                    { faixa: 2, numeroDeGanhadores: 8, valorPremio: 2250.50 }, // 14 pontos
                    { faixa: 3, numeroDeGanhadores: 180, valorPremio: 30 }, // 13 pontos
                    { faixa: 4, numeroDeGanhadores: 7800, valorPremio: 12 }, // 12 pontos
                    { faixa: 5, numeroDeGanhadores: 98000, valorPremio: 6 } // 11 pontos
                ]
            }
        },
        {
            data: '31/10/2025',
            concurso: 3527,
            dia: 'Sexta-feira',
            numerosSorteados: [3, 5, 6, 9, 10, 11, 13, 14, 16, 18, 20, 21, 23, 24, 25],
            dados: {
                numero: 3527,
                dataApuracao: '31/10/2025',
                valorEstimadoProximoConcurso: 1700000,
                listaDezenas: ['03', '05', '06', '09', '10', '11', '13', '14', '16', '18', '20', '21', '23', '24', '25'],
                listaRateioPremio: [
                    { faixa: 1, numeroDeGanhadores: 0, valorPremio: 0 }, // 15 pontos
                    { faixa: 2, numeroDeGanhadores: 15, valorPremio: 1650.80 }, // 14 pontos
                    { faixa: 3, numeroDeGanhadores: 290, valorPremio: 30 }, // 13 pontos
                    { faixa: 4, numeroDeGanhadores: 9200, valorPremio: 12 }, // 12 pontos
                    { faixa: 5, numeroDeGanhadores: 105000, valorPremio: 6 } // 11 pontos
                ]
            }
        },
        {
            data: '01/11/2025',
            concurso: 3528,
            dia: 'Sábado',
            numerosSorteados: [1, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17, 19, 20, 22, 24],
            dados: {
                numero: 3528,
                dataApuracao: '01/11/2025',
                valorEstimadoProximoConcurso: 1800000,
                listaDezenas: ['01', '04', '07', '08', '09', '11', '12', '13', '14', '15', '17', '19', '20', '22', '24'],
                listaRateioPremio: [
                    { faixa: 1, numeroDeGanhadores: 0, valorPremio: 0 }, // 15 pontos
                    { faixa: 2, numeroDeGanhadores: 18, valorPremio: 1425.30 }, // 14 pontos
                    { faixa: 3, numeroDeGanhadores: 320, valorPremio: 30 }, // 13 pontos
                    { faixa: 4, numeroDeGanhadores: 9800, valorPremio: 12 }, // 12 pontos
                    { faixa: 5, numeroDeGanhadores: 118000, valorPremio: 6 } // 11 pontos
                ]
            }
        }
    ];
    
    console.log('📊 Dados simulados criados com 4 concursos:', dadosSimulados.map(d => `${d.concurso} (${d.data})`).join(', '));
    return dadosSimulados;
}