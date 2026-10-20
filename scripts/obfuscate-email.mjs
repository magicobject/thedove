// Keeps plain email addresses out of the generated HTML (spam harvesters read
// page source, not the rendered page). The build writes a <span> holding the
// address reversed then base64-encoded, with a readable "name [at] domain"
// fallback as its text; public/js/main.js decodes it into a real mailto: link.
// Without JavaScript, visitors still see "name [at] domain" and can type it.

export function encodeEmail(address) {
  return Buffer.from([...address].reverse().join(''), 'utf8').toString('base64');
}

export function readableEmail(address) {
  return address.replace('@', ' [at] ');
}

export function emailLinkHtml(address) {
  return `<span class="obf-email" data-e="${encodeEmail(address)}">${readableEmail(address)}</span>`;
}

// HTML-escape a value destined for a double-quoted attribute. Used for the
// subject/body/label on an emailButtonHtml() span -- none of those ever
// contain the address itself, so they don't need obfuscating, only escaping.
function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// A call-to-action version of emailLinkHtml(): renders as a <span> styled
// like a button, with the destination address obfuscated the same way, plus
// an optional pre-filled subject/body for the mailto: link. Those are plain
// text (not the address), so they're carried as ordinary (escaped) data
// attributes; public/js/main.js builds the full "mailto:addr?subject=...
// &body=..." link client-side once it has decoded the address.
export function emailButtonHtml(address, label, { subject = '', body = '' } = {}) {
  const attrs = [
    `data-e="${encodeEmail(address)}"`,
    `data-label="${escapeAttr(label)}"`,
  ];
  if (subject) attrs.push(`data-subject="${escapeAttr(subject)}"`);
  if (body) attrs.push(`data-body="${escapeAttr(body)}"`);
  return `<span class="obf-email-btn btn btn-primary" ${attrs.join(' ')}>${label} (${readableEmail(address)})</span>`;
}
