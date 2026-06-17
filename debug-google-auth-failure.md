# Debug Session: google-auth-failure
- **Status**: [OPEN]
- **Issue**: Google authentication does not work in the user app.
- **Debug Server**: Pending
- **Log File**: .dbg/trae-debug-log-google-auth-failure.ndjson

## Reproduction Steps
1. Open the user app.
2. Tap the Google sign-in action.
3. Observe the failure point, error, or redirect behavior.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | The Google OAuth redirect URL or deep-link scheme is misconfigured, so the app never receives the callback correctly. | High | Low | Pending |
| B | Supabase OAuth starts correctly, but the callback parameters are missing or malformed when returned to the app. | High | Low | Pending |
| C | The app receives the callback, but `exchangeCodeForSession()` or `setSession()` fails during session recovery. | High | Low | Pending |
| D | Google auth completes, but the post-login user sync in `handleSupabaseSession()` fails and leaves the app unauthenticated. | Medium | Low | Pending |
| E | The currently installed native build has auth/browser/deep-link behavior that differs from the current JS config. | Medium | Medium | Pending |

## Log Evidence
- Pending

## Verification Conclusion
- Pending
