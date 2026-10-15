# webcraft · 网页版我的世界

单文件 WebGL 体素沙盒游戏（Minecraft 风格）：程序化生成方块地形，第一人称自由行走/飞行，**左键挖方块、右键放方块**，9 格方块选栏，支持保存/读档。零依赖、零构建、零外部资源（不依赖 three.js，手写着色器与矩阵）。

## 特性

- **程序化地形**：fBm 噪声高度图 → 草/泥土/石头/沙子，水面、成年树木（可挖）
- **第一人称控制**：Pointer Lock 鼠标视角、WASD 移动、空格跳跃、重力 + AABB 碰撞、自动爬 1 格台阶
- **飞行模式**：双击空格切换，空格上升 / Shift 下降
- **挖掘与建造**：DDA 体素射线选块（6 格距离），左键破坏、右键放置，放置不与玩家重叠
- **方块选栏**：1-9 数字键 / 滚轮 / 点击切换（草、泥土、石头、沙、原木、树叶、木板、砖、水）
- **渲染**：按面剔除只画暴露面、顶面更亮、距离雾效、坐标/朝向/手持/模式 HUD、fps
- **存档**：世界改动 + 玩家状态 RLE 压缩存 localStorage，主菜单读档、退出自动存
- **响应式**：≤900/≤640/≤420 三档断点；触屏显示虚拟摇杆 + 跳/挖/放按钮 + 拖动转视角

## 操作

| 按键 | 作用 |
|---|---|
| W A S D | 移动 |
| 鼠标 | 视角（点画面锁定指针） |
| 空格 | 跳跃 / 飞行上升 |
| 双击空格 | 切换飞行 |
| Shift | 飞行下降 |
| 左键 / 右键 | 挖方块 / 放方块 |
| 1-9 / 滚轮 | 切换手持方块 |
| Esc | 暂停并释放鼠标 |

## 本地运行

```bash
open index.html                # 直接浏览器打开（需 WebGL）
# 或
python3 -m http.server 8080   # http://localhost:8080
```

## 结构（单文件 index.html）

- 世界：`Uint8Array` 体素、`genWorld`（噪声高度+树+水）、`hash2/noise2/fbm`
- 渲染：手写 `mat4Perspective`、按面剔除 `rebuildMesh`（仅暴露面）、WebGL 顶点色着色器 + 雾
- 交互：Pointer Lock 视角、`collide` AABB、`raycast` DDA 选块、`breakBlock/placeBlock`
- UI：HUD、选栏、开始/暂停菜单、toast、触屏摇杆
- 存档：`saveGame/loadGame`（RLE 压缩 → localStorage `webcraft_save_v1`）

## 部署

静态页已部署 GitHub Pages：`demo-test/webcraft/`。