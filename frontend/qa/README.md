# 验证证据

本目录是检查输出，不是网页源码；报告必须结合日期和所测版本阅读。最新验证摘要只看[STATUS](../../STATUS.md)。

早期暂停按钮/轮播设计对应的九份报告与截图已移入[历史证据](../../docs/归档不再看/历史版本/目录整理前_20261015/retired-qa/)，原文件内容按SHA256保留。其他历史截图仍供追溯，不能自动算作当前版本通过。

当前统一入口为`node frontend/scripts/check-frontend.cjs`，默认详细输出在被忽略的sandbox/frontend-checks；它不执行服务器发布。
