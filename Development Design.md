## **技术方案设计文档 (修订版) - "轻语评论" (WhisperComment)**

| **文档名称** | WhisperComment 技术方案设计 (Node.js & 免费优先版) |
| :--- | :--- |
| **版本** | V1.1 |
| **关联文档** | WhisperComment 产品需求文档 V1.0 |
| **核心约束** | **后端技术栈: Node.js**, **启动预算: ¥0** |
| **更新日期** | 2025年7月9日 |

-----

### 1\. 系统架构 (System Architecture)

我们将采用基于云原生的、前后端分离的模块化架构，以支持高并发、低延迟和未来的可扩展性。

**核心组件说明**:

1.  **CDN (内容分发网络)**:

      * **职责**: 全球分发 `embed.js` 静态资源。
      * **目的**: 保证无论最终用户在世界何处，都能以极低的延迟加载评论系统脚本，这是性能的第一道保障。

2.  **前端客户端 (`embed.js`)**:

      * **职责**: 嵌入在客户网站上，负责渲染评论UI、处理用户交互、与后端API通信、管理WebSocket连接。这是系统的“门面”。

3.  **负载均衡器 (Load Balancer)**:

      * **职责**: 将来自客户端的HTTP和WebSocket流量分发到后端的多个服务实例。
      * **目的**: 实现高可用性和水平扩展。

4.  **后端服务 (Backend Services)**:

      * **核心API服务**: 处理所有RESTful API请求，如发表评论、获取评论列表、管理操作等。这是系统的“大脑”。
      * **实时通知服务**: 专门管理WebSocket长连接，负责实时消息的推送。这是系统的“神经网络”。
      * **反垃圾管道 (Anti-Spam Pipeline)**: 一个内部处理流，负责对新评论进行多阶段的过滤和分析。

5.  **数据存储层 (Data Stores)**:

      * **主数据库 (PostgreSQL)**: 存储核心业务数据，如网站、评论、用户身份等结构化数据。
      * **缓存/内存数据库 (Redis)**: 存储临时性、高频访问的数据，如会话信息、WebSocket连接映射、速率限制计数器等。

-----

### 2\. 技术栈 (Technology Stack) - **Node.js 生态 & 免费优先**

| 层面 | 技术选型 | 理由 |
| :--- | :--- | :--- |
| **前端客户端** | **Preact + TypeScript + Vite** | 仍然是最佳选择，极致轻量，对客户网站影响最小。 |
| **后端框架** | **Node.js + Fastify + TypeScript** | **Node.js**: 满足您的指定要求。**Fastify**: 一个高性能、低开销的Node.js框架，性能优于Express，拥有出色的TypeScript支持和插件生态，非常适合构建API。**TypeScript**: 保证了代码的类型安全和可维护性。 |
| **数据库ORM** | **Prisma** | **Prisma**: 一个现代化的Node.js ORM。其最大的优势是**类型安全**，它可以从数据库结构自动生成类型，让您的代码在编译时就能发现数据库相关的错误。开发体验和健壮性远超传统ORM。 |
| **数据库** | **Neon (PostgreSQL), Upstash (Redis)** | **Neon**: Serverless PostgreSQL服务，它的**免费额度非常慷慨**（例如：包含1个项目，10个分支，3GiB存储），且支持自动休眠，在没有请求时不会产生费用，完美契合零预算启动。**Upstash**: Serverless Redis服务，提供**每日10,000条命令的免费额度**，足以支撑产品初期的缓存和WebSocket映射需求。 |
| **实时通信** | **`@fastify/websocket` (基于 `ws`)** | `ws`是Node.js生态中性能最高的WebSocket库。`@fastify/websocket`插件可以将其与Fastify框架无缝集成。 |
| **部署与基础设施**| **Vercel (后端), Cloudflare (CDN)** | **Vercel**: 提供了非常强大的**免费Serverless Functions额度**，非常适合托管Node.js API。其全球边缘网络能保证API的低延迟响应。部署流程与GitHub完美集成，极其简单。**Cloudflare**: 提供**顶级的免费CDN服务**，包含SSL、DDoS防护等，是托管`embed.js`静态脚本的不二之选。 |

-----

### 3\. 数据模型设计 (Database Schema)

以下是核心表的初步设计 (使用PostgreSQL语法)。

