# Prisma 数据库管理

这个目录包含了 WhisperComment 项目的数据库模式定义和迁移文件。

## 文件说明

- `schema.prisma` - Prisma 数据库模式定义文件
- `migrations/` - 数据库迁移文件目录（将在首次迁移时创建）

## 数据模型

### Sites (网站)
存储客户网站的基本信息和配置
- `siteId` - 网站唯一标识符
- `ownerId` - 网站所有者ID
- `domain` - 网站域名
- `apiKey` - API密钥
- `settings` - JSON格式的配置信息

### Comments (评论)
存储所有评论数据
- `commentId` - 评论唯一标识符
- `siteId` - 所属网站ID
- `pageIdentifier` - 页面标识符
- `parentId` - 父评论ID（用于回复）
- `authorToken` - 匿名用户标识
- `authorNickname` - 用户昵称
- `content` - 评论内容
- `status` - 审核状态 (0: 待审核, 1: 已通过, 2: 已拒绝, 3: 垃圾评论)

### PushSubscriptions (推送订阅)
存储浏览器推送通知的订阅信息
- `subscriptionId` - 订阅ID
- `authorToken` - 用户标识
- `endpoint` - 推送端点
- `keys` - 推送密钥

### DidAssociations (DID关联)
存储去中心化身份(DID)与匿名身份的关联
- `authorToken` - 匿名用户标识
- `didAddress` - DID地址
- `didType` - DID类型

## 常用命令

### 生成 Prisma 客户端
```bash
pnpm run prisma:generate
```

### 创建和应用迁移
```bash
pnpm run prisma:migrate
```

### 打开 Prisma Studio（数据库可视化工具）
```bash
pnpm run prisma:studio
```

### 重置数据库（开发环境）
```bash
npx prisma migrate reset
```

### 推送模式到数据库（不创建迁移文件）
```bash
npx prisma db push
```

## 环境配置

确保在 `.env` 文件中配置了正确的数据库连接字符串：

```env
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
```

## 注意事项

1. 在生产环境中，请确保数据库连接使用SSL
2. 定期备份数据库
3. 在修改模式之前，请先在开发环境中测试
4. 使用 `prisma migrate` 而不是 `prisma db push` 来管理生产环境的数据库变更