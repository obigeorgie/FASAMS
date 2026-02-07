const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './functions/.env' });

async function testGemini() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = "Explain how AI works";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(text);
    } catch (error) {
        console.error("Error connecting to Gemini:", error);
    }
}

testGemini();
