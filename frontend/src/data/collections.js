// 可重复发布的栏目；简介、组织机构、联系方式继续使用单页。
const rows = [
  ['science-innovation', 1, '研究方向', 'cards'],
  ['science-innovation', 2, '研究进展', 'list'], ['science-innovation', 3, '学术交流', 'list'],
  ['research-platforms', 1, '研究平台', 'cards'], ['research-groups', 1, '课题组', 'cards'],
  ['regulations', 1, '规章制度', 'list'], ['regulations', 2, '办事流程', 'list'],
  ['party-building', 1, '党建动态', 'list'], ['party-building', 2, '学习园地', 'list'],
  ['admissions', 1, '本科生招生', 'list'], ['admissions', 2, '研究生招生', 'list'], ['admissions', 3, '就业指导', 'list'],
  ['community', 1, '师生活动', 'list'], ['community', 2, '学生风采', 'cards'],
  ['ic-world', 1, '学科科普', 'list'], ['ic-world', 2, '芯片与微纳世界', 'cards'],
  ['media', 1, '媒体报道', 'list'], ['talent-cultivation', 1, '学科与专业', 'cards'],
  ['talent-cultivation', 2, '课程与培养方案', 'list'], ['public-service', 1, '服务指南', 'list'],
  ['careers', 1, '人才招聘信息', 'list'],
];
module.exports = rows.map(([page, index, title, layout]) => ({
  key: `${page}.section-${index}`, page: `${page}.html`, title, layout,
  slug: `${page}-section-${index}`, url: `${page}-section-${index}.html`,
  anchor: `section-${index}`, position: index,
  watermark: ({'science-innovation': ['RESEARCH', 'PROGRESS', 'EXCHANGE'], 'talent-cultivation': ['EDUCATION', 'CURRICULUM'], admissions: ['ADMISSIONS', 'GRADUATE', 'CAREERS'], community: ['CAMPUS', 'STUDENTS'], regulations: ['POLICY', 'SERVICES'], 'party-building': ['PARTY', 'LEARNING'], 'research-platforms': ['PLATFORMS'], 'research-groups': ['TEAMS'], 'ic-world': ['SCIENCE', 'MICRO NANO'], media: ['MEDIA'], 'public-service': ['SERVICES'], careers: ['CAREERS']})[page][index - 1],
  legacyKeys: [ `${page}.section-${index}`, ...(['research-platforms', 'research-groups'].includes(page) ? [`${page}.section-2`] : []) ],
}));
