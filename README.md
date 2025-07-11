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
