// 栏目唯一声明。id 不随排序变化；storageKey、旧锚点和 URL 是持久化兼容边界。
// navigation 仅描述入口顺序和复用标签，实际地址/层级来自 nodes。
module.exports = {
  "nodes": [
    {
      "id": "home",
      "kind": "page",
      "url": "index.html",
      "title": "首页",
      "english": "",
      "parentId": null
    },
    {
      "id": "about",
      "kind": "overview",
      "url": "about.html",
      "title": "学院概况",
      "english": "ABOUT THE SCHOOL",
      "parentId": null,
      "sections": [
        {
          "id": "school-introduction",
          "label": "学院简介",
          "key": "about.section-1",
          "anchor": "section-1"
        },
        {
          "id": "organization",
          "label": "组织机构",
          "key": "about.section-2",
          "anchor": "section-2"
        },
        {
          "id": "leadership",
          "label": "领导班子",
          "key": "about.section-3",
          "anchor": "section-3"
        }
      ]
    },
    {
      "id": "research",
      "kind": "overview",
      "url": "science-innovation.html",
      "title": "科学与创新",
      "english": "RESEARCH & INNOVATION",
      "parentId": null,
      "sections": [
        {
          "id": "research-directions",
          "label": "研究方向",
          "key": "science-innovation.section-1",
          "anchor": "section-1"
        },
        {
          "id": "research-progress",
          "label": "研究进展",
          "key": "science-innovation.section-2",
          "anchor": "section-2"
        },
        {
          "id": "academic-exchanges",
          "label": "学术交流",
          "key": "science-innovation.section-3",
          "anchor": "section-3"
        }
      ]
    },
    {
      "id": "education",
      "kind": "overview",
      "url": "talent-cultivation.html",
      "title": "人才培养",
      "english": "EDUCATION",
      "parentId": null,
      "sections": [
        {
          "id": "disciplines",
          "label": "学科与专业",
          "key": "talent-cultivation.section-1",
          "anchor": "section-1"
        },
        {
          "id": "curriculum",
          "label": "课程与培养方案",
          "key": "talent-cultivation.section-2",
          "anchor": "section-2"
        }
      ]
    },
    {
      "id": "faculty",
      "kind": "page",
      "url": "faculty.html",
      "title": "师资队伍",
      "english": "FACULTY",
      "parentId": null
    },
    {
      "id": "news",
      "kind": "page",
      "url": "news.html",
      "title": "学院新闻",
      "navTitle": "新闻通知",
      "previewBreadcrumbs": {
        "detail": [{ "id": "news", "label": "新闻通知" }, { "id": "news", "label": "学院新闻" }]
      },
      "english": "NEWS",
      "parentId": null
    },
    {
      "id": "party",
      "kind": "overview",
      "url": "party-building.html",
      "title": "党建党务",
      "english": "PARTY BUILDING",
      "parentId": null,
      "sections": [
        {
          "id": "party-news",
          "label": "党建动态",
          "key": "party-building.section-1",
          "anchor": "section-1"
        },
        {
          "id": "party-learning",
          "label": "学习园地",
          "key": "party-building.section-2",
          "anchor": "section-2"
        }
      ]
    },
    {
      "id": "services",
      "kind": "overview",
      "url": "public-service.html",
      "title": "公共服务",
      "english": "PUBLIC SERVICE",
      "parentId": null,
      "sections": [
        {
          "id": "service-guides",
          "label": "公共服务信息",
          "key": "public-service.section-1",
          "anchor": "section-1"
        }
      ]
    },
    {
      "id": "careers",
      "kind": "overview",
      "url": "careers.html",
      "title": "人才招聘",
      "english": "JOIN US",
      "parentId": null,
      "sections": [
        {
          "id": "job-openings",
          "label": "人才招聘信息",
          "key": "careers.section-1",
          "anchor": "section-1"
        }
      ]
    },
    {
      "id": "contact",
      "kind": "page",
      "url": "contact.html",
      "title": "联系我们",
      "english": "CONTACT",
      "parentId": null
    },
    {
      "id": "platforms",
      "kind": "overview",
      "url": "research-platforms.html",
      "title": "研究平台",
      "english": "",
      "parentId": "research",
      "sections": [
        {
          "id": "platform-directory",
          "label": "平台概览",
          "key": "research-platforms.section-1",
          "anchor": "section-1"
        },
        {
          "id": "platform-directory",
          "label": "平台介绍",
          "key": "research-platforms.section-2",
          "anchor": "section-2"
        }
      ]
    },
    {
      "id": "groups",
      "kind": "overview",
      "url": "research-groups.html",
      "title": "课题组",
      "english": "",
      "parentId": "research",
      "sections": [
        {
          "id": "group-directory",
          "label": "团队概览",
          "key": "research-groups.section-1",
          "anchor": "section-1"
        },
        {
          "id": "group-directory",
          "label": "课题组介绍",
          "key": "research-groups.section-2",
          "anchor": "section-2"
        }
      ]
    },
    {
      "id": "regulations",
      "kind": "overview",
      "url": "regulations.html",
      "title": "制度建设",
      "english": "",
      "parentId": "services",
      "sections": [
        {
          "id": "regulation-records",
          "label": "规章制度",
          "key": "regulations.section-1",
          "anchor": "section-1"
        },
        {
          "id": "service-procedures",
          "label": "办事流程",
          "key": "regulations.section-2",
          "anchor": "section-2"
        }
      ]
    },
    {
      "id": "admissions",
      "kind": "overview",
      "url": "admissions.html",
      "title": "招生就业",
      "english": "",
      "parentId": "education",
      "sections": [
        {
          "id": "undergraduate-admissions",
          "label": "本科生招生",
          "key": "admissions.section-1",
          "anchor": "section-1"
        },
        {
          "id": "graduate-admissions",
          "label": "研究生招生",
          "key": "admissions.section-2",
          "anchor": "section-2"
        },
        {
          "id": "employment-guidance",
          "label": "就业指导",
          "key": "admissions.section-3",
          "anchor": "section-3"
        }
      ]
    },
    {
      "id": "community",
      "kind": "overview",
      "url": "community.html",
      "title": "师生园地",
      "english": "",
      "parentId": "education",
      "sections": [
        {
          "id": "campus-activities",
          "label": "师生活动",
          "key": "community.section-1",
          "anchor": "section-1"
        },
        {
          "id": "student-stories",
          "label": "学生风采",
          "key": "community.section-2",
          "anchor": "section-2"
        }
      ]
    },
    {
      "id": "ic-world",
      "kind": "overview",
      "url": "ic-world.html",
      "title": "芯片天地",
      "english": "",
      "parentId": "research",
      "sections": [
        {
          "id": "science-outreach",
          "label": "学科科普",
          "key": "ic-world.section-1",
          "anchor": "section-1"
        },
        {
          "id": "micro-nano-world",
          "label": "芯片与微纳世界",
          "key": "ic-world.section-2",
          "anchor": "section-2"
        }
      ]
    },
    {
      "id": "media",
      "kind": "overview",
      "url": "media.html",
      "title": "媒体掠影",
      "english": "",
      "parentId": "news",
      "sections": [
        {
          "id": "media-reports",
          "label": "媒体报道",
          "key": "media.section-1",
          "anchor": "section-1"
        }
      ]
    },
    {
      "id": "notices",
      "previewBreadcrumbs": {
        "page": [{ "id": "news", "label": "新闻通知" }, { "id": "news", "label": "新闻通知" }]
      },
      "kind": "page",
      "url": "notices.html",
      "title": "通知公告",
      "english": "NOTICES",
      "parentId": "news"
    },
    {
      "id": "sitemap",
      "kind": "page",
      "url": "site-map.html",
      "title": "网站导航",
      "english": "SITE MAP",
      "parentId": "services"
    },
    {
      "id": "credits",
      "kind": "page",
      "url": "image-credits.html",
      "title": "图片来源与授权",
      "english": "IMAGE CREDITS",
      "parentId": "services"
    },
    {
      "id": "research-directions",
      "kind": "collection",
      "parentId": "research",
      "title": "研究方向",
      "url": "science-innovation-section-1.html",
      "storageKey": "science-innovation.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "cards",
      "watermark": "RESEARCH",
      "legacyKeys": [
        "science-innovation.section-1"
      ]
    },
    {
      "id": "research-progress",
      "kind": "collection",
      "parentId": "research",
      "title": "研究进展",
      "url": "science-innovation-section-2.html",
      "storageKey": "science-innovation.section-2",
      "anchor": "section-2",
      "order": 2,
      "layout": "list",
      "watermark": "PROGRESS",
      "legacyKeys": [
        "science-innovation.section-2"
      ]
    },
    {
      "id": "academic-exchanges",
      "kind": "collection",
      "parentId": "research",
      "title": "学术交流",
      "url": "science-innovation-section-3.html",
      "storageKey": "science-innovation.section-3",
      "anchor": "section-3",
      "order": 3,
      "layout": "list",
      "watermark": "EXCHANGE",
      "legacyKeys": [
        "science-innovation.section-3"
      ]
    },
    {
      "id": "platform-directory",
      "kind": "collection",
      "parentId": "platforms",
      "title": "研究平台",
      "url": "research-platforms-section-1.html",
      "storageKey": "research-platforms.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "cards",
      "watermark": "PLATFORMS",
      "legacyKeys": [
        "research-platforms.section-1",
        "research-platforms.section-2"
      ]
    },
    {
      "id": "group-directory",
      "kind": "collection",
      "parentId": "groups",
      "title": "课题组",
      "url": "research-groups-section-1.html",
      "storageKey": "research-groups.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "cards",
      "watermark": "TEAMS",
      "legacyKeys": [
        "research-groups.section-1",
        "research-groups.section-2"
      ]
    },
    {
      "id": "regulation-records",
      "kind": "collection",
      "parentId": "regulations",
      "title": "规章制度",
      "url": "regulations-section-1.html",
      "storageKey": "regulations.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "list",
      "watermark": "POLICY",
      "legacyKeys": [
        "regulations.section-1"
      ]
    },
    {
      "id": "service-procedures",
      "kind": "collection",
      "parentId": "regulations",
      "title": "办事流程",
      "url": "regulations-section-2.html",
      "storageKey": "regulations.section-2",
      "anchor": "section-2",
      "order": 2,
      "layout": "list",
      "watermark": "SERVICES",
      "legacyKeys": [
        "regulations.section-2"
      ]
    },
    {
      "id": "party-news",
      "kind": "collection",
      "parentId": "party",
      "title": "党建动态",
      "url": "party-building-section-1.html",
      "storageKey": "party-building.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "list",
      "watermark": "PARTY",
      "legacyKeys": [
        "party-building.section-1"
      ]
    },
    {
      "id": "party-learning",
      "kind": "collection",
      "parentId": "party",
      "title": "学习园地",
      "url": "party-building-section-2.html",
      "storageKey": "party-building.section-2",
      "anchor": "section-2",
      "order": 2,
      "layout": "list",
      "watermark": "LEARNING",
      "legacyKeys": [
        "party-building.section-2"
      ]
    },
    {
      "id": "undergraduate-admissions",
      "kind": "collection",
      "parentId": "admissions",
      "title": "本科生招生",
      "url": "admissions-section-1.html",
      "storageKey": "admissions.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "list",
      "watermark": "ADMISSIONS",
      "legacyKeys": [
        "admissions.section-1"
      ]
    },
    {
      "id": "graduate-admissions",
      "kind": "collection",
      "parentId": "admissions",
      "title": "研究生招生",
      "url": "admissions-section-2.html",
      "storageKey": "admissions.section-2",
      "anchor": "section-2",
      "order": 2,
      "layout": "list",
      "watermark": "GRADUATE",
      "legacyKeys": [
        "admissions.section-2"
      ]
    },
    {
      "id": "employment-guidance",
      "kind": "collection",
      "parentId": "admissions",
      "title": "就业指导",
      "url": "admissions-section-3.html",
      "storageKey": "admissions.section-3",
      "anchor": "section-3",
      "order": 3,
      "layout": "list",
      "watermark": "CAREERS",
      "legacyKeys": [
        "admissions.section-3"
      ]
    },
    {
      "id": "campus-activities",
      "kind": "collection",
      "parentId": "community",
      "title": "师生活动",
      "url": "community-section-1.html",
      "storageKey": "community.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "list",
      "watermark": "CAMPUS",
      "legacyKeys": [
        "community.section-1"
      ]
    },
    {
      "id": "student-stories",
      "kind": "collection",
      "parentId": "community",
      "title": "学生风采",
      "url": "community-section-2.html",
      "storageKey": "community.section-2",
      "anchor": "section-2",
      "order": 2,
      "layout": "cards",
      "watermark": "STUDENTS",
      "legacyKeys": [
        "community.section-2"
      ]
    },
    {
      "id": "science-outreach",
      "kind": "collection",
      "parentId": "ic-world",
      "title": "学科科普",
      "url": "ic-world-section-1.html",
      "storageKey": "ic-world.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "list",
      "watermark": "SCIENCE",
      "legacyKeys": [
        "ic-world.section-1"
      ]
    },
    {
      "id": "micro-nano-world",
      "kind": "collection",
      "parentId": "ic-world",
      "title": "芯片与微纳世界",
      "url": "ic-world-section-2.html",
      "storageKey": "ic-world.section-2",
      "anchor": "section-2",
      "order": 2,
      "layout": "cards",
      "watermark": "MICRO NANO",
      "legacyKeys": [
        "ic-world.section-2"
      ]
    },
    {
      "id": "media-reports",
      "kind": "collection",
      "parentId": "media",
      "title": "媒体报道",
      "url": "media-section-1.html",
      "storageKey": "media.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "list",
      "watermark": "MEDIA",
      "legacyKeys": [
        "media.section-1"
      ]
    },
    {
      "id": "disciplines",
      "kind": "collection",
      "parentId": "education",
      "title": "学科与专业",
      "url": "talent-cultivation-section-1.html",
      "storageKey": "talent-cultivation.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "cards",
      "watermark": "EDUCATION",
      "legacyKeys": [
        "talent-cultivation.section-1"
      ]
    },
    {
      "id": "curriculum",
      "kind": "collection",
      "parentId": "education",
      "title": "课程与培养方案",
      "url": "talent-cultivation-section-2.html",
      "storageKey": "talent-cultivation.section-2",
      "anchor": "section-2",
      "order": 2,
      "layout": "list",
      "watermark": "CURRICULUM",
      "legacyKeys": [
        "talent-cultivation.section-2"
      ]
    },
    {
      "id": "service-guides",
      "kind": "collection",
      "parentId": "services",
      "title": "服务指南",
      "url": "public-service-section-1.html",
      "storageKey": "public-service.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "list",
      "watermark": "SERVICES",
      "legacyKeys": [
        "public-service.section-1"
      ]
    },
    {
      "id": "job-openings",
      "kind": "collection",
      "parentId": "careers",
      "title": "人才招聘信息",
      "url": "careers-section-1.html",
      "storageKey": "careers.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "list",
      "watermark": "CAREERS",
      "legacyKeys": [
        "careers.section-1"
      ]
    },
    {
      "id": "school-introduction",
      "kind": "section",
      "parentId": "about",
      "title": "学院简介",
      "url": "about.html#section-1",
      "storageKey": "about.section-1",
      "anchor": "section-1",
      "watermark": "INTRODUCTION"
    },
    {
      "id": "organization",
      "kind": "section",
      "parentId": "about",
      "title": "组织机构",
      "url": "about.html#section-2",
      "storageKey": "about.section-2",
      "anchor": "section-2",
      "watermark": "ORGANIZATION"
    },
    {
      "id": "leadership",
      "kind": "section",
      "parentId": "about",
      "title": "领导班子",
      "url": "about.html#section-3",
      "storageKey": "about.section-3",
      "anchor": "section-3",
      "watermark": "LEADERSHIP"
    },
    {
      "id": "faculty-directory",
      "kind": "section",
      "parentId": "faculty",
      "url": "faculty.html#faculty-list",
      "title": "教师名录",
      "anchor": "faculty-list"
    }
  ],
  "navigation": [
    {
      "id": "home"
    },
    {
      "id": "about",
      "children": [
        {
          "id": "school-introduction"
        },
        {
          "id": "organization"
        },
        {
          "id": "leadership"
        }
      ]
    },
    {
      "id": "research",
      "children": [
        {
          "id": "research-directions"
        },
        {
          "id": "platforms",
          "children": [
            {
              "id": "platform-directory",
              "label": "平台概览"
            },
            {
              "id": "platform-directory",
              "label": "平台介绍"
            }
          ]
        },
        {
          "id": "groups",
          "children": [
            {
              "id": "group-directory",
              "label": "团队概览"
            },
            {
              "id": "group-directory",
              "label": "课题组介绍"
            }
          ]
        },
        {
          "id": "research-progress"
        },
        {
          "id": "academic-exchanges"
        },
        {
          "id": "ic-world"
        }
      ]
    },
    {
      "id": "education",
      "children": [
        {
          "id": "disciplines"
        },
        {
          "id": "curriculum"
        },
        {
          "id": "admissions",
          "children": [
            {
              "id": "undergraduate-admissions"
            },
            {
              "id": "graduate-admissions"
            },
            {
              "id": "employment-guidance"
            }
          ]
        },
        {
          "id": "community",
          "children": [
            {
              "id": "campus-activities"
            },
            {
              "id": "student-stories"
            }
          ]
        }
      ]
    },
    {
      "id": "faculty",
      "children": [
        {
          "id": "faculty-directory"
        },
        {
          "id": "careers"
        }
      ]
    },
    {
      "id": "news",
      "children": [
        {
          "id": "news",
          "label": "学院新闻"
        },
        {
          "id": "notices"
        },
        {
          "id": "media"
        }
      ]
    },
    {
      "id": "party",
      "children": [
        {
          "id": "party-news"
        },
        {
          "id": "party-learning"
        }
      ]
    },
    {
      "id": "services",
      "children": [
        {
          "id": "regulations",
          "label": "制度与办事",
          "children": [
            {
              "id": "regulation-records"
            },
            {
              "id": "service-procedures"
            }
          ]
        },
        {
          "id": "service-guides"
        },
        {
          "id": "sitemap"
        }
      ]
    },
    {
      "id": "careers"
    },
    {
      "id": "contact"
    }
  ]
};
