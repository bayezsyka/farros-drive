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
	clean := filepath.ToSlash(filepath.Clean("/" + strings.TrimSpace(userPath)))
	clean = strings.TrimPrefix(clean, "/")

	if clean == ".." || strings.HasPrefix(clean, "../") {
		return "", ErrPathTraversal
	}

	if clean == "." || clean == "" {
		return "", nil
	}

	parts := strings.Split(clean, "/")
	for _, part := range parts {
		if strings.HasPrefix(part, ".") {
			if part == "." || part == "" {
				continue
			}

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

func GetFullPath(rootDir, sanitizedPath string) string {
	return filepath.Join(rootDir, sanitizedPath)
}

func IsHidden(name string) bool {
	return strings.HasPrefix(name, ".")
}

func NormalizeVirtualPath(userPath string) string {
	clean := filepath.ToSlash(filepath.Clean("/" + strings.TrimSpace(userPath)))
	if clean == "." {
		return "/"
	}
	return clean
}

func ParentVirtualPath(userPath string) string {
	normalized := NormalizeVirtualPath(userPath)
	if normalized == "/" {
		return "/"
	}

	parent := filepath.ToSlash(filepath.Dir(normalized))
	if parent == "." {
		return "/"
	}

	if !strings.HasPrefix(parent, "/") {
		parent = "/" + parent
	}

	return parent
}
