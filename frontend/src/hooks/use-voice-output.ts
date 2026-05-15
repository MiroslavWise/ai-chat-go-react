import { useCallback, useEffect, useState } from "react"

const DEFAULT_LANG = "ru-RU"

const supportsSpeechSynthesis =
  typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window

export function useVoiceOutput(language = DEFAULT_LANG) {
  const [speaking, setSpeaking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (supportsSpeechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (!supportsSpeechSynthesis) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      setNotice(null)

      if (!supportsSpeechSynthesis) {
        setNotice("Озвучивание не поддерживается в этом браузере.")
        return
      }

      const trimmed = text.trim()
      if (!trimmed) {
        setNotice("Нечего озвучить — введите или продиктуйте текст.")
        return
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(trimmed)
      utterance.lang = language
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    },
    [language],
  )

  const toggleSpeak = useCallback(
    (text: string) => {
      if (speaking) {
        stop()
        return
      }
      speak(text)
    },
    [speak, speaking, stop],
  )

  return {
    speaking,
    speak,
    stop,
    toggleSpeak,
    notice,
    supportsSpeechSynthesis,
  }
}
