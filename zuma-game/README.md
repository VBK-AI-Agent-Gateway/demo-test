# zuma-game · 网页版祖玛

单文件 HTML5 Canvas 祖玛（Zuma）游戏：彩色珠子沿螺旋轨道涌向洞口，玩家用中心炮台瞄准发射同色珠子，**3 连及以上消除**，消除后珠子回缩可制造**连锁**；清空全部珠子获胜，珠子进洞失败。零依赖、零构建。

## 玩法

- **移动鼠标 / 拖动触摸** 炮台瞄准，**点击 / 松手** 发射珠子
- 命中珠链后按飞行方向插入前侧或后侧；同色连续 ≥3 即消除
- 消除后产生间隙，后方珠子回缩合并，可能触发**连锁反应**（COMBO 加成）
- 珠链持续推进，全部 **90 颗**珠子出完后加速；清空即胜，头珠抵达洞口即败
- 快捷键：`空格` 暂停 · `Q` 交换当前/备用珠 · `Esc` 暂停

## 特性

- 弧长参数化珠链（`s` 坐标）+ 二分定位渲染，碰撞与推进稳定
- 间隙回缩平滑动画、连锁判定、连击倍率（x1~x9）
- 计分 / 剩余 / 危险进度 HUD、屏幕震动、WebAudio 音效（可静音）
- 菜单 / 暂停 / 胜负结算三态覆盖层
- 响应式：画布按容器等比缩放，三档断点（≤900/≤640/≤420），支持触摸

## 本地运行

```bash
open index.html            # 直接浏览器打开
# 或
python3 -m http.server 8080  # http://localhost:8080
```

## 结构

单文件 `index.html`：样式（暗色主题 + 覆盖层）+ 内嵌 JS：
- `buildPath/posAt` — 螺旋路径采样与弧长定位
- `resetGame/updateChain/updateSpawning` — 状态与珠链推进
- `fire/updateFlying/insertBall/checkMatches/collapseGap` — 发射、碰撞、插入、消除、回缩
- `drawPath/drawBall/drawShooter/drawChain` — Canvas 渲染
- `startGame/setPause/endGame` — 流程控制

## 部署

静态页已部署 GitHub Pages：`demo-test/zuma-game/`。