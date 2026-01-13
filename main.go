package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"github.com/lxn/walk"
	. "github.com/lxn/walk/declarative"
	"mkv-info-editor/mkvprocessor"
)

var (
	mw                    *walk.MainWindow
	selectedFile          string
	chapterInfos          []mkvprocessor.ChapterInfo
	chapterTable          *walk.TableView
	nameEditors           []*walk.LineEdit
	mkvProcessor          *mkvprocessor.MKVProcessor
)

// ChapterItem 用于表格显示的章节项

type ChapterItem struct {
	Index     int
	StartTime string
	Name      string
}

// getMKVToolNixDownloadURL 根据系统类型获取MKVToolNix下载地址
func getMKVToolNixDownloadURL() string {
	sys := runtime.GOOS
	arch := runtime.GOARCH

	// 目前只支持Windows，因为程序本身是Windows版本
	if sys == "windows" {
		// 32位和64位Windows使用不同的下载链接
		if arch == "amd64" {
			return "https://mkvtoolnix.download/windows/releases/latest/mkvtoolnix-64bit-latest-setup.exe"
		} else {
			return "https://mkvtoolnix.download/windows/releases/latest/mkvtoolnix-32bit-latest-setup.exe"
		}
	}

	// 默认返回官方网站
	return "https://mkvtoolnix.download/"
}

// downloadMKVToolNix 下载MKVToolNix
func downloadMKVToolNix(url string) (string, error) {
	// 获取文件名
	fileName := filepath.Base(url)
	// 下载到临时目录
	tempDir := os.TempDir()
	destPath := filepath.Join(tempDir, fileName)

	// 创建文件
	destFile, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("创建文件失败: %v", err)
	}
	defer destFile.Close()

	// 发送HTTP请求
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("下载失败: %v", err)
	}
	defer resp.Body.Close()

	// 检查响应状态
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("下载失败，状态码: %d", resp.StatusCode)
	}

	// 复制内容到文件
	if _, err := io.Copy(destFile, resp.Body); err != nil {
		return "", fmt.Errorf("写入文件失败: %v", err)
	}

	return destPath, nil
}

func main() {
	// 初始化MKV处理器
	mkvProcessor = mkvprocessor.NewMKVProcessor()

	// 检查系统是否安装了MKVToolNix
	if !mkvProcessor.HasMKVToolNix() {
		// 获取下载地址
		downloadURL := getMKVToolNixDownloadURL()
		
		// 显示提示并询问是否下载
		msg := fmt.Sprintf("未检测到MKVToolNix。\n\nMKV章节编辑器需要MKVToolNix工具集来处理MKV文件。\n\n是否自动下载MKVToolNix？\n下载地址: %s", downloadURL)
		
		result := walk.MsgBox(nil, "提示 - 需要安装MKVToolNix", msg, walk.MsgBoxIconQuestion|walk.MsgBoxYesNo)
		if result == walk.DlgCmdYes {
			// 下载MKVToolNix
			walk.MsgBox(nil, "提示", "开始下载MKVToolNix，请稍候...", walk.MsgBoxIconInformation)
			
			destPath, err := downloadMKVToolNix(downloadURL)
			if err != nil {
				walk.MsgBox(nil, "错误", fmt.Sprintf("下载失败: %v\n\n请手动访问 %s 下载并安装", err, downloadURL), walk.MsgBoxIconError)
				return
			}
			
			// 提示用户运行安装程序
			msg := fmt.Sprintf("MKVToolNix已成功下载到: %s\n\n是否立即运行安装程序？\n\n安装完成后，请重新启动MKV章节编辑器。", destPath)
			result := walk.MsgBox(nil, "下载完成", msg, walk.MsgBoxIconQuestion|walk.MsgBoxYesNo)
			if result == walk.DlgCmdYes {
				// 提示用户手动运行安装程序
				walk.MsgBox(nil, "提示", "请手动运行下载的安装程序: " + destPath, walk.MsgBoxIconInformation)
			}
			
			return
		}
		
		// 用户选择不下载，显示手动安装指导
		msg = fmt.Sprintf("未检测到MKVToolNix。\n\nMKV章节编辑器需要MKVToolNix工具集来处理MKV文件。\n\n请按以下步骤操作：\n1. 访问 %s 下载并安装MKVToolNix\n2. 确保MKVToolNix的安装目录已添加到系统PATH环境变量中\n3. 重新启动MKV章节编辑器", downloadURL)
		walk.MsgBox(nil, "提示 - 需要安装MKVToolNix", msg, walk.MsgBoxIconInformation)
		return
	}

	// 创建主窗口
	MainWindow{
		AssignTo: &mw,
		Title:    "MKV章节编辑器",
		Size:     Size{Width: 800, Height: 600},
		MinSize:  Size{Width: 600, Height: 400},
		Layout:   VBox{},
		Children: []Widget{
			Composite{
				Layout: HBox{},
				Children: []Widget{
					PushButton{
						Text: "选择MKV文件",
						OnClicked: func() {
							selectMKVFile()
						},
					},
					PushButton{
						Text: "保存修改后的MKV",
						OnClicked: func() {
							saveModifiedMKV()
						},
					},
				},
			},
			TableView{
				AssignTo: &chapterTable,
				Columns: []TableViewColumn{
					{Title: "序号", Width: 50, Alignment: AlignCenter},
					{Title: "开始时间", Width: 120, Alignment: AlignCenter},
					{Title: "章节名称", Width: 600},
				},
			},
		},
	}.Run()
}

