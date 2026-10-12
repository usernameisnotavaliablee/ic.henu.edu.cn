const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "release", "boda-site");
const srcDir = path.join(root, "src");
const { buildPage, buildSiteShellSource } = require("./build-site");

function replaceRegion(source, start, end, replacement, label) {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) throw new Error(`Could not find start marker for ${label}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex < 0) throw new Error(`Could not find end marker for ${label}`);
  return source.slice(0, startIndex) + replacement + source.slice(endIndex);
}

function addBodaFlag(source) {
  const result = source.replace(
    /<body([^>]*)data-page="([^"]+)"/,
    '<body$1data-page="$2" data-cms-site="boda"'
  );
  if (result === source) throw new Error("Could not add data-cms-site flag to page");
  return result;
}

function rewriteCmsLinks(source) {
  return source
    .replace(/href="index\.html"/g, 'href="index.jsp"')
    .replace(/href="news\.html"/g, 'href="new.jsp"')
    .replace(/href="notices\.html"/g, 'href="notice.jsp"');
}

function emptySlot({ className, ariaLabel, slotName, note }) {
  return `<div class="${className}" aria-label="${ariaLabel}" data-boda-slot="${slotName}">
      <!-- 博达栏目资料组件插入位：${note} -->
    </div>
`;
}

function buildHomePage() {
  let html = buildPage("index.html");
  html = replaceRegion(
    html,
    '<div class="feed-list">',
    '<!-- 博达组件区域结束：首页新闻列表（模板一） -->',
    emptySlot({
      className: "feed-list",
      ariaLabel: "首页新闻列表",
      slotName: "home-news",
      note: "在此拖入文章列表组件，并绑定新闻资料源",
    }),
    "首页新闻列表"
  );
  const secondMarker = "博达组件区域：首页通知列表";
  const secondMarkerIndex = html.indexOf(secondMarker);
  if (secondMarkerIndex < 0) throw new Error("Could not find home notice marker");
  const secondStart = html.indexOf('<div class="feed-list">', secondMarkerIndex);
  const secondEnd = html.indexOf(
    '<!-- 博达组件区域结束：首页通知列表（模板二） -->',
    secondStart
  );
  if (secondStart < 0 || secondEnd < 0) throw new Error("Could not find home notice region");
  html = html.slice(0, secondStart)
    + emptySlot({
      className: "feed-list",
      ariaLabel: "首页通知列表",
      slotName: "home-notices",
      note: "在此拖入文章列表组件，并绑定通知资料源",
    })
    + html.slice(secondEnd);
  return rewriteCmsLinks(addBodaFlag(html));
}

function buildListPage(sourcePage, ariaLabel, slotName, marker, outputLabel) {
  let html = buildPage(sourcePage);
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Could not find ${outputLabel} marker`);
  const startToken = `<div class="content-list" aria-label="${ariaLabel}">`;
  const startIndex = html.indexOf(startToken, markerIndex);
  const endToken = "\n    </div>\n  </div>\n</section>";
  const endIndex = html.indexOf(endToken, startIndex + startToken.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Could not find ${outputLabel} region`);
  html = html.slice(0, startIndex)
    + emptySlot({
      className: "content-list",
      ariaLabel,
      slotName,
      note: `在此拖入${outputLabel}文章列表组件，并绑定对应资料源`,
    })
    + html.slice(endIndex);
  return rewriteCmsLinks(addBodaFlag(html));
}

function copyDirectory(name) {
  fs.cpSync(path.join(srcDir, name), path.join(outputDir, name), { recursive: true });
}

function writeReadme() {
  fs.writeFileSync(
    path.join(outputDir, "README.txt"),
    [
      "河南大学低空技术与空天信息学院官网 · 博达模板包",
      "",
      "发布文件：",
      "  index.jsp   首页模板，包含首页新闻和首页通知组件插入位",
      "  new.jsp     新闻列表模板，对应后台已配置的 /new.jsp",
      "  notice.jsp  通知列表模板，对应后台已配置的 /notice.jsp",
      "  notices.jsp 兼容副本；后台当前实际配置的是 /notice.jsp，优先使用 notice.jsp",
      "  css/ js/ assets/ 与页面配套的静态资源",
      "",
      "重要：页面文件只提供与现有设计匹配的组件插入位。上传后需要在博达后台向插入位拖入文章列表组件，",
      "并按项目根目录的 BODA_CMS_COMPONENT_TEMPLATES.md 配置组件模板和资料来源。",
      "",
      "文章详情页不是另一个 JSP 文件：请复制项目根目录 boda-component-templates/article-detail.html 的全部内容，",
      "粘贴到博达后台“新闻”和“通知”栏目各自的“内容页模板”中。该文件只用于后台模板编辑器，不要上传到网站根目录。",
      "",
      "不要把整个 release/boda-site 目录中的 README.txt 上传到网站；它只是部署说明。",
      "",
    ].join("\n"),
    "utf8"
  );
}

function main() {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(path.join(outputDir, "index.jsp"), buildHomePage(), "utf8");
  fs.writeFileSync(
    path.join(outputDir, "new.jsp"),
    buildListPage("news.html", "新闻列表", "news-list", "博达组件区域：新闻列表", "新闻列表"),
    "utf8"
  );
  const noticePage = buildListPage(
    "notices.html",
    "通知列表",
    "notice-list",
    "博达组件区域：通知列表",
    "通知列表"
  );
  fs.writeFileSync(path.join(outputDir, "notice.jsp"), noticePage, "utf8");
  fs.writeFileSync(path.join(outputDir, "notices.jsp"), noticePage, "utf8");

  copyDirectory("css");
  copyDirectory("js");
  fs.mkdirSync(path.join(outputDir, "js"), { recursive: true });
  fs.writeFileSync(path.join(outputDir, "js", "site-shell.js"), buildSiteShellSource(), "utf8");
  copyDirectory("assets");
  writeReadme();

  console.log(`Built Boda templates into ${path.relative(root, outputDir)}/`);
  console.log("Upload index.jsp, new.jsp, notice.jsp (or notices.jsp if the column is configured that way), css/, js/, and assets/.");
}

if (require.main === module) main();

module.exports = { buildHomePage, buildListPage };
