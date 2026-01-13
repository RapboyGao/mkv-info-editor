package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

// App struct
type App struct {
	Log logger.Logger
}

// Chapter represents a single chapter
type Chapter struct {
	Time  string `json:"time"`
	Title string `json:"title"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	// Perform any startup tasks here
}

// shutdown is called when the app closes
func (a *App) shutdown(ctx context.Context) {
	// Perform any shutdown tasks here
}

// LoadMetadata loads metadata from an MKV file
func (a *App) LoadMetadata(filePath string) (map[string]interface{}, error) {
	// Download FFmpeg if not present
	ffmpegPath, err := getFFmpegPath()
	if err != nil {
		return nil, err
	}

	// Create temporary directory for metadata
	tempDir, err := os.MkdirTemp("", "mkv-editor")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp dir: %w", err)
	}

	metadataPath := filepath.Join(tempDir, "metadata.txt")

	// Export metadata using FFmpeg
	output, err := runFFmpegCommand(ffmpegPath, "-i", filePath, "-f", "ffmetadata", metadataPath)
	if err != nil {
		return nil, fmt.Errorf("failed to export metadata: %w\nOutput: %s", err, string(output))
	}

	// Read metadata file
	metadata, err := os.ReadFile(metadataPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read metadata: %w", err)
	}

	// Parse chapters
	chapters := parseChapters(string(metadata))

	return map[string]interface{}{
		"chapters":      chapters,
		"metadataPath": metadataPath,
	}, nil
}

// SaveMetadata saves updated metadata
func (a *App) SaveMetadata(chapters []Chapter) (map[string]interface{}, error) {
	// This function would be called after editing chapters
	// For now, just return a success message
	return map[string]interface{}{
		"message": "Metadata saved successfully",
	}, nil
}

// ExportMKV exports the MKV file with updated metadata
func (a *App) ExportMKV(inputPath string, chapters []Chapter) (map[string]interface{}, error) {
	// Download FFmpeg if not present
	ffmpegPath, err := getFFmpegPath()
	if err != nil {
		return nil, err
	}

	// Create temporary directory for metadata
	tempDir, err := os.MkdirTemp("", "mkv-editor")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp dir: %w", err)
	}

	// Export current metadata
	metadataPath := filepath.Join(tempDir, "metadata.txt")
	output, err := runFFmpegCommand(ffmpegPath, "-i", inputPath, "-f", "ffmetadata", metadataPath)
	if err != nil {
		return nil, fmt.Errorf("failed to export metadata: %w\nOutput: %s", err, string(output))
	}

	// Read current metadata
	metadata, err := os.ReadFile(metadataPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read metadata: %w", err)
	}

	// Update metadata with new chapter titles
	updatedMetadata := updateChapterTitles(string(metadata), chapters)

	// Write updated metadata
	if err := os.WriteFile(metadataPath, []byte(updatedMetadata), 0644); err != nil {
		return nil, fmt.Errorf("failed to write updated metadata: %w", err)
	}

	// Create output file path
	outputDir := filepath.Dir(inputPath)
	outputName := filepath.Base(inputPath)
	outputPath := filepath.Join(outputDir, "output_"+outputName)

	// Export MKV with updated metadata
	output, err = runFFmpegCommand(ffmpegPath, "-i", inputPath, "-i", metadataPath, "-map_metadata", "1", "-c", "copy", outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to export MKV: %w\nOutput: %s", err, string(output))
	}

	return map[string]interface{}{
		"outputPath": outputPath,
	}, nil
}
