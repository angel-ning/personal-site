import type { L10n } from "@/lib/i18n";

// Everything on the homepage lives here. Edit freely — both languages side by side.

export const profile = {
  name: "Youming Ning",
  nickname: "Angel",
  nameZh: "宁佑铭",
  role: {
    en: "Software engineer · MSc Cyber Security @ HKUST",
    zh: "软件工程师 · 港科大网络安全硕士在读",
  } satisfies L10n,
  bio: {
    en: "I build AI agents and data-heavy web platforms. Most recently I was a core developer on Huawei's Petal Maps Agent, launched at HDC 2026. Before that I designed an LLM-based fraud-blocking system for an app with 500k+ users. I studied Computer Science at Waterloo and am now doing an MSc in Information and Cyber Security Management at HKUST. This site is where I keep my course notes.",
    zh: "我做 AI Agent 和数据密集型的 Web 平台。最近一份工作是在华为北京研究所，作为核心开发参与花瓣地图 Agent 的研发，在 HDC 2026 上发布；此前为一款 50 万+ 注册用户的应用独立设计了基于大模型的实时风控系统。本科读的是滑铁卢大学计算机科学，现在在港科大读信息与网络安全管理硕士。这个网站用来存放我的课程笔记。",
  } satisfies L10n,
  location: { en: "Hong Kong", zh: "香港" } satisfies L10n,
};

export const links = {
  github: "https://github.com/angel-ning",
  linkedin: "", // TODO: paste your LinkedIn profile URL
  email: "ningyouming2026@163.com",
  wechat: "Angel_Nnnnn",
};

export type Experience = {
  period: string;
  org: L10n;
  role: L10n;
  place: L10n;
  points: L10n[];
};

export const experience: Experience[] = [
  {
    period: "2025.07 — 2026.07",
    org: { en: "Huawei Technologies · Beijing Research Institute", zh: "华为技术有限公司 · 北京研究所" },
    role: { en: "Software Development Engineer (on-site contractor)", zh: "软件开发工程师（派驻）" },
    place: { en: "Beijing", zh: "北京" },
    points: [
      {
        en: "Core developer of the Petal Maps AI travel-companion agent (HDC 2026): ReAct-style tool orchestration on Spring AI, conversation memory, tracing, and an LLM-as-judge evaluation loop. Cut end-to-end latency from 40–60s to 6–40s.",
        zh: "花瓣地图 AI 伴游 Agent 核心开发（HDC 2026 发布）：基于 Spring AI 的 ReAct 多工具编排、多轮记忆、全链路 Trace，以及 LLM-as-judge 自动评测；端到端时延从 40–60 秒降到 6–40 秒。",
      },
      {
        en: "Built the front-end architecture of an AI road-case analysis platform (React, TypeScript, D3, RapiD), taking analysis from days to hours for 20+ internal users.",
        zh: "负责道路 Case AI 分析平台的前端架构与 UX（React、TypeScript、D3、RapiD），把道路问题分析从天级缩短到小时级，服务 20+ 内部用户。",
      },
      {
        en: "Reworked the transit map layer end to end (leaner PostGIS queries, viewport windowing, zoom-level merging) so thousands of bus routes scroll smoothly.",
        zh: "重构公交图层的前后端加载链路（精简空间查询、视口动态窗口、按缩放等级合并线路），上千条线路也能流畅滑动。",
      },
    ],
  },
  {
    period: "2024.02 — 2025.04",
    org: { en: "Gelenk Networks Inc.", zh: "Gelenk Networks Inc." },
    role: { en: "Full-stack Developer", zh: "全栈开发工程师" },
    place: { en: "Canada", zh: "加拿大" },
    points: [
      {
        en: "Designed and built, solo, a real-time LLM risk-control system for PingMe (500k+ users) that screens outgoing messages and blocks 99% of obvious scam SMS.",
        zh: "为 PingMe（50 万+ 注册用户）独立设计并实现基于大模型的实时风控封禁系统，消息发送时实时研判，99% 的明显诈骗短信被快速封禁。",
      },
      {
        en: "Shipped an AI support-ticket assistant that cut handling time from 8 hours to 1.",
        zh: "上线 AI 智能客服工单系统，工单处理从 8 小时缩短到 1 小时。",
      },
    ],
  },
  {
    period: "2022.04 — 2022.09",
    org: { en: "iFLYTEK", zh: "科大讯飞" },
    role: { en: "UI/UX Intern · AI Learning Machine", zh: "AI 交互设计实习生 · AI 学习机" },
    place: { en: "Shanghai", zh: "上海" },
    points: [
      {
        en: "Designed the English-learning module UI and AI tutor interactions; iterated on user feedback into shipped releases.",
        zh: "负责英语学习模块的核心界面与 AI 教师互动设计，并根据用户反馈持续迭代，方案落地到正式版本。",
      },
    ],
  },
];

