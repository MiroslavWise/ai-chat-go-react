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
	apiKey     string
	model      string
	baseURL    string
	httpReferer string
	appTitle   string
	httpClient *http.Client
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
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
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

	content := strings.TrimSpace(parsed.Choices[0].Message.Content)
	if content == "" {
		return "", fmt.Errorf("%s: empty assistant content", provider)
	}
	return content, nil
}

func providerLabel(baseURL string) string {
	if strings.Contains(strings.ToLower(baseURL), "openrouter.ai") {
		return "openrouter"
	}
	return "deepseek api"
}
