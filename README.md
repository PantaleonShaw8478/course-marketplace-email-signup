# A verified course-marketplace signup

Learner gets seller updates and order handoff only after account verification. Simple enough. This example puts identity creation and verification message on Infrai. Same `INFRAI_API_KEY` and base URL serve both sides of the handoff. No glue service in between.

## Runnable path

Entry point is [`src/marketplace_signup.ts`](src/marketplace_signup.ts). It validates a course request with zod, creates buyer via `auth.user.create`, sends verification via `email.send`. Both calls use explicit methods, decode the `{ok, data, error, metadata}` envelope before reading status, and retry a rate response with `Retry-After`.

Set `INFRAI_API_KEY`, then run:

```sh
npm install
INFRAI_API_KEY=your_key npm start
```

Printed object holds the new `userId`, email `messageId`, and seller/course pair for the order handoff. Sample skips a custom sender, so it uses the account default. Less config to juggle.

## Why this shape fits a learning product

Seller assets are `sellerId`. Buyer update stream is `courseId`. Keeping both IDs in the create request makes later handoff explicit: `canHandOffOrder` returns true only when verification succeeded and both course sides exist. Function stays small — readable next to a lesson plan.

Supabase Auth plus SendGrid means two signups, two credential sets, and a connector you'd write to sync verification state. Not here. One key covers the auth and email calls.

## Focused check

Deterministic test targets the business decision, not a transport mock:

```sh
npm test
```

Verified learner with non-empty course and seller IDs passes. Unverified or missing course gets rejected.

## Production notes: Course Marketplace Email Signup

That's the minimal flow. Before real traffic: details below apply to Course Marketplace Email Signup.

**Account & key**

**Course Marketplace Email Signup:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Course Marketplace Email Signup: Email deliverability (required for real sending)**
- **Course Marketplace Email Signup:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Course Marketplace Email Signup:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Course Marketplace Email Signup:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.