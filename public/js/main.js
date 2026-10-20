document.addEventListener('DOMContentLoaded', function () {
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  // Turn each obfuscated email span (see scripts/obfuscate-email.mjs) into a
  // real mailto: link. Without JavaScript the "name [at] domain" text stays.
  document.querySelectorAll('.obf-email').forEach(function (el) {
    try {
      var address = atob(el.getAttribute('data-e')).split('').reverse().join('');
      var a = document.createElement('a');
      a.href = 'mailto:' + address;
      a.textContent = address;
      el.replaceWith(a);
    } catch (e) { /* leave the readable fallback */ }
  });

  // Same idea for the "Email Sally Welch"-style call-to-action button: it
  // also carries a plain-text (not obfuscated -- they don't contain the
  // address) subject/body, built into the mailto: link's query string only
  // after the address itself has been decoded. There is no form to submit
  // here, just a normal mailto: link once this has run.
  document.querySelectorAll('.obf-email-btn').forEach(function (el) {
    try {
      var address = atob(el.getAttribute('data-e')).split('').reverse().join('');
      var params = [];
      var subject = el.getAttribute('data-subject');
      var body = el.getAttribute('data-body');
      if (subject) { params.push('subject=' + encodeURIComponent(subject)); }
      if (body) { params.push('body=' + encodeURIComponent(body)); }
      var href = 'mailto:' + address + (params.length ? '?' + params.join('&') : '');
      var a = document.createElement('a');
      a.className = el.className;
      a.href = href;
      a.textContent = el.getAttribute('data-label') || address;
      el.replaceWith(a);
    } catch (e) { /* leave the readable fallback */ }
  });

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }
});
