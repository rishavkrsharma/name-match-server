import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export async function getEmbedding(text) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  return embedding?.data[0]?.embedding;
}

export async function getOcrRes(instruction, images) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("Invalid images array. Please pass an array of image URLs.");
  }

  const content = [
    { type: "text", text: instruction },
    ...images.map((image) => ({
      type: "image_url",
      image_url: { url: image },
    })),
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        ...content,
      },
    ],
  });

  return response.choices[0]
}

