// 文案、栏目、轮播的统一入口。这里的示例仅供内部预览。
module.exports = {
  name: '河南大学集成电路与微纳电子学院',
  college: '集成电路与微纳电子学院',
  english: 'School of Integrated Circuits and Micro-Nano Electronics',
  navigation: [
    ['index.html', '首页'], ['about.html', '学院概况'],
    ['science-innovation.html', '科学与创新'], ['talent-cultivation.html', '人才培养'],
    ['faculty.html', '师资队伍'], ['news.html', '新闻通知'],
    ['public-service.html', '公共服务'], ['careers.html', '人才招聘'], ['contact.html', '联系我们'],
  ],
  // 未取得学校配置前保持 null，不填写猜测的接口或旧学院 ID。
  cms: { adminUrl: null, siteId: null, newsColumnId: null, noticeColumnId: null, searchUrl: null },
  contact: { address: '待提供', phone: '待提供', email: '待提供' },
  slides: [
    { image: 'assets/campus-gate.jpg', alt: '河南大学牌坊，来自低空参考包的校园图片',
      eyebrow: 'HENAN UNIVERSITY', title: '集成电路与微纳电子学院',
      text: '河南大学', note: '校园图片示意 · 待替换高清素材', theme: 'campus' },
    { image: 'assets/chip-banner.svg', alt: '芯片与电路走线原创示意图',
      eyebrow: 'INTEGRATED CIRCUITS · MICRO-NANO ELECTRONICS', title: '集成电路 · 微纳电子',
      text: '河南大学集成电路与微纳电子学院', note: '学科主题视觉示意', theme: 'chip' },
  ],
  news: [
    { slug: 'news-preview-1', title: '学院新闻标题（待提供）', summary: '图片新闻展示区域，待补充经审核的新闻标题、摘要及配图。' },
    { slug: 'news-preview-2', title: '学院动态标题（待提供）', summary: '待补充学院动态正文与配图。' },
    { slug: 'news-preview-3', title: '学术交流标题（待提供）', summary: '待补充经审核的学术交流内容。' },
    { slug: 'news-preview-4', title: '教学科研新闻标题（待提供）', summary: '待补充经审核的教学科研内容。' },
  ],
  notices: [
    { slug: 'notice-preview-1', title: '学院通知标题（待提供）', summary: '通知正文、发布日期和附件待提供。' },
    { slug: 'notice-preview-2', title: '教学通知标题（待提供）', summary: '待补充经审核的教学通知。' },
    { slug: 'notice-preview-3', title: '学术活动通知标题（待提供）', summary: '待补充活动信息，不代表已有活动安排。' },
  ],
  teachers: [
    { slug: 'zhang-jinlong', name: '张锦龙', image: 'assets/teacher-zhang.jpg' },
    { slug: 'zheng-haiwu', name: '郑海务', image: 'assets/teacher-zheng.jpg' },
    { slug: 'cheng-gang', name: '程纲', image: 'assets/teacher-cheng.jpg' },
  ],
  pages: {
    'about.html': { title: '学院概况', english: 'ABOUT THE SCHOOL', sections: ['学院简介', '组织机构'] },
    'science-innovation.html': { title: '科学与创新', english: 'RESEARCH & INNOVATION', sections: ['研究方向', '科研平台与成果'] },
    'talent-cultivation.html': { title: '人才培养', english: 'EDUCATION', sections: ['学科与专业', '课程与培养方案'] },
    'public-service.html': { title: '公共服务', english: 'PUBLIC SERVICE', sections: ['公共服务信息'] },
    'careers.html': { title: '人才招聘', english: 'JOIN US', sections: ['人才招聘信息'] },
  },
};
