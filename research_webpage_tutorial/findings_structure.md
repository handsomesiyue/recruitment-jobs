# 初学者网页设计教程（HTML + CSS）最佳结构研究

## 研究来源
- **MDN Web Docs** (developer.mozilla.org)
- **W3Schools** (w3schools.com)
- **freeCodeCamp** (freecodecamp.org) — Responsive Web Design Certification
- **web.dev** (web.dev/learn) — Google 官方教程

---

## 各大平台课程结构对比

### 1. MDN Web Docs

#### HTML 模块（Structuring Content with HTML）
```
1.  Basic HTML syntax             — 元素、属性、HTML 页面结构
2.  Web page metadata (<head>)    — title, meta, link to CSS
3.  Headings and paragraphs       — 标题与段落
4.  Emphasis and importance       — 语义化文本（strong, em）
5.  Lists                         — ul, ol, dl
6.  Advanced text features        — 引用、代码、上下标
7.  [Challenge] Marking up a letter
8.  Structuring documents         — 语义化结构（header, nav, main, footer）
9.  Creating links                — 超链接
10. [Challenge] Structuring a page of content
11. HTML images                   — img, figure, alt
12. HTML video and audio          — 多媒体
13. [Challenge] Splash page
14. HTML table basics             — 表格
15. HTML table accessibility      — 表格无障碍
16. [Challenge] Planet data table
17. Forms and buttons             — 表单基础
18. Debugging HTML                — 调试工具
```

#### CSS 模块（Styling Basics）
```
1.  What is CSS?                  — CSS 简介
2.  CSS getting started           — 如何添加 CSS（inline/internal/external）
3.  [Challenge] Biography page
4.  Basic selectors               — 元素、类、ID 选择器
5.  Attribute selectors           — 属性选择器
6.  Pseudo-classes and elements   — :hover, ::before 等
7.  Combinators                   — 后代、子代、兄弟选择器
8.  Box model                     — margin, border, padding, content
9.  Handling conflicts            — 层叠与优先级（cascade, specificity）
10. Values and units              — px, em, rem, %, vw, vh
11. Sizing                        — width, height, min/max
12. Backgrounds and borders       — 背景色、图片、边框
13. Overflow                      — 溢出处理
14. Images, media, forms          — 替换元素样式
15. Styling tables                — 表格样式
16. Debugging CSS                 — 调试技巧
```

#### CSS 布局模块（CSS Layout）
```
1.  Introduction                  — 布局概述
2.  Floats                        — 浮动布局
3.  Positioning                   — 定位（static/relative/absolute/fixed/sticky）
4.  Flexbox                       — 弹性布局
5.  CSS Grid                      — 网格布局
6.  Responsive web design         — 响应式设计
7.  Media queries                 — 媒体查询
```

#### MDN 零基础入门路径（"Your First Website"）
```
1.  What will it look like?        — 设计规划
2.  Creating the content           — 写 HTML
3.  Styling the content            — 写 CSS
4.  Adding interactivity           — 加 JavaScript
5.  Publishing                     — 发布上线
```

---

### 2. W3Schools

#### HTML 教程顺序（前 15 章核心）
```
1.  HTML Introduction              — 什么是 HTML，第一个示例
2.  HTML Editors                   — 编辑器选择
3.  HTML Basic                     — 基础文档结构
4.  HTML Elements                  — 元素语法（开始标签/结束标签）
5.  HTML Attributes                — 属性（href, src, style 等）
6.  HTML Headings                  — h1-h6
7.  HTML Paragraphs                — p, br, hr, pre
8.  HTML Styles                    — style 属性（内联样式入门）
9.  HTML Formatting                — b, strong, i, em, mark 等
10. HTML Quotations                — blockquote, q, abbr, cite
11. HTML Comments                  — 注释
12. HTML Colors                    — 颜色名称、RGB、HEX
13. HTML CSS                       — 通过 <style> 和外部文件使用 CSS
14. HTML Links                     — 超链接、target、书签
15. HTML Images                    — img, src, alt, 图片映射
16. HTML Favicon                   — 网站图标
17. HTML Page Title                — title 标签
18. HTML Tables                    — 表格系列（6 个子章节）
19. HTML Lists                     — ul, ol, dl
20. HTML Block & Inline            — 块级与内联元素
21. HTML Div                       — div 容器
22. HTML Classes                   — class 属性
23. HTML Id                        — id 属性
24. HTML Iframes                   — 内嵌框架
25. HTML Head                      — head 元素详解
26. HTML Layout                    — 页面布局方法
27. HTML Responsive                — 响应式基础
28. HTML Semantics                 — 语义化标签
```

