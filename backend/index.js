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
                else if (key.includes("gondola")) obj.gondola = value;
                else if (key.includes("atendimento")) obj.atendimento = value;
                else if (key.includes("visita") && key.includes("quinzenal")) obj.visita_quinzenal = value;
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

    // Diagnóstico de Itens
    const checkStatus = (val) => {
        const v = (val || "").toUpperCase();
        return v === "SIM" || v === "OK" || v === "S";
    };

    const gaps = [];
    if (!checkStatus(loja.spaten)) gaps.push("Spaten");
    if (!checkStatus(loja.corona)) gaps.push("Corona");
    if (!checkStatus(loja.stella)) gaps.push("Stella");
    if (!checkStatus(loja.ponto_extra)) gaps.push("Ponto Extra");

    // Lógica de Sentimento
    let status = "neutral";
    let title = "Estável";
    let message = "Manter execução.";

    if (delta > 0.5) {
        status = "success";
        title = "Crescimento";
        message = "Ótimo trabalho! Blinde o espaço conquistado.";
    } else if (delta < -0.5) {
        status = "danger";
        title = "Queda";
        message = "Alerta! Recupere espaço ou verifique invasões.";
    } else {
        message = "Precisamos de Ponto Extra para voltar a crescer.";
    }

    // Retorna OBJETO ESTRUTURADO para o Frontend montar o Card
    return {
        type: "analysis_card",
        text: `📊 Análise de ${loja.nome_fantasia} gerada com sucesso.`, // Fallback de texto
        card: {
            title: loja.nome_fantasia,
            subtitle: `EG: ${loja.eg} | Rede: ${loja.rede || "N/A"}`,
            gn: loja.gn,
            share: {
                current: shareM0,
                previous: shareM1,
                delta: delta.toFixed(1),
                status: status // 'success', 'danger', 'neutral'
            },
            gaps: gaps, // Lista do que falta
            insight: message,
            extra: {
                atendimento: loja.atendimento || "N/A",
                visita_quinzenal: loja.visita_quinzenal || "N/A"
            }
        }
    };
};

// --- 3. BASE DE PRODUTOS (Apenas Detalhes Úteis) ---
const produtosInfo = {
    "spaten": "🍺 **Spaten:** Cerveja puro malte estilo Munich Helles. Item OBRIGATÓRIO no Mix.",
    "corona": "🍋 **Corona:** Cerveja premium mais vendida. Foco em ocasiões 'Sunset'.",
    "stella": "🍺 **Stella Artois:** Cerveja premium belga. Foco em gastronomia."
};

// --- 4. SERVIDOR PRINCIPAL (A "IA" Híbrida) ---
functions.http('analisar', async (req, res) => {
    // Configurações de CORS
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
        const saudacaoAtual = getSaudacaoTemporal();

        let respostaFinal = "";

        // --- ROTEADOR INTELIGENTE ---

        // 1. Saudações (Resposta Curta e Profissional)
        if (textoLimpo.match(/^(bom dia|boa tarde|boa noite|oi|ola|e ai|opa)/)) {
            respostaFinal = `👋 ${saudacaoAtual}! Assistente Raio-X Score 5 pronto.\n\nQual loja vamos analisar agora? (Digite Nome ou EG)`;
        }

        // 2. Menu/Ajuda (Versão Lean)
        else if (textoLimpo.includes("menu") || textoLimpo.includes("ajuda") || textoLimpo.includes("opcoes")) {
            respostaFinal = `🤖 **Central Rápida**\n\n` +
                `1️⃣ Digite o **EG** ou **Nome** para analisar a loja.\n` +
                `2️⃣ Pergunte sobre **Spaten**, **Corona** ou **Stella** para detalhes do produto.\n\n` +
                `👇 Aguardando seu comando:`;
        }

        // 3. Perguntas de Produto (Sem conceitos básicos)
        else if (textoLimpo.includes("spaten")) respostaFinal = produtosInfo["spaten"];
        else if (textoLimpo.includes("corona")) respostaFinal = produtosInfo["corona"];
        else if (textoLimpo.includes("stella")) respostaFinal = produtosInfo["stella"];

        // 4. Agradecimentos
        else if (textoLimpo.includes("obrigado") || textoLimpo.includes("valeu") || textoLimpo.includes("top")) {
            respostaFinal = "🤝 Tamo junto! Foco total na execução!";
        }

        // 5. ANÁLISE DE LOJA (O Principal)
        else {
            const matchEg = inputUsuario.match(/\d{4,6}-?\d?/);
            const termoBusca = textoLimpo.replace(/(analisa|ver|buscar|loja|gostaria|preciso|de|da|do|analise|sobre|me|fale|pode)\s/g, "").trim();

            if (egClicado || matchEg || termoBusca.length > 2) {
                const sheetResponse = await fetch(GOOGLE_SHEET_CSV_URL);
                const csvText = await sheetResponse.text();
                const csvData = parseCSVRobust(csvText);

                let lojaEncontrada = null;

                if (egClicado) {
                    lojaEncontrada = csvData.find(l => normalizar(l.eg) === normalizar(egClicado));
                } else if (matchEg) {
                    lojaEncontrada = csvData.find(l => normalizar(l.eg).includes(matchEg[0]));
                } else if (termoBusca.length > 3) {
                    const candidatos = csvData.filter(l => l.busca_full.includes(termoBusca));
                    if (candidatos.length === 1) lojaEncontrada = candidatos[0];
                    else if (candidatos.length > 1) {
                        respostaFinal = `🔎 Achei **${candidatos.length} lojas** com termo "${termoBusca}".\n\nPrincipais:\n` + candidatos.slice(0, 5).map(l => `🔹 ${l.nome_fantasia} (EG: ${l.eg})`).join("\n");
                    }
                }

                if (lojaEncontrada) {
                    const analise = gerarAnaliseProfunda(lojaEncontrada);
                    // Retorna o objeto completo para o frontend processar
                    return res.status(200).json({
                        resposta: analise.text, // Texto fallback
                        card: analise.card      // Dados ricos
                    });
                } else if (!respostaFinal) { // Only set if no multiple candidates message was set
                    respostaFinal = `🧐 Não encontrei nenhuma loja com o termo **"${termoBusca}"**. Tente o EG.`;
                }
            } else {
                respostaFinal = `🤔 Não entendi. Digite o **Nome da Loja**, o **EG**, ou **"Menu"**.`;
            }
        }

        res.status(200).json({ resposta: respostaFinal });

    } catch (error) {
        console.error("Erro Fatal:", error);
        res.status(200).json({ resposta: "⚠️ Banco de dados atualizando. Tente em instantes." });
    }
});
