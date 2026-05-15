//go:build windows

package storage

import (
	"path/filepath"
	"strings"
)

func getDiskSummary(root string) (DiskSummary, error) {
	volumeName := filepath.VolumeName(root)
	if volumeName == "" {
		volumeName = root
	}

	return DiskSummary{
		Mount:       strings.TrimSuffix(volumeName, "\\"),
		TotalBytes:  0,
		UsedBytes:   0,
		FreeBytes:   0,
		UsedPercent: 0,
	}, nil
}
