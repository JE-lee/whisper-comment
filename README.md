# Whisper Comment

一个**完全独立**的现代化评论组件，基于 Preact 和 TwindCSS 构建，所有依赖都打包在一个 JS 文件中。

## 特性

- ✅ **自动挂载**：无需手动初始化，开箱即用 🆕
- ✅ 响应式设计，适配各种设备
- ✅ 支持评论和回复的树形结构
- ✅ 点赞和踩功能，带有流畅的动画效果
- ✅ 用户友好的交互体验
- ✅ 现代化的视觉设计
- ✅ 基于 Preact，轻量级高性能
- ✅ 使用 TwindCSS，无需额外 CSS 文件

## 安装

### 直接使用（推荐）

#### 方式一：自动挂载 🆕

最简单的使用方式，只需两步：

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的网站</title>
</head>
<body>
    <!-- 1. 添加容器（使用 data 属性） -->
    <div data-whisper-comment></div>
    
    <!-- 2. 引入 JS 文件，组件自动挂载！ -->
    <script src="./dist/whisper-comment.umd.js"></script>
</body>
</html>
```

**自定义配置：**

```html
<!-- 自定义标题和样式 -->
<div data-whisper-comment 
     data-title="参与讨论" 
     data-class-name="my-custom-class"></div>
```

#### 方式二：手动挂载（传统方式）

如果你需要更多控制权：

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的网站</title>
</head>
<body>
    <!-- 添加容器 -->
    <div id="whisper-comment"></div>
    
    <!-- 引入 JS 文件 -->
    <script src="./dist/whisper-comment.umd.js"></script>
    
    <!-- 手动初始化组件 -->
    <script>
        WhisperComment.mount('#whisper-comment', {
            title: '评论区',
            className: 'my-custom-class'
        });
    </script>
</body>
</html>
```

### 通过 CDN 使用

```html
<script src="https://unpkg.com/whisper-comment@1.0.0/dist/whisper-comment.umd.js"></script>
```

### 通过 npm 安装

```bash
npm install whisper-comment
```

```javascript
import { Comments } from 'whisper-comment';
import { render } from 'preact';

render(
    <Comments title="评论区" className="my-custom-class" />,
    document.getElementById('whisper-comment')
);
```

## 配置选项

### 自动挂载配置

通过 data 属性配置：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data-whisper-comment` | - | - | 标识元素需要挂载评论组件（必需） |
| `data-title` | string | '评论区' | 评论区的标题 |
| `data-class-name` | string | '' | 自定义 CSS 类名 |

### 手动挂载配置

通过 JavaScript 对象配置：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | string | '评论区' | 评论区的标题 |
| `className` | string | '' | 自定义 CSS 类名 |

## API 参考

### 全局对象

`window.WhisperComment` 提供以下方法：

- **`autoMount()`** - 手动触发自动挂载功能
- **`mount(selector, options)`** - 手动挂载组件到指定元素
- **`Comments`** - Preact 组件类

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建库
npm run build:lib

# 预览构建结果
npm run preview
```

## 构建输出

构建后会生成以下文件：

- `dist/whisper-comment.umd.js` (82.7 KB) - **完全独立的 UMD 格式文件**，包含所有依赖
- `dist/whisper-comment.es.js` (137.2 KB) - ES 模块格式，适用于现代打包工具
- `dist/whisper-comment.css` - 样式文件（已内联到 JS 中）

**注意：** UMD 文件是完全独立的，包含了 Preact、TwindCSS、图标库等所有依赖。

## 演示

查看 `demo.html` 文件了解完整的使用示例。

## 许可证

MIT 
