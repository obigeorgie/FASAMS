const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './functions/.env' });

async function testFix() {
    try {
        console.log("Testing with Model: gemini-2.0-flash (Retry)");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Simple prompt
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.log("Still Rate Limited (429). Please wait.");
        } else {
            console.error("Test Failed:", error.message);
        }
    }
}

testFix();
