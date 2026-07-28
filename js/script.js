(function () {
  'use strict';

  var prose = document.querySelector('.prose');

  // Reading progress ---------------------------------------------------------

  var progress = document.querySelector('#reading-progress span');
  var article = document.querySelector('.page-post');

  if (progress && article) {
    var updateProgress = function () {
      var start = article.offsetTop;
      var span = article.offsetHeight - window.innerHeight;
      var ratio = span > 0 ? (window.scrollY - start) / span : 1;

      progress.style.width = Math.min(1, Math.max(0, ratio)) * 100 + '%';
    };

    var progressQueued = false;
    var onProgressScroll = function () {
      if (progressQueued) return;
      progressQueued = true;
      requestAnimationFrame(function () {
        progressQueued = false;
        updateProgress();
      });
    };

    window.addEventListener('scroll', onProgressScroll, { passive: true });
    window.addEventListener('resize', onProgressScroll);
    updateProgress();
  }

  // Contents rail: mark the heading currently being read ----------------------

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-link'));

  if (tocLinks.length && 'IntersectionObserver' in window) {
    var linkById = {};
    var headings = [];

    tocLinks.forEach(function (link) {
      var id = decodeURIComponent(link.getAttribute('href').slice(1));
      var heading = document.getElementById(id);
      if (!heading) return;

      linkById[id] = link;
      headings.push(heading);
    });

    var visible = [];

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        var at = visible.indexOf(id);

        if (entry.isIntersecting && at === -1) visible.push(id);
        if (!entry.isIntersecting && at !== -1) visible.splice(at, 1);
      });

      // Fall back to the last heading scrolled past when nothing is on screen.
      var current = visible.length
        ? headings.filter(function (h) { return visible.indexOf(h.id) !== -1; })[0]
        : headings.filter(function (h) { return h.getBoundingClientRect().top < 120; }).pop();

      tocLinks.forEach(function (link) { link.classList.remove('is-active'); });
      if (current && linkById[current.id]) linkById[current.id].classList.add('is-active');
    }, { rootMargin: '-90px 0px -70% 0px' });

    headings.forEach(function (heading) { observer.observe(heading); });
  }

  // Code blocks: language bar and copy button --------------------------------

  if (prose) {
    Array.prototype.forEach.call(prose.querySelectorAll('figure.highlight'), function (figure) {
      var code = figure.querySelector('td.code') || figure.querySelector('pre');
      if (!code) return;

      var language = (figure.className.match(/highlight\s+(\S+)/) || [])[1] || 'code';

      var head = document.createElement('div');
      head.className = 'code-head';

      var label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = language;

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.textContent = 'copy';

      button.addEventListener('click', function () {
        var text = code.innerText.replace(/\n{2,}/g, '\n');

        var done = function (ok) {
          button.textContent = ok ? 'copied' : 'failed';
          setTimeout(function () { button.textContent = 'copy'; }, 1600);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        } else {
          done(false);
        }
      });

      head.appendChild(label);
      head.appendChild(button);
      figure.insertBefore(head, figure.firstChild);
    });

    // Wide tables scroll inside their own frame rather than the page.
    Array.prototype.forEach.call(prose.querySelectorAll('table'), function (table) {
      if (table.closest('figure.highlight') || table.parentNode.classList.contains('table-scroll')) return;

      var frame = document.createElement('div');
      frame.className = 'table-scroll';
      table.parentNode.insertBefore(frame, table);
      frame.appendChild(table);
    });

    // Drop cap opens the reading view only, and only when the post starts with
    // running text rather than an image or a heading.
    var first = document.querySelector('.page-post .prose > *');
    if (first && first.tagName === 'P' && !first.querySelector('img') && /^[A-Za-zÀ-ÿ]/.test(first.textContent.trim())) {
      first.classList.add('has-dropcap');
    }

    // Captions from image alt text, and lightbox wrappers.
    Array.prototype.forEach.call(prose.querySelectorAll('img'), function (image) {
      var parent = image.parentNode;
      if (parent.classList && parent.classList.contains('fancybox')) return;

      var alt = image.getAttribute('alt') || '';

      var link = document.createElement('a');
      link.className = 'fancybox';
      link.setAttribute('href', image.getAttribute('src'));
      link.setAttribute('rel', 'article');
      if (alt) link.setAttribute('title', alt);

      parent.insertBefore(link, image);
      link.appendChild(image);

      if (alt) {
        var caption = document.createElement('span');
        caption.className = 'caption';
        caption.textContent = alt;
        link.parentNode.insertBefore(caption, link.nextSibling);
      }
    });
  }

  // Share --------------------------------------------------------------------

  var share = document.querySelector('.share-link');

  if (share) {
    share.addEventListener('click', function (event) {
      var url = share.getAttribute('data-url') || window.location.href;
      var title = document.title;

      if (navigator.share) {
        event.preventDefault();
        navigator.share({ title: title, url: url }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        event.preventDefault();
        navigator.clipboard.writeText(url).then(function () {
          var original = share.textContent;
          share.textContent = 'Link copied';
          setTimeout(function () { share.textContent = original; }, 1600);
        }, function () {});
      }
    });
  }

  // Lightbox (jQuery plugin, loaded before this file) -------------------------

  if (window.jQuery && window.jQuery.fn && window.jQuery.fn.fancybox) {
    window.jQuery('.fancybox').fancybox();
  }
})();
