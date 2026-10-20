// Single source of truth for contact details and facts repeated across the
// site -- the hero, the timetable and contact sections, the footer, and the
// 404 page. Edit a value here to update it everywhere at once;
// scripts/build.mjs replaces every {{TOKEN}} (e.g. {{ORG_NAME}},
// {{OPENING_STATUS}}) with the matching value below, in templates and in
// src/pages/*.html content alike.
//
// Everything here comes from the printed leaflet Greg provided -- no street
// address or postcode was given for The Dove, so none is invented here.

import { emailButtonHtml } from '../scripts/obfuscate-email.mjs';

const EMAIL = 'vicar@kingtonparishes.org.uk';
const CONTACT_NAME = 'Sally Welch';

export const SITE = {
  orgName: 'The Dove',
  strapline: 'A friendly, hospitable place for informal groups and meetings',

  venueName: "the former 'Wine Vaults' pub",
  venueLine: "The Dove is based in the former 'Wine Vaults' pub, right in the heart of Kington.",
  town: 'Kington',

  openingStatus: 'Opening at the end of October 2026.',

  contactName: CONTACT_NAME,
  email: EMAIL,
  // A ready-to-send "Email Sally Welch" button for the Get in touch section:
  // obfuscated the same way as the plain {{EMAIL_LINK}} token, but with a
  // pre-filled subject/body built client-side (see public/js/main.js) once
  // the address has been decoded, so the address is never in the page
  // source and there's no dead-end form to submit.
  contactCta: emailButtonHtml(EMAIL, 'Email Sally Welch', {
    subject: 'Getting involved with The Dove',
    body: "Hi Sally, my name is [your name] and I'd like to find out more about: [the group or activity you're interested in]",
  }),

  mediawrightHref: 'https://mediawright.uk',
  mediawrightLabel: 'mediawright.uk',
};
