# 本地审核样例

- [内容数量对比](content-density/index.html)：一条短内容与八条长内容；概览最多三条，可进入完整列表和详情。
- [三档教师样式](faculty-states.html)：大照片、小圆头像、普通教师列表。只用于样式审核，不代表真实称号归属。

样例使用`../preview`的实际CSS/JS/字体和图片，随完整源码包携带，解压换电脑后仍可查看；不使用本机绝对路径。它们不进入正式静态站点或业务数据库。

数量样例由现有Django组件输出；重新生成可在仓库根目录、具备项目Django依赖的隔离Python中执行`python frontend/scripts/build-layout-examples.py`。脚本使用内存数据，并拒绝数据库连接。教师样式快照来自现有hover审核夹具。
