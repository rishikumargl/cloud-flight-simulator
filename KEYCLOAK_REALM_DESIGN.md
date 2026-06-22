# Keycloak Realm Design Specification

**Date**: 2026-06-22  
**Status**: SPECIFICATION — AWAITING APPROVAL  
**Scope**: Complete Keycloak realm and client configuration  
**Owner**: Deployment/DevOps (P2 coordinates)  
**Required before**: Production deployment

---

## REALM OVERVIEW

### Realm Name
```
cloud-flight-simulator
```

### Purpose
Single realm for all Cloud Flight Simulator users across all environments.

### Governance
- Single source of truth for user identities
- Supports multiple identity providers (email, Google, Microsoft)
- Issues JWTs consumed by FastAPI backend and frontend SPA
- No application-managed user accounts or passwords

---

## CLIENTS CONFIGURATION

### Client 1: Frontend SPA

**Client ID**: `cloud-flight-simulator-web`

**Type**: Public (no client secret)

**Protocol**: openid-connect

**Access Type**: public

**Standard Flow**: ENABLED

**Implicit Flow**: DISABLED

**Direct Access Grants**: DISABLED

**Service Account**: DISABLED

**Valid Redirect URIs**:
```
Development:
  http://localhost:3000/*
  http://localhost:3000/auth/callback

Staging:
  https://staging.cloud-flight-simulator.internal/*
  https://staging.cloud-flight-simulator.internal/auth/callback

Production:
  https://cloud-flight-simulator.com/*
  https://cloud-flight-simulator.com/auth/callback
```

**Web Origins** (CORS):
```
Development:
  http://localhost:3000

Staging:
  https://staging.cloud-flight-simulator.internal

Production:
  https://cloud-flight-simulator.com
```

**Authorization Code Flow with PKCE**: REQUIRED

- Code Challenge Method: S256 (SHA-256)
- keycloak-js automatically implements PKCE

**Scopes**: 
- openid (required for ID token)
- profile (user name, picture, etc.)
- email (user email address)

**Token Endpoint Auth Method**: none (public client, no secret)

---

### Client 2: Backend API

**Client ID**: `cloud-flight-simulator-backend`

**Type**: Confidential (has client secret)

**Protocol**: openid-connect

**Access Type**: confidential

**Service Account**: ENABLED (for admin operations, if needed)

**Valid Redirect URIs**:
```
(None — backend does NOT participate in OAuth flow)
```

**Client Secret**: 
```
Environment variable: KEYCLOAK_CLIENT_SECRET
Never commit to git
Rotate quarterly
```

**Token Endpoint Auth Method**: client_secret_basic

**Scopes**:
- openid (for token validation)

**Permissions**: 
- Can validate tokens issued to any client
- Can query user realm roles via admin API (if needed)

**Note**: Backend validates tokens issued to frontend clients. It does NOT exchange codes or issue tokens.

---

## ROLES CONFIGURATION

### Realm Roles

All roles defined at realm level (not client level).

#### Role 1: learner

**Description**: Cloud Flight Simulator learner

**Composite**: NO

**Usage**:
- Default role assigned to all new users
- Grants access to challenge endpoints
- Grants access to own progress/stats
- Cannot access admin or audit endpoints

**Assigned to**: All new users (default)

#### Role 2: admin

**Description**: Cloud Flight Simulator administrator

**Composite**: NO

**Usage**:
- Grants access to admin dashboard
- Can view all users' progress
- Can view audit events (read-only)
- Cannot modify system configuration

**Assigned to**: Manual assignment only via Keycloak Admin Console

#### Role 3: platform_admin

**Description**: Cloud Flight Simulator platform administrator

**Composite**: NO (can be composite of admin + learner if needed)

**Usage**:
- Grants access to system configuration
- Can manage identity providers
- Can manage realm roles
- Can view and manage all audit events
- Can access platform-level traces and monitoring

**Assigned to**: Manual assignment only via Keycloak Admin Console

---

## IDENTITY PROVIDERS CONFIGURATION

### Identity Provider 1: Keycloak Native (Email/Password)

**Provider Name**: `keycloak`

**Alias**: `email`

**Display Name**: `Email and Password`

**Enabled**: YES

**Store Tokens**: NO (unnecessary)

**Prompt User to Create Account**: YES (self-registration enabled)

**User Registration**: ENABLED (self-service signup available)

**Email Verification**: OPTIONAL (configurable per deployment)

**Password Policy**:
```
Minimum length: 12 characters
Required character types:
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*)
```

**Mapper for JWT**:
- Claim name: `identity_provider`
- Claim value: `email`
- Added to: ID Token, Access Token

---

### Identity Provider 2: Google OAuth

**Provider Name**: `google`

**Display Name**: `Login with Google`

**Enabled**: YES (production), OPTIONAL (dev/staging)

**Provider URL**: `https://accounts.google.com`

**Client ID**: (from Google Cloud Console)

**Client Secret**: (from Google Cloud Console, stored in secret manager)

**Scope**: `openid email profile`

**User Mapping**:
- Email → Keycloak email (unique identifier)
- Name → Keycloak full name
- Picture → Keycloak avatar (optional)

