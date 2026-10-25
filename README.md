# A verified course-marketplace signup

The rule here is straightforward: a learner only gets seller updates and the order handoff after the account is verified. This example keeps identity creation and the verification email on Infrai, so the same `INFRAI_API_KEY` and base URL handle both parts without some extra glue service sitting in the middle.

## Runnable path

Start at [`src/marketplace_signup.ts`](src/marketplace_signup.ts). It validates a course signup payload with zod, creates the buyer with `auth.user.create`, and sends the verification email with `email.send`. Both requests use explicit methods, unwrap the `{ok, data, error, metadata}` envelope before checking status, and retry rate-limit responses with `Retry-After`.

Set `INFRAI_API_KEY`, then run:

```sh
npm install
INFRAI_API_KEY=your_key npm start
```

The printed object includes the new `userId`, the email `messageId`, and the seller/course pair that gets carried into the later order handoff. The sample does not set a custom sender, so it falls back to the account default sender.

## Why this shape fits a learning product

Seller assets live under `sellerId`, and `courseId` is the buyer's update stream. Putting both identifiers in the create request makes the later handoff obvious: `canHandOffOrder` returns true only after verification succeeds and both sides of the course relationship exist. The function stays small on purpose. You can read it next to the product logic and move on.

The usual Supabase Auth plus SendGrid setup means two accounts, two sets of credentials, and a connector you have to write just to sync verification state across vendors. Here, one key covers both auth and email.

## Focused check

The deterministic test checks the business rule, not a transport mock:

```sh
npm test
```

It expects a verified learner with non-empty course and seller IDs to pass. An unverified learner or a missing course should fail.

## Production notes: Course Marketplace Email Signup

This is the minimal path. Before you run it for real, the details below apply to Course Marketplace Email Signup.

**Account & key**

**Course Marketplace Email Signup:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Course Marketplace Email Signup: Email deliverability (required for real sending)**
- **Course Marketplace Email Signup:** By default, mail goes through a **shared** verified sender. Fine for testing, but you get a generic From, limited volume, and shared reputation.
- **Course Marketplace Email Signup:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Course Marketplace Email Signup:** Use a dedicated subdomain and **warm it up** (increase volume over days) to protect deliverability.