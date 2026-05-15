/** Нормализует текст после Web Speech API перед отправкой. */
export function normalizeVoiceText(text: string): string {
  let value = text.trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith("«") && value.endsWith("»"))
  ) {
    value = value.slice(1, -1).trim()
  }

  return value.replace(/\s+/g, " ")
}
