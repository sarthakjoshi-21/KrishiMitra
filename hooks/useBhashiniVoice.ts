'use client'

import { useCallback, useRef, useState } from 'react'

type Language = 'en' | 'hi' | 'mr'

// ─── Utility: Convert Blob to base64 string ───────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Strip the data URL prefix (e.g. "data:audio/webm;base64,")
      const base64 = result.split(',')[1]
      if (base64) resolve(base64)
      else reject(new Error('Failed to convert audio blob to base64'))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// ─── Utility: Call the /api/bhashini backend route ───────────────────────────

async function callBhashiniRoute(payload: Record<string, unknown>): Promise<any> {
  const res = await fetch('/api/bhashini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `Bhashini API error (${res.status})`)
  return data
}

// ─── Hook: useAudioRecorder ───────────────────────────────────────────────────
//
// Records audio from the microphone using the MediaRecorder API,
// converts to base64, and sends to the Bhashini ASR+NMT pipeline.
//
// Returns:
//   isRecording   – true while mic is actively recording
//   isProcessing  – true while Bhashini API call is in-flight
//   transcript    – the translated (or ASR) English text result
//   error         – any error message
//   startRecording() – start mic capture
//   stopRecording()  – stop mic, process audio through Bhashini
//   clearTranscript() – reset transcript state

export interface AudioRecorderState {
  isRecording: boolean
  isProcessing: boolean
  transcript: string
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  clearTranscript: () => void
}

export function useAudioRecorder(language: Language): AudioRecorderState {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const browserTranscriptRef = useRef<string>('')

  const startRecording = useCallback(async () => {
    setError(null)
    setTranscript('')
    chunksRef.current = []
    browserTranscriptRef.current = ''

    // Start browser SpeechRecognition in parallel as a fallback
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRec) {
        try {
          const rec = new SpeechRec()
          rec.continuous = true
          rec.interimResults = true
          rec.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
          rec.onresult = (event: any) => {
            let combined = ''
            for (let i = 0; i < event.results.length; i++) {
              combined += event.results[i][0].transcript
            }
            if (combined) browserTranscriptRef.current = combined
          }
          rec.onerror = () => {}
          rec.start()
          recognitionRef.current = rec
        } catch {
          // ignore if speech recognition cannot start
        }
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      // Prefer audio/wav; fall back to whatever the browser supports
      const mimeType = MediaRecorder.isTypeSupported('audio/wav')
        ? 'audio/wav'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Stop all tracks to release the mic indicator in the browser
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        setIsProcessing(true)
        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType })
          const audioBase64 = await blobToBase64(audioBlob)

          const result = await callBhashiniRoute({
            task: 'asr-translate',
            language,
            audioBase64,
            sampleRate: 16000,
          })

          setTranscript(result.transcript ?? '')
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn('[useBhashiniVoice] Bhashini ASR error, checking browser speech fallback:', msg)

          // If browser speech recognition captured text, use it seamlessly!
          if (browserTranscriptRef.current && browserTranscriptRef.current.trim()) {
            console.log('[useBhashiniVoice] Using browser speech transcript:', browserTranscriptRef.current)
            setTranscript(browserTranscriptRef.current.trim())
            setError(null)
          } else {
            console.error('[useBhashiniVoice] ASR error:', msg)
            setError(
              msg.includes('Error in fetching ulcaApiKey')
                ? 'Bhashini Error: In .env.local, BHASHINI_USER_ID must be the 32-character User ID from your Bhashini Profile (not email).'
                : msg
            )
          }
        } finally {
          setIsProcessing(false)
        }
      }

      recorder.start(250) // collect chunks every 250ms
      setIsRecording(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[useBhashiniVoice] Mic access error:', msg)
      setError('Microphone access denied or unavailable.')
    }
  }, [language])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    setIsRecording(false)
  }, [])

  const clearTranscript = useCallback(() => setTranscript(''), [])

  return { isRecording, isProcessing, transcript, error, startRecording, stopRecording, clearTranscript }
}

// ─── Hook: useBhashiniTTS ─────────────────────────────────────────────────────
//
// Translates English text to the target language and speaks it via Bhashini TTS.
// Audio is decoded from base64 and played using the HTML5 Audio object.
//
// Returns:
//   isSpeaking  – true while audio is playing
//   speak(text, language) – translate + speak
//   stop()      – stop the current audio

export interface BhashiniTTSState {
  isSpeaking: boolean
  speak: (text: string, language: Language) => Promise<void>
  stop: () => void
}

export function useBhashiniTTS(): BhashiniTTSState {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(
    async (text: string, language: Language) => {
      // Stop any currently playing audio
      stop()

      try {
        setIsSpeaking(true)

        const result = await callBhashiniRoute({
          task: 'translate-tts',
          language,
          text,
          gender: 'female',
        })

        if (!result.audioBase64) {
          throw new Error('No audio returned from Bhashini TTS')
        }

        // Decode base64 → Blob → Object URL → play
        const byteCharacters = atob(result.audioBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const audioBlob = new Blob([byteArray], { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)

        const audio = new Audio(audioUrl)
        audioRef.current = audio

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setIsSpeaking(false)
          audioRef.current = null
        }

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          setIsSpeaking(false)
          audioRef.current = null
          console.error('[useBhashiniTTS] Audio playback error')
        }

        await audio.play()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn('[useBhashiniTTS] Bhashini TTS error, falling back to browser SpeechSynthesis:', msg)

        // Browser speech synthesis fallback
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
            utterance.onend = () => setIsSpeaking(false)
            utterance.onerror = () => setIsSpeaking(false)
            window.speechSynthesis.speak(utterance)
            return
          } catch {
            // fall through
          }
        }
        setIsSpeaking(false)
      }
    },
    [stop]
  )

  return { isSpeaking, speak, stop }
}
