import { prettifyError, z } from "zod";
import dotenv from "dotenv";
import path from "path";

// 加载 .env 文件（优先项目根目录）
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000").transform((val) => parseInt(val, 10)),
  HOST: z.ipv4().default("0.0.0.0"),
  DATABASE_URL: z.url(),
});


const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ 环境变量校验失败:", prettifyError(parsedEnv.error));
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}

export const env = parsedEnv.data;
