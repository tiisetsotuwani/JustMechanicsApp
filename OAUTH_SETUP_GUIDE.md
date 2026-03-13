# Google & Facebook OAuth Setup Guide for JustMechanic

## 🎯 Current Status
OAuth integration is **COMPLETE** in the code. You just need to configure it in your Supabase Dashboard.

---

## 📋 STEP-BY-STEP SETUP

### 1. Google OAuth Setup

#### A. Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. Configure OAuth consent screen (if first time):
   - User type: **External**
   - App name: **JustMechanic**
   - User support email: your email
   - Developer contact: your email
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **JustMechanic Web**
   - Authorized JavaScript origins:
     - `https://<your-project-id>.supabase.co`
     - `http://localhost:3000` (for testing)
   - Authorized redirect URIs:
     - `https://<your-project-id>.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**

#### B. Configure in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle **Enable Google Provider** to ON
6. Paste **Client ID** and **Client Secret**
7. Click **Save**

---

### 2. Facebook OAuth Setup

#### A. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** as app type
4. App Display Name: **JustMechanic**
5. App Contact Email: your email
6. Click **Create App**

#### B. Configure Facebook Login
1. In your new app, go to **Dashboard**
2. Click **Add Product** → Find **Facebook Login** → Click **Set Up**
3. Choose **Web** as platform
4. Site URL: `https://<your-project-id>.supabase.co`
5. Click **Save** → **Continue**
6. Go to **Facebook Login** → **Settings**
7. Add to **Valid OAuth Redirect URIs**:
   - `https://<your-project-id>.supabase.co/auth/v1/callback`
8. Click **Save Changes**

#### C. Get App Credentials
1. Go to **Settings** → **Basic**
2. Copy **App ID** and **App Secret**

#### D. Configure in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Facebook** in the list
5. Toggle **Enable Facebook Provider** to ON
6. Paste **App ID** (as Client ID) and **App Secret** (as Client Secret)
7. Click **Save**

---

## ✅ VERIFICATION

After setup, test the OAuth flow:

1. Open your JustMechanic app
2. Go to Login screen
3. Click **"Continue with Google"** or **"Continue with Facebook"**
4. You should be redirected to the OAuth provider
5. Authorize the app
6. You should be redirected back and logged in automatically

---

## 🔍 TROUBLESHOOTING

### Error: "OAuth provider is not enabled"
**Solution:** Make sure you toggled the provider to ON in Supabase Dashboard and clicked Save.

### Error: "redirect_uri_mismatch"
**Solution:** Double-check that your redirect URI in Google/Facebook matches exactly:
```
https://<your-project-id>.supabase.co/auth/v1/callback
```

### Error: "App Not Setup"
**Solution:** In Facebook, make sure:
1. Facebook Login product is added
2. Valid OAuth Redirect URIs includes the Supabase callback URL
3. App is not in Development Mode (or your account is added as a test user)

### OAuth redirects but doesn't login
**Solution:** Check browser console for errors. Make sure:
1. Supabase client is properly initialized
2. No CORS errors
3. Access token is being received in the URL hash

---

## 🎨 HOW IT WORKS IN THE APP

### User Flow:
1. User clicks "Continue with Google" or "Continue with Facebook"
2. App saves their selected user type (Customer/Provider) to localStorage
3. User is redirected to Google/Facebook
4. User authorizes the app
5. Google/Facebook redirects back with access token
6. App extracts token from URL hash
7. App gets user data from Supabase
8. App creates user profile in backend (if doesn't exist)
9. User is logged in and redirected to appropriate dashboard

### Code Flow:
```typescript
// 1. User clicks social login button
handleSocialLogin('google' | 'facebook')
  ↓
// 2. Save user type preference
localStorage.setItem('oauth_userType', userType)
  ↓
// 3. Trigger OAuth redirect
supabase.auth.signInWithOAuth({ provider })
  ↓
// 4. User authorizes on Google/Facebook
// ... OAuth provider flow ...
  ↓
// 5. Redirect back to app with token
// URL: https://yourapp.com#access_token=xxx
  ↓
// 6. useEffect detects token in URL hash
useEffect() → handleOAuthCallback()
  ↓
// 7. Get user data from Supabase
supabase.auth.getUser(accessToken)
  ↓
// 8. Create/get user profile from backend
fetch('/auth/signup' or '/auth/session')
  ↓
// 9. Login user
onLogin(userType, accessToken, profile)
```

---

## 📝 ADDITIONAL NOTES

### Production Checklist:
- [ ] Set up proper domain (not localhost)
- [ ] Add domain to Google OAuth authorized origins
- [ ] Add domain to Facebook OAuth redirect URIs
- [ ] Take Facebook app out of Development Mode
- [ ] Test OAuth flow on production domain
- [ ] Set up proper error monitoring

### Security Best Practices:
- ✅ Access tokens are stored in localStorage
- ✅ Tokens are validated with backend
- ✅ User type is verified on backend
- ✅ OAuth state parameter prevents CSRF
- ✅ Redirect URI is whitelisted

### Future Enhancements:
- Add Apple Sign In
- Add Microsoft/Azure AD
- Add Twitter/X login
- Add LinkedIn login
- Implement refresh tokens
- Add session expiry warnings

---

## 🆘 NEED HELP?

### Supabase Documentation:
- [Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Auth with Facebook](https://supabase.com/docs/guides/auth/social-login/auth-facebook)

### Common Resources:
- [Google Cloud Console](https://console.cloud.google.com/)
- [Facebook Developers](https://developers.facebook.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)

### Error Messages:
All OAuth errors will display in the error box on the login screen with helpful messages pointing you to the right configuration page.
