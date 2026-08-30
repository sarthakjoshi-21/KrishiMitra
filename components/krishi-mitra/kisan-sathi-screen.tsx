'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowRight, Bot, Loader2, Send, Sprout, User } from 'lucide-react'
import { useState } from 'react'
import { VoiceField, VoiceInput } from './voice-input'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }

function getMessageText(message: any): string {
  const content = typeof message.content === 'string' ? message.content : '';
  const text = typeof message.text === 'string' ? message.text : '';
  
  let partsText = '';
  if (Array.isArray(message.parts) && message.parts.length > 0) {
    partsText = message.parts
      .filter((p: any) => p.type === 'text' || p.type === 'text-delta' || p.text || p.textDelta || typeof p === 'string')
      .map((p: any) => typeof p === 'string' ? p : (p.text || p.textDelta || p.content || ''))
      .join('');
  }

  if (content.length >= partsText.length && content.length >= text.length && content.trim().length > 0) return content;
  if (partsText.length >= content.length && partsText.length >= text.length && partsText.trim().length > 0) return partsText;
  if (text.length > 0) return text;
  
  return content || partsText || text || '';
}

export default function KisanSathiScreen({ onLogout, onNavigate }: Props) {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status } = useChat({ transport: new DefaultChatTransport({ api: '/api/kisan-sathi' }) })
  const isLoading = status === 'streaming' || status === 'submitted'
  const submit = () => { if (!input.trim() || isLoading) return; sendMessage({ text: input.trim() }); setInput('') }
  return <div className="min-h-screen bg-background"><header className="topbar"><div><p className="eyebrow">Kisan Sathi</p><h1 className="text-xl font-bold text-foreground">Kisan Sathi</h1></div><div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:inline">Ask in your language</span><button onClick={onLogout} className="secondary-button">Logout</button></div></header><div className="app-layout"><aside className="sidebar"><button onClick={() => onNavigate('Overview')} className="mb-4 flex items-center gap-2 text-sm font-bold text-primary"><ArrowRight className="size-4 rotate-180" /> Back to Farmer Desk</button><div className="kisan-sathi-side"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Bot className="size-6" /></div><p className="mt-3 font-bold text-foreground">Kisan Sathi</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your practical farming companion for every season.</p></div></aside><main className="dashboard-main"><div className="kisan-sathi-chat"><div className="kisan-sathi-intro"><div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Sprout className="size-7" /></div><div><p className="eyebrow">Always here to help</p><h2 className="mt-1 text-2xl font-bold text-foreground">What can I help you grow today?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Ask about your crop, soil, pests, irrigation, weather, schemes, or selling options.</p></div></div><div className="kisan-sathi-messages" aria-live="polite">{messages.length === 0 && <div className="kisan-sathi-suggestions"><button onClick={() => setInput('How can I protect my onion crop from heatwave?')}>Protect my crop from heatwave</button><button onClick={() => setInput('Which government schemes can I apply for?')}>Find schemes for my farm</button><button onClick={() => setInput('How often should I irrigate my crop?')}>Plan irrigation</button></div>}{messages.map((message, index) => <div key={message.id || index} className={`chat-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}><span className="chat-avatar">{message.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}</span><div className="whitespace-pre-wrap overflow-visible">{getMessageText(message)}</div></div>)}{isLoading && <div className="chat-bubble assistant"><span className="chat-avatar"><Bot className="size-4" /></span><Loader2 className="size-4 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Kisan Sathi is thinking...</span></div>}</div><div className="kisan-sathi-composer"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); submit() } }} placeholder="Ask Kisan Sathi anything about farming..." aria-label="Ask Kisan Sathi" rows={2} /><button onClick={submit} disabled={!input.trim() || isLoading} aria-label="Send question" className="action-button"><Send className="size-4" /></button></div></div></main></div></div>
}
