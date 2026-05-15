package security

import (
	"errors"
	"path/filepath"
	"strings"
)

var (
	ErrInvalidPath   = errors.New("invalid path")
	ErrPathTraversal = errors.New("path traversal detected")
	ErrHiddenAccess  = errors.New("access to hidden items denied")
)

// SanitizePath validates and cleans a user-provided path.
// It ensures the path is relative and does not escape the drive root.
func SanitizePath(userPath string, allowTrash bool) (string, error) {
	// Clean the path
	clean := filepath.ToSlash(filepath.Clean(userPath))

	// Disallow absolute paths
	if filepath.IsAbs(clean) || strings.HasPrefix(clean, "/") {
		// Strip leading slash for processing
		clean = strings.TrimPrefix(clean, "/")
	}

	// Disallow path traversal
	if strings.HasPrefix(clean, "..") {
		return "", ErrPathTraversal
	}

	// Handle empty/root path
	if clean == "." || clean == "" {
		return "", nil
	}

	// Check for hidden files (starting with .)
	// Special case: .trash is allowed if allowTrash is true
	parts := strings.Split(clean, "/")
	for _, part := range parts {
		if strings.HasPrefix(part, ".") {
			if part == ".trash" {
				if !allowTrash {
					return "", ErrHiddenAccess
				}
			} else {
				return "", ErrHiddenAccess
			}
		}
	}

	return clean, nil
}

// GetFullPath returns the absolute filesystem path for a sanitized user path.
func GetFullPath(rootDir, sanitizedPath string) string {
	return filepath.Join(rootDir, sanitizedPath)
}
