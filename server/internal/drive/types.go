package drive

import "time"

type ItemType string

const (
	TypeFile   ItemType = "file"
	TypeFolder ItemType = "folder"
)

type DriveItem struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Type      ItemType   `json:"type"`
	Size      int64      `json:"size"`
	Path      string     `json:"path"`
	UpdatedAt time.Time  `json:"updatedAt"`
	DeletedAt *time.Time `json:"deletedAt,omitempty"`
}
