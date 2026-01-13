package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// getFFmpegPath returns the path to FFmpeg executable
func getFFmpegPath() (string, error) {
	// Check if FFmpeg is already in PATH
	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err == nil {
		return ffmpegPath, nil
	}

	// Download FFmpeg from mirror
	return downloadFFmpeg()
}

// downloadFFmpeg downloads FFmpeg from the specified mirror
func downloadFFmpeg() (string, error) {
	// Determine platform and architecture
	platform := runtime.GOOS
	arch := runtime.GOARCH

	var ffmpegFilename string
	var urlPrefix = "https://registry.npmmirror.com/binary/ffmpeg-static/b6.1.1/ffmpeg-"

	switch platform {
	case "darwin":
		if arch == "amd64" {
			ffmpegFilename = "ffmpeg-darwin-x64"
		} else if arch == "arm64" {
			ffmpegFilename = "ffmpeg-darwin-arm64"
		} else {
			return "", fmt.Errorf("unsupported architecture: %s", arch)
		}
	case "linux":
		if arch == "amd64" {
			ffmpegFilename = "ffmpeg-linux-x64"
		} else if arch == "arm64" {
			ffmpegFilename = "ffmpeg-linux-arm64"
		} else {
			return "", fmt.Errorf("unsupported architecture: %s", arch)
		}
	case "windows":
		if arch == "amd64" {
			ffmpegFilename = "ffmpeg-win32-x64.exe"
		} else {
			return "", fmt.Errorf("unsupported architecture: %s", arch)
		}
	default:
		return "", fmt.Errorf("unsupported platform: %s", platform)
	}

	// Create cache directory
	cacheDir := filepath.Join(os.TempDir(), "ffmpeg-cache")
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create cache dir: %w", err)
	}

	ffmpegPath := filepath.Join(cacheDir, ffmpegFilename)

	// Check if already downloaded
	if _, err := os.Stat(ffmpegPath); err == nil {
		// Make executable
		os.Chmod(ffmpegPath, 0755)
		return ffmpegPath, nil
	}

	// Download URL
	downloadURL := urlPrefix + platform + "-" + arch
	if platform == "windows" {
		downloadURL = urlPrefix + "win32-x64.exe"
	}

	// Download FFmpeg
	cmd := exec.Command("curl", "-L", downloadURL, "-o", ffmpegPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to download FFmpeg: %w\nOutput: %s", err, string(output))
	}

	// Make executable
	os.Chmod(ffmpegPath, 0755)

	return ffmpegPath, nil
}

// runFFmpegCommand runs an FFmpeg command and returns the output
func runFFmpegCommand(ffmpegPath string, args ...string) ([]byte, error) {
	cmd := exec.Command(ffmpegPath, args...)
	return cmd.CombinedOutput()
}
