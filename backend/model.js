require('dotenv').config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getModels = async () => {
  const result = await groq.models.list();
  result.data.forEach(m => console.log(m.id));
};

getModels();
