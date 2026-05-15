package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("not found")

type User struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"created_at"`
}

type Chat struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Message struct {
	ID        uuid.UUID `json:"id"`
	ChatID    uuid.UUID `json:"chat_id"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Store struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) UpsertUser(ctx context.Context, id uuid.UUID) (User, error) {
	const q = `
		INSERT INTO users (id) VALUES ($1)
		ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
		RETURNING id, created_at`
	var u User
	err := s.pool.QueryRow(ctx, q, id).Scan(&u.ID, &u.CreatedAt)
	if err != nil {
		return User{}, fmt.Errorf("upsert user: %w", err)
	}
	return u, nil
}

func (s *Store) ListChats(ctx context.Context, userID uuid.UUID) ([]Chat, error) {
	const q = `
		SELECT id, user_id, title, created_at, updated_at
		FROM chats
		WHERE user_id = $1
		ORDER BY updated_at DESC`
	rows, err := s.pool.Query(ctx, q, userID)
	if err != nil {
		return nil, fmt.Errorf("list chats: %w", err)
	}
	defer rows.Close()

	var chats []Chat
	for rows.Next() {
		var c Chat
		if err := rows.Scan(&c.ID, &c.UserID, &c.Title, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan chat: %w", err)
		}
		chats = append(chats, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate chats: %w", err)
	}
	if chats == nil {
		chats = []Chat{}
	}
	return chats, nil
}

func (s *Store) CreateChat(ctx context.Context, userID uuid.UUID, title string) (Chat, error) {
	if title == "" {
		title = "Новый чат"
	}
	const q = `
		INSERT INTO chats (user_id, title)
		VALUES ($1, $2)
		RETURNING id, user_id, title, created_at, updated_at`
	var c Chat
	err := s.pool.QueryRow(ctx, q, userID, title).Scan(
		&c.ID, &c.UserID, &c.Title, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return Chat{}, fmt.Errorf("create chat: %w", err)
	}
	return c, nil
}

func (s *Store) ChatForUser(ctx context.Context, chatID, userID uuid.UUID) (Chat, error) {
	const q = `
		SELECT id, user_id, title, created_at, updated_at
		FROM chats
		WHERE id = $1 AND user_id = $2`
	var c Chat
	err := s.pool.QueryRow(ctx, q, chatID, userID).Scan(
		&c.ID, &c.UserID, &c.Title, &c.CreatedAt, &c.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Chat{}, ErrNotFound
	}
	if err != nil {
		return Chat{}, fmt.Errorf("get chat: %w", err)
	}
	return c, nil
}

func (s *Store) ListMessages(ctx context.Context, chatID uuid.UUID) ([]Message, error) {
	const q = `
		SELECT id, chat_id, role, content, created_at
		FROM messages
		WHERE chat_id = $1
		ORDER BY created_at ASC`
	rows, err := s.pool.Query(ctx, q, chatID)
	if err != nil {
		return nil, fmt.Errorf("list messages: %w", err)
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.ChatID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan message: %w", err)
		}
		messages = append(messages, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate messages: %w", err)
	}
	if messages == nil {
		messages = []Message{}
	}
	return messages, nil
}

func (s *Store) InsertMessage(ctx context.Context, chatID uuid.UUID, role, content string) (Message, error) {
	const q = `
		INSERT INTO messages (chat_id, role, content)
		VALUES ($1, $2, $3)
		RETURNING id, chat_id, role, content, created_at`
	var m Message
	err := s.pool.QueryRow(ctx, q, chatID, role, content).Scan(
		&m.ID, &m.ChatID, &m.Role, &m.Content, &m.CreatedAt,
	)
	if err != nil {
		return Message{}, fmt.Errorf("insert message: %w", err)
	}
	return m, nil
}

func (s *Store) TouchChat(ctx context.Context, chatID uuid.UUID) error {
	const q = `UPDATE chats SET updated_at = now() WHERE id = $1`
	_, err := s.pool.Exec(ctx, q, chatID)
	if err != nil {
		return fmt.Errorf("touch chat: %w", err)
	}
	return nil
}
