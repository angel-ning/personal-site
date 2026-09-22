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

- **Markdown**：只复制正文里引用到的图片（放进 `images/`），并改写链接。标题、周次、日期写在文件顶部的 frontmatter 里。
- **HTML**：原样复制为 `index.html`，元数据写在旁边的 `meta.json`。HTML 笔记在网站里嵌入显示，保留自己的样式；只要支持 `<html data-theme="dark|light">`，就会跟随网站主题切换。
- **类型**文件夹可以随便起名。`lectures`、`labs`、`tutorials`、`assignments`、`readings`、`projects`、`exams` 有中英文标签和固定排序，其他名字按原样显示。
- 不想公开的笔记：在 frontmatter / meta.json 里加 `draft: true`。

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
src/
  data/profile.ts             # 首页所有内容：简介、经历、项目、教育、技能、联系方式
  lib/content.ts              # 读取 content/ 目录树
  lib/i18n.ts                 # 界面文案（中英）
  app/[lang]/...              # 页面
```

## 部署

**Vercel（推荐）**：把仓库推到 GitHub，在 vercel.com 导入仓库，全部用默认设置。之后每次 push 都会自动上线。买了域名以后在 Vercel 的 Domains 里绑定就行。

**GitHub Pages**：把 `out/` 里的内容发布出去就行。站点部署在子路径（`username.github.io/repo`）时需要在 `next.config.ts` 里设置 `basePath`；用 `username.github.io` 仓库或者自定义域名就不用。
