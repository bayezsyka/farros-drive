package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/bayezsyka/farros-drive/server/internal/auth"
	"github.com/bayezsyka/farros-drive/server/internal/drive"
	"github.com/bayezsyka/farros-drive/server/internal/preview"
	"github.com/bayezsyka/farros-drive/server/internal/security"
	"github.com/bayezsyka/farros-drive/server/internal/share"
	"github.com/bayezsyka/farros-drive/server/internal/storage"
)

type Handler struct {
	Service     *drive.Service
	Auth        *auth.Manager
	Shares      *share.Service
	MaxUploadMB int
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	JSONResponse(w, http.StatusOK, map[string]any{
		"status":             "ok",
		"app":                "Farros Drive",
		"version":            "phase-3",
		"storageRoot":        h.Service.Root,
		"passwordConfigured": h.Auth.Configured(),
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var payload struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	if err := h.Auth.Login(w, r, payload.Password); err != nil {
		status := http.StatusUnauthorized
		if !h.Auth.Configured() {
			status = http.StatusServiceUnavailable
		}
		ErrorResponse(w, status, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, map[string]bool{"authenticated": true})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		ErrorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	authenticated := h.Auth.AuthenticateRequest(r)
	if !h.Auth.Configured() {
		authenticated = true
	}

	JSONResponse(w, http.StatusOK, map[string]any{
		"authenticated":      authenticated,
		"passwordConfigured": h.Auth.Configured(),
	})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	h.Auth.Logout(w, r)
	JSONResponse(w, http.StatusOK, map[string]bool{"authenticated": false})
}

func (h *Handler) ListItems(w http.ResponseWriter, r *http.Request) {
	items, err := h.Service.ListItems(r.URL.Query().Get("path"), false)
	if err != nil {
		h.writeDriveError(w, err)
		return
	}
	JSONResponse(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) GetItem(w http.ResponseWriter, r *http.Request) {
	item, err := h.Service.GetItem(r.URL.Query().Get("path"))
	if err != nil {
		h.writeDriveError(w, err)
		return
	}
	JSONResponse(w, http.StatusOK, item)
}

func (h *Handler) CreateFolder(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Path string `json:"path"`
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	item, err := h.Service.CreateFolder(payload.Path, payload.Name)
	if err != nil {
		h.writeDriveError(w, err)
		return
	}

	JSONResponse(w, http.StatusCreated, item)
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(int64(h.MaxUploadMB) << 20); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "failed to parse multipart form")
		return
	}

	parent := r.FormValue("path")
	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		ErrorResponse(w, http.StatusBadRequest, "no files uploaded")
		return
	}

	createdItems := make([]drive.DriveItem, 0, len(files))
	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}

		item, err := h.Service.SaveFile(parent, fileHeader.Filename, file)
		file.Close()
		if err != nil {
			continue
		}

		createdItems = append(createdItems, item)
	}

	JSONResponse(w, http.StatusCreated, map[string]any{"items": createdItems})
}

