# Starting the Backend Server

The frontend is now configured to call `http://localhost:8000`, which is where the FastAPI backend should run.

## Start the Backend

Open a **new terminal** and run:

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or if using Python 3:

```bash
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
[STARTUP] Database connection OK
```

## Verify Backend is Running

Test the health endpoint:

```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "cloud-flight-simulator",
  "version": "3.0"
}
```

## Frontend Config

The frontend is now configured to call:
- `VITE_API_URL=http://localhost:8000` ✅

When you refresh the browser, it should now connect to the backend and:
1. Sync user email from Clerk JWT
2. Load progress data
3. Allow mission launches
4. Provision GCP environments

## Troubleshooting

**If you see "404 /progress/me":**
- Backend isn't running on port 8000
- Check the server output for errors
- Verify database connection works

**If you see "401 Unauthorized":**
- Frontend token isn't being sent
- Check browser DevTools → Network → request headers for `Authorization: Bearer ...`

**If you see "500 Internal Server Error":**
- Check backend logs for the actual error
- Most likely: database connection issue or missing JWT email
