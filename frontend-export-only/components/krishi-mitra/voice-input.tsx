'use client'

import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = { value: string; onChange: (value: string) => void; language?: string; label?: string }

type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((event: any) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }
type RecognitionConstructor = new () => Recognition

export function VoiceInput({ value, onChange, language = 'en', label = 'Use voice input' }: Props) {
  const recognitionRef = useRef<Recognition | null>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const baseValue = useRef(value)

  useEffect(() => {
    const speechWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
    setSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition))
    return () => recognitionRef.current?.stop()
  }, [])

  function toggleListening() {
    if (!supported) return
    const speechWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
    if (listening) { recognitionRef.current?.stop(); return }
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false
    baseValue.current = value
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result: any) => result[0]?.transcript || '').join('')
      onChange(`${baseValue.current}${baseValue.current && transcript ? ' ' : ''}${transcript}`)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  if (!supported) return null
  return <button type="button" onClick={toggleListening} aria-label={listening ? 'Stop voice input' : label} title={listening ? 'Listening… tap to stop' : label} className={`voice-input-button ${listening ? 'is-listening' : ''}`}><span className="sr-only">{listening ? 'Listening' : label}</span>{listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}</button>
}

export function VoiceField({ children }: { children: React.ReactNode }) { return <div className="voice-field">{children}</div> }
