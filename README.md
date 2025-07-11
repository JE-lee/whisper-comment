# Whisper Comment

基于 Preact 和 TwindCSS 构建的现代化评论组件

## 功能特性

- ✨ **现代化设计** - 采用现代 UI/UX 设计理念，界面简洁美观
- 🌳 **树形结构** - 支持评论和回复的多层嵌套显示
- 👍 **互动功能** - 点赞和踩功能，带有流畅的动画效果
- 📱 **响应式设计** - 完美适配桌面、平板和移动设备
- ⚡ **性能优化** - 基于 Preact 构建，轻量且高性能
- 🎨 **样式系统** - 使用 TwindCSS 实现原子化 CSS
- 🔧 **TypeScript** - 完整的类型支持
- 🎭 **用户体验** - 友好的交互设计和反馈
- 🔀 **展开收起** - 智能的回复折叠功能，支持展开/收起长回复串
- 👥 **回复预览** - 收起状态下显示参与讨论的用户头像预览
- 🎬 **流畅动画** - 丰富的CSS动画效果，包括展开/收起、淡入淡出、悬浮缩放等

## 技术栈

- **Preact** - 轻量级 React 替代方案
- **TwindCSS** - 实时 CSS-in-JS 框架
- **TypeScript** - 类型安全的 JavaScript
- **Lucide Icons** - 现代化图标库
- **Vite** - 快速构建工具

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建项目

```bash
pnpm build
```

## 组件使用

### 基础用法

```tsx
import { Comments } from './components/Comments'

function App() {
  return (
    <div>
      <Comments title="评论区" />
    </div>
  )
}
```

### 自定义样式

```tsx
<Comments 
  title="参与讨论" 
  className="my-custom-class"
/>
```

## 组件结构

```
src/
├── components/           # 组件目录
│   ├── Comments.tsx     # 主评论组件
│   ├── CommentForm.tsx  # 评论表单
│   ├── CommentItem.tsx  # 单个评论项
│   ├── CommentList.tsx  # 评论列表
│   └── index.ts         # 组件导出
├── types/               # 类型定义
│   └── comment.ts       # 评论相关类型
├── services/            # 服务层
│   └── commentService.ts # 评论API服务
└── twind.config.ts      # TwindCSS 配置
```

## 数据结构

### Comment 类型

```typescript
interface Comment {
  id: string
  content: string
  author: string
  timestamp: string
  likes: number
  dislikes: number
  userAction: 'like' | 'dislike' | null
  parentId: string | null
  replies: Comment[]
}
```

### API 接口

```typescript
// 创建评论
interface CreateCommentRequest {
  content: string
  author: string
  parentId?: string
}

// 投票
interface VoteRequest {
  commentId: string
  action: 'like' | 'dislike'
}
```

## 交互功能详解

### 展开/收起回复

- **智能默认状态**：顶层和第一层回复默认展开，深层回复（第二层及以下）默认收起
- **展开按钮**：点击"查看 N 条回复"按钮展开所有回复，按钮图标有旋转动画
- **收起按钮**：点击"收起回复"按钮折叠回复列表，带有平滑的收起动画
- **预览模式**：收起状态下显示参与讨论的用户头像和统计信息
- **快速展开**：点击预览区域可快速展开回复
- **动画效果**：
  - 展开时：高度渐变 + 透明度淡入 + 轻微缩放效果
  - 收起时：高度收缩 + 透明度淡出 + 向上位移
  - 按钮交互：悬浮缩放、按下缩小、图标旋转
  - 预览卡片：悬浮时轻微缩放和位移

### 树形结构

- **可视化连接线**：清晰的线条和圆点显示评论层级关系
- **层级缩进**：不同深度的回复有不同的缩进距离
- **无限嵌套**：支持任意深度的回复嵌套（界面上限制最大缩进）

### 动画体验

- **入场动画**：所有评论组件都有淡入动画，给用户流畅的视觉体验
- **交互反馈**：按钮悬浮、点击都有微妙的缩放和颜色变化
- **状态转换**：展开/收起状态切换有 300ms 的平滑过渡
- **连接线动画**：树形结构的连接线也有淡入效果
- **表单动画**：回复表单出现时有下滑动画
- **防抖处理**：动画执行期间禁用重复操作，避免动画冲突

## 自定义主题

可以通过修改 `src/twind.config.ts` 来自定义主题：

```typescript
export default defineConfig({
  presets: [presetAutoprefix(), presetTailwind()],
  theme: {
    extend: {
      colors: {
        primary: {
          // 自定义主色调
        }
      },
      animation: {
        // 自定义动画
      }
    }
  }
})
```

## Mock 数据

当前使用 mock 数据进行演示，生产环境中需要：

1. 替换 `commentService` 中的 API 调用
2. 连接真实的后端服务
3. 处理用户认证和权限

## 贡献

欢迎提交 Issues 和 Pull Requests！

## 许可证

MIT License 
