# Keycloak Setup Guide

**Target**: Get Keycloak running locally in under 10 minutes  
**Prerequisite**: Docker and Docker Compose installed

---

## QUICK START (10 minutes)

### Step 1: Create docker-compose.yml (1 min)

Create file: `docker-compose.keycloak.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - keycloak_db:/var/lib/postgresql/data
    ports:
      - "5432:5432"

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

volumes:
  keycloak_db:
```

### Step 2: Start Keycloak (2 min)

```bash
cd /path/to/cloud-flight-simulator
docker-compose -f docker-compose.keycloak.yml up -d
```

Wait for startup:
```bash
docker-compose -f docker-compose.keycloak.yml logs keycloak | grep "Keycloak.*started"
```

### Step 3: Access Admin Console (1 min)

URL: `http://localhost:8081`

Login:
- Username: `admin`
- Password: `admin`

### Step 4: Create Realm (2 min)

1. Click "Keycloak" logo → click dropdown "Master"
2. Click "Create Realm"
3. Name: `cloud-flight-simulator`
4. Click "Create"

### Step 5: Create Frontend Client (2 min)

1. Left menu → "Clients"
2. Click "Create client"
3. Client ID: `cloud-flight-simulator-web`
4. Client type: `OpenID Connect`
5. Click "Next"
6. "Client authentication": OFF (public client)
7. "Authorization": OFF
8. Click "Next"
9. "Root URL": `http://localhost:3000`
10. "Valid redirect URIs": `http://localhost:3000/auth/callback`
11. "Valid post logout redirect URIs": `http://localhost:3000`
12. "Web origins": `http://localhost:3000`
13. Click "Save"
14. Tab "Advanced" → "Proof Key for Public OAuth 2.0 Authorization Code Flow": ON
15. Click "Save"

### Step 6: Create Backend Client (2 min)

