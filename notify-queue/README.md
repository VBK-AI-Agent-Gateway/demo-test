# notify-queue

BullMQ（同类队列）notification queue：**邮件 / 站内信**投递，带**失败自动重试**、**最大重试次数**与**死信队列（DLQ）**，并提供一个小型 Express 管理 API。

## 特性

- **队列**：BullMQ + Redis，队列名 `notifications`
- **自动重试**：指数退避（`exponential`，base 500ms）
- **最大次数**：`MAX_ATTEMPTS`（默认 3），耗尽后标记 `failed`
- **死信队列**：
  1. BullMQ 内建 `failed` set（`queue.getFailed()`）
  2. Worker 的 `failed` 事件把耗尽任务复制进独立队列 `notifications-dlq`，可通过 API 查看 / 重投
- **管理 API**：入队、任务状态、队列统计、死信列表、死信重投、投递日志
- **校验 / 统一错误**：zod + `{ error: { code, message, details } }` 信封

## 快速启动

```bash
# 起 Redis + API(:3000) + Worker
docker compose up --build

# 入队一条通知
curl -X POST http://localhost:3000/api/notifications \
  -H 'content-type: application/json' \
  -d '{"channel":"email","to":"a@example.com","subject":"Hi","body":"Hello"}'

# 查看任务状态
curl http://localhost:3000/api/notifications/<JOB_ID>

# 查看死信
curl http://localhost:3000/api/dead-letters

# 重投死信
curl -X POST http://localhost:3000/api/dead-letters/<DLQ_ID>/retry

# 查看投递日志（内存 demo）
curl http://localhost:3000/api/deliveries
```

## 运行测试（三条验收）

```bash
# 需要可达的 Redis（默认 redis://localhost:6379）
docker compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from test
# 或本地：起好 Redis 后
npm install && npm test
```

测试覆盖：
1. **正常消费**：email/inapp 任务入队后 Worker 消费并记录投递，`state=completed`
2. **失败重试**：`failTimes` 注入前 N 次失败 → 指数退避重试 → 最终成功，`attemptsMade≥N`
3. **进入死信**：`alwaysFail` 耗尽 `MAX_ATTEMPTS` → `state=failed`、出现在 `/api/dead-letters`、复制进 `notifications-dlq`、可重投成功、`deadLettered=true`

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| GET | `/api` | 端点索引 |
| POST | `/api/notifications` | 入队 `{channel, to, subject?, body?, failTimes?, alwaysFail?}` |
| GET | `/api/notifications` | 队列统计（waiting/active/completed/failed） |
| GET | `/api/notifications/:id` | 任务状态（state/attempts/deadLettered/reason） |
| GET | `/api/dead-letters` | 死信列表（DLQ 队列 + 主队列耗尽任务） |
| POST | `/api/dead-letters/:id/retry` | 死信重投（清除失败注入后重新入队） |
| GET | `/api/deliveries` | 内存投递日志（demo） |

### 错误信封

```json
{ "error": { "code": "BAD_REQUEST", "message": "Validation failed", "details": {} } }
```

## 目录结构

```
src/
  queues.js           # 队列工厂：重试策略 / MAX_ATTEMPTS / DLQ
  worker.js           # Worker 消费：模拟 email/inapp 投递 + 失败注入 + DLQ 转发
  redis.js            # ioredis 连接（BullMQ 双连接）
  app.js              # Express 管理 API（可注入 queue/dlq 便于测试）
  server.js           # 启动入口
  middleware/error.js # ApiError + 统一错误信封
tests/queue.test.js   # 三条验收的集成测试
docker-compose.yml    # redis + api + worker
docker-compose.test.yml # redis + jest
Dockerfile  README.md  jest.config.js  package.json
```

## 技术栈

Node 20 · BullMQ 5 · Redis 7 · Express 4 · zod 3 · Jest + Supertest 7 · Docker Compose