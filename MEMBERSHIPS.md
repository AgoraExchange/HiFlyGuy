# Firebase accounts and memberships

The existing static hosting can stay in place. Firebase supplies Authentication and a small Firestore database; no Firebase Hosting migration, Cloud Functions, phone authentication, or paid Firebase billing plan is required by this implementation. Spark is no-cost within its published quotas; it is not unlimited. Square charges its normal processing fees independently.

## Finish the hiflyguy project setup

1. In Firebase Authentication, enable Email/Password. Add the actual website hostname to Authentication > Settings > Authorized domains. Add localhost / 127.0.0.1 for local account testing if needed.
2. Create a Standard Cloud Firestore database in Production mode, staying on Spark. Pick the region appropriate for the audience.
3. In Firestore > Rules, replace the initial deny-all rules with the exact contents of `firestore.rules`, then Publish. Do not use open test-mode rules. Alternatively, from an authenticated Firebase CLI: `firebase deploy --only firestore:rules --project hiflyguy`.
4. The public Firebase web configuration supplied for hiflyguy is in `src/firebase-client.js`. `.env.example` documents optional overrides; no server/admin key belongs in Vite variables or the browser.
5. Create your own website account and choose a permanent username. The visible sign-in and registration use username and password. A missing profile after registration can be completed from the account dialog once rules are published.
6. Verify a real sign-up, sign-out, username sign-in, password change and username reservation before public launch. The requested owner registration could not complete because this runner could not reach Firebase Authentication; no owner account or role was created by the implementation.

## What each pass can do

- Visitor / Free Tier: explore all rooms, camera tools, brain/data, leave banana or tomato in Habitat. Free will stays on; food does not summon him. Peppermint, swatter, training, world/time controls and invitations require membership. Director Mode is reserved for Godfather.
- Flyest Guy: $28.99 per month. Current interactive tools and training.
- Da God: $299 per year. Same current tools, annual pricing, distinctive gold badge.
- Godfather is the owner-only tier. An admin-owned Firestore `roles/{uid}` record with `role: "godfather"` grants all interaction and exclusive Director Mode access without a purchased plan. It is never editable from the browser.

The entrance runs for 2.5 seconds. Signed-in sessions return to their world; new visitors choose sign-in, registration or Enter as a visitor. Guest and account worlds use separate local storage namespaces. Training progress is device-local, not cloud synchronized. The original pre-account `hiflyguy.world.v1` save is preserved in storage but is not exposed to a visitor or automatically imported into another user's account.

## Payment and account activation

Square monthly link: https://square.link/u/z7XqVcUJ

Square annual link: https://square.link/u/u4wSCV1J

Both checkouts already have the account-username custom field per the site owner. The site asks the member to confirm their signed-in username, writes a checkout request, and reveals the matching link. A request is not proof of payment and never changes membership. The owner checks the paid Square receipt and its username, then grants that username access. The owner should confirm the configured amounts and renewal/cancellation settings in Square; this code does not create or configure Square subscriptions.

Data:

- `profiles/{uid}`: immutable username and creation timestamp, readable only by that account.
- `usernames/{lowercaseUsername}`: immutable UID mapping, read by authenticated users for username reservation; no emails or billing details.
- `profiles/{uid}/checkoutRequests/{flyest|god}`: username, selected tier, server request timestamp. Account-owned, never trusted as payment evidence.
- `roles/{uid}`: owner-only Godfather role. Account can read its own record; every browser write is denied.
- `entitlements/{uid}`: tier, expiry timestamp and admin audit metadata. Account can read its own record; all browser writes are denied.
- `membershipPayments/{sha256(paymentReference)}`: admin-only payment audit and duplicate-application protection.

The live listener only accepts entitlement snapshots confirmed by the server. Expiry and revocation remove interactive access. Opening checkout, changing local storage, or typing another username cannot grant a server membership. This remains a downloaded client-side simulation: browser UI checks are not DRM and cannot prevent a technically skilled person from modifying their own local copy. Future shop, wallet or withdrawal APIs must independently authorize every server operation.

