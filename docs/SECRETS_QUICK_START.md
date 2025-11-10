# GitHub Secrets Quick Start

**🎯 Goal:** Configure 5 secrets to enable automated deployment

**⏱️ Time:** 10-15 minutes

---

## Visual Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  https://github.com/bohhem/pustikorijen                     │
│                                                              │
│  Settings → Secrets and variables → Actions                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 🔐 Repository Secrets                              │    │
│  │                                                     │    │
│  │ ✅ PRODUCTION_HOST          vibengin.com          │    │
│  │ ✅ PRODUCTION_USER          bohhem                │    │
│  │ ✅ PRODUCTION_SSH_KEY       -----BEGIN KEY-----   │    │
│  │ ✅ PRODUCTION_SSH_PORT      22                    │    │
│  │ ✅ PRODUCTION_PROJECT_PATH  /home/bohhem/...      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Encrypted & Secure
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Actions Runner                       │
│                 (Automated Workflow)                         │
│                                                              │
│  1. Pull latest code                                        │
│  2. Build application                                       │
│  3. SSH to production using secrets ────────┐              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                               │ SSH Connection
                                               │ (using secrets)
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Production Server (vibengin.com)                  │
│                                                              │
│  ~/.ssh/authorized_keys contains public key                 │
│                                                              │
│  /home/bohhem/projects/pustikorijen/                        │
│  ├── backend/                                               │
│  │   └── dist/  (deployed)                                 │
│  ├── frontend/                                              │
│  │   └── dist/  (deployed)                                 │
│  └── systemd service: pustikorijen-backend                  │
│                                                              │
│  🌐 https://pustikorijen.vibengin.com                       │
│  🌐 https://api-pustikorijen.vibengin.com                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3-Step Setup

### Step 1: Generate SSH Key (On Production Server)

```bash
# Connect to your server
ssh bohhem@vibengin.com

# Generate key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy
# Press Enter twice (no passphrase)

# Add public key
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Set permissions
chmod 600 ~/.ssh/authorized_keys ~/.ssh/github_deploy
```

---

### Step 2: Copy Private Key

```bash
# Display private key (copy ALL of this output)
cat ~/.ssh/github_deploy
```

**Copy everything from:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
...
...
-----END OPENSSH PRIVATE KEY-----
```

---

### Step 3: Add Secrets to GitHub

**Go to:** https://github.com/bohhem/pustikorijen/settings/secrets/actions

**Click "New repository secret" for each:**

| Name | Value | Where to get it |
|------|-------|-----------------|
| `PRODUCTION_HOST` | `vibengin.com` | Your server domain/IP |
| `PRODUCTION_USER` | `bohhem` | Your SSH username |
| `PRODUCTION_SSH_KEY` | `-----BEGIN...` | Output from Step 2 |
| `PRODUCTION_SSH_PORT` | `22` | Your SSH port (usually 22) |
| `PRODUCTION_PROJECT_PATH` | `/home/bohhem/projects/pustikorijen` | Full path to project |

---

## Verification

### Test SSH Connection

```bash
# From your local machine
ssh -i ~/.ssh/github_deploy bohhem@vibengin.com

# Should connect without password ✅
```

### Check Secrets in GitHub

All 5 secrets should show:
```
✅ PRODUCTION_HOST          Updated now
✅ PRODUCTION_USER          Updated now
✅ PRODUCTION_SSH_KEY       Updated now
✅ PRODUCTION_SSH_PORT      Updated now
✅ PRODUCTION_PROJECT_PATH  Updated now
```

---

## What Happens Next?

When you push to `main` branch:

```
1. GitHub Actions detects push
   ↓
2. Runs CI tests (lint, build, test)
   ↓
3. If tests pass, starts deployment
   ↓
4. Uses secrets to SSH into production
   ↓
5. Pulls latest code
   ↓
6. Builds backend and frontend
   ↓
7. Runs database migrations
   ↓
8. Restarts backend service
   ↓
9. Verifies health check
   ↓
10. ✅ Deployment complete!
```

**Time:** ~5 minutes, fully automated

---

## Common Issues

### "Permission denied (publickey)"

**Fix:**
```bash
# On production server
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/authorized_keys | grep github-actions
# Should show your public key
```

### "Secret not found"

**Fix:**
- Check secret names are exactly: `PRODUCTION_HOST`, `PRODUCTION_USER`, etc.
- Secrets are case-sensitive
- Re-add the secret if needed

### "Host key verification failed"

**Fix:** Already handled in workflow with `StrictHostKeyChecking=no` for automation

---

## Need More Details?

📚 **Full Guide:** [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)
- Detailed explanations
- Security best practices
- Advanced configurations
- Complete troubleshooting

📚 **CI/CD Guide:** [CICD_SETUP.md](./CICD_SETUP.md)
- All workflows explained
- Deployment process
- Monitoring and logs

---

## Support

**Questions?**
- Check [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) for detailed guide
- Check [CICD_SETUP.md](./CICD_SETUP.md) for workflow details
- Open an issue: https://github.com/bohhem/pustikorijen/issues

---

**Ready to deploy? Push to main! 🚀**

```bash
git push origin main
```

Then watch it deploy automatically at:
https://github.com/bohhem/pustikorijen/actions