#### CSS 教程顺序（前 20 章核心）
```
1.  CSS Introduction               — 什么是 CSS
2.  CSS Syntax                     — 选择器 + 声明块
3.  CSS Selectors                  — 元素/类/ID 选择器
4.  CSS How To / Add CSS           — 三种添加方式
5.  CSS Comments                   — 注释
6.  CSS Colors                     — 颜色系统
7.  CSS Backgrounds                — 背景属性
8.  CSS Borders                    — 边框
9.  CSS Margins                    — 外边距
10. CSS Padding                    — 内边距
11. CSS Height/Width               — 尺寸
12. CSS Box Model                  — 盒模型
13. CSS Outline                    — 轮廓
14. CSS Text                       — 文本样式（颜色、对齐、装饰）
15. CSS Fonts                      — 字体
16. CSS Links                      — 链接样式
17. CSS Lists                      — 列表样式
18. CSS Tables                     — 表格样式
19. CSS Display                    — display 属性
20. CSS Position                   — 定位
21. CSS Overflow                   — 溢出
22. CSS Float                      — 浮动
23. CSS Align                      — 对齐
24. CSS Combinators                — 组合器
25. CSS Pseudo-classes             — 伪类
26. CSS Pseudo-elements            — 伪元素
```
---

### 3. freeCodeCamp — Responsive Web Design Certification

freeCodeCamp 采用**项目驱动**的方式，在构建实际项目的过程中学习：

```
1.  Learn HTML by Building a Cat Photo App           — 基础 HTML 元素
2.  Learn Basic CSS by Building a Cafe Menu          — CSS 基础（颜色、字体、背景）
3.  Learn CSS Colors by Building a Set of Colored Markers — 颜色深入学习
4.  Learn HTML Forms by Building a Registration Form — 表单
5.  Learn the CSS Box Model by Building a Rothko Painting — 盒模型
6.  Learn CSS Flexbox by Building a Photo Gallery    — Flexbox
7.  Learn Typography by Building a Nutrition Label   — 排版
8.  Learn Accessibility by Building a Quiz           — 无障碍
9.  Learn More About CSS Pseudo Selectors...         — 伪选择器进阶
10. Learn Intermediate CSS by Building a Picasso Painting
11. Learn Responsive Web Design by Building a Piano  — 响应式设计
12. Learn CSS Variables by Building a City Skyline
13. Learn CSS Grid by Building a Magazine
14. Learn CSS Transforms by Building a Penguin
15. Learn CSS Animations by Building a Ferris Wheel
```

**突出特点**：完全项目驱动，每个概念通过一个具体项目来学习。先动手再理解。

---

### 4. web.dev（Google）— Learn HTML / Learn CSS

web.dev 的结构更接近 MDN，先概念后实践：

#### Learn HTML
```
1.  Overview of HTML
2.  Document structure
3.  Metadata
4.  Semantic HTML
5.  Headings and sections
6.  Attributes
7.  Text basics
8.  Links
9.  Lists
10. Navigation
11. Tables
12. Forms
13. Images
14. Audio and video
15. Template, slot, and shadow
16. HTML APIs
17. Focus
18. Other inline text elements
19. Details and summary
20. Dialog
```

#### Learn CSS
```
1.  Box model
2.  Selectors
3.  The cascade
4.  Specificity
5.  Inheritance
6.  Color
7.  Sizing units
8.  Layout
9.  Flexbox
10. Grid
11. Logical properties
12. Spacing
13. Pseudo-elements
14. Pseudo-classes
15. Borders
16. Shadows
17. Focus
18. Z-index and stacking contexts
19. Functions
20. Gradients
21. Animations
22. Filters
23. Blend modes
24. Lists
25. Transitions
26. Overflow
27. Backgrounds
28. Text and typography
```

