package handler

import (
	"errors"
	"net/http"

	"ai-chat/internal/middleware"
	"ai-chat/internal/store"

	"github.com/google/uuid"
)

type ChatsHandler struct {
	store *store.Store
}

func NewChatsHandler(s *store.Store) *ChatsHandler {
	return &ChatsHandler{store: s}
}

type createChatRequest struct {
	Title string `json:"title"`
}

func (h *ChatsHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	chats, err := h.store.ListChats(r.Context(), userID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to list chats")
		return
	}
	WriteJSON(w, http.StatusOK, chats)
}

func (h *ChatsHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req createChatRequest
	if err := DecodeJSON(r, &req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	chat, err := h.store.CreateChat(r.Context(), userID, req.Title)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to create chat")
		return
	}
	WriteJSON(w, http.StatusCreated, chat)
}

func ParseChatID(r *http.Request) (uuid.UUID, error) {
	return uuid.Parse(r.PathValue("id"))
}

func (h *ChatsHandler) RequireOwnedChat(r *http.Request) (store.Chat, error) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		return store.Chat{}, errUnauthorized
	}
	chatID, err := ParseChatID(r)
	if err != nil {
		return store.Chat{}, errBadChatID
	}
	chat, err := h.store.ChatForUser(r.Context(), chatID, userID)
	if errors.Is(err, store.ErrNotFound) {
		return store.Chat{}, errNotFound
	}
	if err != nil {
		return store.Chat{}, err
	}
	return chat, nil
}

var (
	errUnauthorized = errors.New("unauthorized")
	errBadChatID    = errors.New("bad chat id")
	errNotFound     = errors.New("not found")
)

func ChatAccessError(w http.ResponseWriter, err error) bool {
	switch {
	case errors.Is(err, errUnauthorized):
		WriteError(w, http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, errBadChatID):
		WriteError(w, http.StatusBadRequest, "invalid chat id")
	case errors.Is(err, store.ErrNotFound), errors.Is(err, errNotFound):
		WriteError(w, http.StatusNotFound, "chat not found")
	default:
		return false
	}
	return true
}
