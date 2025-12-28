"use client"

import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, Loader2, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AIChatInterfaceProps {
  pdfUrl?: string
  pdfContext?: string
}

export function AIChatInterface({ pdfUrl, pdfContext }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: pdfUrl
        ? "I've loaded your PDF document. I'm ready to answer any questions you have about it. What would you like to know?"
        : "Upload a PDF to start analyzing it with AI.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: input }],
          pdfContext: pdfContext || `PDF URL: ${pdfUrl}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      const aiMessageId = (Date.now() + 1).toString()
      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        accumulatedContent += chunk

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== aiMessageId)
          return [
            ...filtered,
            {
              id: aiMessageId,
              role: "assistant",
              content: accumulatedContent,
            },
          ]
        })
      }
    } catch (error) {
      console.error("[v0] Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background/30 backdrop-blur-xl">
      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border border-border/40",
                  message.role === "assistant" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {message.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div
                className={cn(
                  "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                  message.role === "assistant"
                    ? "bg-card border border-border/40 shadow-sm"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-border/40 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
              <div className="bg-card border border-border/40 p-4 rounded-2xl w-24" />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/40">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="relative"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the PDF..."
            className="pr-20 h-12 bg-background/50 border-border/60 focus:ring-primary/20 rounded-xl"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition-all active:scale-95"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
        <div className="mt-2 flex items-center gap-2 justify-center">
          <Sparkles className="h-3 w-3 text-primary/60" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Powered by PDF IQ Intelligence
          </span>
        </div>
      </div>
    </div>
  )
}
