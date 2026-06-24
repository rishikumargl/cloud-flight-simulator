# GCP Configuration Setup

## ⚠️ Security Notice

**Your service account key was exposed in the repository and has been removed.** You must:
1. **Rotate the exposed key in GCP immediately** — delete the old key, create a new one
2. Never commit service account keys to version control
3. Always use environment variables to reference local secret files

---

## Setup Instructions

### 1. Download GCP Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Find the `cloud-simulator` service account
4. **Delete** the exposed key (labeled with today's date if recently rotated)
5. Click **Create Key** → **JSON**
6. Save the file as `gcp-service-account.json` in a **local directory outside the repo**

Example:
```bash
# Linux/Mac
~/secrets/gcp-service-account.json

# Windows
C:\Users\YourUsername\secrets\gcp-service-account.json
```

### 2. Set Environment Variable

Create or update your `.env` file in the `backend/` directory:

```bash
GCP_KEY_PATH=/path/to/your/gcp-service-account.json
GCP_PROJECT_ID=cloud-flight-sim
```

**Using the example paths above:**

**Linux/Mac:**
```bash
GCP_KEY_PATH=~/secrets/gcp-service-account.json
```

**Windows (Git Bash):**
```bash
GCP_KEY_PATH=/c/Users/YourUsername/secrets/gcp-service-account.json
```

### 3. Verify Setup

Run the backend and check for errors:

```bash
cd backend/
python -m uvicorn app.main:app --reload
```

If configured correctly, you should see:
```
INFO:     Application startup complete
```

If the key is missing, you'll see a clear error:
```
GCP_KEY_PATH environment variable must be set to a valid service account key file.
```

---

## What Was Fixed

| Issue | Solution |
|-------|----------|
| Exposed private key in repo | Removed `backend/secrets/` directory and added to `.gitignore` |
| Hardcoded key path | Changed to require `GCP_KEY_PATH` environment variable |
| Unclear error messages | Improved error handling in `ChallengeService` |
| Missing setup guide | Created this document + `.env.example` |

---

## Next Steps

- [ ] Rotate the service account key in GCP
- [ ] Download the new key to a local directory outside the repo
- [ ] Set `GCP_KEY_PATH` in your `.env` file
- [ ] Test the backend with `POST /challenges/start`
- [ ] Never commit `.env` or service account keys to git
