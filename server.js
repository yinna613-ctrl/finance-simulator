const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Read GEMINI_API_KEY from Vercel Environment Variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Server-side fallback database
const stockDatabase = {
    "00878": { name: "國泰永續高股息", cagr: 8.5, risk: "中低風險" },
    "0050": { name: "元大台灣50", cagr: 10.2, risk: "中風險" },
    "0056": { name: "元大高股息", cagr: 7.8, risk: "中低風險" },
    "00919": { name: "群益台灣精選高息", cagr: 9.0, risk: "中低風險" },
    "00929": { name: "復華台灣科技優息", cagr: 9.2, risk: "中風險" },
    "00940": { name: "元大台灣價值高息", cagr: 7.5, risk: "中低風險" },
    "2603": { name: "長榮海運", cagr: 12.0, risk: "高風險" },
    "2618": { name: "長榮航空", cagr: 11.5, risk: "中高風險" },
    "2330": { name: "台積電", cagr: 16.5, risk: "中高風險" },
    "2317": { name: "鴻海", cagr: 9.5, risk: "中風險" },
    "2454": { name: "聯發科", cagr: 14.0, risk: "高風險" },
    "NVDA": { name: "輝達 (NVIDIA)", cagr: 25.0, risk: "高風險" },
    "AAPL": { name: "蘋果 (Apple)", cagr: 15.0, risk: "中風險" },
    "TSLA": { name: "特斯拉 (Tesla)", cagr: 22.0, risk: "高風險" },
    "QQQ": { name: "納斯達克100 ETF", cagr: 13.5, risk: "中高風險" },
    "VOO": { name: "標普500 ETF", cagr: 10.5, risk: "中風險" },
    "BTC": { name: "比特幣", cagr: 35.0, risk: "極高風險" }
};

// API Endpoint for stock analysis
app.post('/api/analyze', async (req, res) => {
    const { ticker } = req.body;
    if (!ticker) {
        return res.status(400).json({ error: "請提供股票代號" });
    }

    const cleanTicker = ticker.trim().toUpperCase();

    // 1. Check local preset first
    if (stockDatabase[cleanTicker]) {
        const item = stockDatabase[cleanTicker];
        return res.json({
            ticker: cleanTicker,
            name: item.name,
            cagr: item.cagr,
            risk: item.risk,
            source: "preset"
        });
    }

    // 2. Call Gemini API securely from server side
    if (GEMINI_API_KEY) {
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            const systemPrompt = "你是一位資深計量分析師。請針對用戶提供的股票代號或資產進行分析，並回傳純 JSON 格式：{\"ticker\": \"代號大寫\", \"assetName\": \"中文名稱\", \"cagr\": 10.5, \"riskLevel\": \"風險等級\"}";
            const userQuery = `請分析標的：${cleanTicker}，估算其合理的長期歷史年化報酬率 CAGR (%) 與中文名稱。`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textContent) {
                    const parsed = JSON.parse(textContent);
                    return res.json({
                        ticker: parsed.ticker ? parsed.ticker.toUpperCase() : cleanTicker,
                        name: parsed.assetName || "個股/資產",
                        cagr: Number(parsed.cagr) || 8.0,
                        risk: parsed.riskLevel || "中風險",
                        source: "gemini-ai"
                    });
                }
            }
        } catch (err) {
            console.error("Backend Gemini API Error:", err);
        }
    }

    // 3. Algorithmic fallback
    let estimatedCagr = 8.0;
    let estimatedName = "優質標的";
    if (cleanTicker.startsWith("00")) {
        estimatedName = "高股息/指數型 ETF";
        estimatedCagr = 8.5;
    } else if (!isNaN(cleanTicker)) {
        estimatedName = "台股個股";
        estimatedCagr = 10.0;
    } else {
        estimatedName = "美股/外幣資產";
        estimatedCagr = 12.0;
    }

    return res.json({
        ticker: cleanTicker,
        name: estimatedName,
        cagr: estimatedCagr,
        risk: "中風險",
        source: "estimation"
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For Vercel Serverless Function export
module.exports = app;

// For local testing
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 伺服器已啟動：http://localhost:${PORT}`);
    });
}
