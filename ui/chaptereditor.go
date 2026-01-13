package ui

import (
	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/widget"
	"mkv-info-editor/mkvprocessor"
)

// ChapterEditor 章节编辑器

type ChapterEditor struct {
	Window       fyne.Window
	ChapterInfos []mkvprocessor.ChapterInfo
	Content      *fyne.Container
	nameEntries  []*widget.Entry
}

// NewChapterEditor 创建一个新的章节编辑器

func NewChapterEditor(window fyne.Window, chapterInfos []mkvprocessor.ChapterInfo) *ChapterEditor {
	ce := &ChapterEditor{
		Window:       window,
		ChapterInfos: chapterInfos,
		nameEntries:  make([]*widget.Entry, len(chapterInfos)),
	}

	// 创建章节编辑界面
	ce.createChapterEditorUI()

	return ce
}

// createChapterEditorUI 创建章节编辑界面

func (ce *ChapterEditor) createChapterEditorUI() {
	// 创建标题行
	titleRow := container.NewGridWithColumns(3, 
		container.NewCenter(widget.NewLabel("序号")),
		container.NewCenter(widget.NewLabel("开始时间")),
		container.NewCenter(widget.NewLabel("章节名称")),
	)

	// 创建章节行
	rows := make([]fyne.CanvasObject, 0, len(ce.ChapterInfos)+1)
	rows = append(rows, titleRow)

	// 添加分隔线
	rows = append(rows, widget.NewSeparator())

	// 添加章节信息行
	for i, chapter := range ce.ChapterInfos {
		// 序号
		indexLabel := widget.NewLabel(string(rune(i + 1)))

		// 开始时间
		timeLabel := widget.NewLabel(chapter.StartTime)

		// 章节名称输入框
		nameEntry := widget.NewEntry()
		nameEntry.SetText(chapter.Name)
		ce.nameEntries[i] = nameEntry

		// 创建一行
		row := container.NewGridWithColumns(3, 
			container.NewCenter(indexLabel),
			container.NewCenter(timeLabel),
			nameEntry,
		)

		rows = append(rows, row)
	}

	// 创建内容容器
	ce.Content = container.NewVBox(rows...)
}

// GetChapterInfos 获取编辑后的章节信息

func (ce *ChapterEditor) GetChapterInfos() []mkvprocessor.ChapterInfo {
	// 更新章节名称
	for i, entry := range ce.nameEntries {
		ce.ChapterInfos[i].Name = entry.Text
	}

	return ce.ChapterInfos
}