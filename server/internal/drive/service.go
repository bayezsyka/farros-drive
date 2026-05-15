package drive

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/bayezsyka/farros-drive/server/internal/security"
)

type Service struct {
	Root     string
	TrashDir string
}

func NewService(root, trashDir string) *Service {
	return &Service{
		Root:     root,
		TrashDir: trashDir,
	}
}

func (s *Service) ListItems(userPath string, isTrash bool) ([]DriveItem, error) {
	sanitized, err := security.SanitizePath(userPath, isTrash)
	if err != nil {
		return nil, err
	}

	fullPath := security.GetFullPath(s.Root, sanitized)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	items := make([]DriveItem, 0)
	for _, entry := range entries {
		if security.IsHidden(entry.Name()) && (!isTrash || entry.Name() != s.TrashDir) {
			// Skip hidden files unless it's specifically the trash directory itself during non-trash listing
			// Actually, if we are in root and see .trash, we skip it.
			if entry.Name() == s.TrashDir {
				continue
			}
			// General hidden files are skipped
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		itemType := TypeFile
		if entry.IsDir() {
			itemType = TypeFolder
		}

		items = append(items, DriveItem{
			ID:        entry.Name(), // Use name as ID for now
			Name:      entry.Name(),
			Type:      itemType,
			Size:      info.Size(),
			Path:      filepath.ToSlash(filepath.Join(userPath, entry.Name())),
			UpdatedAt: info.ModTime(),
		})
	}

	return items, nil
}

func (s *Service) CreateFolder(parentPath, name string) error {
	sanitizedParent, err := security.SanitizePath(parentPath, false)
	if err != nil {
		return err
	}

	// Validate folder name
	if strings.ContainsAny(name, `\/:*?"<>|`) || strings.HasPrefix(name, ".") {
		return fmt.Errorf("invalid folder name")
	}

	fullPath := filepath.Join(s.Root, sanitizedParent, name)
	return os.MkdirAll(fullPath, 0755)
}

func (s *Service) SaveFile(parentPath, name string, content io.Reader) (string, error) {
	sanitizedParent, err := security.SanitizePath(parentPath, false)
	if err != nil {
		return "", err
	}

	dirPath := security.GetFullPath(s.Root, sanitizedParent)

	// Handle suffix for non-overwrite
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	finalName := name
	counter := 1

	for {
		targetPath := filepath.Join(dirPath, finalName)
		if _, err := os.Stat(targetPath); os.IsNotExist(err) {
			break
		}
		finalName = fmt.Sprintf("%s (%d)%s", base, counter, ext)
		counter++
	}

	f, err := os.Create(filepath.Join(dirPath, finalName))
	if err != nil {
		return "", err
	}
	defer f.Close()

	_, err = io.Copy(f, content)
	return finalName, err
}

func (s *Service) Rename(userPath, newName string) error {
	sanitized, err := security.SanitizePath(userPath, false)
	if err != nil {
		return err
	}

	if strings.ContainsAny(newName, `\/:*?"<>|`) || strings.HasPrefix(newName, ".") {
		return fmt.Errorf("invalid name")
	}

	oldFullPath := security.GetFullPath(s.Root, sanitized)
	newFullPath := filepath.Join(filepath.Dir(oldFullPath), newName)

	return os.Rename(oldFullPath, newFullPath)
}

func (s *Service) MoveToTrash(userPath string) error {
	sanitized, err := security.SanitizePath(userPath, false)
	if err != nil {
		return err
	}

	fullPath := security.GetFullPath(s.Root, sanitized)
	trashPath := filepath.Join(s.Root, s.TrashDir)

	// Ensure trash dir exists
	os.MkdirAll(trashPath, 0755)

	// In trash, we use timestamp prefix to avoid collisions
	name := filepath.Base(fullPath)
	targetName := fmt.Sprintf("%d_%s", time.Now().Unix(), name)
	targetPath := filepath.Join(trashPath, targetName)

	return os.Rename(fullPath, targetPath)
}

func (s *Service) RestoreFromTrash(trashID, restorePath string) error {
	trashPath := filepath.Join(s.Root, s.TrashDir, trashID)

	if restorePath == "" {
		parts := strings.SplitN(trashID, "_", 2)
		if len(parts) < 2 {
			return fmt.Errorf("invalid trash ID")
		}
		restorePath = "/" + parts[1]
	}

	sanitizedRestore, err := security.SanitizePath(restorePath, false)
	if err != nil {
		return err
	}

	targetPath := security.GetFullPath(s.Root, sanitizedRestore)
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return err
	}

	if _, err := os.Stat(targetPath); err == nil {
		ext := filepath.Ext(targetPath)
		base := strings.TrimSuffix(targetPath, ext)
		counter := 1
		for {
			candidate := fmt.Sprintf("%s_restored_%d%s", base, counter, ext)
			if _, err := os.Stat(candidate); os.IsNotExist(err) {
				targetPath = candidate
				break
			}
			counter++
		}
	}

	return os.Rename(trashPath, targetPath)
}

func (s *Service) DeletePermanently(trashID string) error {
	trashPath := filepath.Join(s.Root, s.TrashDir, trashID)
	return os.RemoveAll(trashPath)
}

func (s *Service) Search(query string) ([]DriveItem, error) {
	items := make([]DriveItem, 0)
	query = strings.ToLower(query)

	err := filepath.Walk(s.Root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Skip errors
		}

		// Skip root itself
		if path == s.Root {
			return nil
		}

		rel, _ := filepath.Rel(s.Root, path)
		if strings.HasPrefix(rel, s.TrashDir) || strings.HasPrefix(filepath.Base(path), ".") {
			if info.IsDir() && rel != "." {
				return filepath.SkipDir
			}
			return nil
		}

		if strings.Contains(strings.ToLower(info.Name()), query) {
			itemType := TypeFile
			if info.IsDir() {
				itemType = TypeFolder
			}

			items = append(items, DriveItem{
				ID:        info.Name(),
				Name:      info.Name(),
				Type:      itemType,
				Size:      info.Size(),
				Path:      filepath.ToSlash(rel),
				UpdatedAt: info.ModTime(),
			})
		}
		return nil
	})

	return items, err
}
