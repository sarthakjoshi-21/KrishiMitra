interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList }
interface SpeechRecognitionResultList { readonly length: number; [index: number]: SpeechRecognitionResult }
interface SpeechRecognitionResult { readonly length: number; readonly isFinal: boolean; [index: number]: SpeechRecognitionAlternative }
interface SpeechRecognitionAlternative { readonly transcript: string; readonly confidence: number }
interface SpeechRecognition extends EventTarget { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((event: SpeechRecognitionEvent) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }
declare var SpeechRecognition: { new (): SpeechRecognition }
declare var webkitSpeechRecognition: { new (): SpeechRecognition }
