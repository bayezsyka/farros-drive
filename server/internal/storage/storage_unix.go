//go:build !windows

package storage

import "syscall"

func getDiskSummary(root string) (DiskSummary, error) {
	var stat syscall.Statfs_t
	if err := syscall.Statfs(root, &stat); err != nil {
		return DiskSummary{}, err
	}

	totalBytes := stat.Blocks * uint64(stat.Bsize)
	freeBytes := stat.Bavail * uint64(stat.Bsize)
	usedBytes := totalBytes - (stat.Bfree * uint64(stat.Bsize))
	usedPercent := 0.0
	if totalBytes > 0 {
		usedPercent = float64(usedBytes) * 100 / float64(totalBytes)
	}

	return DiskSummary{
		Mount:       "/",
		TotalBytes:  totalBytes,
		UsedBytes:   usedBytes,
		FreeBytes:   freeBytes,
		UsedPercent: usedPercent,
	}, nil
}
