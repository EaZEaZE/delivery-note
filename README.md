# 送货单生成器

自然语言一键成单 · 自动计算 · 打印导出 PDF · 本地留存

面向小微企业与个体商户的日常开单场景：输入一段送货描述，AI 自动解析为规范送货单，核对后即可打印或导出 PDF。

## 功能特性

- **AI 自然语言解析**：粘贴一段描述，自动填入发货方、收货方、商品明细、备注
- **表单校验**：必填项、数量 > 0、单价非负、电话格式校验；未通过时拒绝保存并在顶部汇总、逐项标红
- **缺失字段提示**：AI 未提供的字段会在保存前列出并高亮，避免带着空值打印
- **自动计算**：单行金额、合计、中文大写金额一键生成
- **商品行管理**：增删商品行，支持名称、规格、单位、数量、单价
- **打印 / 导出 PDF**：A4 标准送货单版式，浏览器打印即可导出
- **本地历史留存**：所有单据保存在浏览器 localStorage，可载入、打印、删除
- **单据编号**：自动生成 `SH-YYYYMMDD-NNN` 格式编号

## 技术栈

- Next.js 16（App Router）+ React 19 + TypeScript 5.7
- 智谱 GLM-4-Flash（OpenAI 兼容接口，JSON 模式）
- 纯 CSS，无 UI 框架
- localStorage 本地存储
- 浏览器原生打印导出 PDF（零第三方依赖）

## 快速开始

```bash
cd delivery-note
npm install
npm run dev
```

默认运行在 http://localhost:3000。

## 配置 AI 解析（可选）

复制 `.env.example` 为 `.env.local`，填入智谱 AI 密钥：

```env
AI_API_KEY=你的密钥
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_MODEL=glm-4-flash
```

获取密钥：https://open.bigmodel.cn/usercenter/apikeys

> 未配置密钥时，手动录入、计算、打印功能照常可用，AI 解析按钮返回"未配置"提示，不伪造结果。

## 生产构建

```bash
npm run build
npm run start
```

## 项目结构

```
delivery-note/
├── app/
│   ├── page.tsx              # 主页面：AI 解析 + 表单 + 历史
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # 全局样式（含打印样式）
│   ├── icon.svg              # 站点图标
│   ├── api/parse/route.ts    # AI 解析代理
│   └── note/[id]/page.tsx    # 打印页
├── lib/
│   ├── types.ts              # 数据类型与空对象工厂
│   ├── calc.ts               # 金额计算与中文大写转换
│   ├── storage.ts            # localStorage CRUD
│   └── ai.ts                 # AI 客户端（System Prompt + JSON 解析）
├── .env.example              # AI 配置模板
├── package.json
└── tsconfig.json
```

## 边界声明

- AI 解析结果仅供预填，**金额与字段必须人工核对**后再保存/打印
- 未配置 AI 密钥时 `/api/parse` 返回真实 503，不伪造解析结果
- 数据仅存于浏览器 localStorage，**不做云端同步**
- 当前仅支持送货单模板，不支持 OCR 拍照识别、多人协作
- 中文大写金额遵循大陆财务规范，不支持外币

## 许可证

本项目为比赛作品，仅供学习与演示使用。