---

## 综合推荐：最佳初学者教程结构

基于以上四大平台的对比分析，以下是**最优的章节顺序**：

### 第一阶段：HTML 基础（搭建骨架）

```
第 1 章：什么是 HTML？网页是如何工作的？
第 2 章：搭建开发环境 + 第一个 HTML 文件
第 3 章：HTML 元素与标签语法
第 4 章：HTML 文档结构（<!DOCTYPE>, <html>, <head>, <body>）
第 5 章：标题与段落（h1-h6, p）
第 6 章：文本格式化（strong, em, br, hr 等）
第 7 章：列表（ul, ol, dl）
第 8 章：超链接（a, href, target）
第 9 章：图片（img, src, alt, figure）
第 10 章：语义化结构元素（header, nav, main, section, article, footer）
第 11 章：div 和 span（通用容器）
第 12 章：表格基础
第 13 章：表单基础（form, input, button）
第 14 章：综合练习——制作一个个人信息页
```

### 第二阶段：CSS 基础（美化外观）

```
第 15 章：什么是 CSS？三种引入方式
第 16 章：CSS 语法与基础选择器（元素、类、ID）
第 17 章：颜色与背景（color, background-color, background-image）
第 18 章：CSS 盒模型（margin, border, padding, content）★ 最核心概念
第 19 章：尺寸单位（px, em, rem, %, vw, vh）
第 20 章：文本与字体样式（font-family, font-size, line-height, text-align）
第 21 章：链接样式（:hover, :visited 伪类入门）
第 22 章：display 属性（block, inline, inline-block, none）
第 23 章：组合器与进阶选择器
第 24 章：伪类与伪元素
第 25 章：层叠、优先级与继承（cascade, specificity, inheritance）★ 重要
第 26 章：综合练习——美化之前的个人信息页
```

### 第三阶段：CSS 布局（搭建页面结构）

```
第 27 章：传统布局方法（float, position）
第 28 章：Flexbox 弹性布局 ★ 现代布局核心
第 29 章：CSS Grid 网格布局
第 30 章：响应式设计基础（media queries, 移动优先）
第 31 章：综合项目——制作一个完整的个人作品集网站
```

---

## 关键原则总结

| 原则 | 说明 |
|------|------|
| **HTML 先于 CSS** | 所有平台都是先教 HTML（结构）再教 CSS（样式）。先建骨架，再美化。 |
| **盒模型是 CSS 的核心** | MDN、W3Schools、freeCodeCamp 都将盒模型放在 CSS 教程的前列，这是理解一切布局的基础。 |
| **项目驱动优于纯理论** | freeCodeCamp 完全项目驱动；MDN 也穿插 Challenge。建议每 3-5 章安排一个练习项目。 |
| **先学 Flexbox，再学 Grid** | Flexbox 比 Grid 更直观、更一维，适合作为入门布局工具。Grid 是进阶能力。 |
| **尽早引入语义化 HTML** | MDN 和 web.dev 都强调语义化。教会初学者用正确的标签而非全是 div。 |
| **CSS 优先级/层叠要讲透** | web.dev 将此列为独立章节；这是初学者最常困惑的点。 |
| **移动优先 + 响应式放在最后** | 先在桌面端学好基础布局，最后再引入响应式概念。（但 freeCodeCamp 穿插教学） |
| **保持实践频率** | 每章都有可运行的代码示例，配合"动手试试"环节。 |

---

## 推荐的"第一课"内容

综合所有平台，"第一个网页"的教学路径：

1. 创建文件 `index.html`
2. 输入基础 HTML 结构（`!` + Tab 或手写 `<!DOCTYPE html>`...）
3. 添加一个 `<h1>` 标题和几个 `<p>` 段落
4. 在浏览器中打开
5. 添加 `<link>` 引入 CSS 文件
6. 创建 `style.css`
7. 用 CSS 改背景色、字体颜色、字体大小
8. 学生看到自己的页面变漂亮——建立成就感

*研究完成时间：2026-06-10*
