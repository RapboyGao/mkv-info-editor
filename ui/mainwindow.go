package ui

import (
	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
	"mkv-info-editor/mkvprocessor"
	"os"
)

// MainWindow 表示应用程序的主窗口

type MainWindow struct {
	App           fyne.App
	Window        fyne.Window
	MKVProcessor  *mkvprocessor.MKVProcessor
	SelectedFile  string
	ChapterInfos  []mkvprocessor.ChapterInfo
	ChapterEditor *ChapterEditor
}

// NewMainWindow 创建一个新的MainWindow实例

func NewMainWindow() *MainWindow {
	app := app.New()
	window := app.NewWindow("MKV章节编辑器")
	window.Resize(fyne.NewSize(800, 600))

	return &MainWindow{
		App:          app,
		Window:       window,
		MKVProcessor: mkvprocessor.NewMKVProcessor(),
	}
}

// Show 显示主窗口

func (mw *MainWindow) Show() {
	// 检查系统是否安装了MKVToolNix
	if !mw.MKVProcessor.HasMKVToolNix() {
		dialog.ShowError(
			fyne.NewError("错误", "未检测到MKVToolNix。请先安装MKVToolNix并确保其在系统PATH中。"),
			mw.Window,
		)
	}

	// 创建主界面
	mw.createMainUI()

	// 显示窗口
	mw.Window.ShowAndRun()
}

// createMainUI 创建主界面

func (mw *MainWindow) createMainUI() {
	// 文件选择按钮
	selectFileBtn := widget.NewButton("选择MKV文件", func() {
		mw.selectMKVFile()
	})

	// 保存按钮
	saveBtn := widget.NewButton("保存修改后的MKV", func() {
		mw.saveModifiedMKV()
	})
	saveBtn.Disable()

	// 主容器
	mainContainer := container.NewVBox(
		container.NewCenter(selectFileBtn),
	)

	// 设置窗口内容
	mw.Window.SetContent(mainContainer)

	// 保存按钮状态跟踪
	mw.Window.Canvas().SetOnTypedKey(func(event *fyne.KeyEvent) {
		if mw.SelectedFile != "" && len(mw.ChapterInfos) > 0 {
			saveBtn.Enable()
		} else {
			saveBtn.Disable()
		}
	})
}

// selectMKVFile 选择MKV文件

func (mw *MainWindow) selectMKVFile() {
	// 创建文件选择对话框
	fileDialog := dialog.NewFileOpen(func(reader fyne.URIReadCloser, err error) {
		if err != nil {
			dialog.ShowError(err, mw.Window)
			return
		}

		if reader == nil {
			// 用户取消了选择
			return
		}
		defer reader.Close()

		// 获取选中的文件路径
		mw.SelectedFile = reader.URI().Path()

		// 提取并显示章节信息
		mw.loadChapters()

	}, mw.Window)

	// 设置过滤器，只显示MKV文件
	fileDialog.SetFilter(
		&fyne.ListableURI{
			Name:     "MKV Files",
			Pattern:  "*.mkv",
			RootURI:  nil,
		},
	)

	// 显示文件选择对话框
	fileDialog.Show()
}

// loadChapters 加载并显示章节信息

func (mw *MainWindow) loadChapters() {
	// 提取章节信息
	var err error
	mw.ChapterInfos, err = mw.MKVProcessor.GetChapters(mw.SelectedFile)
	if err != nil {
		dialog.ShowError(err, mw.Window)
		return
	}

	// 创建章节编辑器
	mw.ChapterEditor = NewChapterEditor(mw.Window, mw.ChapterInfos)

	// 更新主界面，显示章节编辑器
	mw.updateMainUI()
}

// updateMainUI 更新主界面，显示章节编辑器

func (mw *MainWindow) updateMainUI() {
	// 文件选择按钮
	selectFileBtn := widget.NewButton("选择MKV文件", func() {
		mw.selectMKVFile()
	})

	// 保存按钮
	saveBtn := widget.NewButton("保存修改后的MKV", func() {
		mw.saveModifiedMKV()
	})
	saveBtn.Enable()

	// 主容器
	mainContainer := container.NewVBox(
		container.NewCenter(selectFileBtn),
		widget.NewSeparator(),
		container.NewScroll(mw.ChapterEditor.Content),
		container.NewCenter(saveBtn),
	)

	// 设置窗口内容
	mw.Window.SetContent(mainContainer)
}

// saveModifiedMKV 保存修改后的MKV文件

func (mw *MainWindow) saveModifiedMKV() {
	// 更新章节信息
	mw.ChapterInfos = mw.ChapterEditor.GetChapterInfos()

	// 创建保存对话框
	saveDialog := dialog.NewFileSave(func(writer fyne.URIWriteCloser, err error) {
		if err != nil {
			dialog.ShowError(err, mw.Window)
			return
		}

		if writer == nil {
			// 用户取消了保存
			return
		}
		defer writer.Close()

		// 获取保存路径
		savePath := writer.URI().Path()

		// 保存修改后的章节并重新封装MKV文件
		if err := mw.MKVProcessor.SaveModifiedChapters(mw.SelectedFile, "", savePath); err != nil {
			dialog.ShowError(err, mw.Window)
			return
		}

		// 显示保存成功消息
		dialog.ShowInformation("成功", "MKV文件已成功保存！", mw.Window)

	}, mw.Window)

	// 设置默认文件名
	defaultName := "modified_" + mw.SelectedFile
	saveDialog.SetFileName(defaultName)

	// 显示保存对话框
	saveDialog.Show()
}