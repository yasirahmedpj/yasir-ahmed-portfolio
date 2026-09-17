/* script.js — shared site logic: logo intro, transitions, nav, reveals, work grid */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var body = document.body;

    function setStore(key, value) { try { sessionStorage.setItem(key, value); } catch (e) { /* ignore */ } }
    function getStore(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
    function delStore(key) { try { sessionStorage.removeItem(key); } catch (e) { /* ignore */ } }

    /* ------------------------------------------------------------------
       1. CINEMATIC LOGO INTRO
       Plays public/animations/yasir-logo.webm once (2-4s), then fades
       into the page. Skips for reduced-motion, repeat visits in the same
       session, and falls back to a text wordmark if the video cannot load.
    ------------------------------------------------------------------ */
    var introDone = false;
    var intro = document.getElementById('intro');

    function finishIntro(fast) {
        if (introDone) return;
        introDone = true;
        setStore('introSeen', '1');
        body.classList.add('is-loaded');
        if (!intro) return;
        intro.classList.add('is-leaving');
        window.setTimeout(function () {
            intro.style.display = 'none';
        }, fast ? 40 : 720);
    }

    function bootIntro() {
        if (reduce || getStore('introSeen')) {
            finishIntro(true);
            return;
        }
        var video = document.getElementById('intro-video');
        if (!video) { finishIntro(true); return; }

        var safety = window.setTimeout(function () { fallback(); }, 3200);

        function fallback() {
            clearTimeout(safety);
            intro.classList.add('is-fallback');
            window.setTimeout(function () { finishIntro(); }, 1100);
        }

        video.addEventListener('error', function () { clearTimeout(safety); fallback(); });
        video.addEventListener('loadedmetadata', function () {
            try {
                var p = video.play();
                if (p && p.catch) p.catch(function () { fallback(); });
            } catch (e) { fallback(); }
        });
        video.addEventListener('ended', function () { clearTimeout(safety); finishIntro(); });
    }

    if (intro) {
        bootIntro();
    } else {
        body.classList.add('is-loaded');
    }

    /* ------------------------------------------------------------------
       2. SCROLL RESTORE / ANCHOR TARGET
       Handles returning to the homepage with position or a target section
       after a page transition (used mainly by project.html links).
    ------------------------------------------------------------------ */
    var scrollTarget = getStore('scrollTarget');
    var scrollFrom = getStore('scrollFrom');
    delStore('scrollTarget');
    delStore('scrollFrom');

    var onIndex = !!document.querySelector('.project-list');
    var onProject = !!document.querySelector('.project-page');

    if (onProject) {
        /* detail page: start at top */
    } else if (scrollTarget) {
        window.setTimeout(function () {
            var el = document.querySelector(scrollTarget);
            if (el) {
                var html = document.documentElement;
                var prev = html.style.scrollBehavior;
                html.style.scrollBehavior = 'auto';
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                html.style.scrollBehavior = prev;
            }
        }, 450);
    } else if (parseFloat(scrollFrom) > 0) {
        window.setTimeout(function () {
            var html = document.documentElement;
            var prev = html.style.scrollBehavior;
            html.style.scrollBehavior = 'auto';
            window.scrollTo(0, parseFloat(scrollFrom));
            html.style.scrollBehavior = prev;
        }, 60);
    }

    /* ------------------------------------------------------------------
       3. MOBILE MENU
    ------------------------------------------------------------------ */
    var toggle = document.querySelector('.nav-toggle');

    function closeMenu() {
        body.classList.remove('menu-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            var open = body.classList.toggle('menu-open');
            toggle.setAttribute('aria-expanded', String(open));
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });
    var menu = document.querySelector('.menu');
    if (menu) {
        menu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', closeMenu);
        });
    }

    /* ------------------------------------------------------------------
       4. PAGE TRANSITIONS
       A sliding overlay covers the viewport before navigating to internal
       pages, then resets on the next page load for a clean cine touch.
    ------------------------------------------------------------------ */
    var transit = document.querySelector('.page-transition');

    function navigate(href) {
        body.classList.remove('menu-open');
        if (reduce || !transit) { window.location.href = href; return; }

        var hashIndex = href.indexOf('#');
        if (hashIndex === 0) { return; } /* pure anchor on same page */

        var target = hashIndex !== -1 ? href.slice(hashIndex) : null;

        if (target) {
            setStore('scrollTarget', target);
        } else if (onIndex && href.indexOf('project.html') === 0) {
            setStore('scrollFrom', String(window.scrollY));
        } else if (onProject && href.indexOf('index.html') === 0) {
            delStore('scrollFrom');
        }

        transit.classList.add('is-active');
        window.setTimeout(function () { window.location.href = href; }, 640);
    }

    document.addEventListener('click', function (e) {
        var link = e.target.closest('a.js-transition');
        if (!link) return;
        var href = link.getAttribute('href');
        if (!href || href === '#' || href.charAt(0) === '#') return;
        e.preventDefault();
        navigate(href);
    });

    /* ------------------------------------------------------------------
       5. SCROLL REVEALS (image slide-ins + text reveals)
    ------------------------------------------------------------------ */
    var observed = new Set();

    function initReveals(root) {
        var els = (root || document).querySelectorAll('.reveal, .reveal-image');
        els.forEach(function (el) {
            if (observed.has(el)) return;
            observed.add(el);
            if (reduce) { el.classList.add('is-in'); return; }
            revealObserver.observe(el);
        });
    }

    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });

    window.yaInitReveals = function () { initReveals(document); };

    /* ------------------------------------------------------------------
       6. WORK GRID (homepage) — rendered from projectsData
    ------------------------------------------------------------------ */
    var grid = document.getElementById('project-list');
    if (grid && typeof projectsData !== 'undefined' && Array.isArray(projectsData)) {
        var countEl = document.getElementById('project-count');
        if (countEl) countEl.textContent = String(projectsData.length).padStart(2, '0');

        var rowsHtml = '<div class="project-rows">' + projectsData.map(function (p, i) {
            var num = String(i + 1).padStart(2, '0');

            /* If project.link is set, the card opens it in a new tab;
               otherwise it goes to the project detail page. */
            var cls = p.link ? 'project-item' : 'project-item js-transition';
            var open = p.link
                ? 'href="' + p.link + '" target="_blank" rel="noopener noreferrer"'
                : 'href="project.html?id=' + p.id + '"';

            return '<a class="' + cls + '" ' + open + ' data-index="' + i + '">' +
                    '<div class="project-cover">' +
                        '<img src="' + p.thumbnail + '" alt="' + p.title + '" loading="lazy" decoding="async">' +
                    '</div>' +
                    '<div class="project-info">' +
                        '<span class="row-title">' + p.title + '</span>' +
                        '<span class="row-tags"><span>' + p.category + '</span><span class="dot"></span><span>' + p.year + '</span></span>' +
                    '</div>' +
                '</a>';
        }).join('') + '</div>';

        grid.innerHTML = rowsHtml;

        initReveals(grid);
    }

    /* ------------------------------------------------------------------
       7. SHORTFILMS (homepage) — same 3-box layout as commercials
    ------------------------------------------------------------------ */
    var shortGrid = document.getElementById('shortfilm-list');
    if (shortGrid && typeof shortfilmsData !== 'undefined' && Array.isArray(shortfilmsData)) {
        var shortCount = document.getElementById('shortfilm-count');
        if (shortCount) shortCount.textContent = String(shortfilmsData.length).padStart(2, '0');

        shortGrid.innerHTML = shortfilmsData.map(function (s, i) {
            var open = s.link
                ? 'href="' + s.link + '" target="_blank" rel="noopener noreferrer"'
                : '';

            return '<' + (s.link ? 'a' : 'div') + ' class="project-item" ' + open + ' data-index="' + i + '">' +
                    '<div class="project-cover">' +
                        '<img src="' + s.thumbnail + '" alt="' + s.title + '" loading="lazy" decoding="async">' +
                    '</div>' +
                    '<div class="project-info">' +
                        '<span class="row-title">' + s.title + '</span>' +
                        '<span class="row-tags"><span>' + s.category + '</span><span class="dot"></span><span>' + s.year + '</span></span>' +
                    '</div>' +
                '</' + (s.link ? 'a' : 'div') + '>';
        }).join('');

        initReveals(shortGrid);
    }

    /* ------------------------------------------------------------------
       8. REELS (homepage) — rendered from reelsData, 9:16 grid
    ------------------------------------------------------------------ */
    var reelGrid = document.getElementById('reel-grid');
    if (reelGrid && typeof reelsData !== 'undefined' && Array.isArray(reelsData)) {
        var reelCount = document.getElementById('reel-count');
        if (reelCount) reelCount.textContent = String(reelsData.length).padStart(2, '0');

        reelGrid.innerHTML = reelsData.map(function (r, i) {
            var tag = r.link ? 'a' : 'div';
            var href = r.link ? ' href="' + r.link + '" target="_blank" rel="noopener noreferrer"' : '';
            var titleHtml = r.title ? '<span class="reel-title">' + r.title + (r.year ? '<span class="reel-year">' + r.year + '</span>' : '') + '</span>' : '';
            var media = '';
            if (r.video) {
                media = r.thumbnail ? '<video class="reel-img is-video" src="' + r.thumbnail + '" muted playsinline preload="metadata" decoding="async" tabindex="0" aria-label="Play reel video"></video>' : '';
            } else {
                media = r.thumbnail
                    ? '<img class="reel-img" src="' + r.thumbnail + '" alt="' + (r.title || '') + '" loading="lazy" decoding="async">'
                    : '';
            }
            return '<' + tag + ' class="reel-item reveal"' + href + ' data-index="' + i + '">' +
                    media +
                    '<span class="reel-play">&#9654;</span>' +
                    titleHtml +
                '</' + tag + '>';
        }).join('');

        initReveals(reelGrid);

        var modalEl = document.getElementById('player-modal');
        var playerVideo = modalEl ? modalEl.querySelector('.player-video') : null;
        var playerIframe = modalEl ? modalEl.querySelector('.player-iframe') : null;

        function openPlayer(src, fallback) {
            if (!modalEl || !playerVideo) return;
            if (fallback) {
                playerVideo.onerror = function () {
                    openIframePlayer(fallback);
                };
            }
            playerVideo.src = src;
            playerVideo.load();
            modalEl.classList.add('is-open');
            modalEl.setAttribute('aria-hidden', 'false');
            playerVideo.play();
        }

        /* Extracts the file id from a Google Drive share/preview URL. */
        function driveFileId(url) {
            var m = url.match(/[\/]d[\/]([^\/\?&#]+)/);
            if (m) return m[1];
            m = url.match(/[?&]id=([^&]+)/);
            return m ? m[1] : null;
        }

        /* Converts a Google Drive share/preview URL into a direct streaming
           URL. Playing the original file (instead of the Drive preview embed)
           preserves the uploaded quality, e.g. 1080p. `confirm=t` skips the
           virus-scan warning that Google shows for files over ~100MB. */
        function driveStreamUrl(url) {
            var id = driveFileId(url);
            if (!id) return null;
            return 'https://drive.usercontent.google.com/download?id=' +
                encodeURIComponent(id) + '&export=download&confirm=t';
        }

        function openIframePlayer(src) {
            if (!modalEl || !playerIframe) return;
            playerIframe.src = src;
            modalEl.classList.add('is-open', 'is-iframe');
            modalEl.setAttribute('aria-hidden', 'false');
        }

        function closePlayer() {
            if (!modalEl) return;
            if (playerVideo) {
                playerVideo.pause();
                playerVideo.onerror = null;
                playerVideo.removeAttribute('src');
                playerVideo.load();
            }
            if (playerIframe) {
                playerIframe.src = '';
            }
            modalEl.classList.remove('is-open', 'is-iframe');
            modalEl.setAttribute('aria-hidden', 'true');
        }

        reelGrid.querySelectorAll('video.is-video').forEach(function (video) {
            video.addEventListener('click', function () {
                openPlayer(video.src);
            });
        });

        reelGrid.querySelectorAll('.reel-item').forEach(function (item) {
            var idx = parseInt(item.getAttribute('data-index'), 10);
            var r = reelsData[idx];
            if (r && r.gdrive) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', function (e) {
                    e.preventDefault();
                    var id = driveFileId(r.gdrive);
                    var direct = id
                        ? (r.quality
                            ? '/drive-stream?id=' + encodeURIComponent(id) + '&q=' + encodeURIComponent(r.quality)
                            : driveStreamUrl(r.gdrive))
                        : null;
                    if (direct) {
                        openPlayer(direct, r.gdrive);
                    } else {
                        openIframePlayer(r.gdrive);
                    }
                });
            }
        });

        if (modalEl) {
            modalEl.querySelector('.player-close').addEventListener('click', closePlayer);
            modalEl.querySelector('.player-backdrop').addEventListener('click', closePlayer);
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closePlayer();
            });
        }
    }

