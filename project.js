/* project.js — project detail page renderer (project.html?id=N) */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    if (!document.querySelector('.project-page')) return;
    if (typeof projectsData === 'undefined' || !Array.isArray(projectsData)) return;

    var params = new URLSearchParams(window.location.search);
    var id = parseInt(params.get('id'), 10);
    var index = projectsData.findIndex(function (p) { return p.id === id; });

    if (index === -1) {
        window.location.replace('index.html');
        return;
    }

    var project = projectsData[index];

    /* Document */
    document.title = project.title + ' — Yasir Ahmed';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', project.title + ' — ' + project.category + ' (' + project.year + ') — Yasir Ahmed, Video Editor &amp; Director.');
    }

    /* Title + meta */
    var titleEl = document.getElementById('project-title');
    var categoryEl = document.getElementById('project-category');
    var yearEl = document.getElementById('project-year');
    if (titleEl) titleEl.textContent = project.title;
    if (categoryEl) categoryEl.textContent = project.category;
    if (yearEl) yearEl.textContent = project.year;

    /* Media — video if provided (metadata-only preload, keeps pages light),
       otherwise the thumbnail image. */
    var media = document.getElementById('project-media');
    if (media) {
        if (project.video) {
            media.classList.add('has-video');
            media.innerHTML =
                '<video controls playsinline preload="metadata" poster="' + project.thumbnail + '" aria-label="' + project.title + '">' +
                    '<source src="' + project.video + '">' +
                '</video>';
        } else {
            media.innerHTML =
                '<img src="' + project.thumbnail + '" alt="' + project.title + '" decoding="async" aria-label="' + project.title + '">';
        }
    }

    /* Description / role / source — only rendered when present */
    var descEl = document.getElementById('project-description');
    var roleEl = document.getElementById('project-role');
    var srcEl = document.getElementById('project-source');

    if (descEl && project.description) {
        descEl.textContent = project.description;
    } else if (descEl) {
        descEl.remove();
    }

    if (roleEl && project.role) {
        roleEl.textContent = project.role;
    } else if (roleEl) {
        roleEl.remove();
    }

    var external = project.source || project.link;

    if (srcEl && external) {
        srcEl.href = external;
        srcEl.classList.remove('is-hidden');
    } else if (srcEl) {
        srcEl.remove();
    }

    var descCol = document.querySelector('.project-cols .project-desc');
    if (descCol && !descCol.textContent.trim()) {
        descCol.remove();
    }

    /* Tools */
    var toolList = document.getElementById('project-tools');
    if (toolList && project.tools && project.tools.length) {
        project.tools.forEach(function (tool) {
            var li = document.createElement('li');
            li.textContent = tool;
            toolList.appendChild(li);
        });
    } else {
        var aside = document.getElementById('project-aside');
        if (aside) aside.remove();
    }

    var cols = document.getElementById('project-cols');
    if (cols && !cols.querySelector('.project-desc') && !cols.querySelector('.project-aside')) {
        cols.remove();
    }

    /* Previous / next navigation */
    var pager = document.getElementById('project-pager');
    if (pager) {
        var prev = projectsData[(index - 1 + projectsData.length) % projectsData.length];
        var next = projectsData[(index + 1) % projectsData.length];

        var pagerHtml =
            '<a class="pager-item pager-prev js-transition" href="project.html?id=' + prev.id + '">' +
                '<span class="pager-dir">&larr;&nbsp;&nbsp;Previous</span>' +
                '<span class="pager-name">' + prev.title + '</span>' +
            '</a>' +
            '<a class="pager-item pager-next js-transition" href="project.html?id=' + next.id + '">' +
                '<span class="pager-dir">Next&nbsp;&nbsp;&rarr;</span>' +
                '<span class="pager-name">' + next.title + '</span>' +
            '</a>';

        pager.innerHTML = pagerHtml;
    }

    /* Pick up any freshly rendered reveal elements */
    if (window.yaInitReveals) window.yaInitReveals();
});