package config

import (
	"os"
	"strconv"
)

type Config struct {
	DriveRoot    string
	TrashDir     string
	Port         string
	MaxUploadMB  int
}

func LoadConfig() *Config {
	port := getEnv("DRIVE_PORT", "8085")
	driveRoot := getEnv("DRIVE_ROOT", "../dev-drive")
	trashDirName := getEnv("DRIVE_TRASH_DIR", ".trash")
	maxUploadStr := getEnv("DRIVE_MAX_UPLOAD_MB", "100")

	maxUpload, _ := strconv.Atoi(maxUploadStr)
	if maxUpload <= 0 {
		maxUpload = 100
	}

	return &Config{
		DriveRoot:   driveRoot,
		TrashDir:    trashDirName,
		Port:        port,
		MaxUploadMB: maxUpload,
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
