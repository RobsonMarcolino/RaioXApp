const functions = require('@google-cloud/functions-framework');

// URL da Planilha
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTfDeTnX48gWUAbXL_LcueTA-TMVcgqAe8VxBXjrlFnyGgQxZuZEs-gh7B1vDNYVn8efcxUJqB_QIx-/pub?output=csv";

// --- 1. UTILITÁRIOS & PARSER (A Base Técnica) ---

// Função para deixar o texto limpo para comparação
const normalizar = (texto) => {
    return (texto || "").toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim();
};

// Sorteia uma resposta para não parecer robô repetitivo
const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];

// Pega a saudação correta baseada no Horário de Brasília
const getSaudacaoTemporal = () => {
    // Gambiarra técnica para pegar hora certa no servidor do Google (que roda em UTC)
    const dataBR = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(dataBR).getHours();

    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 18) return "Boa tarde";
    return "Boa noite";
};

// Parser CSV (O mesmo robusto de sempre)
const parseCSVRobust = (text) => {
    const lines = [];
    const rawLines = text.trim().split("\n").filter((line) => line.trim());
    for (const line of rawLines) {
        const row = [];
        let cell = "";
        let inQuote = false;
        const cleanLine = line.replace(/\r$/, "");
        for (let i = 0; i < cleanLine.length; i++) {
            const char = cleanLine[i];
            if (char === '"') {
                if (inQuote && cleanLine[i + 1] === '"') { cell += '"'; i++; }
                else { inQuote = !inQuote; }
            } else if (char === "," && !inQuote) {
                row.push(cell.trim()); cell = "";
            } else { cell += char; }
        }
        row.push(cell.trim()); lines.push(row);
    }
    if (lines.length > 1) {
        const headers = lines[0];
        return lines.slice(1).map((row) => {
            const obj = {};
            headers.forEach((header, index) => {
                let key = normalizar(header).replace(/[^a-z0-9]/g, "_");
                const value = (row[index] || "").trim();
                if (key === "eg" || key === "codigo") obj.eg = value;
                else if (key.includes("nome")) obj.nome_fantasia = value;
                else if (key.includes("gn")) obj.gn = value;
                else if (key.includes("rede")) obj.rede = value;
                else if (key.includes("coordenador")) obj.coordenador = value;
                else if (key.includes("share_de_espaco_m_1") && !key.includes("vs")) obj.share_de_espaco_m1 = value;
                else if (key.includes("share_de_espaco_m0")) obj.share_de_espaco_m0 = value;
                else if (key === "spaten") obj.spaten = value;
                else if (key === "corona") obj.corona = value;
                else if (key === "stella") obj.stella = value;
                else if (key === "ponto_extra") obj.ponto_extra = value;
                else if (key === "gondola") obj.gondola = value;
                else obj[key] = value;
            });
            obj.busca_full = normalizar(`${obj.eg} ${obj.nome_fantasia} ${obj.rede} ${obj.gn}`);
            return obj;
        }).filter(item => item.eg);
    }
    return [];
};

// --- 2. CÉREBRO DA RESPOSTA (O Analista Inteligente) ---

const gerarAnaliseProfunda = (loja) => {
    if (!loja) return null;

    const toNum = (val) => parseFloat((val || "0").replace(",", ".").replace("%", ""));
    const shareM0 = toNum(loja.share_de_espaco_m0);
    const shareM1 = toNum(loja.share_de_espaco_m1);
    const delta = shareM0 - shareM1;

    // Diagnóstico de Itens Críticos
    const checkStatus = (val) => {
        const v = (val || "").toUpperCase();
        return v === "SIM" || v === "OK" || v === "S";
    };

    const gaps = [];
    if (!checkStatus(loja.spaten)) gaps.push("Spaten");
    if (!checkStatus(loja.corona)) gaps.push("Corona");
    if (!checkStatus(loja.stella)) gaps.push("Stella"); // Adicionado Stella
    if (!checkStatus(loja.ponto_extra)) gaps.push("Ponto Extra");

    // Variação da intro para parecer humano
    const intros = [
        `🔎 **Análise Solicitada:**`,
        `📊 **Dossiê do Estabelecimento:**`,
        `📑 **Relatório Gerencial:**`
    ];

    let txt = `${sortear(intros)} **${loja.nome_fantasia}**\n`;
    txt += `🆔 EG: ${loja.eg} | Rede: ${loja.rede || "Não identificada"}\n`;
    txt += `👤 Gestão: ${loja.gn || "N/A"}\n\n`;

    // Análise de Share com "Sentimento"
    txt += `📉 **Dinâmica de Share:**\n`;
    if (delta > 0.5) {
        txt += `🚀 **Excelente!** Crescemos **+${delta.toFixed(1)}%** (De ${shareM1}% para ${shareM0}%).\n`;
        txt += `💡 *Recomendação:* O trabalho de execução está surtindo efeito. Blinde esse espaço!\n`;
    } else if (delta < -0.5) {
        txt += `⚠️ **Alerta:** Queda de **${delta.toFixed(1)}%** (De ${shareM1}% para ${shareM0}%).\n`;
        txt += `🔥 *Ação Imediata:* Identificar se houve invasão da concorrência ou perda de módulos.\n`;
    } else {
        txt += `➖ **Estabilidade:** Mantivemos ${shareM0}%. (M-1: ${shareM1}%).\n`;
        txt += `💡 *Insight:* Para crescer, precisamos de um Ponto Extra agressivo.\n`;
    }

    txt += `\n📋 **Checklist de Execução (Score 5):**\n`;
    if (gaps.length === 0) {
        txt += `✅ **Loja Perfeita!** Mix Premium e Pontos Extras positivados.\n`;
    } else {
        txt += `❌ **GAPS Encontrados:** Faltam ${gaps.join(" + ")}.\n`;
        txt += `Oportunidade de aumentar o faturamento introduzindo esses itens.\n`;
    }

    return txt;
};

