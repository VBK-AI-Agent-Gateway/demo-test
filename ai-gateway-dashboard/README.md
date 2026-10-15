# ai-gateway-dashboard · AI 智能网关数字大屏

单文件 HTML5 DataV 风格**数字大屏 demo**：深色科技感全屏仪表盘，展示 AI 网关核心指标，所有数字与图表**动态模拟刷新**。零依赖、零 CDN、零 echarts、零构建（图表全部 Canvas 手绘 + DOM 动画）。

## 大屏构成

- **顶部标题栏**：渐变发光标题 + LIVE 指示 + 实时时钟/日期
- **KPI 行（6 卡）**：今日请求量、实时 QPS、平均延迟、Token 消耗、错误率、在线模型——每 1.5s 跳变 + 同比趋势
- **左列**：24h 请求趋势（Canvas 面积折线 + 高亮点）、渠道调用占比（Canvas 环形 + 图例）
- **中列**：全球网关节点拓扑（点阵世界地图 + 脉冲节点 + **贝塞尔流光粒子**动画 + 在线/吞吐/成功率）、实时请求流（每 0.8s 逐条滚动新增，含状态码/模型/路由/耗时）
- **右列**：模型调用排行 TOP8（动态条形，每 1.5s 增长重排）、告警/事件中心（每 7s 推新，级别着色）

## 视觉效果

网格底纹 + 径向光晕 + 扫描线（`mix-blend-mode`）、发光描边、面板渐变头标、数字 text-shadow 呼吸感。

## 数据说明

全部为前端**模拟数据源**（`tickData()` 每 1.5s 推进、日志每 0.8s、告警每 7s），无后端、无网络请求，刷新即演示。

## 响应式（三档断点）

- ≤1280px：三栏收紧、KPI 字号下调
- ≤900px：改为单栏纵向堆叠、header 换行、页面可滚动
- ≤640px / ≤420px：KPI 两列、日志字号/栏宽压缩

## 本地运行

```bash
open index.html                # 直接浏览器打开
# 或
python3 -m http.server 8080   # http://localhost:8080
```

## 结构（单文件 index.html）

- 样式：CSS 变量科技配色、栅格布局、扫描线/网格、三档媒体查询
- 工具：`fmt/dpr/clamp/rand`（含高分屏 canvas 适配）
- KPI：`updateKPI/trendHTML`（跳变 + 趋势箭头）
- 图表：`drawTrend`（面积折线）、`drawDonut`（环形+图例）、`drawMap`（点阵地图+脉冲节点+光点）、`stepParticles`（贝塞尔粒子）
- 流：`makeLog/pushLog`（日志流）、`renderRank`（条形排行）、`pushAlert/renderAlerts`（告警）
- 循环：`setInterval` 数据推进 + `requestAnimationFrame` 图表动画

## 部署

静态页已部署 GitHub Pages：`demo-test/ai-gateway-dashboard/`。