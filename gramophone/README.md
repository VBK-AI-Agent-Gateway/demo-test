# gramophone · 古典音乐留声机（网页版）

单文件 HTML5 **复古留声机**，内置 8 首古典名曲，用 **WebAudio 实时合成旋律**（无需任何音频文件、零 CDN、零构建），打开即听。

## 特性

### 🎵 曲库（音符级合成，非音频文件）
- 致爱丽丝 — 贝多芬
- 第40号交响曲主题 — 莫扎特
- 夜曲 Op.9 No.2 — 肖邦
- 月光 ( Clair de Lune ) — 德彪西
- G弦上的咏叹调 — 巴赫
- 四季·春 第一乐章 — 维瓦尔第
- 天鹅湖主题 — 柴可夫斯基
- 爱之梦 — 李斯特

每曲含：作曲家、调性、BPM、主旋律 + 低音两声部音符序列（MIDI 音高 + 拍位）。

### 🎛 播放控制
- 播放 / 暂停（大按钮 + 空格键 + 点唱片也能切换）
- 上一曲 / 下一曲（← → 方向键）
- 进度条拖动 seek（已播音符跳过，避免爆音）
- 音量滑杆（`master.gain` 平滑调节）
- 🔁 单曲循环、🔀 随机播放
- 曲库列表点播，当前曲高亮 + EQ 呼吸动画

### 🎨 视觉
- 复古木质机身 + 黄铜描边 + SVG 喇叭（播放时脉冲律动）
- 唱片转盘（播放时匀速旋转）+ 唱臂落下动画
- Canvas 频谱可视化（AnalyserNode 驱动，红金渐变柱状）
- 标题铭牌、曲库专辑封面卡片

### 🔊 音频引擎
- `AudioContext` + 主/低音双声部
- **look-ahead 调度器**（120ms 前瞻 / 30ms tick）避免 WebAudio 抢调度爆音
- 三角波主音 + 正弦泛音加 warmth，指数包络起音/释音
- `AnalyserNode` 取频谱驱动动画

### 📱 响应式（三档断点）
- ≤900px：单栏堆叠（机器在上、控制台在下）
- ≤640px：喇叭/唱片缩小、按钮紧凑
- ≤420px：进一步压缩标题、唱片、按钮、封面

## 本地运行

```bash
open index.html                 # 直接浏览器打开（需点击后才出声，浏览器自动播放策略）
# 或
python3 -m http.server 8080    # http://localhost:8080
```

> 注：浏览器要求用户交互后才能出声，点 ▶ 或唱片即可开始。

## 结构（单文件 index.html）

- 样式：CSS 变量复古配色、留声机机身/喇叭/唱片/控制台、三档媒体查询
- 数据：`NOTE/n/midi2freq/seq` 音名转 MIDI；`TRACKS` 曲库
- 引擎：`ensureAudio/playNote/scheduleLoop` 合成与前瞻调度
- 控制：`play/pause/loadTrack/nextTrack/seekTo/setVol`
- UI：`renderList/markPlayingRow/updateSeekUI/toast`
- 可视化：`drawSpectrum`（rAF 频谱）、`tickProgress`（进度同步）

## 部署

静态页已部署 GitHub Pages：`demo-test/gramophone/`。