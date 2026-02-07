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
      Your task is to correct the following invalid Client Intake CSV rows to STRICTLY match the provided JSON Schema and DCF Pamphlet 155-2 Logic.

      Schema:
      ${JSON.stringify(FASAMS_SCHEMA, null, 2)}

      Invalid Rows (JSON):
      ${JSON.stringify(invalidRows, null, 2)}

      CRITICAL CORRECTION RULES:
      1. **Dates**: All dates MUST be 'YYYY-MM-DD'. 
         - Logic Check: 'Admission_Date' MUST be chronologically AFTER 'DOB'. If Admission is before DOB, assume a typo in the year and correct logic to make Age reasonable (18-99).
      2. **IDs**: 
         - SSN must be 9 digits (no dashes). Remove dashes if present.
         - Medicaid_ID must be 10 digits. Pad with leading zeros if 8 or 9 digits.
      3. **Project Codes**: 
         - If 'OCA' is provided (context), infer the 'Project_Code'. 
         - Example: If OCA is 'MH0BN', Project_Code MUST be 'A1'.
      4. **Missing Data**: 
         - If a required field is strictly missing and cannot be inferred, use standard DCF placeholder '999999999' for IDs or '1900-01-01' for dates, but prefer inference.

      OUTPUT:
      Return ONLY the corrected JSON array. Do not use Markdown code blocks. Do not explain your edits.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Sanitize output
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const correctedRows = JSON.parse(cleanedText);

        return { correctedRows };

    } catch (error) {
        console.error("AI Repair Failed:", error);
        throw new functions.https.HttpsError('internal', 'AI Repair Failed', error.message);
    }
});
