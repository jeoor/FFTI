# FFTI — 发疯人格类型指标

> 用科学测量你的不科学。

一个纯前端人格测试 web app，基于 15 维度 × 5 模型的向量匹配算法，覆盖 25 种标准人格 + 3 种隐藏人格。

## 在线体验

👉 [https://fun.kayro.cn/ffti/](https://fun.kayro.cn/ffti/)

## 特性

- **28 种人格类型** — 25 标准 + 3 隐藏（LOOP404 / GONE / NULL）
- **15 维画像** — 爆发(E) / 内耗(R) / 解构(D) / 生存(S) / 身份(X) 五大模型
- **曼哈顿距离匹配** — 15 维 L/M/H 向量，相似度排序
- **隐藏题触发** — 满足维度条件自动插入隐藏题，选 C 解锁特殊人格
- **Canvas 分享图** — 一键生成带雷达图、头像、二维码的结果海报
- **28 个 SVG 头像** — 每种人格独立设计
- **移动端优先** — 响应式 + 触摸动效 + `prefers-reduced-motion` 适配

## 快速开始

```bash
git clone https://github.com/jeoor/FFTI.git
cd SBTI
npm install
npm run dev
```

```bash
npm run build      # 产物在 dist/
npm run preview    # 预览构建结果
```

## 项目结构

```
├── data/
│   ├── questions.json       # 32 主题 + 3 隐藏题
│   ├── dimensions.json      # 15 维度定义 + 模型元数据
│   ├── types.json           # 25 标准 + 3 特殊人格
│   └── config.json          # 阈值、文案、触发配置
├── src/
│   ├── main.js              # 入口：加载数据、页面切换、事件绑定
│   ├── engine.js            # 纯函数：评分、匹配、隐藏触发
│   ├── quiz.js              # 答题流程：队列、进度、隐藏题插入
│   ├── result.js            # 结果页渲染
│   ├── chart.js             # Canvas 雷达图
│   ├── share.js             # Canvas 分享图生成
│   ├── avatar.js            # 头像 URL 解析
│   ├── style.css            # 设计系统（CSS 变量 + 动效）
│   └── utils.js             # shuffle 等工具函数
├── ffti-avatars/            # 28 个 SVG 人格头像
├── index.html
└── vite.config.js
```

## 核心算法

### 评分

1. 每题 3 选项：A=1, B=2, C=3
2. 每维度 2-3 题，求和得原始分（范围 2-9）
3. 按均值分级：avg ≤ 1.5 → L，1.5 < avg < 2.5 → M，avg ≥ 2.5 → H

### 匹配

1. 用户 15 维 L/M/H → 数值向量 (L=1, M=2, H=3)
2. 与每种人格 pattern 做曼哈顿距离：`distance = Σ|user[i] - type[i]|`
3. `similarity = max(0, round((1 - distance/30) * 100))`
4. 排序：distance ASC → exact DESC → similarity DESC

### 隐藏人格触发

| 人格 | 出现条件 | 解锁条件 |
|------|----------|----------|
| LOOP404 | R1/R2/R3 全 H | QH1 选 C，且 R1/R2/R3 ≥ 2 个 H |
| GONE | S1/S2/S3 全 H 且 E1 H | QH2 选 C，且 S1/S2 ≥ 1 个 H |
| NULL | 15 维无 H | QH3 选 C，且最佳匹配相似度 < 55% |

## 定制

所有测试内容在 `data/` 目录，改 JSON 即可，无需改代码。

### 改题目

编辑 `data/questions.json`：

```json
{
  "id": "q1",
  "dim": "E1",
  "text": "你的题目",
  "options": [
    { "label": "选项A", "value": 1 },
    { "label": "选项B", "value": 2 },
    { "label": "选项C", "value": 3 }
  ]
}
```

### 加人格

编辑 `data/types.json` → `standard` 数组。`pattern` 必须是 15 个 L/M/H，按 `E1-E3|R1-R3|D1-D3|S1-S3|X1-X3` 排列。

### 改阈值

编辑 `data/config.json` → `scoring.levelThresholds`。

## 部署

构建产物是纯静态文件，`dist/` 可部署到任何静态服务器。

```bash
npm run build
# dist/ → GitHub Pages / Vercel / Netlify / 任何 HTTP 服务器
```

资源路径使用相对路径 (`./`)，放到任意子目录均可运行。

## 技术栈

- [Vite](https://vitejs.dev/) — 构建
- Vanilla JS — 无框架依赖
- Canvas API — 雷达图 + 分享图
- CSS Custom Properties — 设计系统

## 致谢

原创测试设计：B站UP主 [@蛆肉儿串儿](https://space.bilibili.com/417038183)

## License

[MIT](LICENSE)
