# 三算命 - AI智能命理分析平台

一个基于现代Web技术构建的智能命理分析平台，融合传统中华命理学说与AI技术，为用户提供专业的八字命理、紫微斗数、易经占卜等服务。

## 🌟 项目特色

- **传统与现代结合**：将千年传承的中华命理学说与现代AI技术完美融合
- **多元化分析**：支持八字命理、紫微斗数、易经占卜三大主流命理体系
- **智能化算法**：采用先进的算法确保分析结果的准确性和个性化
- **现代化界面**：采用现代化UI设计，提供优雅的用户体验
- **数据安全**：基于Supabase的安全数据存储和用户认证系统

## 🎯 核心功能

### 八字命理分析
- **四柱排盘**：精确计算年、月、日、时四柱干支
- **五行分析**：深度分析五行平衡与缺失
- **格局判断**：识别命格特点和层次
- **运势预测**：提供大运、流年运势分析
- **性格解读**：基于八字特征分析性格特质
- **事业指导**：提供职业发展建议

### 紫微斗数分析
- **星盘排布**：精确计算紫微星盘和十二宫位
- **主星分析**：解读命宫主星特质
- **宫位解读**：详细分析十二宫位含义
- **四化飞星**：分析化禄、化权、化科、化忌
- **大限分析**：提供人生各阶段运势预测
- **流年运势**：年度运势详细解读

### 易经占卜
- **梅花易数**：采用传统梅花易数起卦方法
- **卦象解读**：详细解释卦象含义和象征
- **变卦分析**：分析卦象变化和发展趋势
- **人生指导**：提供决策建议和人生智慧
- **时机把握**：分析最佳行动时机

## 🛠️ 技术栈

### 前端技术
- **React 18.3.1** - 现代化前端框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vite 6.0.1** - 快速的构建工具
- **React Router 6** - 客户端路由管理
- **Tailwind CSS** - 实用优先的CSS框架
- **Radix UI** - 高质量的无障碍UI组件库
- **Lucide React** - 美观的图标库
- **React Hook Form** - 高性能表单库
- **Zod** - TypeScript优先的模式验证

### 后端服务
- **Supabase** - 开源的Firebase替代方案
- **PostgreSQL** - 可靠的关系型数据库
- **Edge Functions** - 服务端逻辑处理
- **实时数据库** - 实时数据同步
- **身份认证** - 安全的用户认证系统

### 开发工具
- **ESLint** - 代码质量检查
- **TypeScript ESLint** - TypeScript代码规范
- **PostCSS** - CSS后处理器
- **Autoprefixer** - CSS自动前缀

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐) 或 npm >= 9.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/patdelphi/suanming.git
cd suanming
```

2. **安装依赖**
```bash
pnpm install
# 或者使用 npm
npm install
```

3. **环境配置**

创建 `.env.local` 文件并配置以下环境变量：
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **启动开发服务器**
```bash
pnpm dev
# 或者使用 npm
npm run dev
```

5. **访问应用**

打开浏览器访问 `http://localhost:5173`

### 构建部署

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── ui/             # 基础UI组件
│   ├── Layout.tsx      # 布局组件
│   ├── AnalysisResultDisplay.tsx  # 分析结果展示
│   └── ...
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 首页
│   ├── AnalysisPage.tsx # 分析页面
│   ├── HistoryPage.tsx # 历史记录
│   └── ...
├── contexts/           # React上下文
│   └── AuthContext.tsx # 认证上下文
├── hooks/              # 自定义Hook
├── lib/                # 工具库
│   ├── supabase.ts     # Supabase客户端
│   └── utils.ts        # 工具函数
├── types/              # TypeScript类型定义
└── data/               # 静态数据
```

## 🎨 设计特色

- **中国风设计**：采用传统中国元素和配色方案
- **响应式布局**：完美适配桌面端和移动端
- **无障碍设计**：遵循WCAG无障碍设计标准
- **暗色模式**：支持明暗主题切换
- **动画效果**：流畅的交互动画提升用户体验

## 🔐 安全特性

- **用户认证**：基于Supabase的安全认证系统
- **数据加密**：敏感数据传输和存储加密
- **权限控制**：细粒度的用户权限管理
- **输入验证**：严格的前后端数据验证
- **HTTPS支持**：全站HTTPS加密传输

## 📱 功能模块

### 用户系统
- 用户注册/登录
- 个人资料管理
- 分析历史记录
- 收藏夹功能

### 分析系统
- 多种分析类型选择
- 实时分析结果生成
- 详细报告导出
- 结果分享功能

### 数据管理
- 分析记录存储
- 数据备份恢复
- 隐私设置管理

## 🤝 贡献指南

我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug报告
- 💡 功能建议
- 📝 文档改进
- 🔧 代码贡献

### 开发流程

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢所有贡献者的辛勤付出
- 感谢开源社区提供的优秀工具和库
- 感谢传统命理学大师们的智慧传承

## 📞 联系我们

- 项目主页：[https://github.com/patdelphi/suanming](https://github.com/patdelphi/suanming)
- 问题反馈：[Issues](https://github.com/patdelphi/suanming/issues)
- 功能建议：[Discussions](https://github.com/patdelphi/suanming/discussions)

---

**三算命** - 让传统智慧与现代技术完美融合，为您的人生提供智慧指引。