1. "Clients" → "Create client"
2. Client ID: `cloud-flight-simulator-backend`
3. Client type: `OpenID Connect`
4. Click "Next"
5. "Client authentication": ON
6. "Authorization": OFF
7. Click "Next"
8. Leave URLs blank (backend doesn't handle callbacks)
9. Click "Save"
10. Tab "Credentials" → Copy "Client secret"
11. Save to `.env.local`:
```
KEYCLOAK_CLIENT_SECRET=<paste-secret-here>
```

### Step 7: Create Roles (2 min)

1. Left menu → "Realm roles"
2. Click "Create role"
3. Role name: `learner`
4. Click "Save"
5. Repeat for:
   - `admin`
   - `platform_admin`

### Step 8: Create Test Users (2 min)

#### Test User 1: Learner

1. Left menu → "Users"
2. Click "Create user"
3. Username: `learner@example.com`
4. Email: `learner@example.com`
5. First name: `Learner`
6. Last name: `User`
7. Click "Create"
8. Tab "Credentials" → "Set password": `password123`
9. Temporary: OFF
10. Tab "Role mappings" → "learner": Add
11. Click "Save"

#### Test User 2: Admin

1. "Create user"
2. Username: `admin@example.com`
3. Email: `admin@example.com`
4. First name: `Admin`
5. Last name: `User`
6. Click "Create"
7. Tab "Credentials" → "Set password": `password123`
8. Temporary: OFF
9. Tab "Role mappings" → "admin": Add
10. Click "Save"

### Step 9: Verify OIDC Endpoints (1 min)

```bash
# OpenID Configuration Discovery
curl http://localhost:8081/auth/realms/cloud-flight-simulator/.well-known/openid-configuration

# JWKS (public keys)
curl http://localhost:8081/auth/realms/cloud-flight-simulator/protocol/openid-connect/certs
```

Both should return JSON without errors.

### Step 10: Environment Variables (1 min)

Create `backend/.env.local`:
```
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=cloud-flight-simulator
KEYCLOAK_CLIENT_ID=cloud-flight-simulator-backend
KEYCLOAK_CLIENT_SECRET=<from-step-6>
```

Create `frontend/.env.local`:
```
REACT_APP_KEYCLOAK_URL=http://localhost:8081
REACT_APP_KEYCLOAK_REALM=cloud-flight-simulator
REACT_APP_KEYCLOAK_CLIENT_ID=cloud-flight-simulator-web
REACT_APP_API_URL=http://localhost:8000
```

---

## DONE ✅

Keycloak is now running with:
- Realm: `cloud-flight-simulator`
- Frontend client: `cloud-flight-simulator-web`
- Backend client: `cloud-flight-simulator-backend`
- Roles: `learner`, `admin`, `platform_admin`
- Test users: `learner@example.com`, `admin@example.com`

---

## VERIFICATION

### Test Login Flow

1. Start Keycloak (if not running):
```bash
docker-compose -f docker-compose.keycloak.yml up
```

2. Start backend (in separate terminal):
```bash
cd backend
python -m uvicorn app.main:app --reload
```

3. Start frontend (in separate terminal):
```bash
cd frontend
npm start
```

4. Open browser: `http://localhost:3000`

5. Click "Login with Keycloak"

6. Enter credentials:
   - Email: `learner@example.com`
   - Password: `password123`

7. Should see dashboard

---

## TROUBLESHOOTING

### Keycloak won't start

```bash
# Check logs
docker-compose -f docker-compose.keycloak.yml logs keycloak

# Ensure port 8081 is free
lsof -i :8081

# Restart
docker-compose -f docker-compose.keycloak.yml restart
```

### OIDC endpoints return 404

Verify realm name is exactly `cloud-flight-simulator` (case-sensitive)

```bash
curl http://localhost:8081/auth/realms/cloud-flight-simulator/.well-known/openid-configuration
```

### Client secret not found

Log in to admin console:
- Click realm → Clients → `cloud-flight-simulator-backend`
- Tab "Credentials"
- Copy secret again

### Password validation error

Ensure password meets Keycloak requirements:
- At least 8 characters (configurable)
- Or set "Forget temporary password": OFF after creation

### CORS errors in browser

Check frontend client configuration:
- "Valid redirect URIs": includes `http://localhost:3000/auth/callback`
- "Web origins": includes `http://localhost:3000`

---

## PRODUCTION DEPLOYMENT

### For Staging/Production

Use managed Keycloak service or HA deployment:

1. **AWS Cognito**: Native authentication service (similar flow)
2. **Google Cloud Identity Platform**: Managed identity
3. **Keycloak on Kubernetes**: HA deployment (Helm chart available)
4. **Keycloak on Cloud Run**: Serverless option

For Keycloak server specifically:
- Use external PostgreSQL (RDS, Cloud SQL)
- Configure SSL/TLS
- Enable clustering (if self-hosted)
- Set strong KEYCLOAK_ADMIN_PASSWORD
- Configure backup and recovery

---

## CLEANUP

### Stop Keycloak

```bash
docker-compose -f docker-compose.keycloak.yml down
```

### Delete volumes (data loss)

```bash
docker-compose -f docker-compose.keycloak.yml down -v
```

### Stop and keep data

```bash
docker-compose -f docker-compose.keycloak.yml stop
```

Resume later:
```bash
docker-compose -f docker-compose.keycloak.yml up
```

---

## REFERENCE

### Important URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:8081` | Admin Console |
| `http://localhost:8081/auth/realms/cloud-flight-simulator/.well-known/openid-configuration` | OIDC Discovery |
| `http://localhost:8081/auth/realms/cloud-flight-simulator/protocol/openid-connect/certs` | JWKS (public keys) |
| `http://localhost:8081/auth/realms/cloud-flight-simulator/protocol/openid-connect/auth` | Authorization endpoint (used by keycloak-js) |
| `http://localhost:8081/auth/realms/cloud-flight-simulator/protocol/openid-connect/token` | Token endpoint (used by keycloak-js) |

### Test Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Learner | `learner@example.com` | `password123` | learner |
| Admin | `admin@example.com` | `password123` | admin |

### Environment Variables

**Backend**:
```
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=cloud-flight-simulator
KEYCLOAK_CLIENT_ID=cloud-flight-simulator-backend
KEYCLOAK_CLIENT_SECRET=<from-credentials-tab>
```

**Frontend**:
```
REACT_APP_KEYCLOAK_URL=http://localhost:8081
REACT_APP_KEYCLOAK_REALM=cloud-flight-simulator
REACT_APP_KEYCLOAK_CLIENT_ID=cloud-flight-simulator-web
REACT_APP_API_URL=http://localhost:8000
```

---

## NEXT STEPS

1. ✅ Keycloak running
2. Start backend server
3. Start frontend development server
4. Test login flow
5. Begin Phase 1 implementation

---

## SUPPORT

### Documentation
- [Keycloak Admin Console Docs](https://www.keycloak.org/documentation)
- [OIDC Spec](https://openid.net/connect/)
- [keycloak-js Library](https://github.com/keycloak/keycloak-js)

### Common Issues
See TROUBLESHOOTING section above

---

## CHECKLIST

- [ ] Docker and Docker Compose installed
- [ ] docker-compose.keycloak.yml created
- [ ] Keycloak started (`docker-compose up`)
- [ ] Admin console accessible (`http://localhost:8081`)
- [ ] Realm created: `cloud-flight-simulator`
- [ ] Frontend client created: `cloud-flight-simulator-web`
- [ ] Backend client created: `cloud-flight-simulator-backend`
- [ ] Roles created: learner, admin, platform_admin
- [ ] Test users created: learner@example.com, admin@example.com
- [ ] OIDC endpoints verified (curl tests pass)
- [ ] Environment variables set (.env.local files created)
- [ ] Ready for implementation

---

**Status: Ready for Phase 1 Implementation**
