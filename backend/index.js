const functions = require('@google-cloud/functions-framework');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializa a IA com sua chave de ambiente
// Certifique-se de que a variável de ambiente GEMINI_API_KEY esteja configurada no Google Cloud Run
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo atualizado para 1.5-flash (Versão específica 001 para evitar erro 404)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

// URL da Planilha (escondida no backend)
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTfDeTnX48gWUAbXL_LcueTA-TMVcgqAe8VxBXjrlFnyGgQxZuZEs-gh7B1vDNYVn8efcxUJqB_QIx-/pub?output=csv";

// --- 1. Parser de CSV Robust ---
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

                // Mapeamentos específicos do Raio-X App
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

// --- 2. Gerador de Prompt (Estrategista) ---
const generateAIContext = (message, csvData, egSolicitado) => {
    const estabelecimentoEncontrado = csvData.find(loja => loja.eg === egSolicitado);
    let estabelecimentoInfo = "NENHUM ESTABELECIMENTO ENCONTRADO COM ESSE CÓDIGO.";

    if (estabelecimentoEncontrado) {
        const shareM1 = parseFloat(estabelecimentoEncontrado.share_espaco_m1) || 0;
        const shareM0 = parseFloat(estabelecimentoEncontrado.share_espaco_m0) || 0;
        const trend = shareM0 - shareM1;
        const trendSymbol = trend > 0 ? "📈 Crescimento" : trend < 0 ? "📉 Queda" : "➖ Estável";

        estabelecimentoInfo = `
DADOS ESTRATÉGICOS DO PDV (EG: ${estabelecimentoEncontrado.eg}):
- Nome: ${estabelecimentoEncontrado.nome_fantasia || "N/A"} (${estabelecimentoEncontrado.rede || "Rede N/A"})
- Segmentação: ${estabelecimentoEncontrado.sl_sc || "N/A"} | GN: ${estabelecimentoEncontrado.gn || "N/A"}
PERFORMANCE SHARES:
- M-1: ${estabelecimentoEncontrado.share_espaco_m1 || "0"}% | M0: ${estabelecimentoEncontrado.share_espaco_m0 || "0"}% | Tendência: ${trendSymbol}
EXECUÇÃO E GAPS:
- Ponto Extra: ${estabelecimentoEncontrado.ponto_extra || "Não"}
- Gôndola: ${estabelecimentoEncontrado.gondola || "Não"}
- Mix Premium: Corona (${estabelecimentoEncontrado.corona || "N"}), Spaten (${estabelecimentoEncontrado.spaten || "N"}), Stella (${estabelecimentoEncontrado.stella || "N"})
`.trim();
    }

    return `
ATUE COMO: Consultor Estratégico de Trade Marketing (Off Trade) da DIRETA MG para um Gerente de Negócio (GN).
REGRAS:
1. Sem falar de R$ (Reais). Foco em Execução/Visibilidade.
2. Seja direto. Use emojis 🎯, 📉.
3. Não repita dados, dê insights (ex: "Perdeu Share, blinde a gôndola").
DADOS DO PDV:
${estabelecimentoInfo}
PERGUNTA: "${message}"
`;
};

// --- 3. SERVIDOR (HTTP Function) ---
functions.http('analisar', async (req, res) => {
    // Headers CORS essenciais
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return; // Preflight OK
    }

    try {
        // --- DEBUG DETALHADO DO BODY ---
        let body = req.body;
        console.log("🔍 TIPO DO BODY:", typeof body);
        console.log("🔍 CONTEÚDO BODY (JSON):", JSON.stringify(body));

        // Fallback: Se body vier vazio ou undefined, tenta ler rawBody (buffer)
        if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
            console.warn("⚠️ req.body vazio! Tentando ler req.rawBody...");
            if (req.rawBody) {
                try {
                    const rawText = req.rawBody.toString('utf8');
                    console.log("📝 rawBody encontrado:", rawText);
                    body = JSON.parse(rawText);
                } catch (e) {
                    console.error("❌ Falha ao converter rawBody:", e);
                }
            }
        }

        // Se ainda for string (caso raro)
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { console.warn("Body string -> falha parse:", e); }
        }

        // Garante objeto nulo safe
        body = body || {};

        let { message, eg, prompt } = body;

        // --- ADAPTADOR DE LEGADO (Se o front mandar formato antigo) ---
        if (prompt && !message) {
            console.log("⚠️ MODO LEGADO DETECTADO: Usando prompt pronto do frontend.");
            console.log("📝 Prompt recebido (início):", String(prompt).substring(0, 100));

            // No modo legado, o frontend JÁ mandou os dados da planilha e as regras.
            // Não precisamos processar planilha nem gerar contexto.
            // Apenas repassamos para a IA.
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                return res.status(200).json({ resposta: text });
            } catch (err) {
                console.error("Erro no modo legado:", err);
                return res.status(500).json({ error: "Erro na IA (Modo Legado): " + err.message });
            }
        }

        console.log(`📡 DADOS FINAIS: EG [${eg}] - Msg [${message}]`);

        if (!message) {
            console.error("⛔ Erro: Mensagem continua vazia após tentativas.");
            return res.status(400).json({
                error: 'Nenhuma mensagem recebida.',
                debug_body_type: typeof req.body,
                debug_raw_body: req.rawBody ? 'sim' : 'nao'
            });
        }

        // Fluxo normal
        const sheetResponse = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!sheetResponse.ok) throw new Error("Google Sheets inacessível");
        const csvText = await sheetResponse.text();

        const csvData = parseCSVRobust(csvText);
        const finalPrompt = generateAIContext(message, csvData, eg);

        const result = await model.generateContent(finalPrompt);
        const text = result.response.text();

        res.status(200).json({ resposta: text });

    } catch (error) {
        console.error('🔥 Erro Interno:', error);
        res.status(500).json({ error: `Erro Backend: ${error.message}` });
    }
});
