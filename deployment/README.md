# 预览环境部署、备份与回退

本说明描述当前开发预览，不代表正式学校站点部署方案。历史过程已保留在 docs/历史版本/交付整理前_20261012/；最新实测依据为[小标题修复部署回执](../docs/内部资料/ClaudeCode小标题修复部署回执_20261012.md)。

## 当前部署基线

| 项目 | 当前记录 |
|---|---|
| 公网 | http://47.94.146.53:8099/，HTTP 开发预览 |
| release | /srv/ic-college/releases/20261012.8 |
| 运行代码 | 15e8dac；回执提交 73dce92 |
| 服务 | ic-preview：127.0.0.1:8095；ic-public-preview：127.0.0.1:8096 |
| 代理 | 项目专属 nginx 8099 → 8096；不代理后台 8095 |
| 环境 | /srv/ic-college/venv |
| 数据 | /srv/ic-college/shared/data |
| 备份 | /srv/ic-college/shared/backups |
| 迁移 | 0001—0005；0005 SQL no-op |

密码、密钥和实际 env 文件通过私密渠道交接。后台仅通过 SSH 隧道访问：`ssh -N -L 8095:127.0.0.1:8095 <已授权用户>@47.94.146.53`。隧道需持续运行，与本地 Django 不能同时占用 8095。

public.env.example 是未来 HTTPS 场景模板，不是当前 HTTP 实际配置；不要原样覆盖已有 shared/public.env。当前 TLS/正式域名和正式上线事项由后续对接处理。

## 后续发布顺序

1. 核对分支、已提交代码和远端，保留队友修改。构建 `node frontend/scripts/build-site.js`，完成相应功能检查。
2. `python deployment/package_preview.py --check` 校验实际运行资源和字体清单。去掉 --check 才生成 sandbox/deploy/ic-preview.tar.gz 和 manifest.json；这会更新本地部署包。
3. 记录 current 指向，备份当前业务库与必要配置，在新的 releases/<版本> 解压并核对包哈希。代码与持久化数据分离，保留旧 release。
4. 使用 /srv/ic-college/venv，沿用 shared 中已有环境设置和 IC_DATA_DIR，在新 release 执行 check、迁移检查、必要的 migrate、collectstatic 和测试。读取配置前确认是本项目路径；不要运行 bootstrap/seed。
5. 验证后切换 current，仅重启 ic-preview 和 ic-public-preview，核对 healthz、动态正文、后台隔离和运行版本；失败切回原 release。迁移含数据变更时需另行评估回退，不能套用 0005 的 no-op 结论。
6. 保存回执：提交哈希、release、资源版本、检查结果、备份与回退位置。不能声称更新了队友电脑上的本地仓库。

只操作 /srv/ic-college 及本项目服务，不覆盖原站、不改 FRP 或其他 nginx 站点。本轮交付整理没有执行发布。

## 备份与恢复

```text
python deployment/sqlite_backup.py backup <已有源库> <新的备份路径>
python deployment/sqlite_backup.py verify <已有备份路径>
```

backup 使用 SQLite 一致性备份接口，校验完整性和外键，拒绝覆盖已有目标。活动 WAL 库不要直接只复制主文件。备份不进入 Git，不通过聊天传输。

恢复操作应先在隔离目录验证业务数据、页面及账号能用；生产恢复另行安排窗口。生产操作先停止本项目两个服务、另存当前完整库，再从备份生成新恢复文件，校验后切换并恢复正确属主/权限；保留原文件和回退路径，不能覆盖同期新增内容。配套保留密钥、环境配置与所用版本素材。完整生产恢复演练尚未完成。

## 当前版本回退基线

根据最新回执，20261012.8 可切回 20261012.7 并重启本项目两个服务；0005 为 no-op，可保留迁移记录。对应部署前备份为 shared/backups/ic-preview-before-heading-fix-20261012.sqlite3，旧版本指向与服务记录在 shared/backups/release-before-heading-fix/。

这里只记录已有方案，未在本轮执行线上回退。后续版本必须以其实际迁移和备份重新判断。

## 辅助检查

- test_backup.py：标准库临时 WAL 样例的备份/恢复/拒绝覆盖测试，不是完整业务库恢复演练。
- test_release_assets.py：运行字体及配图资源检查的 7 项回归。
- check_showcase_offline.py：早期 48 条演示材料的离线检查，不代表当前线上 80 条发布快照的数量或质量。

安全专项、备份计划/保留策略与多角色人工验证交队友承接，详见[交接验收记录](../docs/内部资料/交接验收记录_20261012.md)。
