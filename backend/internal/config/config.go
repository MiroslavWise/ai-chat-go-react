package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

const defaultDeepSeekBaseURL = "https://api.deepseek.com"

type Config struct {
	DatabaseURL    string
	JWTSecret      []byte
	JWTTTL         time.Duration
	Port           string
	DeepSeekAPIKey string
	DeepSeekModel  string
	DeepSeekBaseURL string
	DeepSeekSystem string
	LLMHTTPReferer string
	LLMAppTitle    string
}

func Load() (Config, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = os.Getenv("POSTGRES_URL")
	}
	if dbURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL or POSTGRES_URL is required")
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return Config{}, fmt.Errorf("JWT_SECRET is required")
	}

	ttlHours := 168
	if v := os.Getenv("JWT_TTL_HOURS"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n <= 0 {
			return Config{}, fmt.Errorf("invalid JWT_TTL_HOURS: %q", v)
		}
		ttlHours = n
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	model := os.Getenv("DEEPSEEK_MODEL")
	if model == "" {
		model = "deepseek-v4-flash"
	}

	baseURL := strings.TrimSpace(os.Getenv("LLM_BASE_URL"))
	if baseURL == "" {
		baseURL = strings.TrimSpace(os.Getenv("DEEPSEEK_BASE_URL"))
	}
	if baseURL == "" {
		baseURL = defaultDeepSeekBaseURL
	}
	model = normalizeModel(model, baseURL)

	system := os.Getenv("DEEPSEEK_SYSTEM_PROMPT")
	if system == "" {
		system = "You are a helpful assistant."
	}

	referer := strings.TrimSpace(os.Getenv("LLM_HTTP_REFERER"))
	if referer == "" {
		referer = strings.TrimSpace(os.Getenv("OPENROUTER_HTTP_REFERER"))
	}
	appTitle := strings.TrimSpace(os.Getenv("LLM_APP_TITLE"))
	if appTitle == "" {
		appTitle = strings.TrimSpace(os.Getenv("OPENROUTER_APP_TITLE"))
	}
	if strings.Contains(strings.ToLower(baseURL), "openrouter.ai") {
		if referer == "" {
			referer = defaultOpenRouterReferer()
		}
		if appTitle == "" {
			appTitle = "AI Chat"
		}
	}

	return Config{
		DatabaseURL:     dbURL,
		JWTSecret:       []byte(secret),
		JWTTTL:          time.Duration(ttlHours) * time.Hour,
		Port:            port,
		DeepSeekAPIKey:  os.Getenv("DEEPSEEK_API_KEY"),
		DeepSeekModel:   model,
		DeepSeekBaseURL: baseURL,
		DeepSeekSystem:  system,
		LLMHTTPReferer:  referer,
		LLMAppTitle:     appTitle,
	}, nil
}

func defaultOpenRouterReferer() string {
	if v := strings.TrimSpace(os.Getenv("VERCEL_URL")); v != "" {
		if strings.HasPrefix(v, "http://") || strings.HasPrefix(v, "https://") {
			return v
		}
		return "https://" + v
	}
	return "http://localhost"
}

func normalizeModel(model, baseURL string) string {
	baseURL = strings.ToLower(baseURL)
	if strings.Contains(baseURL, "openrouter.ai") {
		if strings.Contains(model, "/") {
			return model
		}
		return "deepseek/" + model
	}
	if strings.Contains(model, "/") {
		if i := strings.LastIndex(model, "/"); i >= 0 && i < len(model)-1 {
			return model[i+1:]
		}
	}
	return model
}
