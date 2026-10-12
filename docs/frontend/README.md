# 前端基础版与队友交接

当前入口：[打开首页](preview/index.html)。可直接双击 HTML 查看，不需要安装依赖。此版用于内部预览，未部署到公网，也没有连接学校后台。

已做：校院标识行、独立通栏导航、两张 Banner 轮播、新闻通知、科研/培养、三位教师预览及普通内页。共20页，其中新闻、通知和教师详情为明确占位。队友接下来负责美化，内容以学院审定版本替换。

## 队友改哪里

| 要改的东西 | 文件 |
|---|---|
| 配色、字体、间距、手机布局 | [src/css/style.css](src/css/style.css) |
| 导航、Banner、文案、教师、联系方式 | [src/data/site.js](src/data/site.js) |
| 首页区块顺序与结构 | [src/content/home.html](src/content/home.html) |
| 顶栏、整栏导航、页脚 | [src/templates/partials](src/templates/partials/) |
| 普通栏目与详情公共外框 | [src/templates/page.html](src/templates/page.html) |
| 菜单、轮播与暂停 | [src/js/main.js](src/js/main.js) |
| 图片、芯片示意 | [src/assets](src/assets/) |

修改 src 后，在本目录运行：

```powershell
& 'C:/Develop/NodeJS/node.exe' scripts/build-site.js
```

脚本只使用 Node 内置模块，输出至 preview/。不要直接改 preview/，再次构建会覆盖同名生成文件。删除栏目时，同时手动核对旧生成页面；构建脚本不会清空整个目录。已有素材的网页副本由 scripts/prepare-assets.py 使用本机现有 Pillow 生成，不覆盖原图。

## 低空代码实际参考了什么

原始相关文件已解压到 [参考源码/低空学院](../内部资料/参考源码/低空学院/)，[清单](../内部资料/参考源码/低空源码解压清单.json)记录29个文件的路径和SHA256。没有解压整套便携编辑器和全量媒体，也没有执行原包程序。

| 低空原文件 | 本版用法 |
|---|---|
| scripts/build-site.js | 复用 render 模板替换函数；沿用 data/templates/content 分离，改为构建时生成头尾 |
| src/templates/partials/header.html、footer.html | 参考头尾分层，重写IC标识与通栏导航，不沿用右侧挤排的大菜单 |
| src/data/site.js | 参考科学与创新、人才培养、师资、公共服务、概况、招聘、联系等栏目 |
| src/js/main.js | 参考移动菜单开合模式；补充 Escape、焦点处理和尺寸切换 |
| scripts/build-boda-site.js、BODA_CMS_COMPONENT_TEMPLATES.md | 保留 home-news、home-notices、news-list、notice-list 插入位；未知学校ID为null |

这不是原工程直接改名。当前IC样式、图片轮播和具体页面布局新写；博达插入位只用于后续接入，当前没有生成经过学校验证的JSP发布包。原包中未见可直接使用的学校REST/统一认证实现，不自行伪造接口。

## 素材与发布边界

- 校徽和校园牌坊图来自低空参考包；牌坊图只有720×406，正式版换经确认的高清素材，不当作学院楼宇照片。
- 芯片SVG为本项目原创示意，队友可替换或继续调整。轮播6秒切换，支持前后、圆点、暂停；悬停、焦点进入、页面隐藏时暂停，减少动态效果偏好下静态显示。
- 三位教师照片使用已归档资料的压缩副本，展示名单、照片与简历待学院确认，首版未填未经审核的职称和履历。
- 搜索、学校后台登录、英文版暂不展示无效按钮；配置保留，接通后再开放。
- 正式新闻维护交学校博达站群；Django、SQLite及演示后台本轮未实现，不是本基础前端的运行前提。
- 内部预览带 noindex 和 robots 禁止索引。这些不是访问控制；如需公网审阅，应另配访问限制，不能直接当正式官网发布。

## 本轮检查

2026-10-12：Node脚本语法和构建通过；20页的398处本地资源、链接与片段引用通过，无重复ID。首页已通过本机HTTP在浏览器加载，导航、轮播控件和内容结构可读取。

手机折叠菜单、单列布局、键盘关闭和减少动态效果已实现；手机真机、各尺寸截图和逐项交互仍须复核，不能视为已完成学校上线验收。检查脚本：

```powershell
& 'C:/Develop/Python3.10.8/python.exe' scripts/check-preview.py
```