export type Project = {
  name: L10n;
  meta: L10n;
  desc: L10n;
  tags: string[];
  href?: string;
};

export const projects: Project[] = [
  {
    name: { en: "Petal Maps AI Travel Companion", zh: "花瓣地图 AI 伴游" },
    meta: { en: "Huawei · HDC 2026", zh: "华为 · HDC 2026" },
    desc: {
      en: "Conversational agent for route planning, guided tours and on-site conference help, with multi-step tool calling, structured JSON cards and automated regression evals.",
      zh: "对话式 AI 伴游智能体：路线推荐、语音讲解、会场引导；多步工具调用、结构化卡片输出与可复跑的自动化回归评测。",
    },
    tags: ["Spring AI", "ReAct", "LLM-as-judge"],
  },
  {
    name: { en: "Road Case AI Analysis Platform", zh: "道路 Case AI 分析平台" },
    meta: { en: "Huawei · 0 → 1", zh: "华为 · 从 0 到 1" },
    desc: {
      en: "Workbench that pulls UGC, live traffic, mined signals and closure events together around a road case and drafts an AI analysis.",
      zh: "围绕道路 Case 自动整合 UGC、实时路况、算法挖掘与封路事件等多源数据，并给出 AI 分析参考的工作台。",
    },
    tags: ["React", "TypeScript", "D3.js"],
  },
  {
    name: { en: "AI Risk Control for PingMe", zh: "PingMe AI 实时风控" },
    meta: { en: "Gelenk Networks · solo", zh: "Gelenk Networks · 独立设计" },
    desc: {
      en: "Real-time scam detection weighing region, sending rate, history and known cases — 30+ verdicts a minute.",
      zh: "结合地区、发送频次、历史消息与已有案例的实时诈骗研判，每分钟 30+ 条。",
    },
    tags: ["LLM", "Backend", "Security"],
  },
  {
    name: { en: "Goober", zh: "Goober" },
    meta: { en: "Solana NFT staking · solo", zh: "Solana NFT 质押 · 独立开发" },
    desc: {
      en: "Full-stack staking site with wallet connect, staking and claiming, on an extended TinySPL contract in Rust.",
      zh: "全栈 NFT 质押网站：钱包连接、质押与领取；基于开源 TinySPL 合约用 Rust 修改扩展。",
    },
    tags: ["React", "Web3", "Rust"],
    href: "https://stake.goober.wtf/",
  },
  {
    name: { en: "SpaceShare", zh: "SpaceShare" },
    meta: { en: "Waterloo · team", zh: "滑铁卢大学 · 团队" },
    desc: {
      en: "Android app matching students and residents with hosts' spare storage space; booking in six taps or fewer.",
      zh: "连接学生、居民与房东闲置空间的 Android 应用，预订流程压缩到 6 次点击以内。",
    },
    tags: ["Kotlin", "UI/UX"],
    href: "https://github.com/zhi-minn/SpaceShare",
  },
  {
    name: { en: "OS/161 Kernel", zh: "OS/161 操作系统内核" },
    meta: { en: "Waterloo · CS 350", zh: "滑铁卢大学 · CS 350" },
    desc: {
      en: "Process syscalls (fork, execv, waitpid), lock-and-condition-variable synchronization, and virtual memory with a coremap and TLB fault handling, in C.",
      zh: "用 C 实现进程系统调用（fork、execv、waitpid）、基于锁与条件变量的并发同步，以及 coremap 物理页管理与 TLB 缺页处理。",
    },
    tags: ["C", "OS", "Concurrency"],
  },
];

export const education = [
  {
    period: "2026 — 2027",
    school: { en: "The Hong Kong University of Science and Technology", zh: "香港科技大学" },
    degree: {
      en: "MSc in Information and Cyber Security Management",
      zh: "信息与网络安全管理理学硕士",
    },
    note: { en: "Vice President, Program Committee", zh: "项目委员会副主席" },
  },
  {
    period: "2019 — 2023",
    school: { en: "University of Waterloo", zh: "滑铁卢大学" },
    degree: { en: "Bachelor of Computer Science (Honours)", zh: "计算机科学荣誉学士" },
    note: { en: "President's Scholarship, 2020", zh: "2020 年校长奖学金" },
  },
];

export const skills: { group: L10n; items: string }[] = [
  { group: { en: "Languages", zh: "语言" }, items: "Java · Python · TypeScript · C/C++ · Rust · Kotlin" },
  { group: { en: "AI", zh: "AI" }, items: "Agent architecture · Tool orchestration · Evals · Prompt engineering" },
  { group: { en: "Backend", zh: "后端" }, items: "Spring · Node.js · PostgreSQL / PostGIS · Redis" },
  { group: { en: "Frontend", zh: "前端" }, items: "React · D3.js · Map visualization · UI/UX" },
  { group: { en: "Security", zh: "安全" }, items: "Cyber risk management · Network security · AI anti-fraud" },
];
