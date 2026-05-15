package handler

import (
	"net/http"

	"ai-chat/internal/httpx"
)

func WriteJSON(w http.ResponseWriter, status int, v any) {
	httpx.WriteJSON(w, status, v)
}

func WriteError(w http.ResponseWriter, status int, message string, details ...string) {
	httpx.WriteError(w, status, message, details...)
}

func DecodeJSON(r *http.Request, dst any) error {
	return httpx.DecodeJSON(r, dst)
}
