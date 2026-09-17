const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const ROOT = __dirname;
const PORT = 5500;
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

/* Google Drive transcoded quality itags (fmt_stream_map). These streams are
   much smaller than the uploaded original and are what Drive's own player
   uses when you pick a quality like 1080p (itag 37). */
const DRIVE_ITAGS = { '360': '18', '720': '22', '1080': '37' };

const streamUrlCache = new Map();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function extractDriveId(url) {
    let m = url.match(/[\/]d[\/]([^\/\?&#]+)/);
    if (m) return m[1];
    m = url.match(/[?&]id=([^&]+)/);
    return m ? m[1] : null;
}

function runCurl(args) {
    try {
        return execFileSync('curl', args, {
            encoding: 'utf8',
            maxBuffer: 16 * 1024 * 1024,
            windowsHide: true,
            timeout: 20000
        });
    } catch (e) {
        return null;
    }
}

/* Google ties the transcoded stream URL to the whole get_video_info session
   (cookie jar + TLS fingerprint), so this step must run through curl too and
   the resulting jar must be reused for the stream request. The URL is
   IP-bound, so it must be requested from and streamed via this server. */
async function getDriveStreamUrl(fileId, itag) {
    const key = fileId;
    const cached = streamUrlCache.get(key);
    if (cached && cached.expires > Date.now()) return cached;

    const jar = path.join(os.tmpdir(), 'drivejar-' + fileId + '.txt');
    const body = runCurl([
        '-s', '--http1.1', '-c', jar,
        '-A', UA,
        '-e', 'https://drive.google.com/',
        'https://drive.google.com/get_video_info?docid=' + encodeURIComponent(fileId) + '&hl=en'
    ]);
    if (!body) return null;
    const params = new URLSearchParams(body);
    if (params.get('status') !== 'ok') return null;

    const order = [String(itag), '37', '22', '18'];
    const map = (params.get('fmt_stream_map') || '').split(',');
    let best = null;
    for (const entry of map) {
        const sep = entry.indexOf('|');
        if (sep < 0) continue;
        const entryItag = entry.slice(0, sep);
        const url = entry.slice(sep + 1);
        if (!url) continue;
        if (order.indexOf(entryItag) !== -1 && (best === null || order.indexOf(entryItag) < order.indexOf(best[0]))) {
            best = [entryItag, url];
        }
    }
    if (best) {
        const entry = { url: best[1], jar: jar, expires: Date.now() + 50 * 60 * 1000 };
        streamUrlCache.set(key, entry);
        return entry;
    }
    return null;
}

function waitForHeaders(file, timeout) {
    return new Promise(function (resolve, reject) {
        const started = Date.now();
        const timer = setInterval(function () {
            let size = 0;
            try { size = fs.statSync(file).size; } catch (e) { /* not yet */ }
            if (size > 0) {
                clearInterval(timer);
                resolve();
            } else if (Date.now() - started > timeout) {
                clearInterval(timer);
                reject(new Error('timeout'));
            }
        }, 120);
    });
}

/* Google's video CDN fingerprints the TLS client, so Node's http stack gets
   403 while curl is accepted. Stream by shelling out to curl.exe and piping
   stdout to the response, preserving byte-range requests for seeking. */
function proxyWithCurl(req, res, streamUrl, jar) {
    const headersFile = path.join(
        os.tmpdir(),
        'drivehdr-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.txt'
    );

    const args = [
        '-s', '-N', '--http1.1',
        '-D', headersFile,
        '-A', UA,
        '-e', 'https://drive.google.com/',
        '-H', 'Accept: */*'
    ];
    if (jar) {
        args.push('-b', jar);
    }
    if (req.headers.range) {
        args.push('-H', 'Range: ' + req.headers.range);
    }
    args.push(streamUrl);

    let headersWritten = false;

    const child = spawn('curl', args, { windowsHide: true });

    child.on('error', function (err) {
        console.error('[drive-stream] curl error:', err.message);
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Proxy error');
        }
    });

    child.stderr.on('data', function (d) {
        console.error('[drive-stream] curl stderr:', String(d));
    });

    function cleanup() {
        if (!headersWritten) {
            try { fs.unlinkSync(headersFile); } catch (e) { /* noop */ }
        }
    }

    child.on('close', cleanup);

    res.on('close', function () {
        if (!res.writableEnded) child.kill();
    });
    res.on('finish', cleanup);

    waitForHeaders(headersFile, 8000).then(function () {
        if (headersWritten) return;
        let head = '';
        try { head = fs.readFileSync(headersFile, 'utf8'); } catch (e) { return; }
        const lines = head.split(/\r?\n/);
        const statusMatch = /^HTTP\/\S+\s+(\d{3})/.exec(lines[0] || '');
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 200;

        const out = {};
        for (const line of lines.slice(1)) {
            const ci = line.indexOf(':');
            if (ci < 0) continue;
            const key = line.slice(0, ci).trim().toLowerCase();
            if (key === 'content-type' || key === 'content-length' || key === 'content-range') {
                out[key] = line.slice(ci + 1).trim();
            }
        }

        headersWritten = true;
        res.statusCode = status;
        res.setHeader('Content-Type', out['content-type'] || 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-store');
        if (out['content-length']) res.setHeader('Content-Length', out['content-length']);
        if (out['content-range']) res.setHeader('Content-Range', out['content-range']);

        child.stdout.pipe(res);
    }).catch(function () {
        child.kill();
        if (!res.headersSent) {
            res.writeHead(504, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Timed out');
        }
    });
}

async function handleDriveStream(req, res, id, itag) {
    if (!id) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Bad Request');
        return;
    }
    if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes' });
        res.end();
        return;
    }
    let entry;
    try {
        entry = await getDriveStreamUrl(id, itag);
    } catch (e) {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Proxy error');
        return;
    }
    if (!entry) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('No stream available for this file');
        return;
    }
    proxyWithCurl(req, res, entry.url, entry.jar);
}

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    if (urlPath === '/drive-stream') {
        const q = new URL(req.url, 'http://localhost');
        const itag = DRIVE_ITAGS[q.searchParams.get('q')] || '37';
        handleDriveStream(req, res, q.searchParams.get('id'), itag);
        return;
    }

    let filePath = path.join(ROOT, urlPath);

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Serving at http://localhost:${PORT}`);
});