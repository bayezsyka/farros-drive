package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/bayezsyka/farros-drive/server/internal/auth"
	"github.com/bayezsyka/farros-drive/server/internal/config"
	"github.com/bayezsyka/farros-drive/server/internal/drive"
	"github.com/bayezsyka/farros-drive/server/internal/httpapi"
	"github.com/bayezsyka/farros-drive/server/internal/share"
)

func main() {
	cfg := config.LoadConfig()

	// Ensure drive root and trash exist
	absRoot, err := filepath.Abs(cfg.DriveRoot)
	if err != nil {
		log.Fatalf("failed to resolve drive root: %v", err)
	}

	trashPath := filepath.Join(absRoot, cfg.TrashDir)
	if err := os.MkdirAll(trashPath, 0o755); err != nil {
		log.Fatalf("failed to create trash directory: %v", err)
	}
	metaPath := filepath.Join(absRoot, cfg.MetaDir)
	if err := os.MkdirAll(metaPath, 0o755); err != nil {
		log.Fatalf("failed to create meta directory: %v", err)
	}

	log.Printf("Starting Farros Drive Server...")
	log.Printf("Drive Root: %s", absRoot)
	log.Printf("Trash Dir: %s", cfg.TrashDir)
	log.Printf("Meta Dir: %s", cfg.MetaDir)
	log.Printf("Port: %s", cfg.Port)
	log.Printf("Password Configured: %t", cfg.DrivePassword != "")

	svc := drive.NewService(absRoot, cfg.TrashDir, cfg.MetaDir)
	authManager := auth.NewManager(cfg.DrivePassword)
	shareService := share.NewService(svc, cfg.MetaDir)
	if err := shareService.EnsureStore(); err != nil {
		log.Fatalf("failed to initialize share store: %v", err)
	}

	handler := &httpapi.Handler{
		Service:     svc,
		Auth:        authManager,
		Shares:      shareService,
		MaxUploadMB: cfg.MaxUploadMB,
	}

	router := httpapi.NewRouter(handler)

	// Simple logger middleware
	loggingRouter := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s %s", r.RemoteAddr, r.Method, r.URL)
		router.ServeHTTP(w, r)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	if err := http.ListenAndServe(addr, loggingRouter); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
