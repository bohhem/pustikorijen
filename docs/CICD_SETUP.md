# CI/CD Setup Guide

This document explains the complete CI/CD (Continuous Integration / Continuous Deployment) setup for the Pustikorijen project.

## Overview

The project uses **GitHub Actions** for all CI/CD workflows, providing automated testing, security scanning, and deployment to production.

---

## 🔄 Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**What it does:**
```
✅ Lint code (ESLint)
✅ Build backend (TypeScript compilation)
✅ Build frontend (Vite build)
✅ Run backend tests (with PostgreSQL & Redis)
✅ Run frontend tests (Vitest)
✅ Upload code coverage to Codecov
```

**Services used:**
- PostgreSQL 15 (for integration tests)
- Redis 7 (for cache tests)

---

### 2. Deployment Workflow (`deploy.yml`)

**Triggers:**
- Push to `main` branch (automatic)
- Manual dispatch (via GitHub UI)

**What it does:**
```
1. 🔨 Build backend and frontend
2. 📦 Deploy to production server via SSH
3. 🗄️  Run database migrations
4. 🔄 Restart backend service
5. 🏥 Health check verification
6. 📢 Notify success/failure
```

**Required Secrets:**
- `PRODUCTION_HOST` - Server hostname (e.g., vibengin.com)
- `PRODUCTION_USER` - SSH username (e.g., bohhem)
- `PRODUCTION_SSH_KEY` - Private SSH key for authentication
- `PRODUCTION_SSH_PORT` - SSH port (default: 22)
- `PRODUCTION_PROJECT_PATH` - Project path on server (default: /home/bohhem/projects/pustikorijen)

---

### 3. CodeQL Security Analysis (`codeql.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Weekly schedule (Monday 6:00 AM UTC)

**What it does:**
```
🔍 Scans code for security vulnerabilities
🛡️ Detects common security issues
📊 Reports findings in GitHub Security tab
```

**Coverage:**
- JavaScript/TypeScript code analysis
- Security-extended queries
- Quality checks

---

### 4. Pull Request Checks (`pr-checks.yml`)

**Triggers:**
- Pull request opened/updated

**What it does:**
```
✅ Validates PR title format (conventional commits)
📏 Checks PR size (warns if >500 lines)
🔍 Reviews dependencies for security issues
⚡ Runs Lighthouse performance tests
```

**PR Title Format:**
```
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code refactoring
perf: performance improvement
test: test additions/updates
chore: maintenance tasks
ci: CI/CD changes
```

---

### 5. Docker Build (`docker-build.yml`)

**Triggers:**
- Push to `main` or `develop`
- Version tags (v*.*.*)
- Pull requests

**What it does:**
```
🐳 Builds Docker images for backend & frontend
📦 Pushes to GitHub Container Registry (ghcr.io)
🏷️  Tags images appropriately
💾 Caches layers for faster builds
```

**Image Tags:**
- `main` - Latest main branch
- `develop` - Latest develop branch
- `v1.2.3` - Version tags
- `main-abc1234` - Commit SHA

---

## 🤖 Dependabot Configuration

**Location:** `.github/dependabot.yml`

**What it does:**
- 🔄 Automatically updates npm dependencies
- 📅 Runs weekly on Monday mornings
- 📦 Separate updates for root, backend, frontend
- 🔧 Updates GitHub Actions versions
- 🚫 Ignores major version updates for critical packages

**Categories:**
- Root workspace dependencies
- Backend dependencies (excludes Prisma major updates)
- Frontend dependencies (excludes React major updates)
- GitHub Actions

---

## 🔐 Required GitHub Secrets

To enable automatic deployment, configure these secrets in GitHub:

### Repository Settings → Secrets and Variables → Actions

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `PRODUCTION_HOST` | Production server hostname | `vibengin.com` |
| `PRODUCTION_USER` | SSH username | `bohhem` |
| `PRODUCTION_SSH_KEY` | Private SSH key (full content) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_SSH_PORT` | SSH port (optional) | `22` |
| `PRODUCTION_PROJECT_PATH` | Project directory on server | `/home/bohhem/projects/pustikorijen` |

### Setting Up SSH Key

**On your production server:**

```bash
# Generate SSH key pair (if not exists)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Add public key to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Display private key (copy this to GitHub secrets)
cat ~/.ssh/github_deploy
```

**In GitHub:**
1. Go to Settings → Secrets and Variables → Actions
2. Click "New repository secret"
3. Name: `PRODUCTION_SSH_KEY`
4. Value: Paste the entire private key content
5. Click "Add secret"

---

## 🚀 Deployment Process

### Automatic Deployment

When you push to `main`:

```bash
git push origin main
```

**What happens:**
1. ✅ CI workflow runs (lint, build, test)
2. ✅ If CI passes, deployment workflow starts
3. 📦 Code is built locally in GitHub Actions
4. 🔐 SSH connection to production server
5. 📥 Git pull latest changes
6. 🔨 Build backend and frontend on server
7. 🗄️  Run database migrations
8. 🔄 Restart backend systemd service
9. 🏥 Health check verification
10. ✅ Deployment complete!

### Manual Deployment

**Via GitHub UI:**
1. Go to Actions tab
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow" button

**Via GitHub CLI:**
```bash
gh workflow run deploy.yml
```

---

## 🏗️ Docker Deployment (Alternative)

If you prefer containerized deployment:

### Build Images Locally

```bash
# Backend
docker build -t pustikorijen-backend:latest ./backend

