const functions = require('@google-cloud/functions-framework');

// URL da Planilha (Dados Reais)
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTfDeTnX48gWUAbXL_LcueTA-TMVcgqAe8VxBXjrlFnyGgQxZuZEs-gh7B1vDNYVn8efcxUJqB_QIx-/pub?output=csv";

// --- 1. Parser de CSV Robust (Mantido e Estável) ---
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
                else obj[key] = value;
            });
            return obj;
        }).filter(item => item.eg);
    }
    return [];
};

// --- 2. MOTOR DE REGRAS (A "Inteligência" Hardcoded) ---
const generateExpertAnalysis = (loja) => {
    if (!loja) return "❌ Poxa, procurei na minha base mas não encontrei essa loja. Tem certeza que o EG está correto?";

    // Dados Numéricos
    const shareM1 = parseFloat(loja.share_de_espaco_m1?.replace(',', '.') || 0);
    const shareM0 = parseFloat(loja.share_de_espaco_m0?.replace(',', '.') || 0);
    const trendShare = shareM0 - shareM1;

    // Lógica de "Humor" do Consultor
    let trendEmoji = "➖";
    let trendText = "Estável";
    let advice = "";

    if (trendShare > 0.1) {
        trendEmoji = "�";
        trendText = "Crescendo!";
        advice = "Excelente trabalho na execução! O segredo agora é manutenção e blindagem.";
    } else if (trendShare < -0.1) {
        trendEmoji = "⚠️";
        trendText = "Caindo";
        advice = "Alerta vermelho! Precisamos recuperar esse share. Verifique invasões e rupturas.";
    } else {
        advice = "Estamos estagnados. Que tal negociar um ponto extra para virar o jogo?";
    }

    // Mix (Simulação baseada em strings comuns)
    const mixItems = [];
    const checkMix = (val) => (val && (val.toUpperCase() === "SIM" || val.toUpperCase() === "OK"));
    if (checkMix(loja.corona)) mixItems.push("Corona ✅"); else mixItems.push("Corona ❌");
    if (checkMix(loja.spaten)) mixItems.push("Spaten ✅"); else mixItems.push("Spaten ❌");

    const temPontoExtra = (loja.ponto_extra || "").includes("SIM") || parseFloat(loja.ponto_extra) > 0;

    // Resposta Formatada
    return `
📊 **RAIO-X | ${loja.nome_fantasia}**
*(Rede: ${loja.rede || 'Independente'})*

📈 **Desempenho de Categoria**
• Share Anterior: ${shareM1}%
• Share Atual: ${shareM0}%
• Status: ${trendEmoji} **${trendText}**
💡 *Insight:* ${advice}

� **Execução no PDV**
• Ponto Extra: ${temPontoExtra ? "✅ Conquistado!" : "❌ Oportunidade Aberta"}
• Gôndola: ${loja.gondola || "Não informado"}

📋 **Mix Obrigatório**
${mixItems.join("  |  ")}

👥 **Responsáveis**
GN: ${loja.gn} | Coord: ${loja.coordenador}
`.trim();
};

// --- 3. CÉREBRO CONVERSACIONAL (NLP Simulada) ---
const processConversation = (text) => {
    const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Saudações
    if (t.match(/^(oi|ola|eai|bom dia|boa tarde|boa noite|opa)/)) {
        return `👋 Olá! Sou o Raio-X AI.\n\nEstou aqui para te dar **consultoria estratégica** sobre seus PDVs.\n\nPara começar, você pode:\n1️⃣ Digitar apenas o **EG** (ex: *79499-6*)\n2️⃣ Pedir uma análise (ex: *"Analisa a loja 79499-6"*)\n3️⃣ Perguntar sobre mim (*"Quem é você?"*)`;
    }

    // Identidade / Ajuda
    if (t.includes("quem e voce") || t.includes("o que voce faz") || t.includes("ajuda") || t.includes("menu")) {
        return `🤖 **Minhas Funcionalidades:**\n\nSou um assistente focado em Performance e Trade Marketing.\n\n📌 **O que eu analiso:**\n- Variação de Share (M0 vs M-1)\n- Gaps de Execução (Ponto Extra, Gôndola)\n- Presença do Mix Premium\n\n🎯 **Como usar:**\nBasta me enviar o código **EG** da loja e eu trago o dossiê completo!\n\n👨‍💻 *Criado pelo Robson.*`;
    }

    // Elogios/Agradecimentos
    if (t.includes("obrigado") || t.includes("valeu") || t.includes("top")) {
        return "👊 Tamo junto! Se precisar de mais alguma análise, é só chamar.";
    }

    return null; // Não entendeu, segue para tentar achar EG
};

// --- 4. SERVIDOR HTTP ---
functions.http('analisar', async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

    try {
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { } }
        body = body || {};

        let message = (body.message || body.prompt || "").toString().trim();
        const explicitEg = (body.eg || "").toString().trim();

        // 1. Tenta identificar conversas simples primeiro (Oi, Ajuda, etc)
        // Mas só se NÃO tiver um EG explícito vindo do clique
        if (!explicitEg) {
            const reply = processConversation(message);
            if (reply) {
                return res.status(200).json({ resposta: reply });
            }
        }

        // 2. Extração de EG (Hunter Logic) 🏹
        let targetEg = explicitEg;
        if (!targetEg) {
            // Regex agressiva para achar códigos no meio do texto
            const match = message.match(/\b\d{4,6}-?\d\b/);
            if (match) targetEg = match[0];

            // Backup: Se mandou "prompt" legado com EG lá dentro
            if (!targetEg && body.prompt) {
                const legacyMatch = String(body.prompt).match(/EG: (\d+-\d)/);
                if (legacyMatch) targetEg = legacyMatch[1];
            }
        }

        console.log(`📡 Mensagem: "${message}" | EG Alvo: ${targetEg || "Nenhum"}`);

        // 3. Se não achou EG nem conversa, pede ajuda ao usuário
        if (!targetEg) {
            return res.status(200).json({
                resposta: "🤔 Não entendi qual loja você quer analisar.\n\nPor favor, digite o código **EG** (ex: *12345-6*) ou fale *\"Ajuda\"* para ver o menu."
            });
        }

        // 4. Se achou EG, vai buscar os dados!
        const sheetResponse = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!sheetResponse.ok) throw new Error("Erro ao acessar Base de Dados.");
        const csvText = await sheetResponse.text();
        const dados = parseCSVRobust(csvText);

        // Limpeza do EG para busca (tira traço se precisar, ou mantém se a base tiver)
        // A base parece usar com hífen, mas vamos garantir
        const loja = dados.find(l => {
            const baseEg = (l.eg || "").trim();
            const searchEg = targetEg.trim();
            return baseEg === searchEg || baseEg === searchEg.replace("-", "") || baseEg.replace("-", "") === searchEg;
        });

        const analise = generateExpertAnalysis(loja);
        res.status(200).json({ resposta: analise });

    } catch (error) {
        console.error('🔥 Erro:', error);
        res.status(500).json({ error: "Erro interno: " + error.message });
    }
});
