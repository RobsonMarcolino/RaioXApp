const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTfDeTnX48gWUAbXL_LcueTA-TMVcgqAe8VxBXjrlFnyGgQxZuZEs-gh7B1vDNYVn8efcxUJqB_QIx-/pub?output=csv";

export const loadSheetData = async () => {
    try {
        console.log("📊 Carregando planilha Google Sheets...");
        const response = await fetch(GOOGLE_SHEET_CSV_URL, {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - A planilha não está acessível`);
        }

        const text = await response.text();
        return parseCSVRobust(text);
    } catch (error) {
        console.error("❌ Erro ao carregar planilha:", error.message);
        return [];
    }
};

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
                if (inQuote && cleanLine[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuote = !inQuote;
                }
            } else if (char === "," && !inQuote) {
                row.push(cell.trim());
                cell = "";
            } else {
                cell += char;
            }
        }
        row.push(cell.trim());
        lines.push(row);
    }

    // Process headers and map to objects
    if (lines.length > 1) {
        const headers = lines[0];
        return lines.slice(1).map((row) => {
            const obj = {};
            headers.forEach((header, index) => {
                // Normalize key: lowercase, remove accents, replace spaces with _
                let key = header.trim().toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                    .replace(/[^a-z0-9]/g, "_") // Replace non-alphanumeric with _
                    .replace(/_+/g, "_"); // Remove duplicate underscores

                const value = (row[index] || "").trim();

                // Specific mappings if normalization isn't enough or for aliases
                if (key === "eg" || key === "codigo" || key === "code") obj.eg = value;
                else if (key.includes("nome")) obj.nome_fantasia = value;
                else if (key === "rede") obj.rede = value;
                else if (key === "coordenador") obj.coordenador = value;
                else if (key === "gn") obj.gn = value;
                else if (key.includes("sl_sc")) obj.sl_sc = value;
                // Performance data mappings
                // Performance data mappings
                else if (key.includes("share_de_espaco_m_1") && !key.includes("vs")) obj.share_de_espaco_m1 = value;
                else if (key.includes("share_de_espaco_m0")) obj.share_de_espaco_m0 = value;
                else if (key.includes("share_de_espaco") && key.includes("vs") && key.includes("m_1")) obj.share_de_espaco_vs_m1 = value;

                else if (key.includes("share_de_gelado_m_1") && !key.includes("vs")) obj.share_de_gelado_m1 = value;
                else if (key.includes("share_de_gelado_m0")) obj.share_de_gelado_m0 = value;
                else if (key.includes("share_de_gelado") && key.includes("vs") && key.includes("m_1")) obj.share_de_gelado_vs_m1 = value;
                else {
                    obj[key] = value;
                }
            });
            return obj;
        }).filter(item => item.eg);
    }

    return [];
};

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializa o SDK do Gemini com a chave fornecida
const genAI = new GoogleGenerativeAI("AIzaSyBTZiUDC2INIspbdFm6R3dZX1A4ls7olSI");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const callGoogleAI = async (prompt) => {
    try {
        console.log("🤖 Enviando prompt para o Gemini (Direto)...");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error("Erro ao chamar Gemini:", error);
        return `❌ Erro na IA: ${error.message}`;
    }
};

export const generateAIContext = (message, csvData, estabelecimentoEncontrado = null) => {
    // Logic to generate the prompt context, copied/adapted from original code
    let estabelecimentoInfo = "NENHUM";

    if (estabelecimentoEncontrado) {
        estabelecimentoInfo = `
DADOS REAIS DO ESTABELECIMENTO ${estabelecimentoEncontrado.eg}:
- Nome: ${estabelecimentoEncontrado.nome_fantasia || "Não informado"}
- Rede: ${estabelecimentoEncontrado.rede || "Não informado"}
- Coordenador: ${estabelecimentoEncontrado.coordenador || "Não informado"}
- GN: ${estabelecimentoEncontrado.gn || "Não informado"}
- SL/SC: ${estabelecimentoEncontrado.sl_sc || "Não informado"}
- Share de Espaço M-1: ${estabelecimentoEncontrado.share_espaco_m1 || "Não informado"}
- Share de Espaço M0: ${estabelecimentoEncontrado.share_espaco_m0 || "Não informado"}
- Share de Espaço vs M-1: ${estabelecimentoEncontrado.share_espaco_vs_m1 || "Não informado"}
- Share de Gelado M-1: ${estabelecimentoEncontrado.share_gelado_m1 || "Não informado"}
- Share de Gelado M0: ${estabelecimentoEncontrado.share_gelado_m0 || "Não informado"}
- Share de Gelado vs M-1: ${estabelecimentoEncontrado.share_gelado_vs_m1 || "Não informado"}
- Gôndola: ${estabelecimentoEncontrado.gondola || "Não informado"}
- Ponto Extra: ${estabelecimentoEncontrado.ponto_extra || "Não informado"}
- Base Foco: ${estabelecimentoEncontrado.base_foco || "Não informado"}
- Corona: ${estabelecimentoEncontrado.corona || "Não informado"}
- Spaten: ${estabelecimentoEncontrado.spaten || "Não informado"}
- Stella: ${estabelecimentoEncontrado.stella || "Não informado"}
- COB HDW: ${estabelecimentoEncontrado.cob_hdw || "Não informado"}
- Atendimento: ${estabelecimentoEncontrado.atendimento || "Não informado"}
- Visita Quinzenal: ${estabelecimentoEncontrado.visita_quinzenal || "Não informado"}
`.trim();
    }

    return `Você é um assistente especializado na Base de Lojas da Score 5 da DIRETA MG.
CONTEXTO:
- Sistema de análise de Lojas da DIRETA MG
- Dados disponíveis: ${csvData.length} estabelecimentos

REGRAS CRÍTICAS:
1. NUNCA INVENTE DADOS FICTÍCIOS
2. Use APENAS os dados reais fornecidos
3. Se o codigo EG não for encontrado, informe claramente
4. Você é fiel a AMBEV e não pode falar sobre outras empresas.
5. Se te perguntarem quem criou você, responda que foi o Engenheiro de software Robson.
6. So informa os dados que estão aqui quando for perguntado sobre eles, não expõe tudo no chat de uma vez.

DADOS DA LOJA (EG) SOLICITADO:
${estabelecimentoInfo}

MENSAGEM DO USUÁRIO: "${message}"

Responda de forma natural, organizada separando as principais informações e visual colocando emojis para ilustrar.`;
};
