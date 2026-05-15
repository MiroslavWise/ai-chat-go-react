package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"ai-chat/internal/auth"
	"ai-chat/internal/config"
	"ai-chat/internal/db"
	"ai-chat/internal/handler"
	"ai-chat/internal/middleware"
	"ai-chat/internal/store"

	"github.com/joho/godotenv"
)

func loadEnv() {
	_ = godotenv.Load()
	if wd, err := os.Getwd(); err == nil {
		_ = godotenv.Load(filepath.Join(wd, "..", ".env"))
	}
}

func main() {
	loadEnv()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write([]byte("ok"))
	})

	if err := mountAPI(mux); err != nil {
		log.Printf("api unavailable: %v", err)
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/health" {
				return
			}
			handler.WriteError(w, http.StatusServiceUnavailable, err.Error())
		})
	}

	root := middleware.CORS(mux)
	log.Printf("listening on :%s", port)
	if err := http.ListenAndServe(":"+port, root); err != nil {
		log.Fatalf("server: %v", err)
	}
}

func mountAPI(mux *http.ServeMux) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx := context.Background()
	database, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}

	if err := db.Migrate(ctx, database); err != nil {
		database.Close()
		return err
	}

	st := store.New(database.Pool)
	issuer := auth.NewTokenIssuer(cfg.JWTSecret, cfg.JWTTTL)

	authHandler := handler.NewAuthHandler(st, issuer)
	chatsHandler := handler.NewChatsHandler(st)
	messagesHandler := handler.NewMessagesHandler(chatsHandler, st)

	mux.HandleFunc("POST /auth/token", authHandler.IssueToken)

	protected := middleware.RequireAuth(issuer)
	mux.Handle("GET /chats", protected(http.HandlerFunc(chatsHandler.List)))
	mux.Handle("POST /chats", protected(http.HandlerFunc(chatsHandler.Create)))
	mux.Handle("GET /chats/{id}/messages", protected(http.HandlerFunc(messagesHandler.List)))
	mux.Handle("POST /chats/{id}/messages", protected(http.HandlerFunc(messagesHandler.Create)))

	return nil
}
