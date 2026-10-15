# task-optimistic-lock

任务更新接口的**乐观锁（版本号）**实现：并发更新时检测冲突并返回 **409 Conflict**，前端提示用户刷新。附并发集成测试（两个请求同时改同一任务 → 一个 200、一个 409）。

## 机制

- 每个任务带 `version` 列，创建时为 `1`
- 客户端读任务时拿到 `version`，**更新时必须回传**它作为期望版本
- 服务端用原子 CAS 写入：

```sql
UPDATE tasks SET title=?, status=?, version = version + 1
WHERE id = ? AND version = ?          -- 期望版本
```

- `changes === 0` → 说明行已被并发写者改过 → 返回 **409 CONFLICT**，`details` 带服务端当前版本与最新任务，前端据此提示「任务已被他人修改，请刷新」

### 409 响应示例

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Version conflict: this task was modified by another request. Refresh to get the latest version.",
    "details": {
      "expectedVersion": 3,
      "currentVersion": 4,
      "task": { "id": "t-...", "title": "...", "version": 4 }
    }
  }
}
```

## 快速启动

```bash
docker compose up --build
# 看板 UI:  http://localhost:3000/
# API 索引: http://localhost:3000/api

# 本地跑
cp .env.example .env && npm install && npm run dev
```

看板上的 **⚡ 模拟并发冲突** 按钮会对同一任务同时发两个相同 version 的 PUT，直观展示 200/409 与刷新提示。

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/tasks` | 列表（`page` `pageSize` `q`），含 `version` |
| GET | `/api/tasks/:id` | 详情（含 `version`） |
| POST | `/api/tasks` | 创建 `{title, description?, status?}`，version=1 |
| PUT | `/api/tasks/:id` | 更新，**必须带 `version`**；不匹配 → 409；缺省 → 400 |
| DELETE | `/api/tasks/:id?version=N` | 带版本守卫的删除；不匹配 → 409；不带 version 则直接删 |

## 并发测试

```bash
npm install && npm test
# 或 docker compose --profile test run --rm test
```

关键用例（`tests/tasks.test.js`）：

1. **并发双请求**：`Promise.all` 同时 PUT 同一任务、携带相同 version → 断言 `[200, 409]`，赢家 version+1，输家信封含 `expectedVersion/currentVersion`，最终 DB 只 +1
2. **5 写者踩踏**：5 个同 version 请求 → 恰好 1 个 200、4 个 409、version 只 +1
3. 正常更新 version+1；过期 version → 409；缺 version → 400；未知 id → 404
4. 带版本删除：过期 → 409，正确 → 204

## 目录结构

```
src/
  db.js                 # SQLite 建表 + version 列迁移 + 种子
  routes/tasks.js       # 乐观锁 CAS 更新（核心）
  middleware/error.js    # 统一错误信封 + 409 CONFLICT
  middleware/validate.js# zod 校验
  app.js  server.js
public/index.html       # 任务看板前端（409 刷新提示 + 并发演示）
tests/tasks.test.js     # 并发测试（一 200 一 409）
docker-compose.yml      # api（+ test profile）
Dockerfile  README.md  jest.config.js  package.json  .env.example
```

## 技术栈

Node 20 · Express 4 · better-sqlite3（原子 CAS 乐观锁）· zod 3 · Jest + Supertest 7 · Docker Compose