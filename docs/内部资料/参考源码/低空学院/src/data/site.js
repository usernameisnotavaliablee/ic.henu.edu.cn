const pageDefaults = {
  "bodyClass": "",
  "cssHref": "css/style.css",
  "activeNav": "",
  "utilityHomeBilingual": true,
  "facultyAnchor": "teacher-team",
  "facultyNationalEn": "National Talent",
  "facultyFeatureEn": "Aerospace Info Lab Team",
  "facultyFeatureBg": "assets/faculty-lab-bg.png",
  "footerNewsHref": "news.html",
  "footerNoticeHref": "notices.html",
  "footerLinksEn": "Links",
  "phoneIconPath": "M4 5c0 8 7 15 15 15l3-4-6-3-2 2c-2-1-4-3-5-5l2-2-3-6z",
  "copyrightEn": "Henan University — College of Low-Altitude Technology &amp; Aerospace Information. All Rights Reserved.",
  "footerSearchAttrs": "",
  "footerOpen": true,
  "footerCmsComment": ""
};

function page(options) {
  return { ...pageDefaults, ...options };
}

module.exports = {
  "collegeName": "低空技术与空天信息学院（筹）",
  "collegeNameWithUniversity": "河南大学低空技术与空天信息学院（筹）",
  "phone": "0371-66597287",
  "phoneHref": "tel:037166597287",
  "email": "dzblatai@henu.edu.cn",
  "addressZh": "河南省郑州市明理路北段 379 号 · 河南大学科创西楼 B 座 4 楼",
  "addressEn": "No. 379 North Mingli Road · Kechuang West Building, Building B, 4F",
  "navigation": {
    "science": {
      "href": "science-innovation.html",
      "zh": "科学与创新",
      "en": "Research &amp; Innovation"
    },
    "talent": {
      "href": "talent-cultivation.html",
      "zh": "人才培养",
      "en": "Talent Cultivation"
    },
    "faculty": {
      "href": "faculty.html",
      "zh": "师资队伍",
      "en": "Faculty"
    },
    "public": {
      "href": "public-service.html",
      "zh": "公共服务",
      "en": "Public Service"
    },
    "about": {
      "href": "about.html",
      "zh": "关于我们",
      "en": "About Us"
    },
    "contact": {
      "href": "contact.html",
      "zh": "联系我们",
      "en": "Contact"
    },
    "careers": {
      "href": "careers.html",
      "zh": "招聘",
      "en": "Careers"
    }
  },
  "pages": {
    "about.html": page({
      "activeNav": "about",
      "facultyNationalEn": "National-Level Talent",
      "facultyFeatureEn": "Aerospace Info Research Team",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "关于我们 — 河南大学低空技术与空天信息学院（筹）",
      "description": "学院概览与办公地址。",
      "type": "overview",
      "contentFile": "about.html"
    }),
    "careers.html": page({
      "activeNav": "careers",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "招聘 — 河南大学低空技术与空天信息学院（筹）",
      "description": "人才引进待遇与招聘专业列表，长期有效。",
      "type": "overview",
      "contentFile": "careers.html"
    }),
    "contact.html": page({
      "activeNav": "contact",
      "facultyNationalEn": "National-Level Talent",
      "facultyFeatureEn": "Aerospace Info Research Team",
      "phoneIconPath": "M22 16.92v3a2 2 0 0 1-2.18 2 19.82 19.82 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.82 19.82 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.95.34 1.88.63 2.77a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.31-1.2a2 2 0 0 1 2.11-.45c.89.29 1.82.5 2.77.63A2 2 0 0 1 22 16.92z",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "联系我们 — 河南大学低空技术与空天信息学院（筹）",
      "description": "邮箱、电话、办公室、地址。",
      "type": "overview",
      "contentFile": "contact.html"
    }),
    "faculty-li-zhengqiang.html": page({
      "activeNav": "faculty",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "李正强 — 河南大学低空技术与空天信息学院（筹）",
      "description": "院士、国家级人才、教师队伍。",
      "type": "detail",
      "detailKey": "faculty-li-zhengqiang.html"
    }),
    "faculty-liu-jiatong.html": page({
      "activeNav": "faculty",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "刘佳彤 — 河南大学低空技术与空天信息学院（筹）",
      "description": "院士、国家级人才、教师队伍。",
      "type": "detail",
      "detailKey": "faculty-liu-jiatong.html"
    }),
    "faculty-wang-jiayao.html": page({
      "activeNav": "faculty",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "王家耀 — 河南大学低空技术与空天信息学院（筹）",
      "description": "院士、国家级人才、教师队伍。",
      "type": "detail",
      "detailKey": "faculty-wang-jiayao.html"
    }),
    "faculty.html": page({
      "activeNav": "faculty",
      "facultyAnchor": "backbone-talent",
      "facultyFeatureBg": "assets/faculty-hero-campus.png",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "师资队伍 — 河南大学低空技术与空天信息学院（筹）",
      "description": "院士、国家级人才、教师队伍。",
      "type": "overview",
      "contentFile": "faculty.html"
    }),
    "index.html": page({
      "bodyClass": "home-york",
      "facultyFeatureBg": "assets/science-home-feature.png",
      "footerLinksEn": "Useful Links",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "低空技术与空天信息学院（筹） — 逐梦空天",
      "description": "河南大学低空技术与空天信息学院（筹）官方网站：科学与创新、人才培养、师资队伍、公共服务。",
      "type": "overview",
      "contentFile": "index.html"
    }),
    "links.html": page({
      "facultyNationalEn": "National-Level Talent",
      "facultyFeatureEn": "Aerospace Info Research Team",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "友情链接 — 河南大学低空技术与空天信息学院（筹）",
      "description": "合作单位与友情链接。",
      "type": "overview",
      "contentFile": "links.html"
    }),
    "news-college-established.html": page({
      "facultyAnchor": "backbone-talent",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "新工科学院揭牌成立 — 河南大学低空技术与空天信息学院（筹）",
      "description": "学院新闻动态。",
      "type": "detail",
      "detailKey": "news-college-established.html"
    }),
    "news-template.html": page({
      "facultyAnchor": "backbone-talent",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "新闻内容页模板 — 河南大学低空技术与空天信息学院（筹）",
      "description": "学院新闻动态。",
      "type": "detail",
      "detailKey": "news-template.html"
    }),
    "news.html": page({
      "facultyAnchor": "backbone-talent",
      "footerLinksEn": "Useful Links",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "footerCmsComment": "<!-- 博达组件区域结束：新闻列表（模板三） -->",
      "title": "新闻 — 河南大学低空技术与空天信息学院（筹）",
      "description": "学院新闻动态。College News.",
      "type": "overview",
      "contentFile": "news.html"
    }),
    "notice-acnt-2026.html": page({
      "facultyAnchor": "backbone-talent",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "第二届飞行器控制与导航技术国际学术会议（ACNT 2026） — 河南大学低空技术与空天信息学院（筹）",
      "description": "第二届飞行器控制与导航技术国际学术会议（ACNT 2026）通知详情。",
      "type": "detail",
      "detailKey": "notice-acnt-2026.html"
    }),
    "notice-careers.html": page({
      "facultyAnchor": "backbone-talent",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "低空技术与空天信息学院（筹）招聘公告 — 河南大学低空技术与空天信息学院（筹）",
      "description": "低空技术与空天信息学院（筹）招聘公告通知详情。",
      "type": "detail",
      "detailKey": "notice-careers.html"
    }),
    "notice-rsmg-2026.html": page({
      "facultyAnchor": "backbone-talent",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "第四届遥感、测绘与地理信息系统国际学术会议（RSMG 2026） — 河南大学低空技术与空天信息学院（筹）",
      "description": "第四届遥感、测绘与地理信息系统国际学术会议（RSMG 2026）通知详情。",
      "type": "detail",
      "detailKey": "notice-rsmg-2026.html"
    }),
    "notices.html": page({
      "facultyAnchor": "backbone-talent",
      "footerLinksEn": "Useful Links",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "footerCmsComment": "<!-- 博达组件区域结束：通知列表（模板四） -->",
      "title": "通知 — 河南大学低空技术与空天信息学院（筹）",
      "description": "学院通知公告。Notices &amp; Announcements.",
      "type": "overview",
      "contentFile": "notices.html"
    }),
    "public-service-training-assembly-maintenance.html": page({
      "activeNav": "public",
      "utilityHomeBilingual": false,
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-training-assembly-maintenance.html"
    }),
    "public-service-training-flight-control.html": page({
      "activeNav": "public",
      "utilityHomeBilingual": false,
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-training-flight-control.html"
    }),
    "public-service-training-industry-app.html": page({
      "activeNav": "public",
      "utilityHomeBilingual": false,
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-training-industry-app.html"
    }),
    "public-service-training-low-altitude-safety.html": page({
      "activeNav": "public",
      "utilityHomeBilingual": false,
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-training-low-altitude-safety.html"
    }),
    "public-service-training-survey-remote.html": page({
      "activeNav": "public",
      "utilityHomeBilingual": false,
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-training-survey-remote.html"
    }),
    "public-service-uav-agriculture.html": page({
      "activeNav": "public",
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-agriculture.html"
    }),
    "public-service-uav-counter.html": page({
      "activeNav": "public",
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-counter.html"
    }),
    "public-service-uav-endurance.html": page({
      "activeNav": "public",
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-endurance.html"
    }),
    "public-service-uav-environment.html": page({
      "activeNav": "public",
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-environment.html"
    }),
    "public-service-uav-firefighting.html": page({
      "activeNav": "public",
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-firefighting.html"
    }),
    "public-service-uav-highaltitude.html": page({
      "activeNav": "public",
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-highaltitude.html"
    }),
    "public-service-uav-inspection.html": page({
      "activeNav": "public",
      "footerOpen": false,
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-inspection.html"
    }),
    "public-service-uav-logistics.html": page({
      "activeNav": "public",
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-logistics.html"
    }),
    "public-service-uav-mapping.html": page({
      "activeNav": "public",
      "utilityHomeBilingual": false,
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-mapping.html"
    }),
    "public-service-uav-publicsafety.html": page({
      "activeNav": "public",
      "utilityHomeBilingual": false,
      "title": "低空技术与空天信息学院（筹） — 公共服务详情",
      "description": "无人机服务、无人机培训、遥感数据产品。",
      "type": "detail",
      "detailKey": "public-service-uav-publicsafety.html"
    }),
    "public-service.html": page({
      "activeNav": "public",
      "footerLinksEn": "Useful Links",
      "copyrightEn": "College of Low-Altitude Technology &amp; Aerospace Information, Henan University. All rights reserved.",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "公共服务 — 河南大学低空技术与空天信息学院（筹）",
      "description": "无人机服务、无人机培训、遥感数据产品。UAV services, UAV training, remote sensing data products.",
      "type": "overview",
      "contentFile": "public-service.html"
    }),
    "science-achievement-carbon-platform.html": page({
      "activeNav": "science",
      "utilityHomeBilingual": false,
      "title": "碳卫星监测与数据处理平台 — 河南大学低空技术与空天信息学院（筹）",
      "description": "碳卫星监测与数据处理平台创新成果详情。",
      "type": "detail",
      "detailKey": "science-achievement-carbon-platform.html"
    }),
    "science-achievement-drone-timestamp.html": page({
      "activeNav": "science",
      "utilityHomeBilingual": false,
      "title": "无人机时空戳 — 河南大学低空技术与空天信息学院（筹）",
      "description": "无人机时空戳创新成果详情。",
      "type": "detail",
      "detailKey": "science-achievement-drone-timestamp.html"
    }),
    "science-achievement-spider-satellite.html": page({
      "activeNav": "science",
      "utilityHomeBilingual": false,
      "title": "低成本高分辨率偏振光谱成像小卫星 — 河南大学低空技术与空天信息学院（筹）",
      "description": "低成本高分辨率偏振光谱成像小卫星创新成果详情。",
      "type": "detail",
      "detailKey": "science-achievement-spider-satellite.html"
    }),
    "science-innovation.html": page({
      "activeNav": "science",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "科学与创新 — 河南大学低空技术与空天信息学院（筹）",
      "description": "创新单元（低空技术 / 空天信息）、科研项目、创新成果。",
      "type": "overview",
      "contentFile": "science-innovation.html"
    }),
    "talent-cultivation.html": page({
      "cssHref": "css/style.css?v=20260721-2",
      "activeNav": "talent",
      "footerSearchAttrs": " data-placeholder-zh=\"搜索网站\" data-placeholder-en=\"Search...\"",
      "title": "人才培养 — 河南大学低空技术与空天信息学院（筹）",
      "description": "奖助学金与学生成长支持。",
      "type": "overview",
      "contentFile": "talent-cultivation.html"
    }),
  }
};