**Link Existing Accounts**: NO (create new Keycloak user)

**Mapper for JWT**:
- Claim name: `identity_provider`
- Claim value: `google`
- Added to: ID Token

**Setup Instructions**:
1. Go to Google Cloud Console
2. Create OAuth 2.0 Web Application credential
3. Authorized redirect URIs: `https://keycloak.cloud-flight-simulator.com/auth/realms/cloud-flight-simulator/broker/google/endpoint`
4. Copy Client ID and Secret to Keycloak

---

### Identity Provider 3: Microsoft Azure AD

**Provider Name**: `microsoft`

**Display Name**: `Login with Microsoft`

**Enabled**: YES (production), OPTIONAL (dev/staging)

**Provider URL**: `https://login.microsoftonline.com`

**Tenant ID**: (if organization-specific; use `common` for any Azure AD account)

**Client ID**: (from Azure Portal)

**Client Secret**: (from Azure Portal)

**Scope**: `openid email profile`

**User Mapping**:
- Email → Keycloak email (unique identifier)
- Name → Keycloak full name

**Mapper for JWT**:
- Claim name: `identity_provider`
- Claim value: `microsoft`
- Added to: ID Token

**Setup Instructions**:
1. Go to Azure Portal
2. Create App Registration
3. Add Web Platform → Redirect URI: `https://keycloak.cloud-flight-simulator.com/auth/realms/cloud-flight-simulator/broker/microsoft/endpoint`
4. Create Client Secret
5. Copy Application ID and Secret to Keycloak

---

## TOKEN CONFIGURATION

### Access Token

**Token Type**: JWT (RS256)

**Lifetime**: 60 minutes

**Issued By**: Keycloak

**Used For**: API authorization

**Storage**:
- Frontend: Memory only (lost on page refresh)
- Backend: Not stored (validated on each request)

**Payload Claims**:
```json
{
  "sub": "user-uuid-from-keycloak",
  "iss": "https://keycloak.cloud-flight-simulator.com/auth/realms/cloud-flight-simulator",
  "aud": ["cloud-flight-simulator-backend", "account"],
  "exp": 1719070800,
  "iat": 1719066400,
  "email": "user@example.com",
  "name": "User Name",
  "realm_access": {
    "roles": ["learner"]
  },
  "identity_provider": "email"
}
```

**Signing Algorithm**: RS256 (public key available via JWKS endpoint)

**Key Rotation**: Automatic (Keycloak handles)

---

### ID Token

**Token Type**: JWT (RS256)

**Lifetime**: 60 minutes (same as access token)

**Issued By**: Keycloak

**Used For**: User information (not API calls)

**Storage**:
- Frontend: Memory only (optional, for debugging)
- Backend: Not used

**Payload Claims**:
```json
{
  "sub": "user-uuid",
  "iss": "https://keycloak.cloud-flight-simulator.com/auth/realms/cloud-flight-simulator",
  "aud": "cloud-flight-simulator-web",
  "exp": 1719070800,
  "iat": 1719066400,
  "email": "user@example.com",
  "email_verified": true,
  "name": "User Name",
  "preferred_username": "user@example.com"
}
```

---

### Refresh Token

**Token Type**: Opaque (not JWT)

**Lifetime**: 7 days

**Issued By**: Keycloak

**Used For**: Obtaining new access token without re-authenticating

**Storage**:
- Frontend: **HttpOnly Secure Cookie** (production) OR **NOT STORED** (development alternative)
- Backend: Not stored

**Management**:
- keycloak-js automatically manages refresh token lifecycle
- Automatic refresh when access token expires
- Revoked on logout
- Revoked after 7 days of inactivity (configurable)

**Refresh Token Rotation**: ENABLED (old token invalidated after use)

---

### Session Configuration

**SSO Session Idle Timeout**: 30 minutes

**SSO Session Max Lifespan**: 7 days

**Offline Session Idle Timeout**: 30 days

**Offline Session Max Lifespan**: 60 days

**Access Token Lifespan**: 60 minutes

**Access Token Lifespan For Implicit Flow**: 15 minutes

**Refresh Token Max Reuse**: 0 (unlimited reuse, rotation enabled)

---

## OIDC ENDPOINTS

### OpenID Connect Discovery

**Endpoint**: `https://keycloak.cloud-flight-simulator.com/auth/realms/cloud-flight-simulator/.well-known/openid-configuration`

**Purpose**: Publish realm configuration (clients, public keys, endpoints)

**Usage**: keycloak-js uses this to autodiscover endpoints

**Contains**:
- `issuer`: Keycloak realm URL
- `authorization_endpoint`: OIDC authorize URL
- `token_endpoint`: Token endpoint
- `userinfo_endpoint`: User info endpoint
- `jwks_uri`: Public keys endpoint
- `end_session_endpoint`: Logout endpoint
- `scopes_supported`: Available scopes
- `grant_types_supported`: OIDC flows supported

---

### JWKS Endpoint

**Endpoint**: `https://keycloak.cloud-flight-simulator.com/auth/realms/cloud-flight-simulator/protocol/openid-connect/certs`

