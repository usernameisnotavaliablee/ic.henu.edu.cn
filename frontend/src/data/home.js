// Home editorial content. Layout and interaction remain in templates/CSS; column links use stable IDs.
module.exports = {
  headings: {
    news:{title:'学院新闻',english:'NEWS · HENU',column:'news',linkLabel:'更多学院新闻'},
    notices:{title:'通知公告',english:'NOTICES · HENU',column:'notices',linkLabel:'更多通知公告'},
    research:{title:'科学与创新',english:'RESEARCH & INNOVATION',column:'research',linkLabel:'了解科学与创新'},
    education:{title:'人才培养',english:'EDUCATION · HENU',column:'education',linkLabel:'了解人才培养'},
    faculty:{title:'师资队伍',english:'FACULTY · HENU',column:'faculty',linkLabel:'查看师资队伍'},
  },
  research:{intro:'从微观探索，到集成创新',summary:'学院研究方向、平台与团队材料待审定，先保留清晰的栏目入口。',
    rows:[{column:'platforms',summary:'平台概览、研究方向与设施介绍待提供'},{column:'groups',summary:'团队名称、成员与简介待提供'}],
    links:['research-progress','academic-exchanges'],image:'assets/chip-banner.jpg',alt:'原创芯片示意，非学院成果',caption:'集成电路 · 微纳电子',note:'原创芯片示意 · 非学院成果'},
  education:{intro:'学有所思，研有所成',summary:'学院专业设置与培养方案待审定，先保留基础栏目框架。',
    rows:[{column:'disciplines',summary:'集成电路相关学科介绍 · 待学院确认'},{column:'curriculum',summary:'课程设置、教学安排与培养文件待提供'}],
    links:[],image:'assets/campus-gate.jpg',alt:'河南大学校园牌坊，校园视觉示意',caption:'明德 · 新民 · 止于至善',note:'校园图片示意 · 正式素材待替换'},
  topics:[
    {id:'wafer',title:'走近晶圆与芯片',column:'research-directions',image:'assets/wafer-12inch.jpg',alt:'12英寸硅晶圆示意，非学院成果',caption:'晶圆示意',source:'image-credits.html#wafer-12inch'},
    {id:'lab',title:'微纳加工与实验',column:'research-progress',image:'assets/cleanroom-lcn.jpg',alt:'伦敦纳米技术中心光刻洁净室，校外场景示意',caption:'校外实验室示意',source:'image-credits.html#cleanroom-lcn'},
    {id:'devices',title:'认识半导体器件',column:'education',image:'assets/wafer-display.jpg',alt:'博物馆中的晶圆与器件展品，科普示意',caption:'展品示意',source:'image-credits.html#wafer-display'},
  ],
  facultyNote:'教师资料持续更新，正式内容待学院及本人核对。',
};
