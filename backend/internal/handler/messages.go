package handler

import (
	"log"
	"net/http"
	"strings"

	"ai-chat/internal/llm"
	"ai-chat/internal/store"

	"github.com/google/uuid"
)

type MessagesHandler struct {
	chats        *ChatsHandler
	store        *store.Store
	llm          *llm.Client
	systemPrompt string
}

func NewMessagesHandler(chats *ChatsHandler, s *store.Store, client *llm.Client, systemPrompt string) *MessagesHandler {
	return &MessagesHandler{
		chats:        chats,
		store:        s,
		llm:          client,
		systemPrompt: systemPrompt,
	}
}

type sendMessageRequest struct {
	Content string `json:"content"`
	Role    string `json:"role"`
}

type sendMessageResponse struct {
	Message   store.Message  `json:"message"`
	Assistant *store.Message `json:"assistant,omitempty"`
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

	resp := sendMessageResponse{Message: msg}

	if role == "user" {
		if h.llm == nil {
			WriteError(w, http.StatusServiceUnavailable, "AI is not configured")
			return
		}
		assistant, err := h.replyWithAI(r, chat.ID)
		if err != nil {
			log.Printf("AI reply failed chat=%s: %v", chat.ID, err)
			WriteError(w, http.StatusBadGateway, "failed to get AI response", err.Error())
			return
		}
		resp.Assistant = &assistant
	}

	if err := h.store.TouchChat(r.Context(), chat.ID); err != nil {
		WriteError(w, http.StatusInternalServerError, "failed to update chat")
		return
	}

	WriteJSON(w, http.StatusCreated, resp)
}

func (h *MessagesHandler) replyWithAI(r *http.Request, chatID uuid.UUID) (store.Message, error) {
	ctx := r.Context()

	history, err := h.store.ListMessages(ctx, chatID)
	if err != nil {
		return store.Message{}, err
	}

	messages := make([]llm.ChatMessage, 0, len(history)+1)
	if h.systemPrompt != "" {
		messages = append(messages, llm.ChatMessage{
			Role:    "system",
			Content: h.systemPrompt,
		})
	}
	for _, m := range history {
		messages = append(messages, llm.ChatMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	reply, err := h.llm.ChatCompletion(ctx, messages)
	if err != nil {
		return store.Message{}, err
	}

	return h.store.InsertMessage(ctx, chatID, "assistant", reply)
}
