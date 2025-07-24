# WhisperComment Server

轻语评论系统的后端服务，基于 Fastify + TypeScript + Prisma 构建。

## 功能特性

- ✅ Fastify 高性能 Web 框架
- ✅ TypeScript 类型安全
- ✅ Prisma ORM 数据库操作
- ✅ 热重载开发环境
- ✅ 环境变量配置
- ✅ 优雅关闭处理

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制环境变量模板文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息。

### 开发模式

```bash
pnpm run dev
```

服务器将在 http://localhost:3000 启动，支持热重载。

### 构建生产版本

```bash
pnpm run build
pnpm run start
```

## API 端点

- `GET /` - 服务状态
- `GET /health` - 健康检查

## 项目结构

```
src/
├── index.ts          # 服务器入口文件
└── ...
```

## 开发计划

- [ ] 数据库模式设计 (Prisma)
- [ ] 评论 API 开发
- [ ] WebSocket 实时通知
- [ ] 用户认证系统
- [ ] 反垃圾机制

## 技术栈

- **框架**: Fastify
- **语言**: TypeScript
- **数据库**: PostgreSQL (Neon)
- **ORM**: Prisma
- **缓存**: Redis (Upstash)
- **部署**: Vercel