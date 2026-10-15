// Pure view model. Adapters supply one teacher per stable ID and separate approved title relations.
function createFaculty({teachers, categories, memberships = []}) {
  const categoryMap = new Map();
  for (const c of categories) {
    if (!c.id || categoryMap.has(c.id) || !Number.isFinite(c.priority) || !['portrait','compact','names'].includes(c.display)) throw new Error(`Invalid faculty category: ${c.id}`);
    categoryMap.set(c.id, c);
  }
  const people = new Map();
  for (const t of teachers) {
    const id = t.id || t.slug;
    if (!id || people.has(id)) throw new Error(`Duplicate/missing teacher identity: ${id}`);
    people.set(id, {...t, id, slug:t.slug || id, href:t.href || `teacher-${t.slug || id}.html`, awards:[], legacyCategories:[]});
  }
  const pairs = new Set();
  for (const relation of memberships) {
    const person = people.get(relation.teacherId);
    if (!person) throw new Error(`Unknown teacher in title relation: ${relation.teacherId}`);
    const pair = `${relation.teacherId}/${relation.categoryId}`;
    if (pairs.has(pair)) throw new Error(`Duplicate faculty relation: ${pair}`);
    pairs.add(pair);
    const year = relation.year;
    if (year != null && year !== '' && !/^\d{4}$/.test(String(year))) throw new Error(`Invalid award year: ${pair}`);
    if (!categoryMap.has(relation.categoryId)) {
      // Preserve historic metadata (including other-talent), without inventing an approved group.
      person.legacyCategories.push({...relation});
      continue;
    }
    person.awards.push({categoryId:relation.categoryId, year:year || null});
  }
  const orderedCategories = [...categories].filter(c=>c.enabled !== false).sort((a,b)=>a.priority-b.priority || a.id.localeCompare(b.id));
  const activeIds = new Set(orderedCategories.map(c=>c.id));
  const rank = t => Math.min(...t.awards.filter(a=>activeIds.has(a.categoryId)).map(a=>categoryMap.get(a.categoryId).priority), Number.MAX_SAFE_INTEGER);
  const manual = (a,b) => (a.order ?? 100) - (b.order ?? 100) || a.id.localeCompare(b.id);
  const visible = [...people.values()].filter(t=>t.published !== false && t.visible !== false).sort(manual);
  const sections = group => orderedCategories.filter(c=>c.group===group).map(c=>({
    ...c, teachers:visible.filter(t=>t.awards.some(a=>a.categoryId===c.id)).map(t=>({...t, awardYear:t.awards.find(a=>a.categoryId===c.id).year})),
  })).filter(c=>c.teachers.length || c.showWhenEmpty === true);
  return {teachers:visible, sections, home:[...visible].sort((a,b)=>rank(a)-rank(b) || manual(a,b)).slice(0,3)};
}
module.exports = {createFaculty};
