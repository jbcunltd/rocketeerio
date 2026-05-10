# Facebook Login Go-Live Checklist for Rocketeerio

This checklist is for Bo to complete in the Meta Developer Dashboard for the Rocketeerio Meta app. The codebase now separates basic Facebook Login from Facebook Page authorization, so the initial sign-in flow should only request `email` and `public_profile`, while the dashboard page connection flow requests `pages_show_list`, `pages_manage_metadata`, and `pages_messaging`.

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

## 1. Confirm the production website pages are live

Before changing Meta settings, confirm that the public compliance pages are available over HTTPS. Meta may block app review or Live mode setup if the required public URLs are missing, inaccessible, or mismatched.

| Requirement | URL | Expected result |
|---|---|---|
| Privacy Policy | `https://rocketeerio.com/privacy` | The page loads publicly without authentication. |
| Terms of Service | `https://rocketeerio.com/terms` | The page loads publicly without authentication. |
| Data Deletion Callback | `https://rocketeerio.com/api/auth/facebook/data-deletion` | The route accepts Meta's POST request with `signed_request` and returns JSON containing `url` and `confirmation_code`. |
| Data Deletion Status | `https://rocketeerio.com/api/auth/facebook/data-deletion/status?id=<confirmation_code>` | The route returns a human-readable status payload for the request. |

## 2. Configure Basic Settings in the Meta Developer Dashboard

Open the Meta Developer Dashboard, select the Rocketeerio app, and go to **App settings → Basic**. Confirm that the app shown is **Rocketeerio** with App ID `1730113521290436`.

| Field | Value to set |
|---|---|
| App Domains | `rocketeerio.com` |
| Privacy Policy URL | `https://rocketeerio.com/privacy` |
| Terms of Service URL | `https://rocketeerio.com/terms` |
| User Data Deletion | Select the callback option and enter `https://rocketeerio.com/api/auth/facebook/data-deletion`. |
| Category | Choose the most accurate business category for Rocketeerio. |
| Contact Email | Use Bo's production support or owner email address. |

Save changes after updating the Basic Settings page. If Meta displays validation warnings, resolve them before continuing.

## 3. Verify Facebook Login settings

Go to **Use cases** or **Products → Facebook Login**, depending on the current Meta dashboard layout, and verify the OAuth settings for production.

| Setting | Required value |
|---|---|
| Client OAuth Login | Enabled. |
| Web OAuth Login | Enabled. |
| Enforce HTTPS | Enabled. |
| Valid OAuth Redirect URIs | Include `https://rocketeerio.com/api/auth/facebook/callback`. |
| Allowed Domains for JavaScript SDK | Include `rocketeerio.com` if this field is present. |

The initial login route should be treated as basic authentication only. It should not be used to request Page permissions. In the codebase, the initial login endpoint is `/api/auth/facebook`, and it now requests only `email` and `public_profile`.

## 4. Verify the page connection flow separately

The Page authorization flow should happen only after the user is already logged in and clicks the dashboard action to connect Facebook Pages. In the codebase, the page connection endpoint is `/api/facebook/pages`, and it requests the Page permissions needed for Josh to work with connected Pages.

| Flow | Endpoint | Permissions |
|---|---|---|
| Basic login | `/api/auth/facebook` | `email`, `public_profile` |
| Page connection | `/api/facebook/pages` | `pages_show_list`, `pages_manage_metadata`, `pages_messaging` |

This separation is important because basic Login can be used for ordinary user sign-in, while advanced Page permissions must go through App Review before non-role users can grant them.

## 5. Switch the app to Live mode

In the Meta Developer Dashboard, locate the app mode toggle and switch the app from **Development** to **Live**. If Meta blocks the switch, review the warnings shown on the page. The most common blockers are missing App Domains, missing Privacy Policy URL, missing Terms URL, missing data deletion callback or instructions, incomplete business details, or unresolved platform configuration issues.

After switching to Live mode, confirm that the app status visibly shows **Live** before testing with a non-admin Facebook account.

## 6. Submit App Review for advanced Page permissions

Submit App Review for the permissions required by the dashboard page connection flow.

| Permission | Why Rocketeerio needs it | Where it is used |
|---|---|---|
| `pages_show_list` | Allows the logged-in user to list Facebook Pages they manage so they can choose which Page to connect. | Dashboard Page selection flow. |
| `pages_manage_metadata` | Allows Rocketeerio to access and manage Page metadata needed for Messenger webhook and Page integration setup. | Page connection and Messenger integration setup. |
| `pages_messaging` | Allows Josh to participate in Messenger conversations for the connected Page. | Messenger automation and lead response workflow. |

For each permission, provide a clear screencast and written steps showing a user signing in, opening the dashboard, clicking the Facebook Page connection action, granting the requested permission, selecting a Page, and using the resulting Messenger automation workflow.

## 7. Complete Business Verification if required

If Meta requires Business Verification, complete it from the Business Settings area connected to the app. Use the legal business information, business website, phone number, address, and documents that match Rocketeerio's business records. Do not submit App Review repeatedly while verification is blocked, because reviewers may not approve advanced permissions until the business requirement is satisfied.

## 8. Test with a non-admin Facebook account

After Live mode is enabled and the required settings are saved, test with a Facebook account that is not listed as an admin, developer, or tester on the Meta app.

| Test | Expected result |
|---|---|
| Visit `https://rocketeerio.com/login` and continue with Facebook. | The user can complete basic Facebook Login without seeing **Feature Unavailable**. |
| Confirm the user lands in the Rocketeerio dashboard. | A session is created and the dashboard loads. |
| Click the dashboard Facebook Page connection action. | The user sees a separate authorization prompt for Page permissions. |
| Grant Page permissions from a Page admin account. | The account returns to Rocketeerio and can select a Page. |
| Remove the app from Facebook settings and send a data deletion request. | Meta receives JSON with `url` and `confirmation_code`, and the status URL returns a received status. |

## 9. Troubleshooting notes

If non-admin users still see **Feature Unavailable** during sign-in, first confirm that the app is actually in Live mode and that the login flow is not using a Login Configuration that bundles advanced Page permissions. If the error appears only during the dashboard Page connection step, the issue is likely App Review or Business Verification for the advanced permissions rather than basic Login.

If App Review is still pending, non-role users may be able to complete basic login but may not be able to grant `pages_show_list`, `pages_manage_metadata`, or `pages_messaging` until Meta approves those permissions for production use.

## References

[1]: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback "Meta Developer Documentation: Data Deletion Callback"
