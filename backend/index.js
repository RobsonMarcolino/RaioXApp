const functions = require('@google-cloud/functions-framework');

// URL da Planilha
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTfDeTnX48gWUAbXL_LcueTA-TMVcgqAe8VxBXjrlFnyGgQxZuZEs-gh7B1vDNYVn8efcxUJqB_QIx-/pub?output=csv";

// --- 1. Parser de CSV Robust (Mantido) ---
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
                let key = header.trim().toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
                const value = (row[index] || "").trim();

                if (key === "eg" || key === "codigo" || key === "code") obj.eg = value;
                else if (key.includes("nome")) obj.nome_fantasia = value;
                else if (key === "rede") obj.rede = value;
                else if (key === "coordenador") obj.coordenador = value;
                else if (key === "gn") obj.gn = value;
                else if (key.includes("sl_sc")) obj.sl_sc = value;
                else if (key.includes("share_de_espaco_m_1") && !key.includes("vs")) obj.share_de_espaco_m1 = value;
                else if (key.includes("share_de_espaco_m0")) obj.share_de_espaco_m0 = value;
                else if (key.includes("share_de_espaco") && key.includes("vs") && key.includes("m_1")) obj.share_de_espaco_vs_m1 = value;
                else if (key.includes("share_de_gelado_m_1") && !key.includes("vs")) obj.share_de_gelado_m1 = value;
                else if (key.includes("share_de_gelado_m0")) obj.share_de_gelado_m0 = value;
                else if (key.includes("share_de_gelado") && key.includes("vs") && key.includes("m_1")) obj.share_de_gelado_vs_m1 = value;
                else obj[key] = value;
            });
            return obj;
        }).filter(item => item.eg);
    }
    return [];
};

// --- 2. MOTOR DE REGRAS (A "Inteligência" Hardcoded) ---
const generateExpertAnalysis = (loja) => {
    if (!loja) return "❌ Loja não encontrada ou dados indisponíveis.";

    // Análise de Share Espaço
    const shareM1 = parseFloat(loja.share_de_espaco_m1?.replace(',', '.') || 0);
    const shareM0 = parseFloat(loja.share_de_espaco_m0?.replace(',', '.') || 0);
    const trendShare = shareM0 - shareM1;
    let trendEmoji = "➖";
    let trendText = "Estável";
    let shareInsight = "";

    if (trendShare > 0.1) {
        trendEmoji = "📈";
        trendText = "Crescimento";
        shareInsight = "Ótimo trabalho! Mantenha a execução para segurar esse ganho.";
    } else if (trendShare < -0.1) {
        trendEmoji = "📉";
        trendText = "Queda";
        shareInsight = "🚨 Atenção! Perdemos espaço. Verifique invasões da concorrência urgente.";
    } else {
        shareInsight = "Share estável. Tente negociar um ponto extra para destravar crescimento.";
    }

    // Análise Mix Premium
    const mix = [];
    if ((loja.corona || "").toUpperCase().includes("SIM") || (loja.corona || "").toUpperCase().includes("OK")) mix.push("Corona ✅"); else mix.push("Corona ❌");
    if ((loja.spaten || "").toUpperCase().includes("SIM") || (loja.spaten || "").toUpperCase().includes("OK")) mix.push("Spaten ✅"); else mix.push("Spaten ❌");
    if ((loja.stella || "").toUpperCase().includes("SIM") || (loja.stella || "").toUpperCase().includes("OK")) mix.push("Stella ✅"); else mix.push("Stella ❌");

    // Análise Execução
    const temPontoExtra = (loja.ponto_extra?.includes("SIM") || loja.ponto_extra?.includes("OK") || parseFloat(loja.ponto_extra) > 0);
    const gapPontoExtra = temPontoExtra ? "Ponto Extra: ✅ Ativo" : "🎯 OPORTUNIDADE: Negocie um Ponto Extra!";

    // Montagem da Resposta
    return `
📊 **ANÁLISE RAIO-X | ${loja.nome_fantasia}**
*(EG: ${loja.eg} | Rede: ${loja.rede})*

🏆 **PERFORMANCE DE SHARE**
• Mês Anterior: ${shareM1}%
• Mês Atual: ${shareM0}%
• Tendência: ${trendEmoji} **${trendText}** (${trendShare.toFixed(1)}%)
💡 *Dica:* ${shareInsight}

🍺 **MIX PREMIUM (Disponibilidade)**
${mix.join("\n")}

🛠️ **EXECUÇÃO & VISIBILIDADE**
• ${gapPontoExtra}
• Gôndola: ${loja.gondola || "N/A"}
• Base Foco: ${loja.base_foco || "N/A"}

� **EQUIPE**
• GN: ${loja.gn}
• Coord: ${loja.coordenador}

🚀 *Ação Sugerida:* ${temPontoExtra ? "Foco total em blindar a área dominada!" : "Prioridade máxima: Conquistar visibilidade extra!"}
`.trim();
};


// --- 3. SERVIDOR (HTTP Function) ---
functions.http('analisar', async (req, res) => {
    // Headers CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

    try {
        // Parse Body (Fallback)
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { } }
        body = body || {};

        // Extração Inteligente (Suporta formato novo 'message' ou legado 'prompt')
        let { message, eg, prompt } = body;

        // Se vier prompt legado, tenta extrair EG dele
        if (!eg && prompt) {
            const matchEg = String(prompt).match(/EG: (\d+-\d)/);
            if (matchEg) eg = matchEg[1];
            // Se não achou no regex, tenta ver se a própria user message era um EG
            const matchUserMsg = String(prompt).match(/PERGUNTA DO GN: "(\d+-\d)"/);
            if (matchUserMsg) eg = matchUserMsg[1];
        }

        // Se a mensagem do usuário for apenas um EG, usa ele
        if (message && /^\d+-\d$/.test(message.trim())) {
            eg = message.trim();
        }

        console.log(`📡 Processando EG: [${eg}]`);

        if (!eg) {
            return res.status(200).json({
                resposta: "👋 Olá! Para começar, digite o **código EG** da loja que você quer analisar. (Ex: 12345-6)"
            });
        }

        // 1. Baixar Dados
        const sheetResponse = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvText = await sheetResponse.text();
        const csvData = parseCSVRobust(csvText);

        // 2. Buscar Loja
        const loja = csvData.find(l => l.eg?.trim() === eg?.trim());

        // 3. Gerar Análise (Sem IA, apenas Lógica)
        const respostaFinal = generateExpertAnalysis(loja);

        res.status(200).json({ resposta: respostaFinal });

    } catch (error) {
        console.error('🔥 Erro Interno:', error);
        res.status(500).json({ error: `Erro Backend: ${error.message}` });
    }
});
