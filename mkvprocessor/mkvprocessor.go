package mkvprocessor

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// MKVProcessor 封装MKVToolNix命令行工具调用

type MKVProcessor struct {
	MKVInfoPath    string
	MKVExtractPath string
	MKVMergePath   string
}

// NewMKVProcessor 创建一个新的MKVProcessor实例

func NewMKVProcessor() *MKVProcessor {
	return &MKVProcessor{
		MKVInfoPath:    "mkvinfo",    // 默认使用系统PATH中的命令
		MKVExtractPath: "mkvextract", // 默认使用系统PATH中的命令
		MKVMergePath:   "mkvmerge",   // 默认使用系统PATH中的命令
	}
}

// ExtractChapters 从MKV文件中提取章节信息到XML文件

func (m *MKVProcessor) ExtractChapters(inputMKVPath, outputXMLPath string) error {
	cmd := exec.Command(m.MKVExtractPath, inputMKVPath, "chapters", outputXMLPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to extract chapters: %w\noutput: %s", err, string(output))
	}
	return nil
}

// MergeMKVWithChapters 使用原始MKV文件和修改后的章节信息重新封装MKV文件

func (m *MKVProcessor) MergeMKVWithChapters(inputMKVPath, inputChaptersXML, outputMKVPath string) error {
	// 构建命令：mkvmerge -o output.mkv --chapters chapters.xml input.mkv
	cmd := exec.Command(m.MKVMergePath, "-o", outputMKVPath, "--chapters", inputChaptersXML, inputMKVPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to merge MKV with chapters: %w\noutput: %s", err, string(output))
	}
	return nil
}

// HasMKVToolNix 检查系统是否安装了MKVToolNix

func (m *MKVProcessor) HasMKVToolNix() bool {
	// 检查mkvinfo是否存在
	if _, err := exec.LookPath(m.MKVInfoPath); err != nil {
		return false
	}
	// 检查mkvextract是否存在
	if _, err := exec.LookPath(m.MKVExtractPath); err != nil {
		return false
	}
	// 检查mkvmerge是否存在
	if _, err := exec.LookPath(m.MKVMergePath); err != nil {
		return false
	}
	return true
}

// GetChapters 获取MKV文件的章节信息

func (m *MKVProcessor) GetChapters(inputMKVPath string) ([]ChapterInfo, error) {
	// 创建临时XML文件
	tempDir := os.TempDir()
	tempXMLPath := filepath.Join(tempDir, "temp_chapters.xml")
	defer os.Remove(tempXMLPath) // 清理临时文件

	// 提取章节
	if err := m.ExtractChapters(inputMKVPath, tempXMLPath); err != nil {
		return nil, err
	}

	// 解析章节
	chapterInfos, err := ParseChaptersFromXML(tempXMLPath)
	if err != nil {
		return nil, err
	}

	return chapterInfos, nil
}

// SaveModifiedChapters 保存修改后的章节信息并重新封装MKV文件

func (m *MKVProcessor) SaveModifiedChapters(inputMKVPath, outputMKVPath string, chapterInfos []ChapterInfo) error {
	// 创建临时XML文件
	tempDir := os.TempDir()
	tempXMLPath := filepath.Join(tempDir, "temp_modified_chapters.xml")
	defer os.Remove(tempXMLPath) // 清理临时文件

	// 保存修改后的章节到XML
	if err := SaveChaptersToXML(chapterInfos, tempXMLPath); err != nil {
		return err
	}

	// 重新封装MKV文件
	if err := m.MergeMKVWithChapters(inputMKVPath, tempXMLPath, outputMKVPath); err != nil {
		return err
	}

	return nil
}