## Grant a verified payment

The public web config does not grant administrative access. Use trusted local Application Default Credentials, or set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON stored outside this repository. Do not send the key in chat, commit it, or put it in `.env`/Vite configuration.

Preview the exact account and expiry:

```powershell
npm run membership -- --username fly_name --tier flyest --payment SQUARE_PAYMENT_ID
npm run membership -- --username fly_name --tier god --payment SQUARE_PAYMENT_ID
```

After checking the preview, repeat with `--apply`. Monthly grants add one calendar month; annual grants add one calendar year. Renewals of the same tier extend from the later of now or the existing expiry. Optional `--until 2027-09-21T23:59:59Z` sets an explicit expiry. A payment reference can only be applied once.

```powershell
npm run membership -- --username fly_name --tier free --apply
npm run membership -- --username YOUR_OWN_USERNAME --creator --apply
```

The first command revokes paid access. The second grants the owner's filming access; the open site receives the role automatically. This application has no recurring-payment webhook: the owner must extend renewals, process refunds/revocations, and reconcile Square receipts. No account is upgraded automatically after redirecting back from payment.

## Validation

`npm test` checks simulation, saved-world migration and access policy. Playwright's `membership.spec.js` tests visitor/free/paid/expired account behavior with a network-injected test adapter. That adapter is only in tests and is never imported by application code. Existing world/Director tests use a creator test account. These tests do not validate live Firebase provisioning.

`tests/firestore-rules.test.js` covers username reservation, cross-account access and denied entitlement writes. To run it, install `@firebase/rules-unit-testing`, Firebase CLI and a supported Java runtime, then:

```powershell
firebase emulators:exec --only firestore --project demo-hiflyguy "npm run test:rules"
```

Without `FIRESTORE_EMULATOR_HOST`, that suite skips rather than contacting production. The emulator suite could not be executed in the implementation environment: its rules-testing package download was denied and no Java runtime was available.

## Model and product copy

The running network has 768 units and 4,608 generated connections, with backward-compatible migration from 192-unit saves. The visual has region-colored neuron glow and signal pulses. It is described as a fruit-fly-inspired model, with FlyWire research/download links retained. No full FlyWire dataset is loaded. Earnings, wallets with withdrawals and a habitat shop are roadmap ideas, not included live membership features, and no investment returns are promised.

## Give your own account Godfather without sharing a private key

After signing up, find your own user in Firebase Authentication and copy its exact UID. In Firestore, create collection `roles`, use that UID as the document ID, and add a string field `role` with value `godfather`. Do this only for your own verified account. The website cannot write this collection; other users cannot assign themselves a role. Refresh the website if needed. Removing that role document revokes creator access. Never use the email or username as this document ID: it must be the Authentication UID.

## Username-only authentication

The user signs in with a permanent lowercase username and password. Firebase Email/Password stores an internal identity of `username@accounts.hiflyguy.invalid`; this reserved non-deliverable domain is an account identifier, not a mailbox. No email address is collected. Firestore rules require the profile username to match the authenticated internal identity. Firebase owns password hashing and authentication. No passwords are stored in source, Firestore profiles, logs or local storage.

Signed-in users can change their password by reauthenticating with the current password. Username-only accounts cannot receive email reset links; the Forgot password help points to support. Any manual recovery must verify account ownership before a trusted administrator changes credentials.

## Requested owner: swipingcc

1. Publish `firestore.rules` in the hiflyguy Firestore Rules tab.
2. Open the updated local site, choose Create account, and register `swipingcc` with the chosen password. If it already exists, sign in instead.
3. In Authentication > Users, locate `swipingcc@accounts.hiflyguy.invalid` and copy its UID.
4. In Firestore, create `roles/{THAT_UID}` with the string field `role` set to `godfather`. Never use the username as the document ID.
5. The website will show Godfather and unlock Director Mode when that role is confirmed by the server.

Alternatively, a trusted admin session can run `npm run membership -- --username swipingcc --creator --apply` after the profile has been registered. The owner password is intentionally not recorded here.