```sql
-- 存储客户网站信息
CREATE TABLE sites (
    site_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL, -- 关联到SaaS平台的付费用户
    domain VARCHAR(255) UNIQUE NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    settings JSONB, -- 存储外观定制、反垃圾设置等
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 存储评论信息
CREATE TABLE comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(site_id),
    page_identifier TEXT NOT NULL, -- 由URL等生成的页面唯一标识
    parent_id UUID REFERENCES comments(comment_id), -- 用于评论嵌套
    author_token TEXT NOT NULL, -- 用户的匿名身份标识
    author_nickname VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0, -- 0: pending, 1: approved, 2: rejected, 3: spam
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_page_identifier ON comments(site_id, page_identifier);
CREATE INDEX idx_comments_author_token ON comments(author_token);

-- 存储浏览器推送订阅信息
CREATE TABLE push_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    author_token TEXT NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    keys JSONB NOT NULL, -- 存储p256dh和auth密钥
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 存储DID身份与匿名身份的关联
CREATE TABLE did_associations (
    author_token TEXT PRIMARY KEY,
    did_address VARCHAR(255) UNIQUE NOT NULL,
    did_type VARCHAR(20) NOT NULL, -- e.g., 'eip155' for Ethereum
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

-----

### 4\. 核心组件实现详解 (Node.js 版)

#### 4.1 `embed.js` 客户端工作流

1.  **初始化**: 脚本加载后，查找页面中预设的`<div id="whisper-comment"></div>`容器。
2.  **配置加载**: 从`div`的`data-api-key`属性中读取API Key。
3.  **渲染UI**: 向后端`GET /api/v1/config?api_key=...`请求网站的定制化配置（如主题颜色）。渲染评论框和评论列表的骨架屏。
4.  **身份检查**: 调用`Identity.init()`模块，检查`localStorage`中是否存在`whisper_token`，若无则生成。
5.  **数据获取**: 调用`GET /api/v1/comments?page=...`获取当前页面的评论列表并渲染。
6.  **建立长连接**: 初始化`Notification.connect()`模块，使用`userToken`与实时通知服务建立WebSocket连接。

#### 4.2 分层通知系统实现 (Node.js 版)

  * **Tier 1 (WebSocket)**:

    1.  使用`@fastify/websocket`插件在Fastify应用中注册一个WebSocket路由，例如`/ws`。
    2.  当有新连接时，在`connection`事件处理器中接收客户端的`auth`消息。
    3.  使用 **Upstash Redis** 客户端，将`userToken`与一个唯一的`connectionId`（可以是随机字符串或服务器标识+内部ID）进行映射。
    4.  当API侧（例如发表评论的HTTP请求处理函数中）需要推送通知时，它会向一个**Redis Pub/Sub**频道发布消息。
    5.  WebSocket服务实例订阅此频道。收到消息后，通过`userToken`在Upstash Redis中查找对应的连接信息，并将消息通过该连接推送出去。（注意：在Serverless环境下，每个请求可能是独立的实例，Pub/Sub是跨实例通信的关键）。

  * **Tier 2 (Web Push)**:

    1.  安装并使用`web-push`这个NPM包。
    2.  `POST /api/v1/subscribe`这个API路由的处理函数中，接收到浏览器的`PushSubscription`对象后，将其与`userToken`关联，并使用**Prisma Client**存入由**Neon**托管的PostgreSQL数据库中。
    3.  当需要发送推送时，从数据库中取出订阅对象，使用`web-push`库的`sendNotification`方法发送推送。

-----

### 5\. API设计 (部分核心)

所有API端点均以`/api/v1`为前缀。

  * **`POST /comments`**: 创建评论

      * **Request Body**: `{ "api_key": "...", "page_identifier": "/path/to/page", "content": "...", "nickname": "...", "user_token": "...", "parent_id": "..." }`
      * **Success Response (201)**: `{ "comment_id": "...", "status": "pending", ... }`

  * **`GET /comments`**: 获取评论列表

      * **Query Params**: `api_key=...`, `page_identifier=...`, `sort_by=newest`, `limit=20`, `offset=0`
      * **Success Response (200)**: `{ "comments": [ ... ], "total": 123 }`

  * **`POST /identities/connect-did`**: 连接DID

      * **Request Body**: `{ "user_token": "...", "did_address": "0x123...", "signature": "0xabc..." }`
      * **Success Response (200)**: `{ "status": "verified", "jwt_token": "..." }` (返回一个JWT用于后续的已验证操作)

-----

### 6\. 部署与基础设施 (零预算方案)

这是本修订版的核心。我们将利用以下服务的免费套餐构建一个完整的、生产可用的系统。

1.  **前端脚本 (`embed.js`) 部署**:

      * **服务**: **Cloudflare Pages**
      * **流程**: 将前端项目代码推送到GitHub仓库。连接Cloudflare Pages到该仓库，开启自动部署。每次`push`代码，Cloudflare会自动构建并将其部署到全球CDN网络。
      * **成本**: **¥0** (Cloudflare的免费计划非常慷慨)。

2.  **后端API (Node.js) 部署**:

      * **服务**: **Vercel**
      * **流程**: 将Fastify应用代码推送到GitHub仓库。在Vercel上创建一个新项目并连接到该仓库。Vercel会自动识别Node.js项目并将其部署为Serverless Functions。
      * **成本**: **¥0** (Vercel的免费额度足够支撑产品早期发展)。

3.  **数据库部署**:

      * **PostgreSQL**: 在 **Neon** 官网创建一个免费项目，获取数据库连接字符串。
      * **Redis**: 在 **Upstash** 官网创建一个免费数据库，获取连接URL和Token。
      * **流程**: 将Neon和Upstash的连接信息，作为**环境变量**配置到Vercel的项目设置中。您的Node.js应用将通过这些环境变量连接到数据库。
      * **成本**: **¥0**。

**总结**: 通过 **Cloudflare + Vercel + Neon + Upstash** 这个组合，您可以在完全零前期投入的情况下，搭建并上线一个高性能、可扩展、全球部署的SaaS应用。