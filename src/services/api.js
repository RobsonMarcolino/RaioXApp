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

// GoogleGenerativeAI is now handled server-side in api/chat.js to protect the key

export const callGoogleAI = async (prompt) => {
    try {
        // Check if running on localhost
        if (typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'))) {
            throw new Error("⚠️ O 'Proxy da Vercel' só funciona no site publicado! Esse erro acontece porque você está testando no seu computador (Localhost). Por favor, abra o link oficial do deploy (vercel.app) para testar a IA.");
        }

        console.log("🤖 Enviando prompt para o Vercel Proxy...");

        // Relative path works on Vercel deployment automatically
        // thanks to our vercel.json rewrites
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: prompt,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro API (${response.status}): ${errorText.substring(0, 100)}`);
        }

        // Read text first to debug if it's HTML
        const responseText = await response.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Recebido do servidor (não é JSON):", responseText.substring(0, 500));
            throw new Error(`O servidor retornou algo inválido (provavelmente HTML). Se você está no Localhost, isso é esperado (leia o aviso acima).`);
        }

        return data.resposta;
    } catch (error) {
        console.error("Erro ao chamar IA:", error);
        return `❌ ${error.message}`;
    }
};

export const generateAIContext = (message, csvData, estabelecimentoEncontrado = null) => {
    let estabelecimentoInfo = "NENHUM";

    if (estabelecimentoEncontrado) {
        // Calcular tendências simples (apenas para facilitar a leitura da IA)
        const shareM1 = parseFloat(estabelecimentoEncontrado.share_espaco_m1) || 0;
        const shareM0 = parseFloat(estabelecimentoEncontrado.share_espaco_m0) || 0;
        const trend = shareM0 - shareM1;
        const trendSymbol = trend > 0 ? "📈 Crescimento" : trend < 0 ? "📉 Queda" : "➖ Estável";

        estabelecimentoInfo = `
DADOS ESTRATÉGICOS DO PDV (EG: ${estabelecimentoEncontrado.eg}):
- Nome: ${estabelecimentoEncontrado.nome_fantasia || "N/A"} (${estabelecimentoEncontrado.rede || "Rede N/A"})
- Segmentação: ${estabelecimentoEncontrado.sl_sc || "N/A"} | GN: ${estabelecimentoEncontrado.gn || "N/A"}

PERFORMANCE DE SHARE (ESPAÇO):
- Mês Anterior (M-1): ${estabelecimentoEncontrado.share_espaco_m1 || "0"}%
- Mês Atual (M0): ${estabelecimentoEncontrado.share_espaco_m0 || "0"}%
- Tendência: ${trendSymbol} (${trend.toFixed(1)}%)
- Share Gelado (M0): ${estabelecimentoEncontrado.share_gelado_m0 || "0"}%

EXECUÇÃO E VISIBILIDADE (OFF TRADE):
- Ponto Extra: ${estabelecimentoEncontrado.ponto_extra || "Não"}
- Gôndola: ${estabelecimentoEncontrado.gondola || "Não"}
- Base Foco: ${estabelecimentoEncontrado.base_foco || "Não"}

MIX PREMIUM (PRESENÇA):
- Corona: ${estabelecimentoEncontrado.corona || "Não"}
- Spaten: ${estabelecimentoEncontrado.spaten || "Não"}
- Stella: ${estabelecimentoEncontrado.stella || "Não"}

FREQÜÊNCIA:
- Visita Quinzenal: ${estabelecimentoEncontrado.visita_quinzenal || "N/A"}
- Atendimento: ${estabelecimentoEncontrado.atendimento || "N/A"}
`.trim();
    }

    return `
ATUE COMO: Consultor Estratégico de Trade Marketing (Foco em Off Trade) da DIRETA MG.
SEU CLIENTE: Você está falando com um GN (Gerente de Negócio).
SUA MISSÃO: Fornecer insights de execução e estratégia para alavancar o PDV. Não seja operacional, seja tático.

REGRAS DE OURO (MANDATORY):
1. **NUNCA fale de valores monetários (R$).** O foco é Share, Visibilidade e Execução.
2. **NUNCA chame o usuário de "vendedor".** Ele pode ser o SN (Supervisor de Negócio), GN (Gerente de Negócio), SL ( supervisor de Loja) ou Diretor do off
3. **NÃO repita dados que ele já vê na tela.** Use os dados para gerar *conclusões*.
   - Exemplo Ruim: "O Share é 30%."
   - Exemplo Bom: "Notei uma queda de 5% no Share. Precisamos blindar a gôndola."
4. **Foco em GAPS:** Identifique o que FALTA (Sem ponto extra? Sem Spaten?).
5. Seja direto, profissional e use emojis estratégicos (🎯, 📉, 🚀).

DADOS DO PDV EM ANÁLISE:
${estabelecimentoInfo}

CONTEXTO GERAL:
- Total de lojas na base: ${csvData.length}

PERGUNTA DO GN: "${message}"

Responda com uma análise de **Diagnóstico** (o que está acontecendo) e **Ação Recomendada** (o que o GN deve orientar o time a fazer).
`.trim();
};
