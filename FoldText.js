/* FoldText.js — vanilla JS port of React Bits' <FoldText /> (GSAP).
   Renders each char / word / line as a 3D "panel" that unfolds into place.
   Configure via data attributes on a <span class="fold-text"> element. */

(function () {
    'use strict';

    var HINGE_CONFIG = {
        top:    { origin: '50% 0%',   rotateX: -92, rotateY: 0  },
        bottom: { origin: '50% 100%', rotateX: 92,  rotateY: 0  },
        left:   { origin: '0% 50%',   rotateX: 0,   rotateY: 92 },
        right:  { origin: '100% 50%', rotateX: 0,   rotateY: -92 }
    };

    var DEFAULT = {
        text: 'Design unfolds',
        splitBy: 'char',
        hinge: 'top',
        duration: 0.65,
        stagger: 0.045,
        ease: 'power3.out',
        perspective: 700,
        creaseShading: 0.55,
        trigger: 'mount',
        fontSize: 80,
        fontWeight: 800,
        color: '#f7f2e8'
    };

    var clamp = function (value, min, max) {
        return Math.min(max, Math.max(min, value));
    };

    function renderWhitespace(value, key) {
        return value.split(/(\n)/).map(function (part, index) {
            if (part === '\n') {
                var br = document.createElement('br');
                br.dataset.br = key + '-br-' + index;
                return br;
            }
            if (!part) return null;
            var span = document.createElement('span');
            span.className = 'fold-text-whitespace';
            span.textContent = part.replace(/ /g, '\u00A0');
            span.dataset.ws = key + '-space-' + index;
            return span;
        }).filter(Boolean);
    }

    function buildSegments(root, segmentsHost, opts, safePerspective, safeCrease) {
        segmentsHost.textContent = '';
        segmentsHost.dataset.foldSplit = opts.splitBy;
        var hinge = HINGE_CONFIG[opts.hinge] || HINGE_CONFIG.top;

        var segmentIndex = 0;

        function renderSegment(content, key, split) {
            segmentIndex += 1;
            var segment = document.createElement('span');
            segment.className = 'fold-text-segment';
            segment.dataset.foldSplit = split || opts.splitBy;
            segment.style.setProperty('--fold-perspective', safePerspective + 'px');

            var piece = document.createElement('span');
            piece.className = 'fold-text-piece';
            piece.dataset.foldHinge = opts.hinge;
            piece.style.transformOrigin = hinge.origin;
            piece.style.setProperty('--fold-crease', 0);
            piece.textContent = content || '\u00A0';

            segment.appendChild(piece);
            return segment;
        }

        var nodes = [];
        if (opts.splitBy === 'line') {
            opts.text.split('\n').forEach(function (line, index) {
                var lineEl = document.createElement('span');
                lineEl.className = 'fold-text-line';
                lineEl.appendChild(renderSegment(line || '\u00A0', 'segment-line-' + index, 'line'));
                nodes.push(lineEl);
            });
        } else if (opts.splitBy === 'word') {
            opts.text.split(/(\s+)/).forEach(function (part, index) {
                if (!part) return;
                if (/^\s+$/.test(part)) {
                    nodes = nodes.concat(renderWhitespace(part, 'ws-' + index));
                } else {
                    nodes.push(renderSegment(part, 'segment-word-' + segmentIndex));
                }
            });
        } else {
            Array.from(opts.text).forEach(function (char, index) {
                if (char === '\n') {
                    var br = document.createElement('br');
                    br.dataset.br = 'br-' + index;
                    nodes.push(br);
                    return;
                }
                nodes.push(renderSegment(char === ' ' ? '\u00A0' : char, 'segment-char-' + index));
            });
        }

        nodes.forEach(function (node) { segmentsHost.appendChild(node); });
        return hinge;
    }

    function readOptions(el) {
        var attrs = el.dataset;
        var number = function (raw, fallback) {
            if (raw === undefined || raw === null || raw === '') return fallback;
            var n = parseFloat(raw);
            return isNaN(n) ? fallback : n;
        };
        var fontSize = attrs.fontSize !== undefined ? attrs.fontSize : DEFAULT.fontSize;
        if (typeof fontSize === 'string' && /^\d+(\.\d+)?$/.test(fontSize)) fontSize = parseFloat(fontSize);

        var opts = {
            text: attrs.text || DEFAULT.text,
            splitBy: attrs.splitBy || DEFAULT.splitBy,
            hinge: attrs.hinge || DEFAULT.hinge,
            duration: number(attrs.duration, DEFAULT.duration),
            stagger: number(attrs.stagger, DEFAULT.stagger),
            ease: attrs.ease || DEFAULT.ease,
            perspective: number(attrs.perspective, DEFAULT.perspective),
            creaseShading: number(attrs.creaseShading, DEFAULT.creaseShading),
            trigger: attrs.trigger || DEFAULT.trigger,
            fontSize: fontSize,
            fontWeight: attrs.fontWeight !== undefined ? attrs.fontWeight : DEFAULT.fontWeight,
            color: attrs.color || DEFAULT.color
        };
        return opts;
    }

    function initFoldText(el) {
        if (el.getAttribute('data-fold-text-init') === '1') return;
        el.setAttribute('data-fold-text-init', '1');

        var opts = readOptions(el);

        var hingeConfig = HINGE_CONFIG[opts.hinge] || HINGE_CONFIG.top;
        var safeCrease = clamp(opts.creaseShading, 0, 1);
        var safePerspective = Math.max(120, opts.perspective);

        if (typeof window === 'undefined') return;
        if (!window.gsap) return;

        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var activeDuration = reduceMotion ? Math.min(opts.duration, 0.22) : opts.duration;
        var activeStagger = reduceMotion ? Math.min(opts.stagger, 0.02) : opts.stagger;

        el.style.setProperty('--fold-text-font-size',
            typeof opts.fontSize === 'number' ? opts.fontSize + 'px' : opts.fontSize);
        el.style.setProperty('--fold-text-font-weight', String(opts.fontWeight));
        el.style.setProperty('--fold-text-color', opts.color);

        /* Accessible copy + visual rendering */
        var sr = document.createElement('span');
        sr.className = 'fold-text-sr-only';
        sr.textContent = opts.text;

        var visual = document.createElement('span');
        visual.className = 'fold-text-visual';
        visual.setAttribute('aria-hidden', 'true');

        el.textContent = '';
        el.appendChild(sr);
        el.appendChild(visual);

        buildSegments(el, visual, opts, safePerspective, safeCrease);

        var pieces = visual.querySelectorAll('.fold-text-piece');
        if (!pieces.length) return;

        var timeline = null;

        var fromVars = {
            opacity: 0,
            rotateX: reduceMotion ? 0 : hingeConfig.rotateX,
            rotateY: reduceMotion ? 0 : hingeConfig.rotateY,
            '--fold-crease': reduceMotion ? 0 : safeCrease,
            transformOrigin: hingeConfig.origin,
            force3D: true
        };
        var toVars = {
            opacity: 1,
            rotateX: 0,
            rotateY: 0,
            '--fold-crease': 0,
            duration: activeDuration,
            ease: reduceMotion ? 'power1.out' : opts.ease,
            stagger: activeStagger,
            clearProps: 'willChange'
        };

        var killTimeline = function () {
            if (timeline) { timeline.kill(); timeline = null; }
            if (window.gsap) window.gsap.killTweensOf(pieces);
        };

        var play = function (repeat) {
            killTimeline();
            timeline = window.gsap.timeline({ repeat: repeat ? -1 : 0, repeatDelay: repeat ? 0.75 : 0 });
            timeline.fromTo(pieces, fromVars, toVars);
            return timeline;
        };

        var scrollTrigger;
        var hoverHandler;

        if (opts.trigger === 'hover') {
            window.gsap.set(pieces, { opacity: 1, rotateX: 0, rotateY: 0, '--fold-crease': 0, transformOrigin: hingeConfig.origin });
            hoverHandler = function () { play(false); };
            el.addEventListener('mouseenter', hoverHandler);
        } else if (opts.trigger === 'scroll') {
            window.gsap.set(pieces, fromVars);
            if (window.gsap.ScrollTrigger) {
                scrollTrigger = window.gsap.ScrollTrigger.create({
                    trigger: el,
                    start: 'top 82%',
                    once: true,
                    onEnter: function () { play(false); }
                });
            } else {
                play(false);
            }
        } else if (opts.trigger === 'loop') {
            play(true);
        } else {
            play(false);
        }

        el._foldCleanup = function () {
            if (hoverHandler) el.removeEventListener('mouseenter', hoverHandler);
            if (scrollTrigger) scrollTrigger.kill();
            killTimeline();
        };
    }

    function initAll(root) {
        root = root || document;
        var els = root.querySelectorAll('.fold-text[data-fold-render]');
        els.forEach(function (el) { initFoldText(el); });
    }

    window.yaInitFoldText = initAll;

    document.addEventListener('DOMContentLoaded', function () { initAll(document); });
})();
