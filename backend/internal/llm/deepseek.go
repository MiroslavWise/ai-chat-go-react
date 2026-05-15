package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const defaultBaseURL = "https://api.deepseek.com"

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Client struct {
	apiKey      string
	model       string
	baseURL     string
	httpReferer string
	appTitle    string
	httpClient  *http.Client
}

func NewClient(apiKey, model, baseURL, httpReferer, appTitle string) *Client {
	if model == "" {
		model = "deepseek-v4-flash"
	}
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	return &Client{
		apiKey:      apiKey,
		model:       model,
		baseURL:     strings.TrimSuffix(baseURL, "/"),
		httpReferer: httpReferer,
		appTitle:    appTitle,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

type chatCompletionRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

type chatCompletionResponse struct {
	Choices []chatCompletionChoice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

type chatCompletionChoice struct {
	Message json.RawMessage `json:"message"`
	Text    string          `json:"text"`
}

func (c *Client) ChatCompletion(ctx context.Context, messages []ChatMessage) (string, error) {
	if len(messages) == 0 {
		return "", fmt.Errorf("messages must not be empty")
	}

	body, err := json.Marshal(chatCompletionRequest{
		Model:    c.model,
		Messages: messages,
		Stream:   false,
	})
	if err != nil {
		return "", fmt.Errorf("encode request: %w", err)
	}

	url := strings.TrimSuffix(c.baseURL, "/") + "/chat/completions"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	if c.httpReferer != "" {
		req.Header.Set("HTTP-Referer", c.httpReferer)
	}
	if c.appTitle != "" {
		req.Header.Set("X-Title", c.appTitle)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("deepseek request: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	var parsed chatCompletionResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("decode response: %w", err)
	}
	provider := providerLabel(c.baseURL)
	if parsed.Error != nil && parsed.Error.Message != "" {
		return "", fmt.Errorf("%s: %s", provider, parsed.Error.Message)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		msg := strings.TrimSpace(string(raw))
		if msg == "" {
			msg = resp.Status
		}
		return "", fmt.Errorf("%s %d: %s", provider, resp.StatusCode, msg)
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("%s: empty choices", provider)
	}

	content := extractAssistantContent(parsed.Choices)
	if content == "" {
		return "", fmt.Errorf("%s: empty assistant content", provider)
	}
	return content, nil
}

func extractAssistantContent(choices []chatCompletionChoice) string {
	for _, choice := range choices {
		if content := extractMessageContent(choice.Message); content != "" {
			return content
		}
		if content := strings.TrimSpace(choice.Text); content != "" {
			return content
		}
	}
	return ""
}

func extractMessageContent(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}

	var msg struct {
		Content          json.RawMessage `json:"content"`
		Reasoning        string          `json:"reasoning"`
		ReasoningContent string          `json:"reasoning_content"`
	}
	if err := json.Unmarshal(raw, &msg); err != nil {
		return ""
	}

	if content := parseContentField(msg.Content); content != "" {
		return content
	}
	if content := strings.TrimSpace(msg.Reasoning); content != "" {
		return content
	}
	return strings.TrimSpace(msg.ReasoningContent)
}

func parseContentField(raw json.RawMessage) string {
	if len(raw) == 0 || string(raw) == "null" {
		return ""
	}

	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		return strings.TrimSpace(text)
	}

	var parts []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	if err := json.Unmarshal(raw, &parts); err == nil {
		var b strings.Builder
		for _, part := range parts {
			if part.Type != "text" || part.Text == "" {
				continue
			}
			if b.Len() > 0 {
				b.WriteByte(' ')
			}
			b.WriteString(part.Text)
		}
		return strings.TrimSpace(b.String())
	}

	return ""
}

func providerLabel(baseURL string) string {
	if strings.Contains(strings.ToLower(baseURL), "openrouter.ai") {
		return "openrouter"
	}
	return "deepseek api"
}
