const fs = require('node:fs');
const path = require('node:path');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function render(template, values) {
  return template.replace(/{{([a-zA-Z0-9_]+)}}/g, (_, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Missing template value: ${key}`);
    return values[key];
  });
}
function createTemplates(directory) {
  const cache = new Map();
  const read = name => {
    if (!cache.has(name)) cache.set(name, fs.readFileSync(path.join(directory, name), 'utf8'));
    return cache.get(name);
  };
  const slots = new Map();
  function slot(name, preview, django) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(name) || slots.has(name)) throw new Error(`Invalid/duplicate template slot: ${name}`);
    slots.set(name, {preview, django});
    return `<!--slot:${name}-->`;
  }
  function resolve(html, target) {
    return html.replace(/<!--slot:([a-zA-Z0-9_.-]+)-->/g, (_, key) => {
      if (!slots.has(key)) throw new Error(`Unknown template slot: ${key}`);
      return slots.get(key)[target];
    });
  }
  return {read, render: (name, values) => render(read(name), values), slot, resolve};
}
module.exports = {escape, render, createTemplates};
