const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.repairCsvData = functions.https.onCall(async (data, context) => {
    const invalidRows = data.invalidRows;

    if (!invalidRows || !Array.isArray(invalidRows) || invalidRows.length === 0) {
        return { correctedRows: [], summary: "No rows to repair." };
    }

    try {
        // Use Gemini 1.5 Flash for speed and cost efficiency
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an expert Data Compliance Agent for Florida's FASAMS system (PAM 155-2).
        
        TASK:
        Review and repair the following ${invalidRows.length} invalid client records JSON data.
        
        STRICT RULES:
        1. **Project Code Logic**:
           - If OCA is "MH0BN", Project_Code MUST be "A1".
           - If OCA is "MH026", Project_Code MUST be "A5".
           - If OCA is "MH0FH", Project_Code MUST be "A0".
           - If OCA is "MS091", Project_Code MUST be "A2".
        2. **Date Logic**:
           - Admission_Date cannot be before DOB. If found, assume year error and fix logically (e.g., if admitted 2024 but born 2025, fix DOB).
           - Dates must be YYYY-MM-DD.
        3. **Format**:
           - SSN: Remove dashes, ensure 9 digits.
           - Medicaid_ID: Ensure 10 digits (pad with leading zeros if needed).

        INPUT DATA:
        ${JSON.stringify(invalidRows, null, 2)}

        OUTPUT FORMAT:
        Return ONLY a raw JSON object (no markdown, no code blocks) with this structure:
        {
          "summary": "Brief 1-sentence summary of changes made.",
          "correctedRows": [ ... array of repaired row objects, matching input order ... ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const responseJson = JSON.parse(text);

        return {
            correctedRows: responseJson.correctedRows || [],
            summary: responseJson.summary || "Repaired successfully."
        };

    } catch (error) {
        console.error("AI Repair Error:", error);
        throw new functions.https.HttpsError('internal', 'AI Repair Failed', error.message);
    }
});