/* ------------------------------------------------------------------
       9. CUSTOM CURSOR (React Bits Pro "Custom Cursor" — vanilla port)
       Outer circle + inner dot with independent spring physics, morphs
       on interactive targets. Enabled only on fine-pointer (mouse), never
       on touch devices or under reduced motion.
    ------------------------------------------------------------------ */
    function initCustomCursor() {
        if (reduce) return;
        if (!window.matchMedia('(pointer: fine)').matches) return;

        var root = document.createElement('div');
        root.className = 'custom-cursor';
        root.setAttribute('aria-hidden', 'true');

        var circle = document.createElement('span');
        circle.className = 'cc-circle';

        var label = document.createElement('span');
        label.className = 'cc-label';
        label.textContent = 'View';

        var dot = document.createElement('span');
        dot.className = 'cc-dot';

        circle.appendChild(label);
        root.appendChild(circle);
        root.appendChild(dot);
        document.body.appendChild(root);

        document.body.classList.add('has-cursor');

        /* spring config — mirrors the ReactBits component defaults
           (circle stiffness 150 / damping 20, dot 300 / damping 30) */
        var springs = {
            circle: { x: -100, y: -100, vx: 0, vy: 0, stiffness: 150, damping: 20 },
            dot:    { x: -100, y: -100, vx: 0, vy: 0, stiffness: 300, damping: 30 }
        };
        var target = { x: -100, y: -100 };
        var last = null;

        window.addEventListener('mousemove', function (e) {
            target.x = e.clientX;
            target.y = e.clientY;
            root.classList.add('is-visible');
        }, { passive: true });

        document.addEventListener('mouseleave', function () {
            root.classList.remove('is-visible');
        });

        /* interactive targets → cursor morphs + optional mono label */
        var TARGETS = 'a, button, [data-cursor], [data-cursor-text], .reel-item, .project-item, .pager-item, .project-back, .contact-link, .rows li, .player-close, input, textarea, select';

        function cursorLabel(el) {
            var explicit = el.getAttribute && el.getAttribute('data-cursor-text');
            if (explicit) return explicit;
            var href = (el.getAttribute && el.getAttribute('href')) || '';
            if (/^mailto:/i.test(href)) return 'Say Hi';
            if (el.classList.contains('reel-item')) return 'Play';
            if (el.classList.contains('player-close')) return 'Close';
            if (el.classList.contains('project-back')) return 'Back';
            if (el.classList.contains('pager-item')) return 'Next';
            if (el.classList.contains('project-item')) return 'View';
            return 'Open';
        }

        var currentTarget = null;

        function onOver(e) {
            var el = e.target && e.target.closest ? e.target.closest(TARGETS) : null;
            if (!el || el === currentTarget) return;
            currentTarget = el;
            label.textContent = cursorLabel(el);
            root.classList.add('is-morph');
        }

        function onOut(e) {
            if (!currentTarget) return;
            var next = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(TARGETS) : null;
            if (next === currentTarget) return;
            currentTarget = null;
            root.classList.remove('is-morph');
        }

        document.addEventListener('mouseover', onOver, true);
        document.addEventListener('mouseout', onOut, true);

        function step(now) {
            if (last === null) last = now;
            var dt = Math.min((now - last) / 1000, 1 / 30);
            last = now;

            Object.keys(springs).forEach(function (key) {
                var s = springs[key];
                s.vx += (target.x - s.x) * s.stiffness * dt;
                s.vy += (target.y - s.y) * s.stiffness * dt;
                s.vx *= Math.max(0, 1 - s.damping * dt);
                s.vy *= Math.max(0, 1 - s.damping * dt);
                s.x += s.vx * dt;
                s.y += s.vy * dt;
            });

            var p = springs.circle;
            var d = springs.dot;
            var morph = root.classList.contains('is-morph');
            circle.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0) translate(-50%,-50%)';
            dot.style.transform = 'translate3d(' + d.x + 'px,' + d.y + 'px,0) translate(-50%,-50%) scale(' + (morph ? 0.4 : 1) + ')';
            requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    initCustomCursor();

    initReveals(document);
});