# Frontend
docker build -t pustikorijen-frontend:latest ./frontend
```

### Pull from GitHub Container Registry

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull images
docker pull ghcr.io/YOUR_USERNAME/pustikorijen/backend:main
docker pull ghcr.io/YOUR_USERNAME/pustikorijen/frontend:main
```

### Run Containers

```bash
# Backend
docker run -d \
  --name pustikorijen-backend \
  -p 5000:5000 \
  --env-file .env.production \
  ghcr.io/YOUR_USERNAME/pustikorijen/backend:main

# Frontend
docker run -d \
  --name pustikorijen-frontend \
  -p 3000:80 \
  ghcr.io/YOUR_USERNAME/pustikorijen/frontend:main
```

---

## 📊 Monitoring & Logs

### GitHub Actions Logs

View workflow runs:
```
https://github.com/YOUR_USERNAME/pustikorijen/actions
```

### Production Server Logs

**Backend service logs:**
```bash
# Real-time logs
sudo journalctl -u pustikorijen-backend -f

# Last 100 lines
sudo journalctl -u pustikorijen-backend -n 100

# Errors only
sudo journalctl -u pustikorijen-backend | grep -i error
```

**Or use helper script:**
```bash
./scripts/logs-prod.sh
```

---

## 🐛 Troubleshooting

### Deployment Fails

**Check deployment logs:**
1. Go to GitHub Actions
2. Click on failed deployment
3. Expand "Deploy to Production Server" step

**Common issues:**

**SSH Connection Failed:**
```
Solution: Verify PRODUCTION_SSH_KEY secret is correct
```

**Service Failed to Start:**
```bash
# On production server
sudo journalctl -u pustikorijen-backend -n 50
sudo systemctl status pustikorijen-backend
```

**Health Check Failed:**
```bash
# Check if backend is responding
curl https://api-pustikorijen.vibengin.com/health

# Check nginx configuration
sudo nginx -t
```

### Build Fails

**Backend build errors:**
```bash
# Check TypeScript errors
cd backend
npm run build
```

**Frontend build errors:**
```bash
# Check Vite build
cd frontend
npm run build
```

### Rollback Deployment

**Automatic backups are created:**
```bash
# On production server
ls -lh ~/backups/

# Restore from backup
cd /home/bohhem/projects/pustikorijen
tar -xzf ~/backups/pustikorijen_YYYYMMDD_HHMMSS.tar.gz
sudo systemctl restart pustikorijen-backend
```

---

## 🔧 Advanced Configuration

### Custom Deployment Script

Modify deployment in `.github/workflows/deploy.yml`:

```yaml
- name: Deploy to Production Server
  uses: appleboy/ssh-action@v1.0.3
  with:
    script: |
      # Add your custom deployment steps here
```

### Environment-Specific Builds

Create separate workflows for staging:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [develop]
```

### Notifications

Add Slack/Discord notifications:

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Deployment completed! 🚀"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📈 Best Practices

✅ **Always run CI before deployment** - CI must pass for deployment to start

✅ **Use feature branches** - Develop on feature branches, merge to main when ready

✅ **Review PRs** - All changes should go through pull request review

✅ **Monitor deployments** - Check GitHub Actions after each deployment

✅ **Test locally first** - Always test changes locally before pushing

✅ **Keep secrets secure** - Never commit secrets to repository

✅ **Review Dependabot PRs** - Check automated dependency updates weekly

✅ **Monitor security alerts** - Review CodeQL findings regularly

---

## 🔗 Useful Links

- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **Workflow Runs:** https://github.com/YOUR_USERNAME/pustikorijen/actions
- **Security Alerts:** https://github.com/YOUR_USERNAME/pustikorijen/security
- **Production Frontend:** https://pustikorijen.vibengin.com
- **Production API:** https://api-pustikorijen.vibengin.com

---

## 📝 Changelog

### Version 1.0.0 - 2025-11-09
- ✅ Initial CI/CD setup
- ✅ Automated deployment workflow
- ✅ CodeQL security scanning
- ✅ Dependabot configuration
- ✅ Docker build workflow
- ✅ PR checks and validation

---

**Last Updated:** 2025-11-09
**Status:** ✅ Fully Configured
