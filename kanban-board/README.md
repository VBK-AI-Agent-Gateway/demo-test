# kanban-board · 看板程序

单文件 HTML 看板（Kanban Board）：三列（待办 / 进行中 / 已完成）、卡片**拖拽移动**（鼠标 + 移动端长按触摸兜底）、任务**增删改**（弹窗表单：标题 / 描述 / 优先级 / 截止日期 / 所在列）、**localStorage 持久化**（刷新不丢）、**搜索 + 优先级过滤**、统计与逾期高亮、**响应式三档断点**（≤900 / ≤640 / ≤420）。零依赖、零构建。

## 使用

- 打开页面即用；点 **＋ 新任务** 或列头 **＋** 新建；点卡片或 ✎ 编辑；✕ 删除。
- **拖拽**：桌面直接拖卡片到目标列；移动端**长按卡片 0.35 秒**进入拖动，再**点击目标列**放置。
- 搜索框按标题/描述过滤；下拉按优先级过滤；**↺ 重置**恢复示例数据。
- 数据存在浏览器 `localStorage`（key `kanban-board-v1`）。

## 本地打开

```bash
# 直接用浏览器打开
open index.html
# 或起个静态服务
python3 -m http.server 8080   # http://localhost:8080
```

## 结构

单文件 `index.html`：
- `<style>`：暗色主题 + 卡片/列/弹窗样式 + 三档响应式
- 数据层：`load/save/seedData`（localStorage）
- 渲染：`render/renderCard/renderStats`（列计数、优先级/日期标签、逾期标记）
- 拖拽：HTML5 `dragstart/dragover/drop` + `touchstart` 长按兜底
- 弹窗：新建/编辑表单，Enter 保存 / Esc 取消
- 工具栏：搜索、优先级过滤、统计、重置

## 部署

静态页已部署 GitHub Pages：`demo-test/kanban-board/`。