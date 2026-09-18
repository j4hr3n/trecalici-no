> Public contact updated to `kontakt@trecalici.no` for SEO implementation. This does not change the independently deployed Worker's MAIL_TO/MAIL_FROM settings or provision a mailbox. Confirm domain delivery and configured recipient before launch.

# Resend deployment and handover

Status: the owner deployed the Worker on 2026-09-17. Its version-1 health response and GitHub Pages CORS preflight were verified. Live Turnstile verification and inbox delivery still require the manual checks below. No live emails were sent during automated tests.

## Deploy the Worker first

1. Cloudflare → Workers & Pages → `trecalici-contact` → Edit code.
2. Replace the complete default script with the contents of [`worker/contact.mjs`](../worker/contact.mjs). It is a standalone ES module and needs no packages. Save and Deploy.
3. Under Settings → Variables and Secrets, confirm these values:

| Type | Name | Value |
| --- | --- | --- |
| Secret | `RESEND_API_KEY` | The domain-restricted sending key created in Resend |
| Secret | `TURNSTILE_SECRET_KEY` | The secret paired with the site's Turnstile site key |
| Text | `MAIL_FROM` | `Trecalici Norge <foresporsel@mail.trecalici.no>` |
| Text | `MAIL_TO` | `robot-slump-6x@icloud.com` |
| Text | `ALLOWED_ORIGINS` | `https://j4hr3n.github.io,https://trecalici.no,https://www.trecalici.no` |

Save/deploy variable changes. Origins have no trailing slash or path. A sending address on a verified domain does not need a hosted inbox: confirmations set Reply-To to `MAIL_TO`.

4. Open https://trecalici-contact.christofferjahren.workers.dev/ . It should display `{"service":"trecalici-contact","version":1}`. This confirms code deployment, not email credentials or delivery.
5. Confirm the Managed Turnstile widget allows `j4hr3n.github.io`, `trecalici.no`, and `www.trecalici.no`. Its public site key is `0x4AAAAAAE6oXP7SfndREesn`.
6. Only after the Worker is deployed, publish the accompanying `site/` changes through the normal GitHub Pages workflow. The Worker is outside `site/` and is not deployed by that workflow.

## Verify after publishing

Submit a controlled enquiry using an inbox you own. Check the owner notification, visitor confirmation and Reply-To in both directions. Repeat for product forms and general contact, including navigating from the homepage without reloading. Test invalid input, mobile width and an interrupted connection. The wine list is still sent manually.

Expected: the visitor stays on the page; success appears only when Resend accepts both messages. Inbox delivery can still bounce or be delayed. Check Resend's email dashboard for delivery status and quotas. At two messages per enquiry, 100/day is at most 50 enquiries/day if the team has no other usage.

The Worker validates the request origin, content, consent, honeypot, Turnstile hostname and action. Turnstile is mandatory; no client-only CAPTCHA bypass exists. Origin checks are not authentication. Turnstile reduces automated abuse but is not a hard per-person or global sending cap. Monitor quota consumption; add rate limits if needed.

Failed requests preserve typed form values and can be retried with a fresh Turnstile token. Stable payload-bound Resend idempotency keys prevent duplicate sends for retries from the same mounted form within Resend's 24-hour window. Reloading or navigating away resets the in-memory request ID. No durable enquiry database or background retry queue is included.

Local tests: `node --test tests/*.test.mjs`. The frontend can be served using the README command, but real Turnstile and Worker origin checks are configured for the public hosts, not localhost. Use mocked services for automated tests; never put production secrets in tests.

## Troubleshooting

- Still “Hello World”: the Worker script was not deployed.
- Disabled submit / CAPTCHA error: script blocked, hostname missing from Turnstile, or widget key mismatch. Use the email fallback if necessary.
- `configuration`: a required Worker variable/secret is absent or `MAIL_TO` is invalid.
- `origin`: origin missing from `ALLOWED_ORIGINS`.
- `verification`: expired/reused CAPTCHA token, wrong secret, hostname or action. Retry with a new challenge.
- `email_unavailable`: check Resend domain verification, key permissions and quota. The browser never receives upstream details or secrets.

Provider references: [Resend batch API](https://resend.com/docs/api-reference/emails/send-batch-emails), [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
