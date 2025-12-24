# GitLab Issue Generator

一款现代化的 AI 驱动 GitLab Issue 生成工具。只需描述你的问题，AI 会自动生成结构清晰、格式规范的 Issue。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)
![AI](https://img.shields.io/badge/AI-DeepSeek-green.svg)

## 功能特性

### 核心功能

| 功能 | 说明 |
|------|------|
| **AI 智能生成** | 基于 DeepSeek AI 分析描述内容，自动生成专业规范的 Issue |
| **自动类型识别** | AI 自动判断是 Bug 报告还是 Feature 需求，选择对应模板 |
| **截图支持** | 支持 Ctrl+V 粘贴、拖拽上传，截图自动嵌入 Issue 内容 |
| **图片预览** | 点击图片放大查看，支持缩放、旋转 |
| **多项目管理** | 可配置多个 GitLab 项目，自由切换提交目标 |
| **一键提交** | 通过 GitLab API 直接创建 Issue，无需复制粘贴 |
| **实时预览** | Markdown 实时渲染，所见即所得 |
| **内容编辑** | 生成后可切换到编辑模式，直接修改内容再提交 |
| **快捷键支持** | Ctrl+Enter 快速生成，Esc 关闭弹窗，高效操作 |
| **历史记录** | 自动保存提交历史，方便回溯 |

### Issue 模板

工具内置两套专业模板，AI 会根据描述内容自动选择：

#### Bug 报告模板
```
[Bug] 标题

### 问题描述
### 版本/环境
### 前置条件
### 复现步骤
### 预期结果
### 实际结果
### 影响范围（模块、用户、严重程度 P0-P3）
```

#### Feature 需求模板
```
[Feature] 标题

### 需求描述
### 背景与动机
### 用户故事
### 功能详情
### 验收标准
### 优先级与排期建议
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/your-username/gitlab_issue_reporter.git
cd gitlab_issue_reporter
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_SILICONFLOW_API_KEY=your_api_key_here
```

**获取 API Key：**
1. 访问 [硅基流动官网](https://siliconflow.cn/)
2. 注册并登录账号
3. 进入控制台 → API Keys
4. 创建新的 API Key 并复制

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 即可使用

### 5. 构建生产版本

```bash
npm run build
npm run preview  # 本地预览生产版本
```

## 使用指南

### 基本流程

```
输入描述 → 添加截图（可选）→ 点击生成 → 编辑（可选）→ 复制或提交到 GitLab
```

1. **输入描述**：在左侧文本框描述你遇到的 Bug 或需要的功能
2. **添加截图**（可选）：使用 Ctrl+V 粘贴截图，或拖拽图片到上传区域
3. **生成 Issue**：点击「生成 Issue」按钮（或按 Ctrl+Enter），AI 会自动生成规范的 Issue
4. **编辑内容**（可选）：点击「编辑」按钮可直接修改生成的内容
5. **复制或提交**：复制内容到剪贴板，或配置 GitLab 后直接提交

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Enter` | 快速生成 Issue |
| `Ctrl/Cmd + Shift + C` | 复制生成内容 |
| `Ctrl/Cmd + V` | 粘贴截图 |
| `Esc` | 关闭弹窗/图片预览 |

### 配置 GitLab 项目

支持配置多个 GitLab 项目（包括自建 GitLab 实例）：

1. 点击页面右上角 **「配置」** 按钮
2. 点击 **「添加项目」** 添加项目
3. 填写配置信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| Project Name | 项目显示名称 | 前端项目 |
| GitLab URL | GitLab 地址 | https://gitlab.com |
| Personal Access Token | 访问令牌 | glpat-xxxx |
| Project ID | 项目 ID 或路径 | 12345 或 group/project |

4. 点击 **「测试连接」** 测试连接
5. 连接成功后点击 **「保存」** 保存

### 获取 GitLab Access Token

#### 方法一：通过 Web 界面

1. 登录你的 GitLab（gitlab.com 或自建实例）
2. 点击右上角头像 → **「Preferences」**（偏好设置）
3. 左侧菜单选择 **「Access Tokens」**（访问令牌）
4. 填写以下信息：
   - **Token name**：随意填写，如 `issue-generator`
   - **Expiration date**：过期时间，建议设置 1 年
   - **Select scopes**：勾选 **`api`**（必须）
5. 点击 **「Create personal access token」**
6. **立即复制生成的 Token**（只显示一次，刷新后无法再查看！）

#### 方法二：通过 URL 直接访问

直接访问以下地址创建 Token：
- GitLab.com：`https://gitlab.com/-/user_settings/personal_access_tokens`
- 自建实例：`https://你的域名/-/user_settings/personal_access_tokens`

### 查找 Project ID

Project ID 可以在以下位置找到：

1. **项目主页**：项目名称下方会显示 Project ID
2. **Settings → General**：页面顶部显示
3. **URL 路径**：也可以使用完整路径如 `mygroup/myproject`

### 提交 Issue 到 GitLab

1. 生成 Issue 后，右侧面板会出现项目选择器
2. 从下拉框选择目标项目
3. 点击 **「提交到 GitLab」** 按钮
4. 提交成功后会显示 Issue 链接，可点击「清空继续」创建下一个

## 技术栈

| 类型 | 技术 |
|------|------|
| 前端框架 | React 18 |
| 构建工具 | Vite 5 |
| 样式方案 | Tailwind CSS |
| AI 服务 | 硅基流动 DeepSeek-V3 API |
| Markdown | react-markdown + remark-gfm |
| HTTP | Fetch API (Streaming) |

## 项目结构

```
gitlab_issue_reporter/
├── src/
│   ├── components/
│   │   ├── ui/                    # 基础 UI 组件
│   │   │   ├── button.jsx         # 按钮组件
│   │   │   ├── card.jsx           # 卡片组件
│   │   │   └── textarea.jsx       # 文本域组件
│   │   ├── GitLabSettings.jsx     # GitLab 配置弹窗
│   │   ├── ImagePreviewModal.jsx  # 图片预览弹窗
│   │   └── ProjectSelector.jsx    # 项目选择下拉框
│   ├── hooks/
│   │   └── useClipboard.jsx       # 剪贴板 Hook
│   ├── lib/
│   │   ├── ai.jsx                 # AI API 调用逻辑
│   │   ├── gitlab.js              # GitLab API 集成
│   │   ├── history.js             # 历史记录管理
│   │   └── utils.js               # 工具函数
│   ├── App.jsx                    # 主应用组件
│   ├── index.css                  # 全局样式
│   └── main.jsx                   # 应用入口
├── .env                           # 环境变量（不提交到 Git）
├── .gitignore
├── index.html                     # HTML 模板
├── package.json                   # 项目配置
├── tailwind.config.js             # Tailwind 配置
├── postcss.config.js              # PostCSS 配置
└── vite.config.js                 # Vite 配置
```

## 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `VITE_SILICONFLOW_API_KEY` | 硅基流动 API Key | 是 |

> 注意：Vite 项目中环境变量必须以 `VITE_` 开头才能在前端代码中访问

## 数据存储

应用使用浏览器 `localStorage` 存储以下数据：

| Key | 说明 |
|-----|------|
| `gitlab_projects` | GitLab 项目配置列表（包含 Token） |
| `issue_history` | Issue 提交历史记录（最多 20 条） |

> ⚠️ 安全提示：Token 存储在浏览器本地，请注意保护你的设备安全

## 设计风格

界面采用现代简约的硅谷设计风格：

- 明亮的白色背景 + 淡紫色渐变点缀
- 大量留白，专业感排版
- 精致的阴影和圆角设计
- 流畅的动画过渡效果
- Inter 字体系列

## 常见问题

### Q: API 请求返回 401 错误？

**A:** 检查 `.env` 文件：
- 确保 `VITE_SILICONFLOW_API_KEY` 值正确
- 确保没有多余的空格、引号或换行
- 修改 `.env` 后需要重启开发服务器

### Q: GitLab 连接失败？

**A:** 逐项检查：
- [ ] GitLab URL 是否正确（需包含 `https://`）
- [ ] Access Token 是否有 `api` 权限
- [ ] Token 是否已过期
- [ ] Project ID 是否正确
- [ ] 网络是否能访问该 GitLab 实例

### Q: 截图粘贴不生效？

**A:** 确保：
- 使用 Ctrl+V（Windows）或 Cmd+V（Mac）
- 剪贴板中确实有图片内容（不是文件路径）
- 浏览器允许访问剪贴板权限

### Q: 如何找到 Project ID？

**A:** 三种方式：
1. 项目主页：项目名称下方直接显示
2. Settings → General：页面顶部
3. 使用项目路径：如 `mygroup/myproject`

### Q: 支持自建 GitLab 吗？

**A:** 完全支持。在 GitLab URL 中填入你的自建实例地址即可，如 `https://git.mycompany.com`

### Q: 生成的内容可以编辑吗？

**A:** 可以！生成后点击右侧面板的「编辑」按钮，即可直接修改内容再提交。

### Q: 有哪些快捷键可以使用？

**A:** 点击右上角键盘图标可查看所有快捷键：
- `Ctrl+Enter`：快速生成
- `Ctrl+Shift+C`：复制内容
- `Esc`：关闭弹窗

## 开发计划

- [x] ~~支持直接编辑生成的内容~~（已完成）
- [x] ~~键盘快捷键支持~~（已完成）
- [x] ~~图片放大预览~~（已完成）
- [x] ~~历史记录功能~~（已完成）
- [ ] 支持自定义 Issue 模板
- [ ] 支持图片 OCR 识别
- [ ] 支持浏览器插件版本

## 贡献指南

欢迎提交 Pull Request 或 Issue！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**Made with ❤️ by AI & React**