// selectMKVFile 选择MKV文件

func selectMKVFile() {
	// 创建文件对话框
	dlg := new(walk.FileDialog)
	dlg.Filter = "MKV文件 (*.mkv)|*.mkv|所有文件 (*.*)|*.*"
	dlg.Title = "选择MKV文件"

	// 显示文件对话框
	if ok, err := dlg.ShowOpen(mw); err != nil {
		walk.MsgBox(mw, "错误", fmt.Sprintf("打开文件对话框失败: %v", err), walk.MsgBoxIconError)
		return
	} else if !ok {
		return // 用户取消了选择
	}

	// 获取选中的文件路径
	selectedFile = dlg.FilePath

	// 提取章节信息
	loadChapters()
}

// loadChapters 加载章节信息

func loadChapters() {
	// 提取章节信息
	var err error
	chapterInfos, err = mkvProcessor.GetChapters(selectedFile)
	if err != nil {
		walk.MsgBox(mw, "错误", fmt.Sprintf("提取章节信息失败: %v", err), walk.MsgBoxIconError)
		return
	}

	// 创建表格项
	items := make([]ChapterItem, len(chapterInfos))
	for i, info := range chapterInfos {
		items[i] = ChapterItem{
			Index:     i + 1,
			StartTime: info.StartTime,
			Name:      info.Name,
		}
	}

	// 设置表格模型
	model := &ChapterTableModel{Items: items}
	chapterTable.SetModel(model)

	// 刷新表格
	chapterTable.Invalidate()
}

// saveModifiedMKV 保存修改后的MKV文件

func saveModifiedMKV() {
	if selectedFile == "" {
		walk.MsgBox(mw, "错误", "请先选择MKV文件", walk.MsgBoxIconError)
		return
	}

	// 创建保存对话框
	dlg := new(walk.FileDialog)
	dlg.Filter = "MKV文件 (*.mkv)|*.mkv|所有文件 (*.*)|*.*"
	dlg.Title = "保存修改后的MKV"
	dlg.FilePath = filepath.Join(filepath.Dir(selectedFile), "modified_"+filepath.Base(selectedFile))

	// 显示保存对话框
	if ok, err := dlg.ShowSave(mw); err != nil {
		walk.MsgBox(mw, "错误", fmt.Sprintf("保存文件对话框失败: %v", err), walk.MsgBoxIconError)
		return
	} else if !ok {
		return // 用户取消了保存
	}

	// 保存修改后的章节信息
	if err := mkvProcessor.SaveModifiedChapters(selectedFile, dlg.FilePath, chapterInfos); err != nil {
		walk.MsgBox(mw, "错误", fmt.Sprintf("保存MKV文件失败: %v", err), walk.MsgBoxIconError)
		return
	}

	// 显示成功消息
	walk.MsgBox(mw, "成功", "MKV文件已成功保存！", walk.MsgBoxIconInformation)
}

// ChapterTableModel 表格模型

type ChapterTableModel struct {
	Items []ChapterItem
}

// RowCount 返回行数

func (m *ChapterTableModel) RowCount() int {
	return len(m.Items)
}

// Value 返回指定单元格的值

func (m *ChapterTableModel) Value(row, col int) interface{} {
	item := m.Items[row]
	switch col {
	case 0:
		return item.Index
	case 1:
		return item.StartTime
	case 2:
		return item.Name
	default:
		return nil
	}
}

// SetValue 设置指定单元格的值

func (m *ChapterTableModel) SetValue(row, col int, value interface{}) error {
	if col == 2 {
		// 更新章节名称
		if str, ok := value.(string); ok {
			m.Items[row].Name = str
			chapterInfos[row].Name = str
			// 刷新表格
			if chapterTable != nil {
				chapterTable.Invalidate()
			}
		}
	}
	return nil
}