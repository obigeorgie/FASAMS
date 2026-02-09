const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './functions/.env' });

async function testFix() {
    try {
        // Trying Firebase Client Key for Gemini
        const apiKey = "AIzaSyDitYMLF4mC3pjw1-uQdhXB_YHtmw9-hNw";
        console.log("Testing with Firebase Key & gemini-1.5-flash");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Simple prompt
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.log("Still Rate Limited (429). Please wait.");
        } else {
            console.error("Test Failed Full Error:", error);
        }
    }
}

testFix();
