package httpapi

import (
	"net/http"
)

func NewRouter(h *Handler) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", h.Health)
	mux.HandleFunc("/api/items", h.ListItems)
	mux.HandleFunc("/api/folders", h.CreateFolder)
	mux.HandleFunc("/api/upload", h.Upload)
	mux.HandleFunc("/api/item/rename", h.Rename)
	
	mux.HandleFunc("/api/item", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.GetItem(w, r)
		case http.MethodDelete:
			h.Delete(w, r)
		default:
			ErrorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})

	mux.HandleFunc("/api/trash", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.ListTrash(w, r)
		case http.MethodDelete:
			h.EmptyTrash(w, r)
		default:
			ErrorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})

	mux.HandleFunc("/api/trash/restore", h.RestoreTrash)
	mux.HandleFunc("/api/download", h.Download)
	mux.HandleFunc("/api/search", h.Search)

	return mux
}
