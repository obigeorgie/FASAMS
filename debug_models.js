const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './functions/.env' });

async function listModels() {
    try {
        // We cannot list models directly with the clean SDK easily in some versions without authentication intricacies, 
        // but let's try a simple generation with a very basic model name 'gemini-1.0-pro' just in case.
        // Actually, let's try to just print the API key (masked) to ensure it is loading.
        console.log("Key loaded:", process.env.GEMINI_API_KEY ? "Yes (" + process.env.GEMINI_API_KEY.substring(0, 5) + "...)" : "No");

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Trying an alias
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash-latest");
    } catch (error) {
        console.error("Error with gemini-1.5-flash-latest:", error.message);
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-pro");
    } catch (error) {
        console.error("Error with gemini-pro:", error.message);
    }
}

listModels();
