package drive

import (
	"encoding/base64"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/bayezsyka/farros-drive/server/internal/security"
)

type Service struct {
	Root     string
	TrashDir string
	MetaDir  string
}

func NewService(root, trashDir, metaDir string) *Service {
	return &Service{
		Root:     root,
		TrashDir: trashDir,
		MetaDir:  metaDir,
	}
}

func (s *Service) ListItems(userPath string, isTrash bool) ([]DriveItem, error) {
	if isTrash {
		return s.listTrashItems()
	}

	fullPath, virtualPath, err := s.ResolvePath(userPath, false)
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	items := make([]DriveItem, 0, len(entries))
	for _, entry := range entries {
		if s.shouldSkipEntry(entry.Name(), false) {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		itemPath := security.NormalizeVirtualPath(filepath.ToSlash(filepath.Join(virtualPath, entry.Name())))
		items = append(items, buildDriveItem(itemPath, info))
	}

	return items, nil
}

func (s *Service) GetItem(userPath string) (DriveItem, error) {
	fullPath, virtualPath, err := s.ResolvePath(userPath, false)
	if err != nil {
		return DriveItem{}, err
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		return DriveItem{}, err
	}

	return buildDriveItem(virtualPath, info), nil
}

func (s *Service) CreateFolder(parentPath, name string) (DriveItem, error) {
	sanitizedParent, err := security.SanitizePath(parentPath, false)
	if err != nil {
		return DriveItem{}, err
	}

	if !isValidName(name) {
		return DriveItem{}, fmt.Errorf("invalid folder name")
	}

	fullPath := filepath.Join(s.Root, sanitizedParent, name)
	if err := os.MkdirAll(fullPath, 0o755); err != nil {
		return DriveItem{}, err
	}

	return s.GetItem(filepath.ToSlash(filepath.Join(parentPath, name)))
}

func (s *Service) SaveFile(parentPath, name string, content io.Reader) (DriveItem, error) {
	sanitizedParent, err := security.SanitizePath(parentPath, false)
	if err != nil {
		return DriveItem{}, err
	}

	if !isValidName(name) {
		return DriveItem{}, fmt.Errorf("invalid file name")
	}

	dirPath := security.GetFullPath(s.Root, sanitizedParent)
	if err := os.MkdirAll(dirPath, 0o755); err != nil {
		return DriveItem{}, err
	}

	finalName := nextAvailableName(dirPath, name)
	targetPath := filepath.Join(dirPath, finalName)

	f, err := os.Create(targetPath)
	if err != nil {
		return DriveItem{}, err
	}
	defer f.Close()

	if _, err := io.Copy(f, content); err != nil {
		return DriveItem{}, err
	}

	return s.GetItem(filepath.ToSlash(filepath.Join(parentPath, finalName)))
}

func (s *Service) Rename(userPath, newName string) (DriveItem, error) {
	sanitized, err := security.SanitizePath(userPath, false)
	if err != nil {
		return DriveItem{}, err
	}

	if !isValidName(newName) {
		return DriveItem{}, fmt.Errorf("invalid name")
	}

	oldFullPath := security.GetFullPath(s.Root, sanitized)
	newFullPath := filepath.Join(filepath.Dir(oldFullPath), newName)
	if err := os.Rename(oldFullPath, newFullPath); err != nil {
		return DriveItem{}, err
	}

	return s.GetItem(filepath.ToSlash(filepath.Join(filepath.Dir(userPath), newName)))
}

func (s *Service) MoveToTrash(userPath string) error {
	sanitized, err := security.SanitizePath(userPath, false)
	if err != nil {
		return err
	}

	fullPath := security.GetFullPath(s.Root, sanitized)
	trashPath := filepath.Join(s.Root, s.TrashDir)
	if err := os.MkdirAll(trashPath, 0o755); err != nil {
		return err
	}

	targetName := encodeTrashID(sanitized)
	targetPath := filepath.Join(trashPath, targetName)

	return os.Rename(fullPath, targetPath)
}

func (s *Service) RestoreFromTrash(trashID, restorePath string) error {
	trashPath := filepath.Join(s.Root, s.TrashDir, trashID)

	if restorePath == "" {
		restorePath = "/" + decodeTrashOriginalPath(trashID)
	}

	sanitizedRestore, err := security.SanitizePath(restorePath, false)
	if err != nil {
		return err
	}

	targetPath := security.GetFullPath(s.Root, sanitizedRestore)
	if err := os.MkdirAll(filepath.Dir(targetPath), 0o755); err != nil {
		return err
	}

	if _, err := os.Stat(targetPath); err == nil {
		targetPath = filepath.Join(filepath.Dir(targetPath), nextAvailableName(filepath.Dir(targetPath), filepath.Base(targetPath)))
	}

	return os.Rename(trashPath, targetPath)
}

func (s *Service) DeletePermanently(trashID string) error {
	trashPath := filepath.Join(s.Root, s.TrashDir, trashID)
	return os.RemoveAll(trashPath)
}

func (s *Service) Search(query string) ([]DriveItem, error) {
	items := make([]DriveItem, 0)
	query = strings.ToLower(strings.TrimSpace(query))

	err := filepath.Walk(s.Root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		if path == s.Root {
			return nil
		}

		rel, relErr := filepath.Rel(s.Root, path)
		if relErr != nil {
			return nil
		}

		rel = filepath.ToSlash(rel)
		parts := strings.Split(rel, "/")
		for _, part := range parts {
			if strings.HasPrefix(part, ".") {
				if info.IsDir() {
					return filepath.SkipDir
				}
				return nil
			}
		}

		if query == "" || strings.Contains(strings.ToLower(info.Name()), query) {
			items = append(items, buildDriveItem("/"+rel, info))
		}

		return nil
	})

	return items, err
}

