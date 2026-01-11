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

// ATUALIZAÇÃO NO FRONT-END
export const callGoogleAI = async (mensagemTexto, codigoLoja) => {
    const API_URL = "https://analisareg2-770471336573.us-central1.run.app"; 

    // LOG PARA VOCÊ VER NO NAVEGADOR
    console.log("🚀 TENTANDO ENVIAR PARA O BACKEND:");
    console.log("Message:", mensagemTexto);
    console.log("EG:", codigoLoja);

    if (!mensagemTexto || !codigoLoja) {
        console.error("⛔ PARE! Faltou mensagem ou EG.");
        return "❌ Erro: O código da loja não foi carregado.";
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: mensagemTexto,
                eg: codigoLoja
            }),
        });

        if (!response.ok) {
            const erroServer = await response.text();
            console.error("🔥 Erro voltando do servidor:", erroServer);
            throw new Error(erroServer);
        }

        const data = await response.json();
        return data.resposta;

    } catch (error) {
        console.error("Erro fatal:", error);
        return "❌ Erro ao conectar.";
    }
};