**Purpose**: Publish public signing keys

**Usage**: Backend fetches and caches keys for JWT validation

**Response Format**:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-id-123",
      "use": "sig",
      "alg": "RS256",
      "n": "modulus...",
      "e": "AQAB"
    }
  ]
}
```

**Caching**:
- Backend caches JWKS for 24 hours
- Automatic refresh if key not found
- Graceful fallback to stale cache if fetch fails

---

### Token Endpoint

**Endpoint**: `https://keycloak.cloud-flight-simulator.com/auth/realms/cloud-flight-simulator/protocol/openid-connect/token`

**HTTP Method**: POST

**Used By**: 
- keycloak-js (exchange code for tokens)
- keycloak-js (refresh access token)

**Grant Types Supported**:
- `authorization_code` (OIDC flow with PKCE)
- `refresh_token` (refresh access token)
- `client_credentials` (backend service-to-service, if needed)

**PKCE Required**: YES for public clients (frontend)

**PKCE Required**: NO for confidential clients (backend)

---

### Logout Endpoint

**Endpoint**: `https://keycloak.cloud-flight-simulator.com/auth/realms/cloud-flight-simulator/protocol/openid-connect/logout`

**HTTP Method**: POST or GET with redirect

**Purpose**: Revoke user session and tokens

**Usage**: keycloak.logout() in frontend

---

## DEVELOPMENT ENVIRONMENT SETUP

### Docker Compose

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
    ports:
      - "8081:8080"
    command: start-dev
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - keycloak_db:/var/lib/postgresql/data

volumes:
  keycloak_db:
```

### Initial Setup Script

```bash
#!/bin/bash

# Start Keycloak
docker-compose up -d keycloak

# Wait for startup
sleep 10

# Login to admin console
# URL: http://localhost:8081
# Username: admin
# Password: admin

# Create realm: cloud-flight-simulator
# Create clients: cloud-flight-simulator-web, cloud-flight-simulator-backend
# Create roles: learner, admin, platform_admin
# Create identity providers: email, google (optional), microsoft (optional)
# Create test user: testuser@example.com / password123

echo "Keycloak is ready at http://localhost:8081"
```

---

## PRODUCTION DEPLOYMENT

### High Availability Setup

**Recommendation**: Deploy Keycloak in HA mode (2+ instances) with external PostgreSQL

**Load Balancer**: 
- AWS ALB or nginx
- SSL/TLS termination
- Sticky sessions (session affinity)

**Database**:
- Managed PostgreSQL (RDS, Cloud SQL)
- Automated backups
- Read replicas for scaling

**Caching**:
- Distributed cache (Infinispan) for clustering
- JWKS cache in backend (24h TTL)

### Environment Variables

**Development**:
```
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=cloud-flight-simulator
KEYCLOAK_CLIENT_ID=cloud-flight-simulator-backend
KEYCLOAK_CLIENT_SECRET=dev-secret-12345
```

**Staging**:
```
KEYCLOAK_URL=https://keycloak-staging.cloud-flight-simulator.com
KEYCLOAK_REALM=cloud-flight-simulator
KEYCLOAK_CLIENT_ID=cloud-flight-simulator-backend
KEYCLOAK_CLIENT_SECRET=(from secret manager)
```

**Production**:
```
KEYCLOAK_URL=https://keycloak.cloud-flight-simulator.com
KEYCLOAK_REALM=cloud-flight-simulator
KEYCLOAK_CLIENT_ID=cloud-flight-simulator-backend
KEYCLOAK_CLIENT_SECRET=(from secret manager)
```

---

## SECURITY CHECKLIST

- [ ] HTTPS/TLS enabled for all endpoints
- [ ] Keycloak admin console access restricted (VPN/firewall)
- [ ] Client secrets stored in secret manager (not git)
- [ ] PKCE enabled for public clients
- [ ] Email verification enabled (production)
- [ ] Password policy enforced
- [ ] Session timeouts configured
- [ ] Key rotation enabled
- [ ] Audit logs enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled (if available)
- [ ] Admin realm roles restricted to admins only

---

## MAINTENANCE

### Key Rotation

**Automatic**: Keycloak handles key rotation automatically

**Manual trigger**: Admin console → Realm Settings → Keys tab

**Impact**: No downtime (new key published immediately, old keys kept for 7 days)

### User Management

**Self-Registration**: Available at Keycloak login page

**Admin User Creation**: Keycloak Admin Console → Users → Create

**Bulk Import**: Keycloak API or UI

**Password Reset**: User-initiated via "Forgot Password" link

### Monitoring

**Log Aggregation**: Send Keycloak logs to ELK/CloudWatch

**Metrics**: Prometheus endpoint at `/metrics`

**Health Check**: GET `/health` endpoint

**JWKS Fetch Failures**: Alert if JWKS endpoint returns error

---

## STATUS

✅ Realm configuration complete  
✅ Clients configured  
✅ Roles defined  
✅ Identity providers specified  
✅ Token lifetimes set  
✅ OIDC endpoints documented  
✅ Development setup provided  
✅ Production guidelines included  

**Awaiting approval before Keycloak deployment**
