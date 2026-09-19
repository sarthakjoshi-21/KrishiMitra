import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import http from 'http'
import { URL } from 'url'

// ─── Native HTTP/HTTPS helper that preserves exact header casing ─────────────

function httpRequestJson<T = any>(
  targetUrl: string,
  headers: Record<string, string>,
  body: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl)
    const postData = JSON.stringify(body)

    const requestHeaders: Record<string, string | number> = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      ...headers,
    }

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: requestHeaders,
    }

    const client = url.protocol === 'https:' ? https : http

    const req = client.request(options, (res) => {
      let responseBody = ''
      res.setEncoding('utf8')

      res.on('data', (chunk) => {
        responseBody += chunk
      })

      res.on('end', () => {
        const statusCode = res.statusCode ?? 500
        if (statusCode < 200 || statusCode >= 300) {
          return reject(
            new Error(`Bhashini request failed (${statusCode}): ${responseBody || res.statusMessage}`)
          )
        }

        try {
          const parsed = JSON.parse(responseBody)
          resolve(parsed as T)
        } catch (err) {
          reject(new Error(`Failed to parse JSON response (${statusCode}): ${responseBody}`))
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.write(postData)
    req.end()
  })
}


// ─── Types ────────────────────────────────────────────────────────────────────

type Language = 'en' | 'hi' | 'mr'
type TaskType = 'asr-translate' | 'translate-tts' | 'translate'

interface BhashiniRequestBody {
  task: TaskType
  language: Language
  audioBase64?: string   // required for asr-translate
  text?: string          // required for translate-tts or translate
  texts?: string[]       // optional batch for translate
  gender?: 'male' | 'female'
  sampleRate?: number    // default 16000 for ASR
}

interface PipelineService {
  serviceId: string
  callbackUrl: string
  inferenceApiKey: { value: string; name: string }
}

interface PipelineConfig {
  asr?: PipelineService
  translation?: PipelineService
  tts?: PipelineService
}

// ─── ISO-639 to Bhashini language code mapping ────────────────────────────────

const BHASHINI_LANG: Record<Language, string> = {
  en: 'en',
  hi: 'hi',
  mr: 'mr',
}

// ─── Phase A: Fetch pipeline configuration from ULCA ─────────────────────────

async function fetchPipelineConfig(
  tasks: Array<{ taskType: string; config: Record<string, string> }>,
  userId: string,
  apiKey: string
): Promise<PipelineConfig> {
  const configPayload = {
    pipelineTasks: tasks,
    pipelineRequestConfig: {
      pipelineId: process.env.BHASHINI_PIPELINE_ID ?? '',
    },
  }

  // ⚑ DIAGNOSTIC — visible in the Next.js server terminal on every Bhashini call
  console.log('[Bhashini] ENV CHECK ▶ BHASHINI_USER_ID   =', JSON.stringify(process.env.BHASHINI_USER_ID))
  console.log('[Bhashini] ENV CHECK ▶ BHASHINI_ULCA_API_KEY length =', process.env.BHASHINI_ULCA_API_KEY?.length ?? 'UNDEFINED')
  console.log('[Bhashini] ENV CHECK ▶ BHASHINI_PIPELINE_ID =', JSON.stringify(process.env.BHASHINI_PIPELINE_ID))
  console.log('[Bhashini] Phase A — Config payload:', JSON.stringify(configPayload, null, 2))

  // Native https.request preserves exact header casing ("userID", "ulcaApiKey") required by ULCA API gateway
  const configData = await httpRequestJson<any>(
    'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline',
    {
      'userID': userId,
      'ulcaApiKey': apiKey,
    },
    configPayload
  )
  console.log('[Bhashini] Phase A — Config response:', JSON.stringify(configData, null, 2))

  const pipelineConfig: PipelineConfig = {}

  const responseList: any[] = configData?.pipelineResponseConfig ?? []
  for (const item of responseList) {
    const taskType: string = item?.taskType
    const configs: any[] = item?.config ?? []
    if (!configs.length) continue
    const first = configs[0]
    const serviceId: string = first?.serviceId ?? ''
    const callbackUrl: string = first?.callbackUrl ?? ''
    const inferenceApiKey = first?.inferenceApiKey ?? { value: '', name: 'Authorization' }

    const service: PipelineService = { serviceId, callbackUrl, inferenceApiKey }

    if (taskType === 'asr') pipelineConfig.asr = service
    if (taskType === 'translation') pipelineConfig.translation = service
    if (taskType === 'tts') pipelineConfig.tts = service
  }

  return pipelineConfig
}

// ─── Phase B: Call the compute (inference) endpoint ──────────────────────────

async function callCompute(
  callbackUrl: string,
  inferenceApiKey: { value: string; name: string },
  payload: Record<string, unknown>
): Promise<any> {
  console.log('[Bhashini] Phase B — Compute URL:', callbackUrl)
  console.log('[Bhashini] Phase B — Compute payload:', JSON.stringify(payload, null, 2))

  const computeData = await httpRequestJson<any>(
    callbackUrl,
    {
      [inferenceApiKey.name]: inferenceApiKey.value,
    },
    payload
  )
  console.log('[Bhashini] Phase B — Compute response keys:', Object.keys(computeData))
  return computeData
}

// ─── ASR + Translation (asr-translate) ───────────────────────────────────────

async function handleAsrTranslate(
  body: BhashiniRequestBody,
  userId: string,
  apiKey: string
): Promise<NextResponse> {
  const { language, audioBase64, sampleRate = 16000 } = body

  if (!audioBase64) {
    return NextResponse.json({ error: 'audioBase64 is required for asr-translate' }, { status: 400 })
  }

  const sourceLang = BHASHINI_LANG[language]
  const isEnglish = language === 'en'

  // Build Phase A task list
  const pipelineTasks: Array<{ taskType: string; config: Record<string, string> }> = [
    {
      taskType: 'asr',
      config: { language: { sourceLanguage: sourceLang } as any },
    },
  ]

  // English shortcut: skip NMT to reduce latency
  if (!isEnglish) {
    pipelineTasks.push({
      taskType: 'translation',
      config: {
        language: { sourceLanguage: sourceLang, targetLanguage: 'en' } as any,
      } as any,
    })
  }

  try {
    const config = await fetchPipelineConfig(pipelineTasks, userId, apiKey)

    if (!config.asr) {
      return NextResponse.json({ error: 'ASR service not found in pipeline config' }, { status: 502 })
    }

    // Build Phase B payload — we use the primary service (ASR drives the pipeline)
    const computePayload: Record<string, unknown> = {
      pipelineTasks: [
        {
          taskType: 'asr',
          config: {
            serviceId: config.asr.serviceId,
            language: { sourceLanguage: sourceLang },
            audioFormat: 'wav',
            samplingRate: sampleRate,
            postProcessors: null,
          },
          audio: [{ audioContent: audioBase64 }],
        },
        ...(!isEnglish && config.translation
          ? [
              {
                taskType: 'translation',
                config: {
                  serviceId: config.translation.serviceId,
                  language: { sourceLanguage: sourceLang, targetLanguage: 'en' },
                },
              },
            ]
          : []),
      ],
      inputData: { audio: [{ audioContent: audioBase64 }] },
    }

    // Use the ASR callbackUrl (it orchestrates the full pipeline)
    const result = await callCompute(config.asr.callbackUrl, config.asr.inferenceApiKey, computePayload)

    // Extract the final translated (or ASR) text
    let transcript = ''
    const pipelineOutput: any[] = result?.pipelineResponse ?? []

    for (const step of pipelineOutput) {
      const taskType: string = step?.taskType
      if (taskType === 'translation' && !isEnglish) {
        const trans: any[] = step?.output ?? []
        transcript = trans[0]?.target ?? transcript
      } else if (taskType === 'asr' && isEnglish) {
        const asr: any[] = step?.output ?? []
        transcript = asr[0]?.source ?? ''
      }
    }

    return NextResponse.json({ transcript })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Bhashini] asr-translate error:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

// ─── Translation + TTS (translate-tts) ───────────────────────────────────────

async function handleTranslateTts(
  body: BhashiniRequestBody,
  userId: string,
  apiKey: string
): Promise<NextResponse> {
  const { language, text, gender = 'female' } = body

  if (!text) {
    return NextResponse.json({ error: 'text is required for translate-tts' }, { status: 400 })
  }

  const targetLang = BHASHINI_LANG[language]
  const isEnglish = language === 'en'

  const pipelineTasks: Array<{ taskType: string; config: Record<string, any> }> = []

  // English shortcut: skip NMT
  if (!isEnglish) {
    pipelineTasks.push({
      taskType: 'translation',
      config: {
        language: { sourceLanguage: 'en', targetLanguage: targetLang },
      },
    })
  }

  pipelineTasks.push({
    taskType: 'tts',
    config: {
      language: { sourceLanguage: targetLang },
      gender,
    },
  })

  try {
    const config = await fetchPipelineConfig(pipelineTasks, userId, apiKey)

    // Determine which service drives the callback
    const primaryService = isEnglish ? config.tts : (config.translation ?? config.tts)

    if (!primaryService) {
      return NextResponse.json(
        { error: 'TTS/translation service not found in pipeline config' },
        { status: 502 }
      )
    }

    const computePayload: Record<string, unknown> = {
      pipelineTasks: [
        ...(!isEnglish && config.translation
          ? [
              {
                taskType: 'translation',
                config: {
                  serviceId: config.translation.serviceId,
                  language: { sourceLanguage: 'en', targetLanguage: targetLang },
                },
              },
            ]
          : []),
        ...(config.tts
          ? [
              {
                taskType: 'tts',
                config: {
                  serviceId: config.tts.serviceId,
                  language: { sourceLanguage: targetLang },
                  gender,
                  samplingRate: 8000,
                },
              },
            ]
          : []),
      ],
      inputData: {
        input: [{ source: text }],
      },
    }

    const result = await callCompute(primaryService.callbackUrl, primaryService.inferenceApiKey, computePayload)

    // Extract base64 audio from TTS output
    const pipelineOutput: any[] = result?.pipelineResponse ?? []
    let audioBase64 = ''
    let sampleRate = 8000

    for (const step of pipelineOutput) {
      if (step?.taskType === 'tts') {
        const audio: any[] = step?.audio ?? []
        audioBase64 = audio[0]?.audioContent ?? ''
        sampleRate = step?.config?.samplingRate ?? 8000
      }
    }

    if (!audioBase64) {
      return NextResponse.json({ error: 'No audio returned from Bhashini TTS' }, { status: 502 })
    }

    return NextResponse.json({ audioBase64, sampleRate })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Bhashini] translate-tts error:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

// ─── Text-only Translation (translate) ──────────────────────────────────────────────────────────

async function handleTranslate(
  body: BhashiniRequestBody,
  userId: string,
  apiKey: string
): Promise<NextResponse> {
  const { language, text, texts } = body

  // Accept either a single text or a batch of texts
  const inputs: string[] = texts && texts.length > 0
    ? texts
    : text ? [text] : []

  if (inputs.length === 0) {
    return NextResponse.json({ error: 'text or texts is required for translate' }, { status: 400 })
  }

  const targetLang = BHASHINI_LANG[language]

  if (language === 'en') {
    // No-op: already English, return inputs as-is
    return NextResponse.json({ translations: inputs })
  }

  const pipelineTasks: Array<{ taskType: string; config: Record<string, any> }> = [
    {
      taskType: 'translation',
      config: {
        language: { sourceLanguage: 'en', targetLanguage: targetLang },
      },
    },
  ]

  try {
    const config = await fetchPipelineConfig(pipelineTasks as any, userId, apiKey)

    if (!config.translation) {
      return NextResponse.json({ error: 'Translation service not found in pipeline config' }, { status: 502 })
    }

    const computePayload = {
      pipelineTasks: [
        {
          taskType: 'translation',
          config: {
            serviceId: config.translation.serviceId,
            language: { sourceLanguage: 'en', targetLanguage: targetLang },
          },
        },
      ],
      inputData: {
        input: inputs.map((src) => ({ source: src })),
      },
    }

    const result = await callCompute(
      config.translation.callbackUrl,
      config.translation.inferenceApiKey,
      computePayload
    )

    // Extract translated strings from pipelineResponse[0].output[]
    const pipelineOutput: any[] = result?.pipelineResponse ?? []
    let translations: string[] = inputs // default = untranslated (graceful fallback)
    for (const step of pipelineOutput) {
      if (step?.taskType === 'translation') {
        const outputItems: any[] = step?.output ?? []
        translations = outputItems.map((o: any, i: number) => o?.target ?? inputs[i] ?? '')
      }
    }

    return NextResponse.json({ translations })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Bhashini] translate error:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

// ─── Main Route Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = process.env.BHASHINI_USER_ID;
  const apiKey = process.env.BHASHINI_ULCA_API_KEY;

  if (!userId || !apiKey) {
    console.error("Missing Env Vars - UserID found:", !!userId, "APIKey found:", !!apiKey);
    return NextResponse.json({ error: "Missing Bhashini credentials in .env.local" }, { status: 500 });
  }

  let body: BhashiniRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { task } = body
  if (!task) {
    return NextResponse.json({ error: 'task field is required (asr-translate | translate-tts)' }, { status: 400 })
  }

  if (task === 'asr-translate') return handleAsrTranslate(body, userId, apiKey)
  if (task === 'translate-tts') return handleTranslateTts(body, userId, apiKey)
  if (task === 'translate') return handleTranslate(body, userId, apiKey)

  return NextResponse.json({ error: `Unknown task: ${task}` }, { status: 400 })
}
