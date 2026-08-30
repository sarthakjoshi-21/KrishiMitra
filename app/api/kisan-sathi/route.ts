import { convertToModelMessages, streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    console.log('Incoming messages:', JSON.stringify(messages, null, 2))

    const formattedMessages = (messages || []).map((m: any) => {
      if (!m.role) {
        return {
          role: 'user',
          content: m.text || m.content || '',
          parts: m.parts || (m.text ? [{ type: 'text', text: m.text }] : [])
        }
      }
      return m
    })

    const modelMessages = await convertToModelMessages(formattedMessages)
    
    const result = streamText({
      model: google('gemini-3.6-flash'),
      system: 'You are Kisan Sathi, a practical and kind agricultural assistant for farmers in India. Answer in the farmer’s language when possible. Give clear, actionable advice about crops, soil, irrigation, pests, weather, markets, government schemes, and farm operations. Be honest when information may vary by location or season. For pesticide, medical, or financial safety questions, recommend local agricultural officers or certified experts and never invent exact dosage instructions without context.',
      messages: modelMessages,
      temperature: 0.4,
      maxOutputTokens: 700,
    })
    return result.toUIMessageStreamResponse()
  } catch (err) {
    console.error('Gemini Stream Error:', err)
    return new Response(JSON.stringify({ error: 'Failed to communicate with AI', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

