# 博达增量部署指南

发布包只包含博达可运行的 HTML、CSS、JavaScript 和图片等静态资源，不需要 Node.js、PHP、数据库或接口。

免安装可视化编辑器中的便携运行环境只在用户电脑本地使用，不能上传到博达。编辑器导出的 `site-update-*.zip` 仍只包含博达支持的 HTML、CSS、JavaScript 和图片等静态文件。

## 首次部署

本次结构升级后，先完整执行：

```bash
node scripts/build-site.js
node scripts/verify-site.js
```

随后将 `dist/` 内全部内容上传到网站根目录。必须包含新的 `js/site-shell.js`。首次完整上传成功后，后续才可按下表增量替换。

## 日常增量部署

| 改动类型 | 修改位置 | 构建命令 | 只需上传 |
| --- | --- | --- | --- |
| 单个栏目页正文 | `src/content/overview/about.html` 等 | `node scripts/build-site.js --page about.html` | `dist/about.html` |
| 单个详情页正文 | `src/data/detail-pages.js` | `node scripts/build-site.js --page public-service-uav-inspection.html` | 对应的 `dist/*.html` |
| 导航、页头、页脚、公共电话 | `src/templates/partials/` 或 `src/data/site.js` | `node scripts/build-site.js --shared` | `dist/js/site-shell.js` |
| 全站样式 | `src/css/style.css` | `node scripts/build-site.js --static css/style.css` | `dist/css/style.css` |
| 全站交互 | `src/js/main.js` | `node scripts/build-site.js --static js/main.js` | `dist/js/main.js` |
| 单张图片 | `src/assets/example.jpg` | `node scripts/build-site.js --static assets/example.jpg` | 对应的 `dist/assets/*` |
| 页面标题或描述 | `src/data/site.js` | `node scripts/build-site.js --page 页面文件名` | 对应的 `dist/*.html` |

公共学院名称同时出现在页面正文、标题和公共壳层中，修改时应执行全量构建并上传所有受影响文件。

## 发布检查

每次修改后运行：

```bash
node scripts/verify-site.js
```

不要直接编辑 `dist/`，否则下次构建会覆盖改动。上传时保持目录层级，例如 `dist/js/site-shell.js` 对应网站根目录下的 `js/site-shell.js`。`.backup/`、`src/`、`scripts/` 和参考资料不上传。

替换 `js/site-shell.js` 后若公共页头、导航、页脚或电话没有立即更新，请清理博达/CDN 缓存，或在浏览器中强制刷新后再检查。

## 可视化编辑器增量发布

编辑器位于项目内的 `editor/`，只用于本地浏览器编辑，不上传到博达。启动本地预览：

```bash
python3 -m http.server 8000
```

然后打开 `http://127.0.0.1:8000/editor/`。在编辑器中选择 `dist/` 文件夹，或读取 `../dist/` 地址。双击文字可编辑，点击图片可从 Windows/Linux 本地选择图片。

点击“保存 / 导出”后得到 `site-update-时间.zip`。解压后保持目录层级，把其中文件上传到网站根目录覆盖：

- 页面正文修改：对应的 `页面名.html`
- 页头、导航、页脚、公共电话：`js/site-shell.js`
- 图片替换：`assets/图片文件`

编辑器只导出实际变更文件，不会直接上传服务器，也不会修改 `src/`。确认效果后，应将文字修改同步回 `src/content/overview/` 或 `src/data/detail-pages.js`，将公共修改同步回 `src/templates/partials/` 或 `src/data/site.js`，将图片放回 `src/assets/`，再运行完整构建，避免下次构建覆盖手工发布内容。
