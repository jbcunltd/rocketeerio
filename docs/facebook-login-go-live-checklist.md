# Facebook Login Go-Live Checklist for Rocketeerio

This checklist is for Bo to complete in the [Meta Developer Dashboard](https://developers.facebook.com/apps/) for the Rocketeerio Meta app. The codebase separates **basic Facebook Login** from **Facebook Page authorization**, so the initial sign-in flow should request only `email` and `public_profile`, while the dashboard Page connection flow requests `pages_show_list`, `pages_manage_metadata`, and `pages_messaging`.

| Item | Value |
|---|---|
| Meta App ID | `1730113521290436` |
| Production domain | `rocketeerio.com` |
| Privacy Policy URL | `https://rocketeerio.com/privacy` |
| Terms of Service URL | `https://rocketeerio.com/terms` |
| Data Deletion Callback URL | `https://rocketeerio.com/api/auth/facebook/data-deletion` |
| Data Deletion Status URL pattern | `https://rocketeerio.com/api/auth/facebook/data-deletion/status?id=<confirmation_code>` |
| Facebook Login Configuration ID | `1015579324127162` |
| Production OAuth callback | `https://rocketeerio.com/api/auth/facebook/callback` |
| Page authorization callback | `https://rocketeerio.com/api/facebook/pages/callback` |

## Corrected go-live order

Complete the Meta go-live work in this order so compromised credentials are rotated first, public compliance URLs are ready before Live mode, and Page permissions are reviewed separately from basic login.

| Step | Action | Expected result |
|---:|---|---|
| 1 | Rotate App Secret in **App Settings → Basic** and treat current credentials as compromised. | The old App Secret is no longer usable. |
| 2 | Update the new App Secret in **Vercel environment variables** and **Railway**. | Production frontend and backend services use the rotated secret. |
| 3 | Add the Data Deletion Callback URL: `https://rocketeerio.com/api/auth/facebook/data-deletion`. | Meta has the required user data deletion callback configured. |
| 4 | Verify Privacy Policy (`https://rocketeerio.com/privacy`) and Terms (`https://rocketeerio.com/terms`) return HTTP 200 from a non-logged-in browser. | Both compliance pages are publicly accessible without authentication. |
| 5 | Switch the app to **Live** mode. | Basic login with `email` and `public_profile` is enabled for all users immediately because login permissions are separated from Page permissions. |
| 6 | Submit App Review for `pages_show_list`, `pages_manage_metadata`, and `pages_messaging` with screencasts showing real user flows. | Meta can review the advanced Page connection and messaging permissions. |
| 7 | Complete Business Verification if Meta requires it for Advanced Access. | Any Meta business requirement blocking Advanced Access is resolved. |
| 8 | Test with a real non-admin Facebook account, not a Tester role, to verify the actual public user experience. | A public user can complete basic login, and Page connection behavior matches the current App Review approval state. |

> **Important timing note:** App Review can take **3 days to 3 weeks**. Rejections on first submission are common. Budget **half a day** to record proper screencasts showing real user flows, not just UI walkthroughs. Basic login (`email` + `public_profile`) should work immediately after switching to Live mode, but Page connection features will not work for non-admins until App Review is approved.

## Permission separation to verify

The initial login route should be treated as basic authentication only. It should not request Page permissions. The Page authorization flow should happen only after the user is already logged in and clicks the dashboard action to connect Facebook Pages.

| Flow | Endpoint | Permissions |
|---|---|---|
| Basic login | `/api/auth/facebook` | `email`, `public_profile` |
| Page connection | `/api/facebook/pages` | `pages_show_list`, `pages_manage_metadata`, `pages_messaging` |

This separation is important because basic Login can be used for ordinary user sign-in immediately after Live mode is enabled, while advanced Page permissions must go through App Review before non-role users can grant them.

## App Review screencast expectations

For each advanced Page permission, provide clear written steps and screencasts showing a real user signing in, opening the dashboard, clicking the Facebook Page connection action, granting the requested permission, selecting a Page, and using the resulting Page messaging automation workflow.

| Permission | Why Rocketeerio needs it | Where it is used |
|---|---|---|
| `pages_show_list` | Allows the logged-in user to list Facebook Pages they manage so they can choose which Page to connect. | Dashboard Page selection flow. |
| `pages_manage_metadata` | Allows Rocketeerio to access and manage Page metadata needed for webhook and Page integration setup. | Page connection and messaging integration setup. |
| `pages_messaging` | Allows Josh to participate in Messenger conversations for the connected Page. | Messenger automation and lead response workflow. |

## Final public-user test

After Live mode is enabled and the required settings are saved, test with a Facebook account that is not listed as an admin, developer, or tester on the Meta app. This should be a real public-user test, not a role-based test account.

| Test | Expected result |
|---|---|
| Visit `https://rocketeerio.com/login` and continue with Facebook. | The user can complete basic Facebook Login without seeing **Feature Unavailable**. |
| Confirm the user lands in the Rocketeerio dashboard. | A session is created and the dashboard loads. |
| Click the dashboard Facebook Page connection action. | The user sees a separate authorization prompt for Page permissions if App Review is approved; otherwise, this step may remain blocked for non-admin users. |
| Remove the app from Facebook settings and send a data deletion request. | Meta receives JSON with `url` and `confirmation_code`, and the status URL returns a received status. |

## Troubleshooting notes

If non-admin users still see **Feature Unavailable** during sign-in, first confirm that the app is actually in Live mode and that the login flow is not using a Login Configuration that bundles advanced Page permissions. If the error appears only during the dashboard Page connection step, the issue is likely App Review or Business Verification for the advanced permissions rather than basic Login.

If App Review is still pending, non-role users may be able to complete basic login but will not be able to grant `pages_show_list`, `pages_manage_metadata`, or `pages_messaging` until Meta approves those permissions for production use.

## References

[1]: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback "Meta Developer Documentation: Data Deletion Callback"
