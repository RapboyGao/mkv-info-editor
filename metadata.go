package main

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

// parseChapters parses chapters from FFmetadata
func parseChapters(metadata string) []Chapter {
	var chapters []Chapter

	// Regex to match chapter start times and titles
	chapterRegex := regexp.MustCompile(`\[CHAPTER\]\nTIMEBASE=.*?\nSTART=(\d+)\nEND=.*?\nTITLE=(.*?)\n`)
	matches := chapterRegex.FindAllStringSubmatch(metadata, -1)

	for _, match := range matches {
		if len(match) >= 3 {
			// Convert start time (in seconds) to HH:MM:SS format
			startTime := parseFloat(match[1]) / 1000.0
			timeStr := formatTime(startTime)

			chapters = append(chapters, Chapter{
				Time:  timeStr,
				Title: match[2],
			})
		}
	}

	return chapters
}

// updateChapterTitles updates chapter titles in metadata
func updateChapterTitles(metadata string, chapters []Chapter) string {
	// Split metadata into lines
	lines := strings.Split(metadata, "\n")
	chapterIndex := 0

	for i, line := range lines {
		if strings.HasPrefix(line, "[CHAPTER]") {
			// Found a chapter, look for the next TITLE line
			for j := i + 1; j < len(lines); j++ {
				if strings.HasPrefix(lines[j], "TITLE=") {
					if chapterIndex < len(chapters) {
						lines[j] = "TITLE=" + chapters[chapterIndex].Title
						chapterIndex++
					}
					break
				}
			}
		}
	}

	return strings.Join(lines, "\n")
}

// parseFloat converts string to float64
func parseFloat(s string) float64 {
	var f float64
	fmt.Sscanf(s, "%f", &f)
	return f
}

// formatTime formats seconds to HH:MM:SS
func formatTime(seconds float64) string {
	t := time.Duration(seconds * float64(time.Second))
	return fmt.Sprintf("%02d:%02d:%02d", int(t.Hours()), int(t.Minutes())%60, int(t.Seconds())%60)
}
