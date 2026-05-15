package config

import (
	"os"
	"strconv"
)

type Config struct {
	DriveRoot     string
	TrashDir      string
	MetaDir       string
	Port          string
	MaxUploadMB   int
	DrivePassword string
}

func LoadConfig() *Config {
	port := getEnv("DRIVE_PORT", "8085")
	driveRoot := getEnv("DRIVE_ROOT", "../dev-drive")
	trashDirName := getEnv("DRIVE_TRASH_DIR", ".trash")
	metaDirName := getEnv("DRIVE_META_DIR", ".farros-drive")
	maxUploadStr := getEnv("DRIVE_MAX_UPLOAD_MB", "100")
	drivePassword := os.Getenv("FARROS_DRIVE_PASSWORD")

	maxUpload, _ := strconv.Atoi(maxUploadStr)
	if maxUpload <= 0 {
		maxUpload = 100
	}

	return &Config{
		DriveRoot:     driveRoot,
		TrashDir:      trashDirName,
		MetaDir:       metaDirName,
		Port:          port,
		MaxUploadMB:   maxUpload,
		DrivePassword: drivePassword,
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
