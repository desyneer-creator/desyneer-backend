// Dosya yolu: services/aiService.js

// Firestore ve Auth için __app_id ve __initial_auth_token değişkenleri yerine,
// bu serviste sadece Gemini API'sine çağrı yapacağımız için onlara ihtiyacımız yok.
// API anahtarını, çevre değişkeni (dotenv) olarak almalıyız.

// Gemini API çağrısı için gerekli temel yapılandırma
const apiKey = process.env.GEMINI_API_KEY || ""; // API Anahtarını .env dosyasından okuyun

// Tek bir yeniden deneme (retry) fonksiyonu
const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // HTTP 4xx/5xx hatası varsa, yeniden denemeden önce bekle
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
            }
            return response;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed: ${error.message}`);
            if (i === retries - 1) throw error; // Son denemeyse hatayı fırlat
            const delay = Math.pow(2, i) * 1000; // Exponential backoff (1s, 2s, 4s...)
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

/**
 * Freelancer'ın yeteneklerini proje gereksinimleriyle karşılaştırarak bir eşleştirme puanı hesaplar.
 * @param {string} projectDescription - Projenin detaylı açıklaması.
 * @param {string[]} freelancerSkills - Freelancer'ın yetenek dizisi (ör: ["React", "TypeScript", "Node.js"]).
 * @returns {object} JSON formatında eşleştirme puanı ve gerekçesi.
 */
exports.getMatchingScore = async (projectDescription, freelancerSkills) => {
    
    // Freelancer'ın yeteneklerini okunabilir bir string'e dönüştür
    const skillsString = freelancerSkills.join(', ');

    // Gemini'ye gönderilecek prompt (istem)
    const systemPrompt = "Sen, proje gereksinimlerini ve freelancer yeteneklerini analiz eden, yapay zeka destekli bir eşleştirme uzmanısın. Yalnızca istenen JSON formatında yanıt vermelisin. Yanıtındaki puan, 100 üzerinden olmalıdır.";
    
    const userQuery = `Proje Gereksinimleri: "${projectDescription}". Freelancer Yetenekleri: [${skillsString}]. Bu iki girdi arasındaki teknik uyum için 100 üzerinden bir eşleştirme puanı (matchingScore) hesapla ve puanın gerekçesini (justification) detaylıca açıkla.`;

    // API çağrısının beklediği JSON şeması
    const responseSchema = {
        type: "OBJECT",
        properties: {
            "matchingScore": { 
                "type": "INTEGER",
                "description": "Proje ve yetenekler arasındaki uyum puanı (0-100 arası)."
            },
            "justification": { 
                "type": "STRING",
                "description": "Puanın neden verildiğine dair detaylı gerekçe ve yorumlar."
            }
        },
        "propertyOrdering": ["matchingScore", "justification"]
    };

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    try {
        const response = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!jsonText) {
            throw new Error("AI response was empty or malformed.");
        }

        // AI bazen ekstra markdown ekleyebilir (ör: ```json ... ```)
        const cleanedJsonText = jsonText.replace(/```json\s*|```/g, '').trim();
        return JSON.parse(cleanedJsonText);

    } catch (error) {
        console.error("Gemini API Error in getMatchingScore:", error);
        // Hata durumunda, güvenli bir varsayılan değer döndür
        return {
            matchingScore: 50,
            justification: `AI matching failed: ${error.message}. Default score applied.`
        };
    }
};

// Test amaçlı AI servisi
/*
(async () => {
    const score = await exports.getMatchingScore(
        "Modern React ve Tailwind CSS ile bir e-ticaret kullanıcı arayüzü geliştirmemiz gerekiyor.",
        ["React", "CSS", "JavaScript", "Python"]
    );
    console.log("Test Sonucu:", score);
})();
*/