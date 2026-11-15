// Local preview only. It never connects to production or grants editor access.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), { render } = require('../lib/touring-view.cjs');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
http.createServer((req, res) => { const url = new URL(req.url, 'http://localhost'); if (url.pathname === '/api/product') {
    if (url.searchParams.get('service') === 'touring' && url.searchParams.get('action') === 'data') {
        res.setHeader('Content-Type', 'application/json');
        return res.end(fs.readFileSync(path.join(root, 'data/touring-public.json')));
    }
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Local preview has no authenticated database connection.' }));
} if (url.pathname === '/api/rankings') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(fs.readFileSync(path.join(root, 'data/current.json')));
} if (url.pathname.startsWith('/touring/') || url.pathname === '/studio/touring') {
    const html = render(url.pathname === '/studio/touring' ? 'admin' : url.pathname.slice(9));
    res.writeHead(html ? 200 : 404, { 'Content-Type': 'text/html' });
    return res.end(html || 'Not found');
} let name = decodeURIComponent(url.pathname); if (name === '/')
    name = '/index.html'; let file = path.resolve(root, '.' + name); if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    return res.end();
} if (!path.extname(file))
    file += '.html'; if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    return res.end('Not found');
} res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res); }).listen(4173, '127.0.0.1', () => console.log('Touring preview http://127.0.0.1:4173/touring'));
