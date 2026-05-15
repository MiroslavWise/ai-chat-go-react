package middleware

import (
	"context"
	"net/http"
	"strings"

	"ai-chat/internal/auth"
	"ai-chat/internal/httpx"

	"github.com/google/uuid"
)

type contextKey string

const UserIDKey contextKey = "userID"

func RequireAuth(issuer *auth.TokenIssuer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				httpx.WriteError(w, http.StatusUnauthorized, "missing Authorization header")
				return
			}
			token := strings.TrimPrefix(header, "Bearer ")
			if token == header || token == "" {
				httpx.WriteError(w, http.StatusUnauthorized, "invalid Authorization header")
				return
			}
			userID, err := issuer.Parse(token)
			if err != nil {
				httpx.WriteError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(UserIDKey).(uuid.UUID)
	return id, ok
}
