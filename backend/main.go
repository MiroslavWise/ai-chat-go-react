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

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()
	database, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer database.Close()

	if err := db.Migrate(ctx, database); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	st := store.New(database.Pool)
	issuer := auth.NewTokenIssuer(cfg.JWTSecret, cfg.JWTTTL)

	authHandler := handler.NewAuthHandler(st, issuer)
	chatsHandler := handler.NewChatsHandler(st)
	messagesHandler := handler.NewMessagesHandler(chatsHandler, st)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("POST /auth/token", authHandler.IssueToken)

	protected := middleware.RequireAuth(issuer)
	mux.Handle("GET /chats", protected(http.HandlerFunc(chatsHandler.List)))
	mux.Handle("POST /chats", protected(http.HandlerFunc(chatsHandler.Create)))
	mux.Handle("GET /chats/{id}/messages", protected(http.HandlerFunc(messagesHandler.List)))
	mux.Handle("POST /chats/{id}/messages", protected(http.HandlerFunc(messagesHandler.Create)))

	root := middleware.CORS(mux)
	log.Printf("listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, root))
}
