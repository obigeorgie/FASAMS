const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize Gemini
// For Spark plan (free), we must put the key in environment config, not Secret Manager
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

// Use v1 onCall for better compatibility with Spark plan (though outbound requests might still be restricted)
exports.repairCsvData = functions.https.onCall(async (data, context) => {
    const invalidRows = data.invalidRows;

    if (!invalidRows || !Array.isArray(invalidRows)) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an array of invalid rows.');
    }

    if (invalidRows.length === 0) {
        return { correctedRows: [] };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      You are a Data Compliance Specialist. Correct the following invalid CSV rows to strictly match the provided JSON schema. 
      
      Schema:
      ${JSON.stringify(FASAMS_SCHEMA, null, 2)}

      Invalid Rows (JSON):
      ${JSON.stringify(invalidRows, null, 2)}

      Requirements:
      1. Correct the invalid rows to strictly match the JSON schema.
      2. If a field is missing (like SSN), generate a placeholder '000000000' or flag it as 'REQUIRES_MANUAL_INPUT' if strictly required and validation fails.
      3. Ensure dates are YYYY-MM-DD.
      4. Ensure IDs match the patterns.
      5. Return ONLY the corrected JSON array. No markdown formatting, no explanations.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown code blocks if the model inputs them despite instructions
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const correctedRows = JSON.parse(cleanedText);

        return { correctedRows };

    } catch (error) {
        console.error("Error repairing data", error);
        throw new functions.https.HttpsError('internal', 'Failed to repair data using AI.', error.message);
    }
});
