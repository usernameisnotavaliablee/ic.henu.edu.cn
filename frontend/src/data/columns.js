// 栏目唯一声明。稳定 ID、内容 key、旧 URL 和锚点用于兼容已有资料。
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
          "id": "academic-committee",
          "label": "学术委员会",
          "key": "management.section-2",
          "anchor": "academic-committee"
        },
        {
          "id": "organization",
          "label": "管理机构",
          "key": "about.section-2",
          "anchor": "section-2"
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
          "id": "group-directory",
          "label": "课题组",
          "key": "research-groups.section-1",
          "anchor": "research-groups",
          "reference": true
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
          "id": "undergraduate-admissions",
          "label": "本科生招生",
          "key": "admissions.section-1",
          "anchor": "undergraduate-admissions"
        },
        {
          "id": "graduate-admissions",
          "label": "研究生招生",
          "key": "admissions.section-2",
          "anchor": "graduate-admissions"
        },
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
        },
        {
          "id": "engineering-accreditation",
          "label": "工程教育认证",
          "key": "talent-cultivation.section-3",
          "anchor": "section-3"
        },
        {
          "id": "employment-guidance",
          "label": "就业指导",
          "key": "admissions.section-3",
          "anchor": "employment-guidance"
        }
      ]
    },
    {
      "id": "faculty",
      "kind": "page",
      "url": "faculty.html",
      "title": "师资队伍",
      "english": "FACULTY",
      "facultyFilter": "",
      "parentId": null
    },
    {
      "id": "news",
      "kind": "page",
      "url": "news.html",
      "title": "学院新闻",
      "navTitle": "新闻通知",
      "previewBreadcrumbs": {
        "detail": [
          {
            "id": "news",
            "label": "新闻通知"
          },
          {
            "id": "news",
            "label": "学院新闻"
          }
        ]
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
      "url": "public-service.html",
      "title": "服务指南",
      "kind": "alias",
      "aliasOf": "service-guides",
      "parentId": "community"
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
      "url": "regulations.html",
      "title": "规章与办事",
      "kind": "alias",
      "aliasOf": "student-regulations",
      "parentId": "community"
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
          "anchor": "section-1",
          "reference": true
        },
        {
          "id": "graduate-admissions",
          "label": "研究生招生",
          "key": "admissions.section-2",
          "anchor": "section-2",
          "reference": true
        },
        {
          "id": "employment-guidance",
          "label": "就业指导",
          "key": "admissions.section-3",
          "anchor": "section-3",
          "reference": true
        }
      ],
      "listed": false
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
        },
        {
          "id": "youth-league",
          "label": "团学建设",
          "key": "community.section-4",
          "anchor": "section-4"
        },
        {
          "id": "student-regulations",
          "label": "制度建设",
          "key": "community.section-3",
          "anchor": "section-3"
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
        "page": [
          {
            "id": "news",
            "label": "新闻通知"
          },
          {
            "id": "news",
            "label": "新闻通知"
          }
        ]
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
      "parentId": null
    },
    {
      "id": "credits",
      "kind": "page",
      "url": "image-credits.html",
      "title": "图片来源与授权",
      "english": "IMAGE CREDITS",
      "parentId": null
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
      "url": "regulations-section-1.html",
      "title": "行政规章制度",
      "kind": "alias",
      "aliasOf": "student-regulations",
      "parentId": "community"
    },
    {
      "id": "service-procedures",
      "url": "regulations-section-2.html",
      "title": "办事流程",
      "kind": "alias",
      "aliasOf": "student-regulations",
      "parentId": "community"
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
      "parentId": "education",
      "title": "本科生招生",
      "url": "admissions-section-1.html",
      "storageKey": "admissions.section-1",
      "anchor": "undergraduate-admissions",
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
      "parentId": "education",
      "title": "研究生招生",
      "url": "admissions-section-2.html",
      "storageKey": "admissions.section-2",
      "anchor": "graduate-admissions",
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
      "parentId": "education",
      "title": "就业指导",
      "url": "admissions-section-3.html",
      "storageKey": "admissions.section-3",
      "anchor": "employment-guidance",
      "order": 6,
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
      "order": 3,
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
      "order": 4,
      "layout": "list",
      "watermark": "CURRICULUM",
      "legacyKeys": [
        "talent-cultivation.section-2"
      ]
    },
    {
      "id": "service-guides",
      "listed": false,
      "kind": "collection",
      "parentId": "community",
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
      "kind": "overview",
      "parentId": "about",
      "title": "管理机构",
      "url": "management.html",
      "storageKey": "about.section-2",
      "anchor": "section-2",
      "watermark": "ORGANIZATION",
      "english": "ADMINISTRATION",
      "legacyKeys": [
        "about.section-2"
      ],
      "sections": [
        {
          "id": "leadership",
          "label": "领导班子",
          "key": "about.section-3",
          "anchor": "section-1"
        },
        {
          "id": "administrative-offices",
          "label": "党政机构",
          "key": "management.section-3",
          "anchor": "section-3"
        },
        {
          "id": "professors-committee",
          "label": "教授委员会",
          "key": "management.section-4",
          "anchor": "section-4"
        },
        {
          "id": "trade-union",
          "label": "工会",
          "key": "management.section-5",
          "anchor": "section-5"
        }
      ]
    },
    {
      "id": "leadership",
      "kind": "collection",
      "parentId": "organization",
      "title": "领导班子",
      "url": "management-leadership.html",
      "storageKey": "about.section-3",
      "anchor": "section-1",
      "watermark": "LEADERSHIP",
      "order": 1,
      "layout": "cards",
      "legacyKeys": [
        "about.section-3"
      ]
    },
    {
      "id": "faculty-directory",
      "kind": "section",
      "parentId": "faculty",
      "url": "faculty.html#faculty-list",
      "title": "教师名录",
      "anchor": "faculty-list"
    },
    {
      "id": "academic-committee",
      "kind": "collection",
      "parentId": "about",
      "title": "学术委员会",
      "url": "management-committee.html",
      "storageKey": "management.section-2",
      "anchor": "academic-committee",
      "order": 2,
      "layout": "list",
      "watermark": "COMMITTEE",
      "legacyKeys": [
        "management.section-2"
      ]
    },
    {
      "id": "administrative-offices",
      "kind": "collection",
      "parentId": "organization",
      "title": "党政机构",
      "url": "management-offices.html",
      "storageKey": "management.section-3",
      "anchor": "section-3",
      "order": 2,
      "layout": "list",
      "watermark": "OFFICES",
      "legacyKeys": [
        "management.section-3"
      ]
    },
    {
      "id": "engineering-accreditation",
      "kind": "collection",
      "parentId": "education",
      "title": "工程教育认证",
      "url": "engineering-accreditation.html",
      "storageKey": "talent-cultivation.section-3",
      "anchor": "section-3",
      "order": 5,
      "layout": "list",
      "watermark": "ACCREDITATION",
      "legacyKeys": [
        "talent-cultivation.section-3"
      ]
    },
    {
      "id": "student-regulations",
      "kind": "collection",
      "parentId": "community",
      "title": "制度建设",
      "url": "student-regulations.html",
      "storageKey": "community.section-3",
      "anchor": "section-3",
      "order": 4,
      "layout": "list",
      "watermark": "REGULATIONS",
      "legacyKeys": [
        "community.section-3",
        "regulations.section-1",
        "regulations.section-2"
      ],
      "sort": "date-desc"
    },
    {
      "id": "instruments",
      "kind": "overview",
      "title": "大型仪器",
      "url": "instruments.html",
      "english": "SHARED INSTRUMENTS",
      "parentId": "research",
      "sections": [
        {
          "id": "instrument-directory",
          "label": "仪器与共享服务",
          "key": "instruments.section-1",
          "anchor": "section-1"
        }
      ]
    },
    {
      "id": "instrument-directory",
      "kind": "collection",
      "parentId": "instruments",
      "title": "仪器与共享服务",
      "url": "instruments-directory.html",
      "storageKey": "instruments.section-1",
      "anchor": "section-1",
      "order": 1,
      "layout": "cards",
      "watermark": "INSTRUMENTS",
      "legacyKeys": [
        "instruments.section-1"
      ],
      "service": true
    },
    {
      "id": "faculty-talents",
      "kind": "page",
      "parentId": "faculty",
      "title": "高层次人才",
      "url": "faculty-talents.html",
      "english": "FACULTY",
      "facultyFilter": "talent"
    },
    {
      "id": "faculty-teachers",
      "kind": "page",
      "parentId": "faculty",
      "title": "普通教师",
      "url": "faculty-teachers.html",
      "english": "FACULTY",
      "facultyFilter": "regular"
    },
    {
      "id": "professors-committee",
      "title": "教授委员会",
      "url": "management-professors.html",
      "storageKey": "management.section-4",
      "anchor": "section-4",
      "order": 3,
      "watermark": "PROFESSORS",
      "kind": "collection",
      "parentId": "organization",
      "layout": "list",
      "legacyKeys": [
        "management.section-4"
      ],
      "sort": "date-desc"
    },
    {
      "id": "trade-union",
      "title": "工会",
      "url": "management-union.html",
      "storageKey": "management.section-5",
      "anchor": "section-5",
      "order": 4,
      "watermark": "UNION",
      "kind": "collection",
      "parentId": "organization",
      "layout": "list",
      "legacyKeys": [
        "management.section-5"
      ],
      "sort": "date-desc"
    },
    {
      "id": "youth-league",
      "title": "团学建设",
      "url": "community-youth.html",
      "storageKey": "community.section-4",
      "anchor": "section-4",
      "order": 3,
      "watermark": "YOUTH",
      "kind": "collection",
      "parentId": "community",
      "layout": "list",
      "legacyKeys": [
        "community.section-4"
      ],
      "sort": "date-desc"
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
          "id": "academic-committee"
        },
        {
          "id": "organization",
          "children": [
            {
              "id": "leadership"
            },
            {
              "id": "administrative-offices"
            },
            {
              "id": "professors-committee"
            },
            {
              "id": "trade-union"
            }
          ]
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
          "id": "platforms"
        },
        {
          "id": "groups"
        },
        {
          "id": "research-progress"
        },
        {
          "id": "academic-exchanges"
        },
        {
          "id": "ic-world"
        },
        {
          "id": "instruments"
        }
      ]
    },
    {
      "id": "education",
      "children": [
        {
          "id": "undergraduate-admissions"
        },
        {
          "id": "graduate-admissions"
        },
        {
          "id": "disciplines"
        },
        {
          "id": "curriculum"
        },
        {
          "id": "engineering-accreditation"
        },
        {
          "id": "employment-guidance"
        },
        {
          "id": "community",
          "children": [
            {
              "id": "campus-activities"
            },
            {
              "id": "student-stories"
            },
            {
              "id": "youth-league"
            },
            {
              "id": "student-regulations"
            }
          ]
        }
      ]
    },
    {
      "id": "faculty",
      "children": [
        {
          "id": "faculty-talents"
        },
        {
          "id": "faculty-teachers"
        },
        {
          "id": "faculty-directory"
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
      "id": "careers"
    },
    {
      "id": "contact"
    }
  ]
};
