package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	DatabaseURL string
	JWTSecret   []byte
	JWTTTL      time.Duration
	Port        string
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

	return Config{
		DatabaseURL: dbURL,
		JWTSecret:   []byte(secret),
		JWTTTL:      time.Duration(ttlHours) * time.Hour,
		Port:        port,
	}, nil
}
