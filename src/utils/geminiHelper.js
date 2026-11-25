import { GoogleGenAI } from "@google/generative-ai";

// .env file se API key fetch ho rahi hai
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Base64 helper function (Gemini API ko image format send karne ke liye)
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * 💡 Gemini AI Engine to analyze civic issues from images
 * @param {File} imageFile - The uploaded image file from the input form
 * @returns {Promise<Object>} - Predicted JSON with category, severity, department, and description
 */
export const analyzeCivicIssue = async (imageFile) => {
  if (!apiKey) {
    console.error("Gemini API Key missing! Check your .env file.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Sabse stable aur fast vision model use kar rahe hain
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imagePart = await fileToGenerativePart(imageFile);

    // Dynamic prompt taaki exact structured JSON output mile jo DB me direct fit ho sake
    const prompt = `
      Analyze this image of a civic/municipal issue.
      Identify the issue, predict the severity level, and auto-assign it to the most relevant local government department.
      
      Respond ONLY with a valid JSON object matching this structure (do not include markdown block markers like \`\`\`json):
      {
        "title": "A short 4-5 words concise title of the issue",
        "category": "One of: Pothole, Streetlight, Garbage Pile, Broken Pipe, Water Logging, Tree Fall, Open Manhole, Others",
        "severity": "One of: Low, Medium, High, Critical",
        "department": "One of: Roads & Infrastructure, Waste Management, Electricity Board, Water & Sewage, Forest Department, Public Safety",
        "description": "A precise 1-2 sentence description explaining what is wrong and why it needs immediate attention."
      }
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();
    
    // Safely parse the JSON response
    const cleanJsonText = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJsonText);
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return {
      title: "Reported Civic Issue",
      category: "Others",
      severity: "Medium",
      department: "Public Safety",
      description: "Unable to parse image details. Please fill manually."
    };
  }
};
