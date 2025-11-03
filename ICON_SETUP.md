# PWA 图标设置指南

## 📱 SkinArt Logo 转换为 PWA 图标

由于您的 logo 是 AVIF 格式，需要转换为 PNG 格式并创建不同尺寸。

### 方法一：在线转换（推荐）

1. 访问 https://www.iloveimg.com/convert-to-png 或 https://cloudconvert.com/avif-to-png
2. 上传 `logoSkinart.avif`
3. 下载转换后的 PNG 文件
4. 使用图片编辑工具调整为以下尺寸：
   - **192x192** → 保存为 `logo192.png`
   - **512x512** → 保存为 `logo512.png`
   - **180x180** → 保存为 `apple-touch-icon.png`（用于 iOS）

### 方法二：使用命令行（需要 ImageMagick）

```bash
# 安装 ImageMagick（如未安装）
brew install imagemagick

# 转换并调整尺寸
cd /Users/yaosong/Apps/skinartClockingApp

# 创建 192x192
magick logoSkinart.avif -resize 192x192 client/public/logo192.png

# 创建 512x512
magick logoSkinart.avif -resize 512x512 client/public/logo512.png

# 创建 Apple Touch Icon (180x180)
magick logoSkinart.avif -resize 180x180 client/public/apple-touch-icon.png

# 创建 favicon (32x32)
magick logoSkinart.avif -resize 32x32 client/public/favicon.ico
```

### 方法三：使用在线 PWA 图标生成器

1. 访问 https://www.pwabuilder.com/imageGenerator
2. 上传您的 logo
3. 下载生成的图标包
4. 替换 `client/public/` 中的图标文件

## 📁 文件放置位置

将生成的图标文件放到：
```
/Users/yaosong/Apps/skinartClockingApp/client/public/
├── logo192.png          (192x192)
├── logo512.png          (512x512)
├── apple-touch-icon.png (180x180)
└── favicon.ico          (32x32)
```

## 🔄 重新构建

替换图标后，重新构建 Docker 容器：

```bash
cd /Users/yaosong/Apps/skinartClockingApp
docker-compose build client
docker-compose up -d client
```

## 🎨 主题色建议

基于 SkinArt 的金棕色品牌色：

```json
{
  "theme_color": "#C19A6B",
  "background_color": "#FFFFFF"
}
```

如需更改主题色，编辑 `client/public/manifest.json`。


