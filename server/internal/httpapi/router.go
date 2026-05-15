package httpapi

import "net/http"

func NewRouter(h *Handler) http.Handler {
	mux := http.NewServeMux()
	private := func(handler http.HandlerFunc) http.HandlerFunc {
		return h.Auth.Require(handler, func(w http.ResponseWriter, r *http.Request) {
			ErrorResponse(w, http.StatusUnauthorized, "authentication required")
		})
	}

	mux.HandleFunc("/api/health", h.Health)
	mux.HandleFunc("/api/auth/login", h.Login)
	mux.HandleFunc("/api/auth/me", h.Me)
	mux.HandleFunc("/api/auth/logout", h.Logout)
	mux.HandleFunc("/api/public/share/", h.PublicShare)
	mux.HandleFunc("/api/public/download/", h.PublicDownload)
	mux.HandleFunc("/api/public/preview/", h.PublicPreview)

	mux.HandleFunc("/api/items", private(h.ListItems))
	mux.HandleFunc("/api/folders", private(h.CreateFolder))
	mux.HandleFunc("/api/upload", private(h.Upload))
	mux.HandleFunc("/api/item/rename", private(h.Rename))
	mux.HandleFunc("/api/trash/restore", private(h.RestoreTrash))
	mux.HandleFunc("/api/download", private(h.Download))
	mux.HandleFunc("/api/preview", private(h.Preview))
	mux.HandleFunc("/api/search", private(h.Search))
	mux.HandleFunc("/api/storage", private(h.Storage))
	mux.HandleFunc("/api/share", private(methodMux(
		map[string]http.HandlerFunc{
			http.MethodPost:   h.CreateShare,
			http.MethodDelete: h.DeleteShare,
		},
	)))
	mux.HandleFunc("/api/shares", private(h.ListShares))

	mux.HandleFunc("/api/item", private(methodMux(
		map[string]http.HandlerFunc{
			http.MethodGet:    h.GetItem,
			http.MethodDelete: h.Delete,
		},
	)))
	mux.HandleFunc("/api/trash", private(methodMux(
		map[string]http.HandlerFunc{
			http.MethodGet:    h.ListTrash,
			http.MethodDelete: h.EmptyTrash,
		},
	)))

	return mux
}

func methodMux(handlers map[string]http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handler, ok := handlers[r.Method]
		if !ok {
			ErrorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		handler(w, r)
	}
}
