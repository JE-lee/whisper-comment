1. 安装依赖和执行命令都使用 pnpm
2. 对 .env 或者类似的环境变量配置文件进行写入或者删除的时候都要经过确认，避免错误操作
3. 数据库迁移文件要经过确认，避免错误操作
4. Fasity 路由注册函数中的 Request Schema 和 Response Schema 抽离到单独的文件中，避免路由注册函数中的代码冗长, Schema 变量的命令要区分 Request Schema 和 Response Schema。
5. 项目技术栈：
   - 后端：Fastify + Prisma
   - 前端：Preact + Tailwind CSS
   - 数据库： Neon + PostgreSQL, 必要的时候可以通过 Neon MCP 来获取操作数据库。
6. git commit 信息使用英文，并且要符合 Conventional Commit 规范。
