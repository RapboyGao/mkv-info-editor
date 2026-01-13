package mkvprocessor

import (
	"encoding/xml"
	"os"
	"strconv"
	"time"
)

// ChapterAtom 表示单个章节

type ChapterAtom struct {
	XMLName     xml.Name     `xml:"ChapterAtom"`
	ChapterUID  string       `xml:"ChapterUID"`
	ChapterTimeStart string   `xml:"ChapterTimeStart"`
	ChapterFlagHidden int     `xml:"ChapterFlagHidden,omitempty"`
	ChapterFlagEnabled int    `xml:"ChapterFlagEnabled,omitempty"`
	ChapterDisplay ChapterDisplay `xml:"ChapterDisplay"`
}

// ChapterDisplay 表示章节的显示信息

type ChapterDisplay struct {
	XMLName         xml.Name `xml:"ChapterDisplay"`
	ChapterString   string   `xml:"ChapterString"`
	ChapterLanguage string   `xml:"ChapterLanguage"`
	ChapterCountry  string   `xml:"ChapterCountry,omitempty"`
}

// ChapterTrack 表示章节轨道

type ChapterTrack struct {
	XMLName       xml.Name      `xml:"ChapterTrack"`
	ChapterTrackNumber int       `xml:"ChapterTrackNumber"`
	ChapterAtom   []ChapterAtom `xml:"ChapterAtom"`
}

// Chapters 表示所有章节

type Chapters struct {
	XMLName      xml.Name      `xml:"Chapters"`
	EditionEntry EditionEntry  `xml:"EditionEntry"`
}

// EditionEntry 表示章节版本条目

type EditionEntry struct {
	XMLName       xml.Name      `xml:"EditionEntry"`
	EditionUID    string        `xml:"EditionUID"`
	EditionFlagHidden int        `xml:"EditionFlagHidden,omitempty"`
	EditionFlagDefault int       `xml:"EditionFlagDefault,omitempty"`
	ChapterTrack  ChapterTrack  `xml:"ChapterTrack"`
}

// ChapterInfo 表示章节信息，用于GUI显示

type ChapterInfo struct {
	Index     int
	UID       string
	Name      string
	StartTime string
}

// ParseChaptersFromXML 从XML文件解析章节信息

func ParseChaptersFromXML(filePath string) ([]ChapterInfo, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var chapters Chapters
	decoder := xml.NewDecoder(file)
	if err := decoder.Decode(&chapters); err != nil {
		return nil, err
	}

	var chapterInfos []ChapterInfo
	for i, atom := range chapters.EditionEntry.ChapterTrack.ChapterAtom {
		chapterInfo := ChapterInfo{
			Index:     i + 1,
			UID:       atom.ChapterUID,
			Name:      atom.ChapterDisplay.ChapterString,
			StartTime: atom.ChapterTimeStart,
		}
		chapterInfos = append(chapterInfos, chapterInfo)
	}

	return chapterInfos, nil
}

// SaveChaptersToXML 将章节信息保存为XML文件

func SaveChaptersToXML(chapterInfos []ChapterInfo, filePath string) error {
	// 创建Chapters结构
	chapters := Chapters{
		EditionEntry: EditionEntry{
			EditionUID:    strconv.FormatInt(time.Now().UnixNano(), 10),
			EditionFlagDefault: 1,
			ChapterTrack: ChapterTrack{
				ChapterTrackNumber: 1,
			},
		},
	}

	// 添加章节
	for _, info := range chapterInfos {
		chapterAtom := ChapterAtom{
			ChapterUID:  info.UID,
			ChapterTimeStart: info.StartTime,
			ChapterFlagEnabled: 1,
			ChapterDisplay: ChapterDisplay{
				ChapterString:   info.Name,
				ChapterLanguage: "und", // 默认语言
			},
		}
		chapters.EditionEntry.ChapterTrack.ChapterAtom = append(chapters.EditionEntry.ChapterTrack.ChapterAtom, chapterAtom)
	}

	// 写入文件
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	// 添加XML声明
	file.WriteString(xml.Header)

	// 编码XML
	encoder := xml.NewEncoder(file)
	encoder.Indent("", "  ")
	if err := encoder.Encode(chapters); err != nil {
		return err
	}

	return nil
}