import { streamText } from "ai"

export const maxDuration = 30

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(req: Request) {
  try {
    const { messages, pdfContext }: { messages: ChatMessage[]; pdfContext?: string } = await req.json()

    const allMessages: ChatMessage[] = []

    if (pdfContext) {
      allMessages.push({
        role: "system",
        content: `You are an AI assistant analyzing a PDF document. Here is the document context:\n\n${pdfContext}\n\nAnswer questions about this document accurately and concisely. If you don't have specific information from the document, be honest about it.`,
      })
    }

    allMessages.push(...messages)

    const result = streamText({
      model: "openai/gpt-5-mini",
      messages: allMessages,
      abortSignal: req.signal,
      maxOutputTokens: 2000,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[v0] Chat error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
