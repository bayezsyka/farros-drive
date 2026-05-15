package preview

import (
	"errors"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const MaxTextPreviewBytes int64 = 2 * 1024 * 1024

var (
	imageExtensions = map[string]bool{"jpg": true, "jpeg": true, "png": true, "webp": true, "gif": true, "svg": true}
	videoExtensions = map[string]bool{"mp4": true, "webm": true, "mov": true}
	audioExtensions = map[string]bool{"mp3": true, "wav": true, "ogg": true}
	textExtensions  = map[string]bool{
		"txt": true, "log": true, "env": true, "json": true, "md": true, "csv": true,
		"sql": true, "conf": true, "nginx": true, "yml": true, "yaml": true,
	}
)

func DetectMimeType(path string) string {
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(path), "."))
	if ext == "" {
		return "application/octet-stream"
	}

	if ext == "nginx" {
		return "text/plain; charset=utf-8"
	}

	if contentType := mime.TypeByExtension("." + ext); contentType != "" {
		return contentType
	}

	if textExtensions[ext] {
		return "text/plain; charset=utf-8"
	}

	return "application/octet-stream"
}

func DetectKind(path string) string {
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(path), "."))
	switch {
	case imageExtensions[ext]:
		return "image"
	case ext == "pdf":
		return "pdf"
	case videoExtensions[ext]:
		return "video"
	case audioExtensions[ext]:
		return "audio"
	case textExtensions[ext]:
		return "text"
	default:
		return "other"
	}
}

func ServeInline(w http.ResponseWriter, r *http.Request, fullPath string) error {
	info, err := os.Stat(fullPath)
	if err != nil {
		return err
	}

	if info.IsDir() {
		return errors.New("folders cannot be previewed")
	}

	contentType := DetectMimeType(fullPath)
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", inlineDisposition(filepath.Base(fullPath)))

	if DetectKind(fullPath) == "text" {
		file, err := os.Open(fullPath)
		if err != nil {
			return err
		}
		defer file.Close()

		limit := info.Size()
		if limit > MaxTextPreviewBytes {
			limit = MaxTextPreviewBytes
			w.Header().Set("X-Preview-Truncated", "true")
		}

		w.Header().Set("Content-Length", int64ToString(limit))
		_, err = io.CopyN(w, file, limit)
		if err != nil && !errors.Is(err, io.EOF) {
			return err
		}
		return nil
	}

	http.ServeFile(w, r, fullPath)
	return nil
}

func inlineDisposition(name string) string {
	return `inline; filename="` + strings.ReplaceAll(name, `"`, "") + `"`
}

func int64ToString(value int64) string {
	return strconv.FormatInt(value, 10)
}
