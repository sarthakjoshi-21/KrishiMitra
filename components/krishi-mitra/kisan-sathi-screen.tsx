'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowRight, Bot, Loader2, Send, Sprout, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }

/** Extract the plain-text string out of a message regardless of SDK shape */
function getTextContent(message: any): string {
  if (typeof message.content === 'string' && message.content.length > 0) {
    return message.content
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === 'text' || typeof p.text === 'string')
      .map((p: any) => p.text ?? '')
      .join('')
  }
  if (typeof message.text === 'string') return message.text
  return ''
}

export default function KisanSathiScreen({ onLogout, onNavigate }: Props) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/kisan-sathi' }),
  })
  const isLoading = status === 'streaming' || status === 'submitted'

  /** Auto-scroll to the bottom whenever a new chunk arrives */
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isLoading])

  const submit = () => {
    if (!input.trim() || isLoading) return
    sendMessage({ text: input.trim() })
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      submit()
    }
  }

  return (
    /*
     * LAYOUT STRATEGY
     * ───────────────
     * The KisanSathiScreen is rendered as a direct child of the app router,
     * replacing the whole page. We therefore own the full viewport.
     *
     *  .ks-page  (position:fixed inset-0 flex flex-col)
     *    topbar  (shrink-0)
     *    .ks-body  (flex-1 flex overflow-hidden)
     *      sidebar  (shrink-0 overflow-y-auto)
     *      .ks-main  (flex-1 flex flex-col overflow-hidden p-4|p-8)
     *        .ks-card  (flex-1 flex flex-col overflow-hidden rounded border)
     *          .ks-intro   (shrink-0)           ← pinned top
     *          .ks-msgs    (flex-1 overflow-y-auto) ← THE scroll area
     *          .ks-input   (shrink-0)           ← pinned bottom
     *
     * Using `position:fixed inset-0` is the most reliable cross-browser way
     * to own exactly one viewport regardless of what the parent renders.
     * No shared CSS class (app-layout, dashboard-main, etc.) can interfere.
     */
    <div className="fixed inset-0 flex flex-col bg-background">

      {/* ── TOPBAR ─────────────────────────────────────── */}
      <header className="topbar shrink-0 z-10">
        <div>
          <p className="eyebrow">Kisan Sathi</p>
          <h1 className="text-xl font-bold text-foreground">Kisan Sathi</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">Ask in your language</span>
          <button onClick={onLogout} className="secondary-button">Logout</button>
        </div>
      </header>

      {/* ── BODY (sidebar + main) ──────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — desktop fixed width, hidden on mobile by existing .sidebar CSS */}
        <aside className="sidebar shrink-0 overflow-y-auto">
          <button
            onClick={() => onNavigate('Overview')}
            className="mb-4 flex items-center gap-2 text-sm font-bold text-primary"
          >
            <ArrowRight className="size-4 rotate-180" />
            Back to Farmer Desk
          </button>

          <div className="kisan-sathi-side">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Bot className="size-6" />
            </div>
            <p className="mt-3 font-bold text-foreground">Kisan Sathi</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Your practical farming companion for every season.
            </p>
          </div>
        </aside>

        {/* ── MAIN COLUMN ───────────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 lg:p-8">

          {/* Chat card */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-sm">

            {/* Intro banner — shrink-0: always visible, never scrolled away */}
            <div className="kisan-sathi-intro shrink-0 p-4 sm:p-6">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Sprout className="size-7" />
              </div>
              <div className="min-w-0">
                <p className="eyebrow">Always here to help</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">What can I help you grow today?</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Ask about crops, soil, pests, irrigation, weather, schemes, or selling options.
                </p>
              </div>
            </div>

            {/*
              ── SCROLLABLE MESSAGE LIST ────────────────────
              • flex-1           fills remaining height inside the card
              • min-h-0          overrides flex's default `min-height:auto`
                                 (without this, overflow-y-auto never activates)
              • overflow-y-auto  the actual scroll
              • ref={scrollRef}  lets useEffect auto-scroll on new content
            */}
            <div
              ref={scrollRef}
              className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {/* Suggestion chips */}
              {messages.length === 0 && (
                <div className="kisan-sathi-suggestions">
                  <button onClick={() => setInput('How can I protect my onion crop from heatwave?')}>
                    Protect my crop from heatwave
                  </button>
                  <button onClick={() => setInput('Which government schemes can I apply for?')}>
                    Find schemes for my farm
                  </button>
                  <button onClick={() => setInput('How often should I irrigate my crop?')}>
                    Plan irrigation
                  </button>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map((message, index) => {
                const isUser = message.role === 'user'
                const text = getTextContent(message)
                if (!text) return null

                return (
                  <div
                    key={message.id ?? index}
                    className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}
                    style={{ maxWidth: '85%' }}
                  >
                    {/* Avatar */}
                    <span className="chat-avatar shrink-0">
                      {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                    </span>

                    {/*
                      Message content:
                      • User messages — plain text, no markdown needed
                      • Assistant messages — rendered through ReactMarkdown + remark-gfm
                        so bold, lists, line-breaks, tables all render correctly
                    */}
                    <div className="min-w-0 max-w-full overflow-hidden text-sm leading-relaxed">
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words">{text}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            /* Inline code */
                            code: ({ children }) => (
                              <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs">
                                {children}
                              </code>
                            ),
                            /* Code blocks */
                            pre: ({ children }) => (
                              <pre className="mt-2 overflow-x-auto rounded-xl bg-black/10 p-3 text-xs">
                                {children}
                              </pre>
                            ),
                            /* Paragraphs */
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words">{children}</p>
                            ),
                            /* Unordered list */
                            ul: ({ children }) => (
                              <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
                            ),
                            /* Ordered list */
                            ol: ({ children }) => (
                              <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
                            ),
                            /* Bold */
                            strong: ({ children }) => (
                              <strong className="font-bold">{children}</strong>
                            ),
                            /* Headings */
                            h1: ({ children }) => (
                              <h1 className="mb-1 mt-3 text-base font-bold first:mt-0">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="mb-1 mt-3 text-sm font-bold first:mt-0">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h3>
                            ),
                          }}
                        >
                          {text}
                        </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Streaming / loading indicator */}
              {isLoading && (
                <div className="chat-bubble assistant" style={{ maxWidth: '85%' }}>
                  <span className="chat-avatar shrink-0"><Bot className="size-4" /></span>
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Kisan Sathi is thinking…</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── COMPOSER (input bar) ─── shrink-0: always at bottom ── */}
            <div className="kisan-sathi-composer m-4 mt-0 shrink-0 sm:m-6 sm:mt-0">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Kisan Sathi anything about farming…"
                aria-label="Ask Kisan Sathi"
                rows={2}
              />
              <button
                onClick={submit}
                disabled={!input.trim() || isLoading}
                aria-label="Send question"
                className="action-button"
              >
                <Send className="size-4" />
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
