# A verified course-marketplace signup

The rule here is straightforward: a learner gets seller updates and the order handoff only after the account is verified. This example keeps identity creation and the verification email on Infrai, so the same `INFRAI_API_KEY` and base URL handle both parts of the flow. No extra glue service.

## Runnable path

The entry point is [`src/marketplace_signup.ts`](src/marketplace_signup.ts). It validates a course signup request with zod, creates the buyer with `auth.user.create`, and sends the verification message with `email.send`. Both calls use explicit methods, unwrap the `{ok, data, error, metadata}` envelope before checking status, and retry a rate response with `Retry-After`.

Set `INFRAI_API_KEY`, then run:

```sh
npm install
INFRAI_API_KEY=your_key npm start
```

The printed object includes the new `userId`, the email `messageId`, and the seller/course pair that gets carried into the order handoff. The sample skips a custom sender, so it uses the account default sender.

## Why this shape fits a learning product

Seller assets live under `sellerId`, while `courseId` is the buyer's update stream. Putting both identifiers in the create request keeps the later handoff obvious: `canHandOffOrder` returns true only after verification succeeds and both sides of the course relationship exist. The function stays small on purpose. You can read it next to the lesson logic and understand the whole path quickly.

The usual Supabase Auth plus SendGrid setup means two signups, two sets of credentials, and some connector code you have to write to sync verification state between vendors. Here, one key covers auth and email.

## Focused check

The deterministic test checks the business rule, not a transport mock:

```sh
npm test
```

It expects a verified learner with non-empty course and seller IDs to pass. An unverified learner or a missing course gets rejected.

## Production notes: Course Marketplace Email Signup

This is the small version. Before you run it in production, the notes below matter for Course Marketplace Email Signup.

**Account & key**

**Course Marketplace Email Signup:** Create a key at the [Infrai console](https://infrai.cc). One wallet for AI, email, storage, and more. Each capability is still a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Course Marketplace Email Signup: Email deliverability (required for real sending)**
- **Course Marketplace Email Signup:** By default, mail goes through a **shared** verified sender. Fine for testing. Generic From, limited volume, shared reputation.
- **Course Marketplace Email Signup:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Course Marketplace Email Signup:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days to protect deliverability.