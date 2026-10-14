const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const hash = body => createHash('sha256').update(body).digest('hex');
function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(entry => {
    const file = path.join(directory,entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not a build input: ${file}`);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
function compileStyles(file, stack = []) {
  const resolved = path.resolve(file);
  if (stack.includes(resolved)) throw new Error('Circular style import: ' + file);
  return fs.readFileSync(resolved,'utf8').replace(/^@import "(\.\/components\/[a-z0-9-]+\.css)";$/gm, (_, relative) => compileStyles(path.resolve(path.dirname(resolved),relative),[...stack,resolved]));
}
function collectResources(src) {
  const result = new Map();
  for (const folder of ['css','js','assets']) for (const file of walk(path.join(src,folder))) {
    const name = path.relative(src,file).split(path.sep).join('/');
    if (name.startsWith('css/components/')) continue;
    result.set(name, name === 'css/style.css' ? Buffer.from(compileStyles(file).trimEnd() + '\n') : fs.readFileSync(file));
  }
  return result;
}
function createWriter(root, manifestFile) {
  const rootPath = path.resolve(root);
  const relative = file => path.relative(rootPath,path.resolve(file)).split(path.sep).join('/');
  const allowed = key => /^(frontend\/preview\/|backend\/templates\/site\/generated\/)/.test(key) || ['backend/content-catalog.json','backend/seed-content.json'].includes(key);
  function target(key) {
    if (!allowed(key) || key.split('/').some(part=>['..','.',''].includes(part)) || path.isAbsolute(key)) throw new Error('Unowned build path: ' + key);
    const full = path.resolve(rootPath,key);
    if (!full.startsWith(rootPath + path.sep)) throw new Error('Outside workspace: ' + key);
    let parent = full;
    while (parent !== rootPath) {
      try {
        if (fs.lstatSync(parent).isSymbolicLink()) throw new Error('Symlink build target: ' + key);
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
      parent = path.dirname(parent);
    }
    return full;
  }
  const previous = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile,'utf8')) : {outputs:{}};
  if (previous.version !== undefined && previous.version !== 1) throw new Error('Unsupported build manifest');
  // Validate all ownership records before any write or cleanup.
  for (const key of Object.keys(previous.outputs)) target(key);
  const outputs = {};
  function write(file, body) {
    const key = relative(file);
    const full = target(key);
    fs.mkdirSync(path.dirname(full),{recursive:true});
    const data = Buffer.isBuffer(body) ? body : Buffer.from(body);
    if (!fs.existsSync(full) || !fs.readFileSync(full).equals(data)) fs.writeFileSync(full,data);
    outputs[key] = hash(data);
  }
  function finish(metadata) {
    const preserved = [];
    for (const [key, fingerprint] of Object.entries(previous.outputs)) {
      if (Object.hasOwn(outputs,key)) continue;
      const file = target(key);
      if (!fs.existsSync(file)) continue;
      if (hash(fs.readFileSync(file)) === fingerprint) fs.unlinkSync(file);
      else preserved.push(key);
    }
    const data = {version:1,...metadata,outputs:Object.fromEntries(Object.entries(outputs).sort()),preserved};
    fs.writeFileSync(manifestFile,JSON.stringify(data,null,2)+'\n');
    if(preserved.length) console.warn('Preserved modified obsolete outputs:',preserved.join(', '));
    return data;
  }
  return {write, finish};
}
module.exports={hash,walk,compileStyles,collectResources,createWriter};