// --- 3. BASE DE CONHECIMENTO (Perguntas e Respostas Gerais) ---
const baseConhecimento = {
    conceitos: {
        "share": "📊 **O que é Share de Espaço?**\nRepresenta a % de espaço que nossos produtos ocupam na gôndola em comparação ao total da categoria. A meta é sempre ter Dominância (>50%).",
        "score": "🏆 **Sobre o Score 5:**\nÉ nosso principal KPI de execução. Avalia: Share, Presença de Spaten/Corona/Stella, Ponto Extra e Geladeira.",
        "gn": "👤 **GN (Gerente de Negócios):**\nÉ o responsável pela carteira de clientes e gestão dos vendedores e promotores da região."
    },
    produtos: {
        "spaten": "🍺 **Spaten:** Cerveja puro malte estilo Munich Helles. Foco em harmonização e qualidade. Item OBRIGATÓRIO no Mix Premium.",
        "corona": "🍋 **Corona:** Cerveja premium mais vendida. Foco em ocasiões de consumo diurno e 'Sunset'.",
        "stella": "🍺 **Stella Artois:** Cerveja premium de origem belga. Foco em ocasiões especiais e gastronomia."
    }
};

// --- 4. SERVIDOR PRINCIPAL (A "IA" Híbrida) ---
functions.http('analisar', async (req, res) => {
    // Configurações de CORS (Permitir acesso do app)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

    try {
        // --- PREPARAÇÃO DOS DADOS ---
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { } }

        let inputUsuario = (body.message || body.prompt || "").toString();
        let egClicado = body.eg;
        let textoLimpo = normalizar(inputUsuario);
        const saudacaoAtual = getSaudacaoTemporal(); // Bom dia/tarde/noite

        let respostaFinal = "";

        // --- ROTEADOR INTELIGENTE DE INTENÇÕES ---

        // 1. O usuário mandou uma SAUDAÇÃO? (Espelhamento Inteligente)
        if (textoLimpo.match(/^(bom dia|boa tarde|boa noite)/)) {
            // Se o usuário diz "Bom dia", a gente responde "Bom dia" (se for de manhã) ou corrige educadamente
            respostaFinal = `👋 ${saudacaoAtual}! Sou o Assistente Score 5.\n\nComo posso ajudar na sua análise hoje?\nDigite o **Nome da Loja**, o **EG** ou peça o **Menu**.`;
        }
        else if (textoLimpo.match(/^(oi|ola|e ai|opa|alo)/)) {
            const respostasOi = [
                `👋 Olá! ${saudacaoAtual}. Pronto para analisar?`,
                `🤖 Olá! Sistema Score 5 online.`,
                `👋 Oi! Qual loja vamos verificar agora?`
            ];
            respostaFinal = sortear(respostasOi);
        }

        // 2. O usuário clicou no MENU ou pediu AJUDA?
        else if (textoLimpo.includes("menu") || textoLimpo.includes("ajuda") || textoLimpo.includes("opcoes")) {
            respostaFinal = `🤖 **Central de Ajuda Score 5**\n\n` +
                `1️⃣ **Análise de Loja:** Digite o EG (ex: 79499) ou Nome (ex: Supermercado BH).\n` +
                `2️⃣ **Conceitos:** Pergunte "O que é Share?" ou "O que é Score?".\n` +
                `3️⃣ **Produtos:** Pergunte sobre "Spaten", "Corona" ou "Stella".\n\n` +
                `👇 *Digite sua dúvida abaixo:*`;
        }

        // 3. Perguntas conceituais (Base de Conhecimento)
        else if (textoLimpo.includes("share") || textoLimpo.includes("espaco")) respostaFinal = baseConhecimento.conceitos["share"];
        else if (textoLimpo.includes("score")) respostaFinal = baseConhecimento.conceitos["score"];
        else if (textoLimpo.includes("gn") && textoLimpo.length < 5) respostaFinal = baseConhecimento.conceitos["gn"]; // Só se digitar "o que é gn"
        else if (textoLimpo.includes("spaten")) respostaFinal = baseConhecimento.produtos["spaten"];
        else if (textoLimpo.includes("corona")) respostaFinal = baseConhecimento.produtos["corona"];
        else if (textoLimpo.includes("stella")) respostaFinal = baseConhecimento.produtos["stella"];

        // 4. Agradecimentos
        else if (textoLimpo.includes("obrigado") || textoLimpo.includes("valeu") || textoLimpo.includes("top")) {
            const agradecimentos = [
                "🤝 Tamo junto! Foco na execução.",
                "🚀 Disponha! Se precisar de mais dados, é só chamar.",
                "👊 Conte comigo. Vamos buscar esse Share!"
            ];
            respostaFinal = sortear(agradecimentos);
        }

        // 5. O usuário quer uma LOJA (Prioridade Máxima)
        else {
            // Verifica se tem EG clicado ou no texto
            const matchEg = inputUsuario.match(/\d{4,6}-?\d?/);
            const termoBusca = textoLimpo.replace(/(analisa|ver|buscar|loja|gostaria|preciso|de|da|do|analise|sobre|me|fale|pode)\s/g, "").trim();

            // Só baixa a planilha se realmente parecer uma busca (evita lentidão em 'oi')
            if (egClicado || matchEg || termoBusca.length > 2) {
                const sheetResponse = await fetch(GOOGLE_SHEET_CSV_URL);
                const csvText = await sheetResponse.text();
                const csvData = parseCSVRobust(csvText);

                let lojaEncontrada = null;

                // Estratégia A: Busca por EG exato
                if (egClicado) {
                    lojaEncontrada = csvData.find(l => normalizar(l.eg) === normalizar(egClicado));
                }
                // Estratégia B: Busca por EG no texto
                else if (matchEg) {
                    lojaEncontrada = csvData.find(l => normalizar(l.eg).includes(matchEg[0]));
                }
                // Estratégia C: Busca por Nome (Fuzzy Search simples)
                else if (termoBusca.length > 3) {
                    // Filtra todas as lojas que parecem com o nome (busca mais ampla)
                    const candidatos = csvData.filter(l => l.busca_full.includes(termoBusca));

                    if (candidatos.length === 1) {
                        lojaEncontrada = candidatos[0];
                    } else if (candidatos.length > 1) {
                        // Resposta inteligente se achar vários
                        respostaFinal = `🔎 Encontrei **${candidatos.length} lojas** com termo "${termoBusca}".\n\nSeja mais específico ou digite o EG:\n\n`;
                        respostaFinal += candidatos.slice(0, 5).map(l => `🔹 ${l.nome_fantasia} (EG: ${l.eg})`).join("\n");
                        if (candidatos.length > 5) respostaFinal += `\n... (+${candidatos.length - 5} lojas)`;
                    }
                }

                if (lojaEncontrada) {
                    respostaFinal = gerarAnaliseProfunda(lojaEncontrada);
                } else if (!respostaFinal) {
                    // Se não achou loja e não caiu em nenhum outro if antes
                    respostaFinal = `🧐 Não encontrei nenhuma loja com o termo **"${termoBusca}"** na base ativa.\n\nTente digitar o código EG ou verifique a ortografia.`;
                }
            } else {
                // Caso tenha sobrado lixo ou texto curto
                respostaFinal = `🤔 Não entendi. Você pode digitar o **Nome da Loja**, o **EG**, ou falar **"Menu"** para ver opções.`;
            }
        }

        res.status(200).json({ resposta: respostaFinal });

    } catch (error) {
        console.error("Erro Fatal:", error);
        res.status(200).json({ resposta: "⚠️ Estou atualizando minha base de dados. Tente novamente em alguns segundos." });
    }
});