func (s *Service) ResolvePath(userPath string, allowTrash bool) (string, string, error) {
	sanitized, err := security.SanitizePath(userPath, allowTrash)
	if err != nil {
		return "", "", err
	}

	virtualPath := security.NormalizeVirtualPath(sanitized)
	return security.GetFullPath(s.Root, sanitized), virtualPath, nil
}

func (s *Service) shouldSkipEntry(name string, allowTrash bool) bool {
	if !security.IsHidden(name) {
		return false
	}

	if allowTrash && name == s.TrashDir {
		return false
	}

	return true
}

func (s *Service) listTrashItems() ([]DriveItem, error) {
	fullPath := filepath.Join(s.Root, s.TrashDir)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return []DriveItem{}, nil
		}
		return nil, err
	}

	items := make([]DriveItem, 0, len(entries))
	for _, entry := range entries {
		if security.IsHidden(entry.Name()) {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		trashPath := security.NormalizeVirtualPath(filepath.ToSlash(filepath.Join("/", s.TrashDir, entry.Name())))
		originalPath := security.NormalizeVirtualPath("/" + decodeTrashOriginalPath(entry.Name()))
		item := buildDriveItem(originalPath, info)
		item.Name = filepath.Base(originalPath)
		item.ID = trashPath
		item.TrashPath = trashPath
		item.OriginalPath = originalPath
		item.DeletedAt = pointerToTime(info.ModTime())
		items = append(items, item)
	}

	return items, nil
}

func buildDriveItem(virtualPath string, info os.FileInfo) DriveItem {
	normalizedPath := security.NormalizeVirtualPath(virtualPath)
	itemType := TypeFile
	extension := ""
	mimeType := "application/octet-stream"
	size := info.Size()

	if info.IsDir() {
		itemType = TypeFolder
		mimeType = "inode/directory"
		size = 0
	} else {
		extension = strings.TrimPrefix(strings.ToLower(filepath.Ext(info.Name())), ".")
		if detected := mime.TypeByExtension(filepath.Ext(info.Name())); detected != "" {
			mimeType = detected
		}
	}

	return DriveItem{
		ID:         normalizedPath,
		Name:       info.Name(),
		Type:       itemType,
		Extension:  extension,
		MimeType:   mimeType,
		Size:       size,
		Path:       normalizedPath,
		ParentPath: security.ParentVirtualPath(normalizedPath),
		UpdatedAt:  info.ModTime(),
	}
}

func isValidName(name string) bool {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return false
	}

	if strings.ContainsAny(trimmed, `\/:*?"<>|`) || strings.HasPrefix(trimmed, ".") {
		return false
	}

	return true
}

func nextAvailableName(dirPath, desiredName string) string {
	ext := filepath.Ext(desiredName)
	base := strings.TrimSuffix(desiredName, ext)
	finalName := desiredName
	counter := 1

	for {
		targetPath := filepath.Join(dirPath, finalName)
		if _, err := os.Stat(targetPath); os.IsNotExist(err) {
			return finalName
		}

		finalName = fmt.Sprintf("%s (%d)%s", base, counter, ext)
		counter++
	}
}

func encodeTrashID(relativePath string) string {
	encodedPath := base64.RawURLEncoding.EncodeToString([]byte(relativePath))
	return fmt.Sprintf("%d__%s", time.Now().UnixNano(), encodedPath)
}

func decodeTrashOriginalPath(name string) string {
	parts := strings.SplitN(name, "__", 2)
	if len(parts) == 2 {
		decodedPath, err := base64.RawURLEncoding.DecodeString(parts[1])
		if err == nil && len(decodedPath) > 0 {
			return filepath.ToSlash(string(decodedPath))
		}
	}

	legacyParts := strings.SplitN(name, "_", 2)
	if len(legacyParts) == 2 {
		return legacyParts[1]
	}

	return name
}

func pointerToTime(value time.Time) *time.Time {
	return &value
}
