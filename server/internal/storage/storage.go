package storage

import (
	"os"
	"path/filepath"
	"strings"
)

type DriveSummary struct {
	Root        string `json:"root"`
	UsedBytes   int64  `json:"usedBytes"`
	FileCount   int64  `json:"fileCount"`
	FolderCount int64  `json:"folderCount"`
}

type DiskSummary struct {
	Mount       string  `json:"mount"`
	TotalBytes  uint64  `json:"totalBytes"`
	UsedBytes   uint64  `json:"usedBytes"`
	FreeBytes   uint64  `json:"freeBytes"`
	UsedPercent float64 `json:"usedPercent"`
}

type Summary struct {
	Drive DriveSummary `json:"drive"`
	Disk  DiskSummary  `json:"disk"`
}

func GetSummary(root, trashDir, metaDir string) (Summary, error) {
	driveSummary := DriveSummary{Root: root}

	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		if path == root {
			return nil
		}

		rel, relErr := filepath.Rel(root, path)
		if relErr != nil {
			return nil
		}

		rel = filepath.ToSlash(rel)
		firstSegment := strings.Split(rel, "/")[0]
		if firstSegment == trashDir || firstSegment == metaDir || strings.HasPrefix(firstSegment, ".") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		if info.IsDir() {
			driveSummary.FolderCount++
			return nil
		}

		driveSummary.FileCount++
		driveSummary.UsedBytes += info.Size()
		return nil
	})
	if err != nil {
		return Summary{}, err
	}

	diskSummary, err := getDiskSummary(root)
	if err != nil {
		return Summary{}, err
	}

	return Summary{
		Drive: driveSummary,
		Disk:  diskSummary,
	}, nil
}
