package share

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/bayezsyka/farros-drive/server/internal/drive"
	"github.com/bayezsyka/farros-drive/server/internal/security"
)

var (
	ErrNotFound           = errors.New("share not found")
	ErrExpired            = errors.New("share expired")
	ErrRevoked            = errors.New("share revoked")
	ErrDownloadNotAllowed = errors.New("download is not allowed")
	ErrInvalidSharePath   = errors.New("invalid shared path")
)

type Share struct {
	ID            string     `json:"id"`
	Token         string     `json:"token"`
	Path          string     `json:"path"`
	Type          string     `json:"type"`
	Name          string     `json:"name"`
	Permission    string     `json:"permission"`
	AllowDownload bool       `json:"allowDownload"`
	CreatedAt     time.Time  `json:"createdAt"`
	ExpiresAt     *time.Time `json:"expiresAt"`
	RevokedAt     *time.Time `json:"revokedAt"`
}

type PublicItem struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	Extension  string    `json:"extension"`
	MimeType   string    `json:"mimeType"`
	Size       int64     `json:"size"`
	Path       string    `json:"path"`
	ParentPath string    `json:"parentPath"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type PublicView struct {
	Token         string       `json:"token"`
	Name          string       `json:"name"`
	Type          string       `json:"type"`
	AllowDownload bool         `json:"allowDownload"`
	CreatedAt     time.Time    `json:"createdAt"`
	ExpiresAt     *time.Time   `json:"expiresAt"`
	CurrentPath   string       `json:"currentPath"`
	Items         []PublicItem `json:"items,omitempty"`
	Item          *PublicItem  `json:"item,omitempty"`
}

type Service struct {
	Drive     *drive.Service
	MetaDir   string
	storePath string
	mu        sync.Mutex
}

func NewService(driveService *drive.Service, metaDir string) *Service {
	return &Service{
		Drive:     driveService,
		MetaDir:   metaDir,
		storePath: filepath.Join(driveService.Root, metaDir, "shares.json"),
	}
}

func (s *Service) EnsureStore() error {
	if err := os.MkdirAll(filepath.Dir(s.storePath), 0o755); err != nil {
		return err
	}

	if _, err := os.Stat(s.storePath); os.IsNotExist(err) {
		return os.WriteFile(s.storePath, []byte("[]\n"), 0o644)
	}

	return nil
}

func (s *Service) Create(path string, allowDownload bool, expiresAt *time.Time) (Share, error) {
	item, err := s.Drive.GetItem(path)
	if err != nil {
		return Share{}, err
	}

	now := time.Now().UTC()
	record := Share{
		ID:            randomHex(16),
		Token:         randomHex(32),
		Path:          item.Path,
		Type:          string(item.Type),
		Name:          item.Name,
		Permission:    "viewer",
		AllowDownload: allowDownload,
		CreatedAt:     now,
		ExpiresAt:     expiresAt,
		RevokedAt:     nil,
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	records, err := s.readAllLocked()
	if err != nil {
		return Share{}, err
	}

	records = append(records, record)
	if err := s.writeAllLocked(records); err != nil {
		return Share{}, err
	}

	return record, nil
}

func (s *Service) ListActive() ([]Share, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	records, err := s.readAllLocked()
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	active := make([]Share, 0, len(records))
	for _, record := range records {
		if record.RevokedAt != nil {
			continue
		}
		if record.ExpiresAt != nil && record.ExpiresAt.Before(now) {
			continue
		}
		active = append(active, record)
	}

	return active, nil
}

func (s *Service) Revoke(token string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	records, err := s.readAllLocked()
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	found := false
	for index := range records {
		if records[index].Token == token {
			records[index].RevokedAt = &now
			found = true
			break
		}
	}

	if !found {
		return ErrNotFound
	}

	return s.writeAllLocked(records)
}

func (s *Service) GetPublicView(token, relativePath string) (PublicView, error) {
	record, baseFullPath, baseItem, err := s.resolveToken(token)
	if err != nil {
		return PublicView{}, err
	}

	if record.Type == string(drive.TypeFile) {
		item := publicItemFromDrive(baseItem, "/")
		return PublicView{
			Token:         record.Token,
			Name:          record.Name,
			Type:          record.Type,
			AllowDownload: record.AllowDownload,
			CreatedAt:     record.CreatedAt,
			ExpiresAt:     record.ExpiresAt,
			CurrentPath:   "/",
			Item:          &item,
		}, nil
	}

	currentFullPath, currentRelativePath, err := resolveFolderTarget(baseFullPath, relativePath)
	if err != nil {
		return PublicView{}, err
	}

	info, err := os.Stat(currentFullPath)
	if err != nil {
		return PublicView{}, ErrNotFound
	}

	if !info.IsDir() {
		item := publicItemFromFileInfo(info, currentRelativePath)
		return PublicView{
			Token:         record.Token,
			Name:          record.Name,
			Type:          record.Type,
			AllowDownload: record.AllowDownload,
			CreatedAt:     record.CreatedAt,
			ExpiresAt:     record.ExpiresAt,
			CurrentPath:   security.ParentVirtualPath(currentRelativePath),
			Item:          &item,
		}, nil
	}

	entries, err := os.ReadDir(currentFullPath)
	if err != nil {
		return PublicView{}, err
	}

	items := make([]PublicItem, 0, len(entries))
	for _, entry := range entries {
		if security.IsHidden(entry.Name()) {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		itemPath := security.NormalizeVirtualPath(filepath.ToSlash(filepath.Join(currentRelativePath, entry.Name())))
		items = append(items, publicItemFromFileInfo(info, itemPath))
	}

	return PublicView{
		Token:         record.Token,
		Name:          record.Name,
		Type:          record.Type,
		AllowDownload: record.AllowDownload,
		CreatedAt:     record.CreatedAt,
		ExpiresAt:     record.ExpiresAt,
		CurrentPath:   currentRelativePath,
		Items:         items,
	}, nil
}

func (s *Service) ResolvePreviewTarget(token, relativePath string) (Share, string, error) {
	record, baseFullPath, _, err := s.resolveToken(token)
	if err != nil {
		return Share{}, "", err
	}

	if record.Type == string(drive.TypeFile) {
		return record, baseFullPath, nil
	}

	fullPath, _, err := resolveFolderTarget(baseFullPath, relativePath)
	if err != nil {
		return Share{}, "", err
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		return Share{}, "", ErrNotFound
	}
	if info.IsDir() {
		return Share{}, "", ErrInvalidSharePath
	}

	return record, fullPath, nil
}

func (s *Service) ResolveDownloadTarget(token, relativePath string) (Share, string, error) {
	record, fullPath, err := s.ResolvePreviewTarget(token, relativePath)
	if err != nil {
		return Share{}, "", err
	}
	if !record.AllowDownload {
		return Share{}, "", ErrDownloadNotAllowed
	}
	return record, fullPath, nil
}

func (s *Service) resolveToken(token string) (Share, string, drive.DriveItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	records, err := s.readAllLocked()
	if err != nil {
		return Share{}, "", drive.DriveItem{}, err
	}

	now := time.Now().UTC()
	for _, record := range records {
		if record.Token != token {
			continue
		}
		if record.RevokedAt != nil {
			return Share{}, "", drive.DriveItem{}, ErrRevoked
		}
		if record.ExpiresAt != nil && record.ExpiresAt.Before(now) {
			return Share{}, "", drive.DriveItem{}, ErrExpired
		}

		item, err := s.Drive.GetItem(record.Path)
		if err != nil {
			return Share{}, "", drive.DriveItem{}, ErrNotFound
		}
		fullPath, _, err := s.Drive.ResolvePath(record.Path, false)
		if err != nil {
			return Share{}, "", drive.DriveItem{}, err
		}
		return record, fullPath, item, nil
	}

	return Share{}, "", drive.DriveItem{}, ErrNotFound
}

func (s *Service) readAllLocked() ([]Share, error) {
	if err := s.EnsureStore(); err != nil {
		return nil, err
	}

	body, err := os.ReadFile(s.storePath)
	if err != nil {
		return nil, err
	}

	var records []Share
	if len(strings.TrimSpace(string(body))) == 0 {
		return []Share{}, nil
	}
	if err := json.Unmarshal(body, &records); err != nil {
		return nil, err
	}

	return records, nil
}

func (s *Service) writeAllLocked(records []Share) error {
	body, err := json.MarshalIndent(records, "", "  ")
	if err != nil {
		return err
	}
	body = append(body, '\n')
	return os.WriteFile(s.storePath, body, 0o644)
}

func resolveFolderTarget(baseFullPath, relativePath string) (string, string, error) {
	sanitized, err := security.SanitizePath(relativePath, false)
	if err != nil {
		return "", "", ErrInvalidSharePath
	}

	currentRelativePath := security.NormalizeVirtualPath(sanitized)
	fullPath := filepath.Clean(filepath.Join(baseFullPath, sanitized))
	baseClean := filepath.Clean(baseFullPath)

	if fullPath != baseClean && !strings.HasPrefix(fullPath, baseClean+string(os.PathSeparator)) {
		return "", "", ErrInvalidSharePath
	}

	return fullPath, currentRelativePath, nil
}

func publicItemFromDrive(item drive.DriveItem, relativePath string) PublicItem {
	return PublicItem{
		ID:         security.NormalizeVirtualPath(relativePath),
		Name:       item.Name,
		Type:       string(item.Type),
		Extension:  item.Extension,
		MimeType:   item.MimeType,
		Size:       item.Size,
		Path:       security.NormalizeVirtualPath(relativePath),
		ParentPath: security.ParentVirtualPath(relativePath),
		UpdatedAt:  item.UpdatedAt,
	}
}

func publicItemFromFileInfo(info os.FileInfo, relativePath string) PublicItem {
	item := drive.DriveItem{
		Name:      info.Name(),
		Type:      drive.TypeFile,
		Extension: strings.TrimPrefix(strings.ToLower(filepath.Ext(info.Name())), "."),
		Size:      info.Size(),
		UpdatedAt: info.ModTime(),
	}
	if info.IsDir() {
		item.Type = drive.TypeFolder
		item.Extension = ""
		item.Size = 0
		item.MimeType = "inode/directory"
	} else {
		item.MimeType = mimeFromExtension(info.Name())
	}

	return publicItemFromDrive(item, relativePath)
}

func mimeFromExtension(name string) string {
	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(name)), ".")
	switch ext {
	case "txt", "log", "env", "json", "md", "csv", "sql", "conf", "nginx", "yml", "yaml":
		return "text/plain; charset=utf-8"
	case "":
		return "application/octet-stream"
	default:
		if detected := mimeTypeByExtension("." + ext); detected != "" {
			return detected
		}
		return "application/octet-stream"
	}
}

func mimeTypeByExtension(ext string) string {
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	case ".pdf":
		return "application/pdf"
	case ".mp4":
		return "video/mp4"
	case ".webm":
		return "video/webm"
	case ".mov":
		return "video/quicktime"
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	case ".ogg":
		return "audio/ogg"
	default:
		return ""
	}
}

func randomHex(size int) string {
	buffer := make([]byte, size)
	if _, err := rand.Read(buffer); err != nil {
		panic(err)
	}
	return hex.EncodeToString(buffer)
}
