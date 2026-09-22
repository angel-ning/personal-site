# personal-site

Youming Ning (Angel) 的个人主页和课程笔记站。Next.js 16，全静态导出，中英双语，支持亮色 / 暗色 / 跟随系统。

## 本地运行

需要 Node ≥ 20.9（本机用 nvm：`nvm use 21`）。

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生成静态站点到 out/
npm run preview    # 本地预览 out/
```

## 加一篇笔记

```bash
npm run add-note -- "<笔记文件路径>" <学期>/<课程>/<类型>/<slug> --week 5 --en "Week 5 · ..." --zh "第 5 周 · ..."
```

例：

```bash
npm run add-note -- "../2026 Fall 1st/ISOM 5260/lectures/lec5/notes.md" 2026-fall-1/isom-5260/lectures/week-05 --week 5 --en "Week 5 · SQL" --zh "第 5 周 · SQL"
```

- **Markdown / MDX**：只复制正文里引用到的图片（放进 `images/`），并改写链接。标题、周次、日期写在文件顶部的 frontmatter 里。
- **HTML**：原样复制为 `index.html`，元数据写在旁边的 `meta.json`。HTML 笔记在网站里嵌入显示，保留自己的样式；只要支持 `<html data-theme="dark|light">`，就会跟随网站主题切换。
- **类型**文件夹可以随便起名。`lectures`、`labs`、`tutorials`、`assignments`、`readings`、`projects`、`exams` 有中英文标签和固定排序，其他名字按原样显示。
- 不想公开的笔记：在 frontmatter / meta.json 里加 `draft: true`。

## MDX 笔记与组件

笔记可以写成 `index.mdx`，在 Markdown 里直接用组件（定义在 `src/components/mdx/`）：

| 组件 | 用法 | 作用 |
|---|---|---|
| `<Callout type="exam\|tip\|warn\|board\|extra\|memo\|note\|todo" title="...">…</Callout>` | 内容前后各空一行 | 考点、踩坑、老师板书、课外补充等提示框 |
| `<Figure src="images/x.png" caption="..." source="Slide 3" board />` | `board` 表示老师手写板书 | 带说明和出处的图 |
| `<QA q="问题">答案</QA>` | 自测题 | 点开看答案 |
| `<LayerStack />` | 数据在 `data/osi.json` | OSI 七层 × PDU × 设备 × TCP/IP 对照 |
| `<SwitchLab />` | 场景在 `data/switch-lab.json` | 交换机 MAC 表 learn / flood / forward / filter 交互演示 |
| `<FcsDemo />` | — | FCS 差错检测交互演示 |

MDX 转成普通 Markdown（GitHub 阅读、导出 PDF 用）：

```bash
npm run mdx-to-md -- content/2026-fall-1/isom-5180/lectures/week-01            # → 同目录 README.md
npm run mdx-to-md -- <笔记目录> --out "<某处>/notes.md" --no-frontmatter         # 连同图片一起导出
```

每个组件都有对应的 Markdown 写法（提示框 → 引用块，交互演示 → 用同一份数据算出的表格）。新增组件时，在 `scripts/mdx-to-md.mjs` 里也加一条。

## 导出笔记

每篇 Markdown / MDX 笔记页面顶部的导航栏有「导出」按钮：

- **Markdown（.zip）**：`npm run build` / `npm run dev` 时由 `scripts/sync-content.mjs` 生成，放在 `public/content/<学期>/<课程>/<类型>/<slug>/<课程>-<类型>-<slug>.zip`，里面是纯 Markdown（MDX 组件已转换）和全部引用到的图片。改了笔记之后要重启 `npm run dev` 才会重新打包。
- **PDF**：展开所有折叠内容、加载全部图片、切到亮色主题，然后打开浏览器打印窗口，选「存储为 PDF」。打印样式在 `globals.css` 的 `@media print` 里；不想打印的元素加 `no-print` class。

HTML 笔记没有导出按钮（它本身就是一个独立文件，可以在新窗口打开）。

## 目录结构

```
content/
  2026-fall-1/
    term.json                 # 学期名称（中英）
    isom-5260/
      course.json             # 课程代码、名称、老师、简介
      lectures/
        week-02/index.html + meta.json
        week-04/index.md + images/
    isom-5180/lectures/
        week-01/index.mdx + images/ + README.md   # README.md 由 mdx-to-md 生成
src/
  data/profile.ts             # 首页所有内容：简介、经历、项目、教育、技能、联系方式
  lib/content.ts              # 读取 content/ 目录树
  lib/i18n.ts                 # 界面文案（中英）
  app/[lang]/...              # 页面
```

## 部署

**Vercel（推荐）**：把仓库推到 GitHub，在 vercel.com 导入仓库，全部用默认设置。之后每次 push 都会自动上线。买了域名以后在 Vercel 的 Domains 里绑定就行。

**GitHub Pages**：把 `out/` 里的内容发布出去就行。站点部署在子路径（`username.github.io/repo`）时需要在 `next.config.ts` 里设置 `basePath`；用 `username.github.io` 仓库或者自定义域名就不用。
