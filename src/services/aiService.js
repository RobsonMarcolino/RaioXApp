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

const KNOWN_KEYWORDS = [
    'bahamas', 'bernardao', 'coelho diniz', 'epa', 'mart minas',
    'super nosso', 'supernosso', 'verdemar', 'villefort', 'abc', 'atacadao',
    'big mais', 'carrefour', 'rena', 'sendas', 'super bh', 'sbh', 'assai',
    'mineirao', 'pampulha'
];

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
        console.log("📊 CSV Headers Detected:", headers);

        return lines.slice(1).map((row) => {
            const obj = {};
            // Temp variables to hold raw values for inference logic
            let rawNomePdv = "";

            headers.forEach((header, index) => {
                // Normalize key: lowercase, remove accents, replace spaces with _
                let key = header.trim().toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                    .replace(/[^a-z0-9]/g, "_") // Replace non-alphanumeric with _
                    .replace(/_+/g, "_") // Remove duplicate underscores
                    .replace(/^_+|_+$/g, ""); // Remove leading/trailing underscores

                const value = (row[index] || "").trim();

                // Debug log for first row to verify keys (optional, good for dev)
                // if (lines.indexOf(row) === 0) console.log(`Mapped Header: ${header} -> ${key}`);

                // STRICT MAPPING based on User Request
                if (key === "chave_pdv") obj.chave_pdv = value;
                else if (key === "nome_pdv") {
                    obj.nome_pdv = value;
                    rawNomePdv = value;
                }

                else if (key === "gn") obj.gn = value;
                else if (key === "sn") obj.sn = value;
                else if (key === "sl") obj.sl = value;

                // KPIs & Structure - FLEXIBLE MATCHING for Metrics
                else if (key.includes("cerv") && key.includes("tt") && key.includes("tend")) obj.cerv_tt_tend = value;
                else if (key.includes("cerv") && key.includes("vs") && key.includes("ly")) obj.cerv_vs_ly = value;
                // Specific check for HE Tendency to avoid mixup (e.g. CERV HE TEND)
                else if (key.includes("cerv") && key.includes("he") && key.includes("tend")) obj.cerv_he_tend = value;
                // Check for HE vs LY (should be he_vs_ly or similar) but NOT "cerv"
                else if (key.includes("he") && key.includes("vs") && key.includes("ly") && !key.includes("cerv")) obj.he_vs_ly = value;

                else if (key === "kpis_ok") obj.kpis_ok = value;
                else if (key === "pts") obj.pts = value;
                else if (key === "dtq_he") obj.dtq_he = value;
                else if (key === "visita_sup") obj.visita_sup = value;
                else if (key === "share_espaco") obj.share_espaco = value;
                else if (key === "share_gelado") obj.share_gelado = value;
                else if (key === "hardware") obj.hardware = value;
                else if (key === "promotor") obj.promotor = value;
                /* Legacy columns removed: geo, gc, gc_area, rede(explicit) */
            });

            // LOGIC: Infer Rede from Nome PDV (Internal Logic Only)
            if (rawNomePdv) {
                // Normalize: lowercase + remove accents to ensure 'Atacadão' matches 'atacadao'
                const lowerNome = rawNomePdv.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                const matched = KNOWN_KEYWORDS.find(k => lowerNome.includes(k));

                if (matched) {
                    // Capitalize for display
                    obj.rede = matched.charAt(0).toUpperCase() + matched.slice(1);
                    // Formatting Special Cases
                    if (matched === 'abc') obj.rede = 'ABC';
                    if (matched === 'epa' || matched === 'mineirao') obj.rede = 'EPA';
                    if (matched === 'super bh' || matched === 'sbh') obj.rede = 'Super BH';
                    if (matched === 'mart minas') obj.rede = 'Mart Minas';
                    if (matched === 'coelho diniz') obj.rede = 'Coelho Diniz';
                    if (matched === 'big mais') obj.rede = 'Big Mais';
                    if (matched === 'super nosso' || matched === 'supernosso' || matched === 'pampulha') obj.rede = 'Super Nosso';
                    if (matched === 'atacadao') obj.rede = 'Atacadao'; // Force Capitalization
                    if (matched === 'sendas') obj.rede = 'Sendas';
                    if (matched === 'assai') obj.rede = 'Assai';
                } else {
                    obj.rede = "Outros"; // Fallback mandatory
                }
            } else {
                obj.rede = "Outros";
            }

            // Filter out items that don't have the main identifier
            return obj;
        }).filter(item => item.chave_pdv || item.nome_pdv);
    }

    return [];
};

