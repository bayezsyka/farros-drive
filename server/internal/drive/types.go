package drive

import "time"

type ItemType string

const (
	TypeFile   ItemType = "file"
	TypeFolder ItemType = "folder"
)

type DriveItem struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Type         ItemType   `json:"type"`
	Extension    string     `json:"extension"`
	MimeType     string     `json:"mimeType"`
	Size         int64      `json:"size"`
	Path         string     `json:"path"`
	ParentPath   string     `json:"parentPath"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	DeletedAt    *time.Time `json:"deletedAt,omitempty"`
	TrashPath    string     `json:"trashPath,omitempty"`
	OriginalPath string     `json:"originalPath,omitempty"`
}
