// import { OpenAI } from "openai";
// import dotenv from "dotenv";
// import readlineSync from "readline-sync";
// import fetch from "node-fetch";

// // Load environment variables
// dotenv.config();

// // ✅ Initialize OpenAI client
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // ✅ Weather tool function
// async function getWeather(city) {
//   try {
//     const response = await fetch(`https://wttr.in/${city}?format=%t`);
//     const text = await response.text(); 
//     return `The weather in ${city} is ${text}`;
//   } catch (error) {
//     console.error("Error fetching weather data:", error);
//     return "Sorry, I couldn't fetch the weather data right now.";
//   }
// }

// const availableTools = {
//   get_weather: {
//     fn: getWeather,
//     description: "Takes a city name as an input and returns the current weather for the city",
//   }
// };

// const systemPrompt = `
// You are a helpful AI Assistant who is specialized in resolving user queries.
// You work on start, plan, action, observe mode.
// For the given user query and available tools, plan the step by step execution. Based on the planning,
// select the relevant tool from the available tool and based on the tool selection you perform the action to call the tool.
// Wait for the observation and based on the observation from the tool call resolve the user query.

// Rules:
// - Follow the output JSON Format.
// - Always perform one step at a time and wait for next input
// - Carefully analyze the user query

// Output JSON Format:
// {
//     "step": "string",
//     "content": "string",
//     "function": "The name of function if the step is action",
//     "input": "The input parameter for the function"
// }

// Available Tools:
// - get_weather: Takes a city name as an input and returns the current weather for the city

// Example: 
// User Query: What is the weather in Mumbai?
// Output: {"step": "plan", "content": "The user is interested in the weather in Mumbai, so I need to get the weather for Mumbai"}
// Output: {"step": "plan", "content": "From the available tools, get_weather is the relevant tool to resolve the user query, so I need to call the get_weather tool with the city name Mumbai"}
// Output: {"step": "action", "function": "get_weather", "input": "Mumbai"}
// Output: {"step": "observe", "output": "12 Degree Celsius"}
// Output: {"step": "output", "content": "The weather for Mumbai is 12 Degree Celsius"}
// `;

// const message = [
//   {
//     role: "system",
//     content: systemPrompt
//   }
// ];

// async function promptUser() {
//   const userQuery = readlineSync.question("Enter your query: ");
//   return userQuery;
// }

// async function main() {
//     while (true) {
//       const userQuery = await promptUser();
//     message.push({ role: "user", content: userQuery });

//     while (true) {
//       const response = await openai.chat.completions.create({
//         model: "gpt-4o", // or gpt-4o-mini, depending on your plan
//         messages: message,
//       });

//       const parsedOutput = JSON.parse(response.choices[0].message.content);

//       message.push({
//         role: "assistant",
//         content: JSON.stringify(parsedOutput)
//       });

//       if (parsedOutput.step === "plan") {
//         console.log(`🧠 Plan: ${parsedOutput.content}`);
//         continue;
//       }

//       if (parsedOutput.step === "action") {
//         const toolName = parsedOutput.function;
//         const toolInput = parsedOutput.input;

//         if (availableTools[toolName]) {
//           const output = await availableTools[toolName].fn(toolInput);

//           // ✅ Push observation
//           message.push({
//             role: "assistant",
//             content: JSON.stringify({
//               step: "observe",
//               output: output
//             })
//           });

//           continue;
//         } else {
//           console.log(`❌ Tool '${toolName}' not found.`);
//           break;
//         }
//       }

//       if (parsedOutput.step === "output") {
//         console.log(`✅ Result: ${parsedOutput.content}`);
//         break;
//       }
//     }
//   }
// }

// main();


// GEMINI ---------- -------------

import dotenv from "dotenv";
import readlineSync from "readline-sync";
import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { log } from "console";

// Load env variables
dotenv.config();

// Initialize Gemini (GoogleGenerativeAI)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Weather function
async function getWeather(city) {
    
  try {
    const response = await fetch(`https://wttr.in/${city}?format=%t`);
    const text = await response.text();
    return `The weather in ${city} is ${text}`;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return "Sorry, I couldn't fetch the weather data right now.";
  }
}

const availableTools = {
  get_weather: {
    fn: getWeather,
    description: "Takes a city name as input and returns the current weather for the city",
  }
};


const systemPrompt = `
    You are a helpful AI Assistant who is specialized in resolving user queries.
    You work on start, plan, action, observe mode.
    For the given user query and available tools, plan the step-by-step execution. Based on the planning,
    select the relevant tool from the available tools and based on the tool selection you perform the action to call the tool.
    Wait for the observation and based on the observation from the tool call resolve the user query.

    Rules:
    - Always perform one step at a time and wait for next input
    - Carefully analyze the user query

    Available Tools:
    - get_weather: Takes a city name as an input and returns the current weather for the city

    Example: 
    User Query: What is the weather in Mumbai?
    Output: {"step": "plan", "content": "The user is interested in the weather in Mumbai, so I need to get the weather for Mumbai"}
    Output: {"step": "plan", "content": "From the available tools, get_weather is the relevant tool to resolve the user query, so I need to call the get_weather tool with the city name Mumbai"}
    Output: {"step": "action", "function": "get_weather", "input": "Mumbai"}
    Output: {"step": "observe", "output": "12 Degree Celsius"}
    Output: {"step": "output", "content": "The weather for Mumbai is 12 Degree Celsius"}

`;

const message = [
  {
    role: "user",
    parts: [{ text: systemPrompt }]
  }
];

async function promptUser() {
  const userQuery = readlineSync.question("Enter your query: ");
  return userQuery;
}

async function main() {
  while (true) {
    const userQuery = await promptUser();

    message.push({
      role: "user",
      parts: [{ text: userQuery }]
    });

    while (true) {
      const result = await model.generateContent({
        contents: message
      });
      

      const responseText = result.response.text();
      
      
      let parsedOutput;
        try {
        // Remove triple backticks and optional language hint (```json)
        const cleaned = responseText.replace(/```json|```/g, '').trim();
        parsedOutput = JSON.parse(cleaned); // Now it's a valid JSON string
        } catch (err) {
        console.error("❌ Failed to parse JSON from Gemini:", responseText);
        break;
        }



      message.push({
        role: "user",
        parts: [{ text: JSON.stringify(parsedOutput) }]
      });
      

      if (parsedOutput.step === "plan") {
        console.log(`🧠 Plan: ${parsedOutput.content}`);
        continue;
      }

      if (parsedOutput.step === "action") {
        const toolName = parsedOutput.function;
        const toolInput = parsedOutput.input;

        if (availableTools[toolName]) {
          const output = await availableTools[toolName].fn(toolInput);

          message.push({
            role: "user",
            parts: [{ text: JSON.stringify({ step: "observe", output }) }]
          });

          continue;
        } else {
          console.log(`❌ Tool '${toolName}' not found.`);
          break;
        }
      }

      if (parsedOutput.step === "output") {
        console.log(`✅ Result: ${parsedOutput.content}`);
        break;
      }
    }
  }
}

main();
