package db

import (
	"context"
	_ "embed"
	"fmt"
)

//go:embed migrations/001_init.sql
var migrationSQL string

func Migrate(ctx context.Context, d *DB) error {
	if _, err := d.Pool.Exec(ctx, migrationSQL); err != nil {
		return fmt.Errorf("run migration: %w", err)
	}
	return nil
}
