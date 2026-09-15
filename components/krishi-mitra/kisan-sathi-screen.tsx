'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowLeft, ArrowRight, Bot, Loader2, Mic, MicOff, Send, Sprout, User, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useLanguage } from './language-context'
import { useAudioRecorder, useBhashiniTTS } from '@/hooks/useBhashiniVoice'
import { t } from '@/lib/translations'

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

// ─── TTS Speaker button per message ──────────────────────────────────────────

function SpeakerButton({
  text,
  messageId,
  activeSpeakingId,
  onSpeak,
  onStop,
  lang,
}: {
  text: string
  messageId: string
  activeSpeakingId: string | null
  onSpeak: (id: string, text: string) => void
  onStop: () => void
  lang: 'en' | 'hi' | 'mr'
}) {
  const isSpeaking = activeSpeakingId === messageId
  return (
    <button
      type="button"
      aria-label={isSpeaking ? t('kisanSathi.speaker.stop', lang) : t('kisanSathi.speaker.play', lang)}
      title={isSpeaking ? t('kisanSathi.speaker.stop', lang) : t('kisanSathi.speaker.play', lang)}
      onClick={() => (isSpeaking ? onStop() : onSpeak(messageId, text))}
      className={`ml-auto shrink-0 rounded-full p-1.5 transition-colors ${
        isSpeaking
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-primary'
      }`}
    >
      {isSpeaking ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
    </button>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function KisanSathiScreen({ onLogout, onNavigate }: Props) {
  const [input, setInput] = useState('')
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Language context
  const { language } = useLanguage()

  // Bhashini ASR + NMT
  const {
    isRecording,
    isProcessing: isAsrProcessing,
    transcript,
    error: asrError,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useAudioRecorder(language)

  // Bhashini TTS
  const { isSpeaking, speak, stop: stopTts } = useBhashiniTTS()

  // When ASR returns a transcript, push it into the textarea
  useEffect(() => {
    if (transcript) {
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
      clearTranscript()
    }
  }, [transcript, clearTranscript])

  // When TTS stops externally, clear the active id
  useEffect(() => {
    if (!isSpeaking) setActiveSpeakingId(null)
  }, [isSpeaking])

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

  /** Toggle mic recording */
  const handleMicToggle = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  /** Speak an assistant message */
  const handleSpeak = async (id: string, text: string) => {
    setActiveSpeakingId(id)
    await speak(text, language)
  }

  const handleStop = () => {
    stopTts()
    setActiveSpeakingId(null)
  }

  // Voice hint shown below subheadline when a non-English language is active
  const voiceHint =
    language === 'hi'
      ? t('kisanSathi.voiceHint.hi', language)
      : language === 'mr'
      ? t('kisanSathi.voiceHint.mr', language)
      : ''

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
          <p className="eyebrow">{t('kisanSathi.topbar.eyebrow', language)}</p>
          <h1 className="text-xl font-bold text-foreground">{t('kisanSathi.topbar.title', language)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {t('kisanSathi.topbar.hint', language)}
          </span>
          <button onClick={onLogout} className="secondary-button">
            {t('kisanSathi.topbar.logout', language)}
          </button>
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
            {t('kisanSathi.sidebar.backButton', language)}
          </button>

          <div className="kisan-sathi-side">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Bot className="size-6" />
            </div>
            <p className="mt-3 font-bold text-foreground">{t('kisanSathi.topbar.title', language)}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t('kisanSathi.sidebar.description', language)}
            </p>

            {/* Language indicator */}
            <div className="mt-4 rounded-xl bg-secondary px-3 py-2 text-xs">
              <p className="font-semibold text-foreground">
                {t('kisanSathi.sidebar.voiceLanguage', language)}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {t('kisanSathi.sidebar.languageName', language)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">
                {t('kisanSathi.sidebar.changeHint', language)}
              </p>
            </div>
          </div>
        </aside>

        {/* ── MAIN COLUMN ───────────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 lg:p-8">
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('nav.backToDashboard', language)}
          </button>

          {/* Chat card */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-sm">

            {/* Intro banner — shrink-0: always visible, never scrolled away */}
            <div className="kisan-sathi-intro shrink-0 p-4 sm:p-6">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Sprout className="size-7" />
              </div>
              <div className="min-w-0">
                <p className="eyebrow">{t('kisanSathi.eyebrow', language)}</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">
                  {t('kisanSathi.headline', language)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t('kisanSathi.subheadline', language)}
                  {voiceHint && (
                    <span className="ml-1 font-semibold text-primary">{voiceHint}</span>
                  )}
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
                  <button
                    onClick={() =>
                      setInput(t('kisanSathi.chip.heatwave', language))
                    }
                  >
                    {t('kisanSathi.chip.heatwave', language)}
                  </button>
                  <button
                    onClick={() =>
                      setInput(t('kisanSathi.chip.schemes', language))
                    }
                  >
                    {t('kisanSathi.chip.schemes', language)}
                  </button>
                  <button
                    onClick={() =>
                      setInput(t('kisanSathi.chip.irrigation', language))
                    }
                  >
                    {t('kisanSathi.chip.irrigation', language)}
                  </button>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map((message, index) => {
                const isUser = message.role === 'user'
                const text = getTextContent(message)
                if (!text) return null
                const msgId = message.id ?? String(index)

                return (
                  <div
                    key={msgId}
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
                    <div className="min-w-0 max-w-full overflow-hidden text-sm leading-relaxed flex-1">
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

                    {/* Speaker button — only on assistant messages */}
                    {!isUser && (
                      <SpeakerButton
                        text={text}
                        messageId={msgId}
                        activeSpeakingId={activeSpeakingId}
                        onSpeak={handleSpeak}
                        onStop={handleStop}
                        lang={language}
                      />
                    )}
                  </div>
                )
              })}

              {/* Streaming / loading indicator */}
              {isLoading && (
                <div className="chat-bubble assistant" style={{ maxWidth: '85%' }}>
                  <span className="chat-avatar shrink-0"><Bot className="size-4" /></span>
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {t('kisanSathi.thinking', language)}
                    </span>
                  </div>
                </div>
              )}

              {/* ASR processing indicator */}
              {isAsrProcessing && (
                <div className="chat-bubble assistant" style={{ maxWidth: '85%' }}>
                  <span className="chat-avatar shrink-0"><Mic className="size-4" /></span>
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {language !== 'en'
                        ? t('kisanSathi.processingTranslating', language)
                        : t('kisanSathi.processing', language)}
                    </span>
                  </div>
                </div>
              )}

              {/* ASR error banner */}
              {asrError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                  Voice error: {asrError}
                </div>
              )}
            </div>

            {/* ── COMPOSER (input bar) ─── shrink-0: always at bottom ── */}
            <div className="kisan-sathi-composer m-4 mt-0 shrink-0 sm:m-6 sm:mt-0">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={t('kisanSathi.inputPlaceholder', language)}
                aria-label={t('kisanSathi.inputPlaceholder', language)}
                rows={2}
              />

              {/* Mic button — Bhashini ASR */}
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={isAsrProcessing}
                aria-label={
                  isAsrProcessing
                    ? t('kisanSathi.mic.processing', language)
                    : isRecording
                    ? t('kisanSathi.mic.stop', language)
                    : t('kisanSathi.mic.start', language)
                }
                title={
                  isAsrProcessing
                    ? t('kisanSathi.mic.processing', language)
                    : isRecording
                    ? t('kisanSathi.mic.stop', language)
                    : t('kisanSathi.mic.start', language)
                }
                className={`action-button shrink-0 transition-colors ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : isAsrProcessing
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {isAsrProcessing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
              </button>

              {/* Send button */}
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
