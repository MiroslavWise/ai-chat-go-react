package handler

import (
	"net/http"
	"strings"

	"ai-chat/internal/store"
)

type MessagesHandler struct {
	chats *ChatsHandler
	store *store.Store
}

func NewMessagesHandler(chats *ChatsHandler, s *store.Store) *MessagesHandler {
	return &MessagesHandler{chats: chats, store: s}
}

type sendMessageRequest struct {
	Content string `json:"content"`
	Role    string `json:"role"`
}

type sendMessageResponse struct {
	Message store.Message `json:"message"`
}

func (h *MessagesHandler) List(w http.ResponseWriter, r *http.Request) {
	chat, err := h.chats.RequireOwnedChat(r)
	if ChatAccessError(w, err) {
		return
	}
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to load chat")
		return
	}
	messages, err := h.store.ListMessages(r.Context(), chat.ID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to list messages")
		return
	}
	WriteJSON(w, http.StatusOK, messages)
}

func (h *MessagesHandler) Create(w http.ResponseWriter, r *http.Request) {
	chat, err := h.chats.RequireOwnedChat(r)
	if ChatAccessError(w, err) {
		return
	}
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to load chat")
		return
	}

	var req sendMessageRequest
	if err := DecodeJSON(r, &req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	content := strings.TrimSpace(req.Content)
	if content == "" {
		WriteError(w, http.StatusBadRequest, "content is required")
		return
	}
	role := req.Role
	if role == "" {
		role = "user"
	}
	switch role {
	case "user", "assistant", "system":
	default:
		WriteError(w, http.StatusBadRequest, "role must be user, assistant, or system")
		return
	}

	msg, err := h.store.InsertMessage(r.Context(), chat.ID, role, content)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to save message")
		return
	}
	if err := h.store.TouchChat(r.Context(), chat.ID); err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to update chat")
		return
	}

	WriteJSON(w, http.StatusCreated, sendMessageResponse{Message: msg})
}
