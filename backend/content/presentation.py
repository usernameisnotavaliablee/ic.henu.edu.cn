"""Display-only adapter for the frontend route catalog; no business writes or model assumptions."""
from .editable import catalog


def page_context(slug, *, title=None, english=None, parent_slug=None):
    routes = catalog()['routes']
    route = routes[parent_slug or slug]
    parents = [dict(parent) for parent in route['parents']]
    if parent_slug:
        parents.append({'href': parent_slug + '.html', 'label': route['title']})
    for parent in parents:
        parent['href'] = '/' + parent['href'].lstrip('/')
    return {
        'page_heading': route['title'] if title is None else title,
        'page_english': route.get('english', '') if english is None else english,
        'active_page': route['active'],
        'breadcrumbs': parents,
    }
