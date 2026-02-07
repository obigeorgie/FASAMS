const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FASAMS_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "FASAMS Client and Treatment Episode Data Schema",
    "description": "Strict validation schema for Florida DCF FASAMS 155-2 Chapter 4 (Client Data) and Chapter 5 (Treatment Episode) requirements.",
    "type": "object",
    "required": [
        "SSN",
        "Medicaid_ID",
        "Provider_ID",
        "Admission_Date",
        "Project_Code",
        "Diagnosis_Code_ICD10"
    ],
    "properties": {
        "SSN": {
            "type": "string",
            "description": "Social Security Number must be exactly 9 digits, no dashes.",
            "pattern": "^\\d{9}$"
        },
        "Medicaid_ID": {
            "type": "string",
            "description": "Florida Medicaid Recipient ID must be exactly 10 digits.",
            "pattern": "^\\d{10}$"
        },
        "Provider_ID": {
            "type": "string",
            "description": "Unique identifier for the provider agency. Alphanumeric pattern enforced.",
            "pattern": "^[a-zA-Z0-9]{9,20}$"
        },
        "Admission_Date": {
            "type": "string",
            "description": "The date the client was admitted to the treatment episode. Must be YYYY-MM-DD and is required.",
            "format": "date"
        },
        "Project_Code": {
            "type": "string",
            "description": "Project codes defined in Pamphlet 155-2 Appendix 1.",
            "enum": [
                "A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9",
                "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9",
                "C0", "C1", "C2", "C3", "C4"
            ]
        },
        "Diagnosis_Code_ICD10": {
            "type": "string",
            "description": "Primary diagnosis code based on ICD-10 standards.",
            "pattern": "^[A-TV-Z][0-9AB](?:\\.[0-9A-K]{1,4})?$"
        },
        "Grant_Type": {
            "type": "string",
            "description": "The type of grant funding the episode (e.g., SOR, Recovery Housing)."
        },
        "Sex": {
            "type": "string",
            "description": "Client's biological sex.",
            "enum": ["Male", "Female", "Unknown"]
        },
        "Age": {
            "type": ["integer", "string"],
            "description": "Client's age at admission.",
            "pattern": "^\\d+$"
        },
        "6-Month Follow-up": {
            "type": "string",
            "description": "Date of the 6-month follow-up, if applicable.",
            "format": "date"
        }
    },
    "additionalProperties": false
};

exports.repairCsvData = functions.https.onCall(async (data, context) => {
    const invalidRows = data.invalidRows;

    if (!invalidRows || !Array.isArray(invalidRows) || invalidRows.length === 0) {
        return { correctedRows: [] };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Enhanced Prompt based on Phase 3 Roadmap
        const prompt = `
    You are a Florida DCF FASAMS Data Compliance Agent.
    
    TASK: Repair these ${invalidRows.length} invalid client rows.
    
    CONTEXTUAL RULES (Appendix 1):
    1. **Project Code Inference**: 
       - If 'OCA' is "MH0BN", set 'Project_Code' to "A1".
       - If 'OCA' is "MH026", set 'Project_Code' to "A5".
       - If 'OCA' is "MH0FH", set 'Project_Code' to "A0".
       - If 'OCA' is "MS091", set 'Project_Code' to "A2".
    
    2. **Date Logic**:
       - 'Admission_Date' MUST be after 'DOB'. If Admission < DOB, check if years are swapped (e.g. 2024 vs 1990) and fix.
    
    3. **Formatting**:
       - SSN: Remove dashes, ensure 9 digits.
       - Medicaid_ID: Ensure 10 digits (pad with leading zeros).
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "summary": "Natural language summary of changes (e.g. 'Fixed 12 SSNs and inferred 5 Project Codes from OCA context.')",
      "correctedRows": [ ... array of fixed objects ... ]
    }
  `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Sanitize output
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const responseJson = JSON.parse(cleanedText);

        return {
            correctedRows: responseJson.correctedRows,
            summary: responseJson.summary // Pass narrative back to UI
        };

    } catch (error) {
        console.error("AI Repair Failed:", error);
        throw new functions.https.HttpsError('internal', 'AI Repair Failed', error.message);
    }
});
