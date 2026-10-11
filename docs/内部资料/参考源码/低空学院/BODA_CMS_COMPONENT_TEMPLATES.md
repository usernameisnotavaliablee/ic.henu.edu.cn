# 博达组件模板（与本地学院官网视觉结构对应）

本文件配合 `release/boda-site/` 使用。

`index.jsp`、`new.jsp`、`notice.jsp` 负责页面外层结构和组件插入位；文章循环本身在博达后台的“组件模板”中配置。

## 1. 首页新闻组件

将首页新闻组件放入 `index.jsp` 的 `data-boda-slot="home-news"` 区域，组件模板使用：

```html
<#list list_news as news>
<div class="feed-item">
  <div class="date">
    <b>${v_date(news.date, "yyyy")!}</b>
    <span>${news.showColumnName!}</span>
  </div>
  <div>
    <span class="meta-tag">${news.showColumnName!}</span>
    <time class="feed-time" datetime="${news.date!}">${news.showDate!}</time>
    <h4>${news.showTitle!}</h4>
    <p>${news.showAbstract!} <a href="${news.url!}"><span data-lang-zh>阅读详情</span><span data-lang-en>Read more</span> →</a></p>
  </div>
</div>
</#list>
```

组件参数建议：绑定“新闻”资料源，条数 3，按发布时间倒序。

## 2. 首页通知组件

将首页通知组件放入 `index.jsp` 的 `data-boda-slot="home-notices"` 区域：

```html
<#list list_news as news>
<#if news.isHaveImg>
<a class="feed-item feed-link" href="${news.url!}">
  <img class="feed-thumb" src="${news.picUrl!}" alt="${news.showTitle!}">
  <div>
    <span class="meta-tag">${news.showColumnName!}</span>
    <time class="feed-time">${news.showDate!}</time>
    <h4>${news.showTitle!}</h4>
    <p>${news.showAbstract!}</p>
    <span class="card-more"><span data-lang-zh>查看详情</span><span data-lang-en>Details</span> →</span>
  </div>
</a>
<#else>
<a class="feed-item feed-link" href="${news.url!}">
  <div class="date"><b>INFO</b><span>${news.showColumnName!}</span></div>
  <div>
    <span class="meta-tag">${news.showColumnName!}</span>
    <time class="feed-time">${news.showDate!}</time>
    <h4>${news.showTitle!}</h4>
    <p>${news.showAbstract!}</p>
    <span class="card-more"><span data-lang-zh>查看详情</span><span data-lang-en>Details</span> →</span>
  </div>
</a>
</#if>
</#list>
```

组件参数建议：绑定“通知”资料源，条数 3，按发布时间倒序。

## 3. 新闻列表组件

将动态翻页标题列表组件放入 `new.jsp` 的 `data-boda-slot="news-list"` 区域：

```html
<#list list_news as news>
<a class="content-list-item" href="${news.url!}">
  <time class="list-date" datetime="${news.date!}">
    <b>${news.showDate!}</b>
    <span>${news.showColumnName!}</span>
  </time>
  <div class="list-copy">
    <span class="meta-tag">${news.showColumnName!}</span>
    <h3>${news.showTitle!}</h3>
    <p>${news.showAbstract!}</p>
    <span class="card-more"><span data-lang-zh>阅读详情</span><span data-lang-en>Read More</span> →</span>
  </div>
</a>
</#list>
<div class="boda-pagebar">${cssPageBar}</div>
${includePageBarCss}
```

组件参数建议：绑定“新闻列表”栏目资料源，开启分页，按发布时间倒序。

## 4. 通知列表组件

将动态图片摘要翻页列表组件放入 `notice.jsp` 的 `data-boda-slot="notice-list"` 区域：

```html
<#list list_group as group>
<#list group.list_news as news>
<#if news.isHaveImg>
<a class="content-list-item with-thumb" href="${news.url!}">
  <img class="list-thumb" src="${news.picUrl!}" alt="${news.showTitle!}">
  <div class="list-copy">
    <span class="meta-tag">${news.showColumnName!}</span>
    <h3>${news.showTitle!}</h3>
    <p>${news.showAbstract!}</p>
    <span class="list-meta">${news.showDate!}</span>
    <span class="card-more"><span data-lang-zh>查看详情</span><span data-lang-en>View Details</span> →</span>
  </div>
</a>
<#else>
<a class="content-list-item" href="${news.url!}">
  <time class="list-date" datetime="${news.date!}">
    <b>INFO</b>
    <span>${news.showColumnName!}</span>
  </time>
  <div class="list-copy">
    <span class="meta-tag">${news.showColumnName!}</span>
    <h3>${news.showTitle!}</h3>
    <p>${news.showAbstract!}</p>
    <span class="list-meta">${news.showDate!}</span>
    <span class="card-more"><span data-lang-zh>查看详情</span><span data-lang-en>View Details</span> →</span>
  </div>
</a>
</#if>
</#list>
</#list>
<div class="boda-pagebar">${cssPageBar}</div>
${includePageBarCss}
```

组件参数建议：绑定“通知列表”栏目资料源，开启分页，按发布时间倒序。

## 5. 文章详情页（新闻和通知共用）

文章详情页不需要为每篇文章单独生成 `news-xxx.jsp` 或 `notice-xxx.jsp`。正确流程是：

1. 列表组件使用 `${news.url!}`，由博达自动生成文章详情链接；
2. 将项目中的 `boda-component-templates/article-detail.html` 全部内容复制到博达后台的“内容页模板”；
3. 在“新闻”栏目和“通知”栏目分别保存一次（两者可以使用同一份模板）；
4. 用户以后在后台发布文章时，所有文章自动使用这套详情页外观。

列表链接必须使用 `${news.url!}`，不要继续使用本地的 `news-*.html` 或 `notice-*.html`。

完整可复制的详情页模板文件：

```text
boda-component-templates/article-detail.html
```

这个文件是后台“内容页模板”的代码，不是要上传到网站根目录的 JSP 文件。

正文变量必须使用：

```html
<h1>${showTitle!}</h1>
<div class="detail-meta">发布时间：${showDate!}</div>
<div id="${vsb_contentid}">${content}</div>
```

其中 `${content}` 必须放在 `${vsb_contentid}` 对应的容器内。模板还包含摘要、来源、附件、上一篇/下一篇和返回列表，并沿用官网的 `detail-hero`、`detail-copy` 等样式结构。

## 6. 当前文件名注意事项

后台现有栏目属性显示：

- 新闻列表主模板：`/new.jsp`
- 通知列表主模板：`/notice.jsp`

因此实际应优先上传 `new.jsp` 和 `notice.jsp`。`notices.jsp` 只是本地生成的兼容副本，只有在后台栏目主模板明确改成 `/notices.jsp` 时才使用。
