import { useCallback, useEffect, useRef, useState } from "react"
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition"

const DEFAULT_LANG = "ru-RU"

function mergeDictation(base: string, transcript: string): string {
  const trimmedBase = base.trimEnd()
  const trimmedTranscript = transcript.trim()
  if (!trimmedTranscript) return trimmedBase
  if (!trimmedBase) return trimmedTranscript
  return `${trimmedBase} ${trimmedTranscript}`
}

type UseVoiceInputOptions = {
  value: string
  onChange: (value: string) => void
  language?: string
}

export function useVoiceInput({ value, onChange, language = DEFAULT_LANG }: UseVoiceInputOptions) {
  const baseTextRef = useRef("")
  const [notice, setNotice] = useState<string | null>(null)

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
  } = useSpeechRecognition()

  useEffect(() => {
    if (!listening) return
    onChange(mergeDictation(baseTextRef.current, transcript))
  }, [transcript, listening, onChange])

  const toggleListening = useCallback(async () => {
    setNotice(null)

    if (!browserSupportsSpeechRecognition) {
      setNotice("Голосовой ввод не поддерживается в этом браузере. Попробуйте Chrome или Edge.")
      return
    }

    if (!isMicrophoneAvailable) {
      setNotice("Нет доступа к микрофону. Разрешите запись в настройках браузера.")
      return
    }

    if (listening) {
      await SpeechRecognition.stopListening()
      resetTranscript()
      baseTextRef.current = ""
      return
    }

    baseTextRef.current = value.trimEnd()
    resetTranscript()
    await SpeechRecognition.startListening({
      continuous: browserSupportsContinuousListening,
      language,
    })
  }, [
    browserSupportsContinuousListening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    language,
    listening,
    resetTranscript,
    value,
  ])

  const stopListening = useCallback(async () => {
    if (!listening) return
    await SpeechRecognition.stopListening()
    resetTranscript()
    baseTextRef.current = ""
  }, [listening, resetTranscript])

  return {
    listening,
    toggleListening,
    stopListening,
    notice,
    supportsSpeechRecognition: browserSupportsSpeechRecognition,
  }
}