// Simulates the AI locally to ensure updated data structure is used immediately
export const generateChatResponse = (text, data) => {
    if (!text) return { text: "Por favor, digite algo." };

    const cleanText = text.toLowerCase().trim();

    // Menu
    if (cleanText === 'menu' || cleanText === 'ajuda') {
        return { text: "🤖 **Menu Rápido**\n\n1️⃣ Digite o **EG** ou **Nome** da loja.\n2️⃣ Pergunte sobre produtos.\n\nEstou pronto!" };
    }

    // Search Logic
    let found = null;
    const egMatch = cleanText.match(/\d{4,6}-?\d?/);

    if (egMatch) {
        const eg = egMatch[0].replace('-', '');
        found = data.find(d => d.chave_pdv && d.chave_pdv.toString().replace('-', '').includes(eg));
    } else if (cleanText.length > 2) {
        found = data.find(d => d.nome_pdv && d.nome_pdv.toLowerCase().includes(cleanText));
    }

    if (found) {
        // Build Data Card with NEW COLUMNS
        const card = {
            type: 'analysis_v2', // Version tag for UI
            title: found.nome_pdv,
            subtitle: `EG: ${found.chave_pdv} | ${found.rede}`,
            metrics: {
                cerv_tt_tend: found.cerv_tt_tend || '-',
                cerv_vs_ly: found.cerv_vs_ly || '-',
                cerv_he_tend: found.cerv_he_tend || '-',
                he_vs_ly: found.he_vs_ly || '-',
                share_espaco: found.share_espaco || '-',
                share_gelado: found.share_gelado || '-'
            },
            execution: {
                kpis_ok: found.kpis_ok || '-',
                pts: found.pts || '-',
                dtq_he: found.dtq_he || '-'
            },
            structure: {
                hardware: found.hardware || '-',
                promotor: found.promotor || '-',
                visita_sup: found.visita_sup || '-'
            },
            insight: parseFloat(found.cerv_tt_tend) > 100
                ? "🚀 Cerveja crescendo! Mantenha o foco."
                : "⚠️ Atenção à tendência de Cerveja."
        };

        return {
            text: `🔎 Análise de **${found.nome_pdv}**:`,
            card: card
        };
    }

    return { text: `🤔 Não encontrei loja com "${text}". Tente o EG (Ex: 174028).` };
};

// ATUALIZAÇÃO NO FRONT-END
export const callGoogleAI = async (mensagemTexto, codigoLoja) => {
    const API_URL = "https://analisareg2-770471336573.us-central1.run.app";

    // LOG PARA VOCÊ VER NO NAVEGADOR
    console.log("🚀 TENTANDO ENVIAR PARA O BACKEND:");
    console.log("Message:", mensagemTexto);
    console.log("EG:", codigoLoja);

    if (!mensagemTexto) {
        console.warn("⚠️ Tentativa de envio vazio.");
        return "❌ Digite alguma coisa...";
    }
    // Removida a trava de 'codigoLoja' para permitir conversas livres (Oi, Menu, etc)

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

            // Tenta decodificar se for JSON para ficar bonito
            try {
                const erroJson = JSON.parse(erroServer);
                throw new Error(erroJson.error || erroServer);
            } catch (e) {
                // Se não for JSON (ex: HTML do Google), mostra os primeiros 100 caracteres
                throw new Error(`Erro ${response.status}: ${erroServer.substring(0, 100)}...`);
            }
        }

        const data = await response.json();
        return data; // Retorna objeto completo { resposta, card }

    } catch (error) {
        console.error("Erro fatal:", error);
        return `❌ Erro no Backend: ${error.message}`;
    }
};