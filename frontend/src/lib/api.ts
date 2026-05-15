const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export async function fetchHealth(): Promise<string> {
  const response = await fetch(`${API_BASE}/health`)
  if (!response.ok) {
    throw new Error(`API health check failed: ${response.status}`)
  }
  return response.text()
}

export { API_BASE }
