// Dosya yolu: services/aiService.js

// Firestore ve Auth i��in __app_id ve __initial_auth_token de�Yi�Ykenleri yerine,
// bu serviste sadece Gemini API'sine ��a�Yr�� yapaca�Y��m��z i��in onlara ihtiyac��m��z yok.
// API anahtar��n��, ��evre de�Yi�Ykeni (dotenv) olarak almal��y��z.

// Gemini API ��a�Yr��s�� i��in gerekli temel yap��land��rma
const apiKey = process.env.GEMINI_API_KEY || ""; // API Anahtar��n�� .env dosyas��ndan okuyun

// Node 18 Ǭncesi sǬrǬmlerde global fetch tan��ml�� olmad��� i��in
// gerekirse dinamik olarak node-fetch kullanarak bir fetch fonksiyonu olu�Ytural��m.
let fetchFn = global.fetch;
if (!fetchFn) {
    fetchFn = (...args) =>
        import('node-fetch').then(({ default: fetch }) => fetch(...args));
}
const fetch = (...args) => fetchFn(...args);

// Tek bir yeniden deneme (retry) fonksiyonu
const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // HTTP 4xx/5xx hatas�� varsa, yeniden denemeden ��nce bekle
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
            }
            return response;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed: ${error.message}`);
            if (i === retries - 1) throw error; // Son denemeyse hatay�� f��rlat
            const delay = Math.pow(2, i) * 1000; // Exponential backoff (1s, 2s, 4s...)
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

/**
 * Freelancer'��n yeteneklerini proje gereksinimleriyle kar�Y��la�Yt��rarak bir e�Yle�Ytirme puan�� hesaplar.
 * @param {string} projectDescription - Projenin detayl�� a����klamas��.
 * @param {string[]} freelancerSkills - Freelancer'��n yetenek dizisi (��r: ["React", "TypeScript", "Node.js"]).
 * @returns {object} JSON format��nda e�Yle�Ytirme puan�� ve gerek��esi.
 */
exports.getMatchingScore = async (projectDescription, freelancerSkills) => {
    
    // Freelancer'��n yeteneklerini okunabilir bir string'e d��nǬ�YtǬr
    const skillsString = freelancerSkills.join(', ');

    // Gemini'ye g��nderilecek prompt (istem)
    const systemPrompt = "Sen, proje gereksinimlerini ve freelancer yeteneklerini analiz eden, yapay zeka destekli bir e�Yle�Ytirme uzman��s��n. Yaln��zca istenen JSON format��nda yan��t vermelisin. Yan��t��ndaki puan, 100 Ǭzerinden olmal��d��r.";
    
    const userQuery = `Proje Gereksinimleri: "${projectDescription}". Freelancer Yetenekleri: [${skillsString}]. Bu iki girdi aras��ndaki teknik uyum i��in 100 Ǭzerinden bir e�Yle�Ytirme puan�� (matchingScore) hesapla ve puan��n gerek��esini (justification) detayl��ca a����kla.`;

    // API ��a�Yr��s��n��n bekledi�Yi JSON �Yemas��
    const responseSchema = {
        type: "OBJECT",
        properties: {
            "matchingScore": { 
                "type": "INTEGER",
                "description": "Proje ve yetenekler aras��ndaki uyum puan�� (0-100 aras��)."
            },
            "justification": { 
                "type": "STRING",
                "description": "Puan��n neden verildi�Yine dair detayl�� gerek��e ve yorumlar."
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

        // AI bazen ekstra markdown ekleyebilir (��r: ```json ... ```)
        const cleanedJsonText = jsonText.replace(/```json\s*|```/g, '').trim();
        return JSON.parse(cleanedJsonText);

    } catch (error) {
        console.error("Gemini API Error in getMatchingScore:", error);
        // Hata durumunda, gǬvenli bir varsay��lan de�Yer d��ndǬr
        return {
            matchingScore: 50,
            justification: `AI matching failed: ${error.message}. Default score applied.`
        };
    }
};

// Test ama��l�� AI servisi
/*
(async () => {
    const score = await exports.getMatchingScore(
        "Modern React ve Tailwind CSS ile bir e-ticaret kullan��c�� arayǬzǬ geli�Ytirmemiz gerekiyor.",
        ["React", "CSS", "JavaScript", "Python"]
    );
    console.log("Test Sonucu:", score);
})();
*/
