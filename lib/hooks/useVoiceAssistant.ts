'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/components/krishi-mitra/language-context'

type SpeechWindow = typeof window & {
  SpeechRecognition?: new () => SpeechRecognitionInstance
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance
}

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: any) => void) | null
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
}

export interface UseVoiceAssistantOptions {
  /** Field-level: current value to append transcript to */
  value?: string
  /** Called with updated value when speech detected */
  onChange?: (value: string) => void
  /** Override language; defaults to current app language */
  language?: string
  label?: string
}

export interface UseVoiceAssistantReturn {
  listening: boolean
  supported: boolean
  toggle: () => void
  transcript: string
  error: string | null
}

/**
 * useVoiceAssistant
 * Thin wrapper around the Web Speech API that respects the app's
 * current language context (EN / HI / MR).
 */
export function useVoiceAssistant(
  options: UseVoiceAssistantOptions = {}
): UseVoiceAssistantReturn {
  const { language: appLanguage } = useLanguage()
  const lang = options.language ?? appLanguage
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const baseValueRef = useRef(options.value ?? '')
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Detect browser support once on mount
  useEffect(() => {
    const w = window as SpeechWindow
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition))
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  // Keep baseValue in sync when parent value changes
  useEffect(() => {
    baseValueRef.current = options.value ?? ''
  }, [options.value])

  const toggle = useCallback(() => {
    if (!supported) return

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const w = window as SpeechWindow
    const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Recognition) return

    const recognition: any = new Recognition()
    recognition.lang = LANG_MAP[lang] ?? 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = Array.from({ length: event.results.length }, (_, i) =>
        event.results[i][0]?.transcript ?? ''
      ).join('')
      setTranscript(text)
      const base = baseValueRef.current
      options.onChange?.(`${base}${base && text ? ' ' : ''}${text}`)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.onerror = (ev: any) => {
      setError(ev.error)
      setListening(false)
    }

    recognitionRef.current = recognition as any
    setError(null)
    setTranscript('')
    setListening(true)
    recognition.start()
  }, [supported, listening, lang, options])

  return { listening, supported, toggle, transcript, error }
}