func (h *Handler) Rename(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Path    string `json:"path"`
		NewName string `json:"newName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	item, err := h.Service.Rename(payload.Path, payload.NewName)
	if err != nil {
		h.writeDriveError(w, err)
		return
	}

	JSONResponse(w, http.StatusOK, item)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Path string `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		payload.Path = r.URL.Query().Get("path")
	}

	if payload.Path == "" {
		ErrorResponse(w, http.StatusBadRequest, "path is required")
		return
	}

	if err := h.Service.MoveToTrash(payload.Path); err != nil {
		h.writeDriveError(w, err)
		return
	}

	JSONResponse(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *Handler) ListTrash(w http.ResponseWriter, r *http.Request) {
	items, err := h.Service.ListItems(h.Service.TrashDir, true)
	if err != nil {
		h.writeDriveError(w, err)
		return
	}
	JSONResponse(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) RestoreTrash(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		TrashPath   string `json:"trashPath"`
		RestorePath string `json:"restorePath"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	if err := h.Service.RestoreFromTrash(filepath.Base(payload.TrashPath), payload.RestorePath); err != nil {
		h.writeDriveError(w, err)
		return
	}

	JSONResponse(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *Handler) EmptyTrash(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		TrashPath string `json:"trashPath"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	if payload.TrashPath == "" {
		ErrorResponse(w, http.StatusBadRequest, "trashPath is required")
		return
	}

	if err := h.Service.DeletePermanently(filepath.Base(payload.TrashPath)); err != nil {
		h.writeDriveError(w, err)
		return
	}

	JSONResponse(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *Handler) Download(w http.ResponseWriter, r *http.Request) {
	fullPath, _, err := h.Service.ResolvePath(r.URL.Query().Get("path"), false)
	if err != nil {
		h.writeDriveError(w, err)
		return
	}

	info, err := os.Stat(fullPath)
	if err != nil || info.IsDir() {
		ErrorResponse(w, http.StatusNotFound, "item not found")
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", strings.ReplaceAll(info.Name(), `"`, "")))
	http.ServeFile(w, r, fullPath)
}

func (h *Handler) Preview(w http.ResponseWriter, r *http.Request) {
	fullPath, _, err := h.Service.ResolvePath(r.URL.Query().Get("path"), false)
	if err != nil {
		h.writeDriveError(w, err)
		return
	}

	if err := preview.ServeInline(w, r, fullPath); err != nil {
		h.writeDriveError(w, err)
	}
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	items, err := h.Service.Search(r.URL.Query().Get("q"))
	if err != nil {
		h.writeDriveError(w, err)
		return
	}

	JSONResponse(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) Storage(w http.ResponseWriter, r *http.Request) {
	summary, err := storage.GetSummary(h.Service.Root, h.Service.TrashDir, h.Service.MetaDir)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, summary)
}

func (h *Handler) CreateShare(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Path          string     `json:"path"`
		AllowDownload bool       `json:"allowDownload"`
		ExpiresAt     *time.Time `json:"expiresAt"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	record, err := h.Shares.Create(payload.Path, payload.AllowDownload, payload.ExpiresAt)
	if err != nil {
		h.writeDriveError(w, err)
		return
	}

	JSONResponse(w, http.StatusCreated, map[string]any{
		"token": record.Token,
		"url":   buildShareURL(r, record.Token),
	})
}

func (h *Handler) ListShares(w http.ResponseWriter, r *http.Request) {
	records, err := h.Shares.ListActive()
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	items := make([]map[string]any, 0, len(records))
	for _, record := range records {
		items = append(items, map[string]any{
			"id":            record.ID,
			"token":         record.Token,
			"path":          record.Path,
			"type":          record.Type,
			"name":          record.Name,
			"permission":    record.Permission,
			"allowDownload": record.AllowDownload,
			"createdAt":     record.CreatedAt,
			"expiresAt":     record.ExpiresAt,
			"url":           buildShareURL(r, record.Token),
		})
	}

	JSONResponse(w, http.StatusOK, map[string]any{"shares": items})
}

func (h *Handler) DeleteShare(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	if err := h.Shares.Revoke(payload.Token); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, share.ErrNotFound) {
			status = http.StatusNotFound
		}
		ErrorResponse(w, status, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *Handler) PublicShare(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimPrefix(r.URL.Path, "/api/public/share/")
	view, err := h.Shares.GetPublicView(token, r.URL.Query().Get("path"))
	if err != nil {
		h.writeShareError(w, err)
		return
	}

	JSONResponse(w, http.StatusOK, view)
}

func (h *Handler) PublicPreview(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimPrefix(r.URL.Path, "/api/public/preview/")
	_, fullPath, err := h.Shares.ResolvePreviewTarget(token, r.URL.Query().Get("path"))
	if err != nil {
		h.writeShareError(w, err)
		return
	}

	if err := preview.ServeInline(w, r, fullPath); err != nil {
		h.writeShareError(w, err)
	}
}

func (h *Handler) PublicDownload(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimPrefix(r.URL.Path, "/api/public/download/")
	record, fullPath, err := h.Shares.ResolveDownloadTarget(token, r.URL.Query().Get("path"))
	if err != nil {
		h.writeShareError(w, err)
		return
	}

	name := record.Name
	if record.Type == string(drive.TypeFolder) {
		name = filepath.Base(fullPath)
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", strings.ReplaceAll(name, `"`, "")))
	http.ServeFile(w, r, fullPath)
}

func (h *Handler) writeDriveError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, security.ErrHiddenAccess), errors.Is(err, security.ErrInvalidPath), errors.Is(err, security.ErrPathTraversal):
		ErrorResponse(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, os.ErrNotExist):
		ErrorResponse(w, http.StatusNotFound, "item not found")
	default:
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
	}
}

func (h *Handler) writeShareError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, share.ErrNotFound), errors.Is(err, os.ErrNotExist), errors.Is(err, share.ErrRevoked):
		ErrorResponse(w, http.StatusNotFound, "share not found")
	case errors.Is(err, share.ErrExpired):
		ErrorResponse(w, http.StatusGone, "Tautan kedaluwarsa")
	case errors.Is(err, share.ErrDownloadNotAllowed):
		ErrorResponse(w, http.StatusForbidden, err.Error())
	case errors.Is(err, share.ErrInvalidSharePath):
		ErrorResponse(w, http.StatusBadRequest, err.Error())
	default:
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
	}
}

func buildShareURL(r *http.Request, token string) string {
	scheme := "http"
	if r.TLS != nil || strings.EqualFold(strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-Proto"), ",")[0]), "https") {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s/s/%s", scheme, r.Host, token)
}
