# Whisper Comment 使用指南

## 开发环境

### 启动开发服务器

使用 live-server 启动静态服务器（推荐）：

```bash
# 使用 npm 脚本启动
npm run serve

# 或者直接使用 live-server
live-server --port=8080 --open=./demo.html
```

### 构建项目

```bash
# 构建库文件
npm run build

# 构建后预览
npm run preview
```

## 在项目中使用

### 方式一：自动挂载（推荐）🆕

最简单的使用方式，无需手动初始化！

#### 1. 引入脚本

```html
<script src="./dist/whisper-comment.umd.js"></script>
```

#### 2. 添加容器元素

```html
<!-- 基础用法：使用默认配置 -->
<div data-whisper-comment></div>

<!-- 自定义配置 -->
<div
  data-whisper-comment
  data-title="参与讨论"
  data-class-name="my-custom-class"
></div>
```

#### 3. 完成！

组件会在页面加载完成后自动挂载到所有具有 `data-whisper-comment` 属性的元素上。

### 方式二：手动挂载（向后兼容）

如果你需要更多控制权，可以使用传统的手动挂载方式。

#### 1. 引入脚本

```html
<script src="./dist/whisper-comment.umd.js"></script>
```

#### 2. 添加容器元素

```html
<div id="whisper-comment"></div>
```

#### 3. 手动初始化组件

```html
<script>
  // 等待页面加载完成后初始化
  window.addEventListener("load", function () {
    function initComment() {
      if (typeof window.WhisperComment !== "undefined") {
        window.WhisperComment.mount("#whisper-comment", {
          title: "评论区",
          className: "my-custom-class",
        });
      } else {
        setTimeout(initComment, 100);
      }
    }

    initComment();
  });
</script>
```

## 配置选项

### 自动挂载配置

通过 data 属性配置组件：

| 属性                   | 类型   | 默认值   | 说明                             |
| ---------------------- | ------ | -------- | -------------------------------- |
| `data-whisper-comment` | -      | -        | 标识元素需要挂载评论组件（必需） |
| `data-title`           | string | '评论区' | 评论区的标题                     |
| `data-class-name`      | string | ''       | 自定义 CSS 类名                  |

### 手动挂载配置

通过 JavaScript 对象配置组件：

| 参数        | 类型   | 默认值   | 说明            |
| ----------- | ------ | -------- | --------------- |
| `title`     | string | '评论区' | 评论区的标题    |
| `className` | string | ''       | 自定义 CSS 类名 |

## 高级用法

### 多个评论区

你可以在同一个页面中放置多个评论区：

```html
<!-- 自动挂载方式 -->
<div data-whisper-comment data-title="文章评论"></div>
<div data-whisper-comment data-title="用户讨论"></div>

<!-- 手动挂载方式 -->
<div id="article-comments"></div>
<div id="user-discussion"></div>

<script>
  WhisperComment.mount("#article-comments", { title: "文章评论" });
  WhisperComment.mount("#user-discussion", { title: "用户讨论" });
</script>
```

### 手动触发自动挂载

如果你的页面内容是动态生成的，可以手动触发自动挂载：

```html
<script>
  // 添加新的评论区元素后
  document.body.innerHTML +=
    '<div data-whisper-comment data-title="新评论区"></div>';

  // 手动触发自动挂载
  WhisperComment.autoMount();
</script>
```

## API 参考

### 全局对象

`window.WhisperComment` 提供以下方法和属性：

#### `mount(selector, options)`

手动挂载组件到指定元素。

- `selector` (string): CSS 选择器
- `options` (object): 配置选项
  - `title` (string): 评论区标题
  - `className` (string): 自定义 CSS 类名

#### `autoMount()`

手动触发自动挂载功能，查找并挂载所有具有 `data-whisper-comment` 属性的元素。

#### `Comments`

Preact 组件类，可直接在 Preact/React 项目中使用。

## 特性

- ✅ **自动挂载**：无需手动初始化，开箱即用
- ✅ **响应式设计**：适配各种设备
- ✅ **树形结构**：支持评论和回复的层级结构
- ✅ **交互动画**：点赞和踩功能，带有流畅的动画效果
- ✅ **用户友好**：优秀的交互体验
- ✅ **现代设计**：符合当前设计趋势
- ✅ **轻量高性能**：基于 Preact，体积小速度快
- ✅ **零依赖**：使用 TwindCSS，无需额外 CSS 文件
