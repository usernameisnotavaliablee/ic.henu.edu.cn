// 重构不应意外删除已有地址、教师完整资料或顶层栏目。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const baseline = require('../qa/refactor-baseline.json');
const site = require('../src/data/site');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
for (const file of baseline.pages) assert(fs.existsSync(path.resolve(__dirname, '../preview', file)), `原有地址缺失: ${file}`);
assert.deepEqual(site.navigation, baseline.navigation.filter(([url])=>url!=='public-service.html'), '顶层栏目或顺序改变，需要确认设计变化');
assert.equal(digest(site.teachers.map(({id,order,...record})=>record).sort((a,b)=>['cheng-gang','zhang-jinlong','zheng-haiwu'].indexOf(a.slug)-['cheng-gang','zhang-jinlong','zheng-haiwu'].indexOf(b.slug))), baseline.teachersSha256, '教师完整资料或展示顺序改变');
assert.deepEqual(site.slides.map(({ image, title }) => ({ image, title })), baseline.slides, '轮播素材或标题改变');
console.log(`PASS: ${baseline.pages.length} existing URLs, ${site.navigation.length} navigation entries, full teacher data and slide assets preserved`);
