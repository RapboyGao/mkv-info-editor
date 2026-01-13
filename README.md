# MKV章节编辑软件

这是一个使用 Wails 和 Vue 3 开发的 MKV 章节编辑软件，可以方便地修改 MKV 文件的章节名称。

## 原理

1. 使用 FFmpeg 导出 MKV 文件的元数据：
   ```bash
   ffmpeg -i input.mkv -f ffmetadata metadata.txt
   ```

2. 编辑元数据文件中的章节标题

3. 使用 FFmpeg 将修改后的元数据导回 MKV 文件：
   ```bash
   ffmpeg -i input.mkv -i metadata.txt -map_metadata 1 -c copy output.mkv
   ```

## 功能特性

- 自动从国内镜像下载对应平台的 FFmpeg 可执行文件
- 可视化编辑 MKV 章节标题
- 支持多种平台（Windows、macOS、Linux）
- 基于 Wails 和 Vue 3 构建，界面美观

## 构建步骤

### 1. 安装依赖

#### Go 环境

请先安装 Go 1.23 或更高版本：

```bash
go version
```

#### Wails

安装 Wails CLI：

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

#### pnpm

确保已安装 pnpm：

```bash
pnpm -v
```

### 2. 构建项目

```bash
# 安装前端依赖
pnpm install

# 构建应用程序
wails build
```

构建成功后，可执行文件将生成在 `build` 目录中。

## 使用说明

1. 启动应用程序
2. 点击"选择MKV文件"，选择要编辑的MKV文件
3. 点击"加载元数据"，程序将自动下载FFmpeg（如果需要）并加载章节信息
4. 在章节列表中编辑章节标题
5. 点击"导出MKV"，生成包含新章节标题的MKV文件

## 项目结构

```
mkv-info-editor/
├── frontend/          # Vue 3 前端代码
│   ├── src/           # 前端源代码
│   │   ├── App.vue    # 主应用组件
│   │   ├── main.js    # 应用入口
│   │   └── style.css  # 样式文件
│   ├── index.html     # HTML 入口
│   ├── package.json   # 前端依赖
│   └── vite.config.js # Vite 配置
├── main.go           # Go 后端代码
├── go.mod            # Go 依赖
├── wails.json        # Wails 配置
└── README.md         # 项目说明
```

## 技术栈

- **后端**：Go 1.23 + Wails 2
- **前端**：Vue 3 + Vite
- **包管理器**：pnpm
- **多媒体处理**：FFmpeg

## 注意事项

- 程序会自动从 `https://registry.npmmirror.com/binary/ffmpeg-static/b6.1.1/` 下载对应平台的 FFmpeg 可执行文件
- 生成的新 MKV 文件将保存在原文件所在目录，命名为 `output_原文件名.mkv`
- 请确保有足够的磁盘空间用于临时文件和输出文件

## License

MIT