// 文案、栏目、轮播的统一入口。这里的示例仅供内部预览。
module.exports = {
  name: '河南大学集成电路与微纳电子学院',
  college: '集成电路与微纳电子学院',
  english: 'School of Integrated Circuits and Micro-Nano Electronics',
  ...require('../../scripts/lib/columns').siteConfiguration,
  // 未取得学校配置前保持 null，不填写猜测的接口或旧学院 ID。
  cms: { adminUrl: null, siteId: null, newsColumnId: null, noticeColumnId: null, searchUrl: null },
  contact: { address: '待提供', phone: '待提供', email: '待提供' },
  slides: [
    { image: 'assets/chip-banner.svg', alt: '蓝白芯片与信号光流，原创学科示意',
      eyebrow: 'HENAN UNIVERSITY · INTEGRATED CIRCUITS', title: '集成电路与微纳电子学院',
      text: '从集成电路，探索微纳世界', note: '芯片概念动效 · 非实物与电气设计', theme: 'chip' },
    { image: 'assets/campus-gate.jpg', alt: '河南大学牌坊，来自低空参考包的校园图片',
      eyebrow: 'HENAN UNIVERSITY', title: '集成电路与微纳电子学院',
      text: '河南大学', note: '校园图片示意 · 待替换高清素材', theme: 'campus' },
    { image: 'assets/campus-landscape.jpg', alt: '低空参考包中的校园建筑与绿地，内部预览占位',
      eyebrow: 'HENAN UNIVERSITY · CAMPUS', title: '校园风光',
      text: '在河大，探索与成长', note: '低空参考包校园素材 · 正式发布前待审核', theme: 'campus' },
    { image: 'assets/campus-courtyard.jpg', alt: '低空参考包中的校园建筑与庭院，内部预览占位',
      eyebrow: 'HENAN UNIVERSITY · DISCOVERY', title: '校园一景',
      text: '明德 · 新民 · 止于至善', note: '校园素材占位 · 非学院楼宇介绍', theme: 'campus' },
    { image: 'assets/campus-building.jpg', alt: '低空参考包中的校园楼宇正面，内部预览占位',
      eyebrow: 'HENAN UNIVERSITY · LEARNING', title: '学在河大',
      text: '向学而行，向新而进', note: '校园素材占位 · 非学院楼宇介绍', theme: 'campus' },
    { image: 'assets/wafer-closeup.jpg', alt: '硅晶圆表面近景，通用学科示意',
      eyebrow: 'INTEGRATED CIRCUITS · EXPLORATION', title: '从一片晶圆，走近微观世界',
      text: '集成电路 · 微纳电子', note: '学科示意 · Le hollandais volant / CC BY 4.0 · 来源见页脚', theme: 'technology' },
  ],
  news: [
    { slug: 'news-preview-1', title: '学院新闻标题（待提供）', summary: '这里展示学院新闻摘要，正式报道与配图待学院提供。', image: 'assets/campus-gate.jpg', imageAlt: '校园牌坊示意配图，非新闻现场' },
    { slug: 'news-preview-2', title: '学院动态标题（待提供）', summary: '这里展示学院动态摘要，具体内容以审定材料为准。', image: 'assets/campus-courtyard.jpg', imageAlt: '校园庭院示意配图，非新闻现场' },
    { slug: 'news-preview-3', title: '学术交流标题（待提供）', summary: '这里展示学术交流摘要，标题、日期与正文待补充。', image: 'assets/campus-landscape.jpg', imageAlt: '校园风光示意配图，非新闻现场' },
    { slug: 'news-preview-4', title: '教学科研新闻标题（待提供）', summary: '这里展示教学科研新闻摘要，正式材料待学院提供。', image: 'assets/chip-banner.svg', imageAlt: '原创芯片概念示意，非新闻现场' },
  ],
  notices: [
    { slug: 'notice-preview-1', title: '学院通知标题（待提供）', summary: '通知正文、发布日期和附件待提供。' },
    { slug: 'notice-preview-2', title: '教学通知标题（待提供）', summary: '待补充经审核的教学通知。' },
    { slug: 'notice-preview-3', title: '学术活动通知标题（待提供）', summary: '待补充活动信息，不代表已有活动安排。' },
  ],
  // 程老师首位，其余沿用原顺序；详情完整展示既有公开资料底稿。
  teachers: [...require('./teachers')].sort((a, b) => Number(b.slug === 'cheng-gang') - Number(a.slug === 'cheng-gang')),
};
