package handler

import (
	"net/http"

	"ai-chat/internal/auth"
	"ai-chat/internal/store"

	"github.com/google/uuid"
)

type AuthHandler struct {
	store  *store.Store
	issuer *auth.TokenIssuer
}

func NewAuthHandler(s *store.Store, issuer *auth.TokenIssuer) *AuthHandler {
	return &AuthHandler{store: s, issuer: issuer}
}

type tokenRequest struct {
	UserID string `json:"user_id"`
}

type tokenResponse struct {
	Token  string    `json:"token"`
	UserID uuid.UUID `json:"user_id"`
}

func (h *AuthHandler) IssueToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		WriteError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req tokenRequest
	if err := DecodeJSON(r, &req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "user_id must be a valid UUID")
		return
	}

	if _, err := h.store.UpsertUser(r.Context(), userID); err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to register user")
		return
	}

	token, err := h.issuer.Issue(userID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}

	WriteJSON(w, http.StatusOK, tokenResponse{Token: token, UserID: userID})
}
