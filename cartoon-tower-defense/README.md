# cartoon-tower-defense · 卡通塔防

单文件 HTML5 Canvas 卡通风格塔防游戏：小怪兽沿道路进攻你的城堡，放置卡通防御塔守住 **10 波**进攻即可**通关**。零依赖、零构建。

## 玩法

- 点右侧塔图标 → 点地图草地**建塔**（道路上/已占用不能建）
- 点已建的塔 → **升级**（最高 Lv.4）/ **出售**（返还 65%）
- 💰 金币来自击杀与波次奖励；❤️ 敌人进城堡扣血（BOSS 扣 5）
- 「下波」手动开波推进；打完全部 10 波且 ❤️>0 即 **胜利通关**（按剩余血量评 S/A/B/C）
- 快捷键：`空格` 暂停 · `Q` 切换 x1/x2/x3 加速 · `Esc` 取消建造/选中

## 塔

| 塔 | 价格 | 特点 |
|---|---|---|
| 🏹 箭塔 | 50 | 攻速快、单体、便宜 |
| 💣 炮塔 | 90 | 范围溅射、单发伤害高、慢 |
| ❄️ 冰塔 | 70 | 命中减速 50%（1.4s） |
| 💰 金库 | 60 | 不攻击，每波产出金币 |

## 敌人

小怪（平衡）· 疾风（快、脆）· 胖子（慢、厚）· BOSS（第 10 波，扣 5 血）。血量随波次小幅成长（+16%/波）。

## 通关要点（可通关设计）

- 10 波固定数据、总金币产出 > 总建塔需求，正常玩法可通关
- 转角处放炮塔（覆盖多段路）+ 冰塔减速是关键；金库早建早回本
- 开局 💰140 可先下 2 箭塔 + 1 冰塔过渡

## 结构

单文件 `index.html`：
- 路径/占用网格：`PATH_CELLS → pathPts/pathCum/posAt/blocked`
- 波次：`WAVES`（10 波固定）、`startWave/spawnEnemy/endWaveIfDone`
- 战斗：`updateTowers/findTarget/updateBullets/applyDamage`、`stepEnemies/updateEnemies`
- 经济：`placeTower/upgradeSelected/sellSelected/towerStats`
- 卡通渲染：`drawMap/drawCastle/drawEnemy/drawTower`（圆角、渐变、描边、表情、血条）
- 流程：`startGame/togglePause/toggleSpeed/endGame`，响应式三档断点

## 本地运行

```bash
open index.html                # 直接浏览器打开
# 或
python3 -m http.server 8080    # http://localhost:8080
```

## 部署

静态页已部署 GitHub Pages：`demo-test/cartoon-tower-defense/`。