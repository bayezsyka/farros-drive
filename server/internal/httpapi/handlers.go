package httpapi

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/bayezsyka/farros-drive/server/internal/drive"
	"github.com/bayezsyka/farros-drive/server/internal/security"
)

type Handler struct {
	Service     *drive.Service
	MaxUploadMB int
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	JSONResponse(w, http.StatusOK, map[string]string{
		"status":      "ok",
		"app":         "Farros Drive",
		"version":     "phase-2",
		"storageRoot": h.Service.Root,
	})
}

func (h *Handler) ListItems(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	items, err := h.Service.ListItems(path, false)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSONResponse(w, http.StatusOK, map[string]interface{}{"items": items})
}

func (h *Handler) GetItem(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	sanitized, err := security.SanitizePath(path, false)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	fullPath := security.GetFullPath(h.Service.Root, sanitized)
	info, err := os.Stat(fullPath)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "item not found")
		return
	}

	JSONResponse(w, http.StatusOK, drive.DriveItem{
		Name:      info.Name(),
		Type:      getDriveType(info),
		Size:      info.Size(),
		Path:      filepath.ToSlash(sanitized),
		UpdatedAt: info.ModTime(),
	})
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

	if payload.Name == "" {
		ErrorResponse(w, http.StatusBadRequest, "name is required")
		return
	}

	err := h.Service.CreateFolder(payload.Path, payload.Name)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Frontend expects the created item back
	sanitizedPath := filepath.ToSlash(filepath.Join(payload.Path, payload.Name))
	fullPath := security.GetFullPath(h.Service.Root, sanitizedPath)
	info, _ := os.Stat(fullPath)

	JSONResponse(w, http.StatusCreated, drive.DriveItem{
		Name:      payload.Name,
		Type:      drive.TypeFolder,
		Path:      sanitizedPath,
		UpdatedAt: info.ModTime(),
	})
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

	var createdItems []drive.DriveItem
	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}
		defer file.Close()

		finalName, err := h.Service.SaveFile(parent, fileHeader.Filename, file)
		if err != nil {
			continue
		}

		createdItems = append(createdItems, drive.DriveItem{
			Name: finalName,
			Type: drive.TypeFile,
			Path: filepath.ToSlash(filepath.Join(parent, finalName)),
		})
	}

	JSONResponse(w, http.StatusCreated, map[string]interface{}{"items": createdItems})
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

	err := h.Service.Rename(payload.Path, payload.NewName)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, "item renamed")
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Path string `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		// Fallback to query param for safety
		payload.Path = r.URL.Query().Get("path")
	}

	if payload.Path == "" {
		ErrorResponse(w, http.StatusBadRequest, "path is required")
		return
	}

	err := h.Service.MoveToTrash(payload.Path)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, "item moved to trash")
}

func (h *Handler) ListTrash(w http.ResponseWriter, r *http.Request) {
	items, err := h.Service.ListItems(h.Service.TrashDir, true)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSONResponse(w, http.StatusOK, map[string]interface{}{"items": items})
}

func (h *Handler) RestoreTrash(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		TrashPath string `json:"trashPath"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	// trashPath is like /.trash/12345_file.txt
	id := filepath.Base(payload.TrashPath)
	err := h.Service.RestoreFromTrash(id)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, "item restored")
}

func (h *Handler) EmptyTrash(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		TrashPath string `json:"trashPath"`
	}
	json.NewDecoder(r.Body).Decode(&payload)

	if payload.TrashPath == "" {
		// If no path, we could empty all, but requirement seems to expect specific delete
		ErrorResponse(w, http.StatusBadRequest, "trashPath is required")
		return
	}

	id := filepath.Base(payload.TrashPath)
	err := h.Service.DeletePermanently(id)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, "deleted permanently")
}

func (h *Handler) Download(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	sanitized, err := security.SanitizePath(path, false)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	fullPath := security.GetFullPath(h.Service.Root, sanitized)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filepath.Base(fullPath)))
	http.ServeFile(w, r, fullPath)
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	items, err := h.Service.Search(query)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSONResponse(w, http.StatusOK, items)
}

func getDriveType(info os.FileInfo) drive.ItemType {
	if info.IsDir() {
		return drive.TypeFolder
	}
	return drive.TypeFile
}
