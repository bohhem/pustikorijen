# GitHub Secrets Setup Guide

Complete guide for configuring GitHub repository secrets to enable automated deployment.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Required Secrets](#required-secrets)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [SSH Key Generation](#ssh-key-generation)
5. [Testing the Configuration](#testing-the-configuration)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

GitHub Secrets are encrypted environment variables that allow your workflows to securely access sensitive information like SSH keys, API tokens, and server credentials.

**Why we need secrets:**
- 🔐 Secure SSH connection to production server
- 🚀 Automated deployment without manual intervention
- 🛡️ Keep credentials out of source code
- 🔒 Encrypted by GitHub, only accessible during workflow runs

---

## Required Secrets

Your deployment workflow needs **5 secrets** (3 required, 2 optional):

| Secret Name | Required | Purpose | Example Value |
|-------------|----------|---------|---------------|
| `PRODUCTION_HOST` | ✅ Yes | Server hostname or IP | `vibengin.com` or `192.168.1.100` |
| `PRODUCTION_USER` | ✅ Yes | SSH username | `bohhem` |
| `PRODUCTION_SSH_KEY` | ✅ Yes | Private SSH key for authentication | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_SSH_PORT` | ⚪ Optional | SSH port (defaults to 22) | `22` or `2222` |
| `PRODUCTION_PROJECT_PATH` | ⚪ Optional | Full path to project | `/home/bohhem/projects/pustikorijen` |

---

## Step-by-Step Setup

### Method 1: Using GitHub Web Interface (Recommended for Beginners)

#### **Step 1: Access Repository Settings**

1. Go to your repository: https://github.com/bohhem/pustikorijen
2. Click **"Settings"** tab (top right)
3. In left sidebar, expand **"Secrets and variables"**
4. Click **"Actions"**

You should see: https://github.com/bohhem/pustikorijen/settings/secrets/actions

---

#### **Step 2: Create SSH Key on Production Server**

**Connect to your production server:**
```bash
ssh bohhem@vibengin.com
```

**Generate a new SSH key pair specifically for GitHub Actions:**
```bash
# Generate ED25519 key (more secure than RSA)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# When prompted:
# - Enter file: (press Enter, uses default ~/.ssh/github_deploy)
# - Enter passphrase: (press Enter for no passphrase - required for automation)
# - Enter same passphrase again: (press Enter)
```

**Output will look like:**
```
Generating public/private ed25519 key pair.
Your identification has been saved in /home/bohhem/.ssh/github_deploy
Your public key has been saved in /home/bohhem/.ssh/github_deploy.pub
The key fingerprint is:
SHA256:abcd1234... github-actions-deploy
```

---

#### **Step 3: Add Public Key to Authorized Keys**

**On your production server:**
```bash
# Add the public key to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Set correct permissions (important for security!)
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/github_deploy
chmod 644 ~/.ssh/github_deploy.pub

# Verify it was added
tail -1 ~/.ssh/authorized_keys
```

**Expected output (should match your public key):**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... github-actions-deploy
```

---

#### **Step 4: Copy Private Key**

**Display the private key:**
```bash
cat ~/.ssh/github_deploy
```

**Output will look like this (THIS IS WHAT YOU NEED):**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBqL7x5xGkXFKvP8N/lKj3E/HJQYHp9VBk5oEzQhXK3nwAAAJgH8p6XB/Ke
lwAAAAtzc2gtZWQyNTUxOQAAACBqL7x5xGkXFKvP8N/lKj3E/HJQYHp9VBk5oEzQhXK3nw
AAAEDqV+jFQB9TbVvz3qPQx8sYZx6oPQvXK8uT7qUmL9a7rWovvHnEaRcUq8/w3+UqPcT8
clBgen1UGTmgTNCFcrefAAAAGGdpdGh1Yi1hY3Rpb25zLWRlcGxveQECAwQF
-----END OPENSSH PRIVATE KEY-----
```

**Important:**
- Copy the **ENTIRE output**, including the `-----BEGIN` and `-----END` lines
- Select all with mouse, or use: `cat ~/.ssh/github_deploy | pbcopy` (macOS) or `xclip` (Linux)

---

#### **Step 5: Add Secrets to GitHub**

Now go back to GitHub web interface:

**A. Add `PRODUCTION_HOST`:**
1. Click **"New repository secret"**
2. Name: `PRODUCTION_HOST`
3. Value: `vibengin.com` (your server hostname or IP)
4. Click **"Add secret"**

**B. Add `PRODUCTION_USER`:**
1. Click **"New repository secret"**
2. Name: `PRODUCTION_USER`
3. Value: `bohhem` (your SSH username)
4. Click **"Add secret"**

**C. Add `PRODUCTION_SSH_KEY`:**
1. Click **"New repository secret"**
2. Name: `PRODUCTION_SSH_KEY`
3. Value: Paste the **ENTIRE private key** you copied (all lines including BEGIN/END)
4. Click **"Add secret"**

**D. Add `PRODUCTION_SSH_PORT` (optional):**
1. Click **"New repository secret"**
2. Name: `PRODUCTION_SSH_PORT`
3. Value: `22` (or your custom SSH port)
4. Click **"Add secret"**

**E. Add `PRODUCTION_PROJECT_PATH` (optional):**
1. Click **"New repository secret"**
2. Name: `PRODUCTION_PROJECT_PATH`
3. Value: `/home/bohhem/projects/pustikorijen`
4. Click **"Add secret"**

---

#### **Step 6: Verify Secrets Are Set**

Go back to: https://github.com/bohhem/pustikorijen/settings/secrets/actions

You should see:
```
✅ PRODUCTION_HOST         Updated now
✅ PRODUCTION_USER         Updated now
✅ PRODUCTION_SSH_KEY      Updated now
✅ PRODUCTION_SSH_PORT     Updated now (optional)
✅ PRODUCTION_PROJECT_PATH Updated now (optional)
```

**Note:** You cannot view the secret values after creation (for security), only update/delete them.

---

### Method 2: Using GitHub CLI (For Advanced Users)

If you have [GitHub CLI](https://cli.github.com/) installed:

```bash
# Login to GitHub CLI
gh auth login

# Set secrets
gh secret set PRODUCTION_HOST -b "vibengin.com"
gh secret set PRODUCTION_USER -b "bohhem"
gh secret set PRODUCTION_SSH_KEY < ~/.ssh/github_deploy
gh secret set PRODUCTION_SSH_PORT -b "22"
gh secret set PRODUCTION_PROJECT_PATH -b "/home/bohhem/projects/pustikorijen"

# Verify
gh secret list
```

---

### Method 3: Using the Provided Helper Script

Use our automated script:

```bash
# From your local machine or production server
cd pustikorijen
./scripts/setup-github-secrets.sh
```

The script will:
1. Check if GitHub CLI is installed
2. Verify authentication
3. Prompt for each secret
4. Set them automatically
5. Confirm success

---

## SSH Key Generation

### Understanding SSH Key Types

| Type | Security | Speed | Recommended |
|------|----------|-------|-------------|
| ED25519 | ✅ High | ✅ Fast | ✅ **Best choice** |
| RSA 4096 | ✅ High | ⚠️ Slower | ✅ Good |
| RSA 2048 | ⚠️ Medium | ✅ Fast | ⚠️ OK |

### ED25519 Key (Recommended)

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
```

**Advantages:**
- Modern and secure
- Small key size
- Fast operations
- Industry standard

### RSA 4096 Key (Alternative)

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_deploy
```

**When to use:**
- Older systems that don't support ED25519
- Compliance requirements

---

## Testing the Configuration

### Test 1: Manual SSH Connection

**Before setting up secrets, test SSH works:**

```bash
# From your local machine
ssh -i ~/.ssh/github_deploy bohhem@vibengin.com

# Should connect without password
# If it asks for password, something is wrong with key setup
```

**If connection works:**
```
Welcome to Ubuntu 24.04.3 LTS
bohhem@server:~$
```

**If connection fails:**
- Check public key is in `~/.ssh/authorized_keys` on server
- Verify file permissions (chmod 600)
- Check SSH service is running: `sudo systemctl status ssh`

---

### Test 2: Test from GitHub Actions

**Create a test workflow:**

Create `.github/workflows/test-secrets.yml`:

```yaml
name: Test Secrets

on:
  workflow_dispatch: # Manual trigger only

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test SSH Connection
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          port: ${{ secrets.PRODUCTION_SSH_PORT || 22 }}
          script: |
            echo "✅ SSH connection successful!"
            echo "Connected as: $(whoami)"
            echo "Server: $(hostname)"
            echo "Working directory: $(pwd)"
            echo "Project exists: $([ -d '${{ secrets.PRODUCTION_PROJECT_PATH }}' ] && echo 'YES' || echo 'NO')"
```

**Run the test:**
1. Go to: https://github.com/bohhem/pustikorijen/actions
2. Select "Test Secrets" workflow
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow"

**Expected output:**
```
✅ SSH connection successful!
Connected as: bohhem
Server: your-server-name
Working directory: /home/bohhem
Project exists: YES
```

**After successful test, delete the test workflow file for security.**

---

### Test 3: Verify Secrets in Workflow

Check if secrets are accessible:

```yaml
- name: Check Secrets
  run: |
    echo "Host: ${{ secrets.PRODUCTION_HOST }}"
    echo "User: ${{ secrets.PRODUCTION_USER }}"
    echo "SSH Key length: ${{ length(secrets.PRODUCTION_SSH_KEY) }}"
    # Never echo the actual key value!
```

---

## Security Best Practices

### ✅ DO's

✅ **Use dedicated SSH keys for automation**
- Don't reuse your personal SSH key
- Create separate keys for GitHub Actions

✅ **Use keys without passphrases for automation**
- Passphrases require manual input
- Automation needs non-interactive keys

✅ **Limit key permissions on server**
- Set proper file permissions (600 for private keys)
- Only add to authorized_keys on production server

✅ **Rotate keys regularly**
- Generate new keys every 6-12 months
- Remove old keys from authorized_keys

✅ **Use environment protection rules**
- Require approval for production deployments
- Settings → Environments → New environment

✅ **Enable 2FA on GitHub**
- Protects against unauthorized access to secrets
- Settings → Password and authentication

✅ **Review workflow logs**
- Check deployment logs after each run
- Look for suspicious activity

---

### ❌ DON'Ts

❌ **Never commit secrets to repository**
- No private keys in code
- No passwords in .env files
- Use .gitignore properly

❌ **Never echo secrets in workflows**
```yaml
# BAD - leaks secret in logs
- run: echo "${{ secrets.PRODUCTION_SSH_KEY }}"

# GOOD - only use secrets in secure contexts
- uses: action@v1
  with:
    key: ${{ secrets.PRODUCTION_SSH_KEY }}
```

❌ **Don't use weak key types**
- No RSA 1024 (too weak)
- No DSA keys (deprecated)

❌ **Don't share keys between environments**
- Separate keys for staging/production
- Separate keys per project

❌ **Don't give keys more access than needed**
- Use separate deploy user with limited permissions
- Don't use root SSH access

---

## Advanced Configuration

### Using Deploy Keys (Repository-Specific)

For even better security, use GitHub Deploy Keys:

**On production server:**
```bash
ssh-keygen -t ed25519 -C "deploy-key" -f ~/.ssh/deploy_key
cat ~/.ssh/deploy_key.pub
```

**In GitHub:**
1. Settings → Deploy keys → Add deploy key
2. Paste public key
3. ✅ Check "Allow write access" if needed

**Benefits:**
- Repository-specific access
- Easier to revoke
- More granular control

---

### Multiple Environments

For staging and production:

```yaml
# Different secrets per environment
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY

PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY
```

**Workflow example:**
```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
```

---

## Troubleshooting

### Issue 1: "Permission denied (publickey)"

**Symptoms:**
```
Permission denied (publickey).
```

**Solutions:**
1. **Check public key is in authorized_keys:**
   ```bash
   cat ~/.ssh/authorized_keys | grep github-actions
   ```

2. **Verify file permissions:**
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/github_deploy
   ```

3. **Check SSH server allows key authentication:**
   ```bash
   sudo grep "PubkeyAuthentication" /etc/ssh/sshd_config
   # Should show: PubkeyAuthentication yes
   ```

4. **Restart SSH service:**
   ```bash
   sudo systemctl restart ssh
   ```

---

### Issue 2: "Host key verification failed"

**Symptoms:**
```
Host key verification failed.
fatal: Could not read from remote repository.
```

**Solution:**

Add `StrictHostKeyChecking` configuration in workflow:

```yaml
- name: Add server to known hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan -H ${{ secrets.PRODUCTION_HOST }} >> ~/.ssh/known_hosts
```

Or disable for automation (less secure):
```yaml
- uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.PRODUCTION_HOST }}
    username: ${{ secrets.PRODUCTION_USER }}
    key: ${{ secrets.PRODUCTION_SSH_KEY }}
    # Add this:
    script_stop: true
    command_timeout: 30m
```

---

### Issue 3: Secret Value Incorrect

**Symptoms:**
```
Error: Invalid key format
```

**Solutions:**

1. **Verify secret value was copied completely:**
   - Must include `-----BEGIN OPENSSH PRIVATE KEY-----`
   - Must include `-----END OPENSSH PRIVATE KEY-----`
   - No extra spaces or newlines

2. **Re-copy the key:**
   ```bash
   # Display key again
   cat ~/.ssh/github_deploy

   # Copy carefully, or use clipboard:
   # macOS
   cat ~/.ssh/github_deploy | pbcopy

   # Linux (requires xclip)
   cat ~/.ssh/github_deploy | xclip -selection clipboard
   ```

3. **Update secret in GitHub:**
   - Go to Settings → Secrets → Actions
   - Click on `PRODUCTION_SSH_KEY`
   - Click "Update secret"
   - Paste again

---

### Issue 4: Port Connection Failed

**Symptoms:**
```
Connection timed out
```

**Solutions:**

1. **Verify SSH port:**
   ```bash
   # Check what port SSH listens on
   sudo grep "^Port" /etc/ssh/sshd_config
   ```

2. **Update PRODUCTION_SSH_PORT secret** if different from 22

3. **Check firewall:**
   ```bash
   sudo ufw status
   # Should allow SSH port
   sudo ufw allow 22/tcp
   ```

---

### Issue 5: Project Path Not Found

**Symptoms:**
```
cd: /home/bohhem/projects/pustikorijen: No such file or directory
```

**Solutions:**

1. **Verify path exists:**
   ```bash
   ls -la /home/bohhem/projects/pustikorijen
   ```

2. **Update PRODUCTION_PROJECT_PATH secret** with correct path

3. **Create directory if needed:**
   ```bash
   mkdir -p /home/bohhem/projects/pustikorijen
   cd /home/bohhem/projects/pustikorijen
   git clone https://github.com/bohhem/pustikorijen.git .
   ```

---

### Issue 6: Workflow Can't Access Secrets

**Symptoms:**
```
Error: Secret PRODUCTION_HOST not found
```

**Solutions:**

1. **Check secret names match exactly:**
   - Secrets are case-sensitive
   - Check spelling in workflow file

2. **Verify secrets are set for the repository:**
   - Not organization-level secrets
   - Not environment-level secrets (unless using environments)

3. **Check workflow permissions:**
   - Settings → Actions → General
   - Workflow permissions should allow reading secrets

---

## Testing Checklist

Before running your first deployment, verify:

- [ ] All 5 secrets are set in GitHub
- [ ] SSH key authentication works manually
- [ ] Production server is accessible
- [ ] Project directory exists on server
- [ ] Server has git, npm, Node.js installed
- [ ] Systemd service `pustikorijen-backend` exists
- [ ] User has sudo access (for service restart)
- [ ] nginx is configured and running (for frontend)

---

## Quick Reference

### Secrets Summary

```bash
# Required
PRODUCTION_HOST="vibengin.com"
PRODUCTION_USER="bohhem"
PRODUCTION_SSH_KEY="-----BEGIN OPENSSH PRIVATE KEY----- ... -----END OPENSSH PRIVATE KEY-----"

# Optional (with defaults)
PRODUCTION_SSH_PORT="22"
PRODUCTION_PROJECT_PATH="/home/bohhem/projects/pustikorijen"
```

### Common Commands

```bash
# Generate key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy

# Add to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Display private key (for GitHub secret)
cat ~/.ssh/github_deploy

# Test SSH connection
ssh -i ~/.ssh/github_deploy bohhem@vibengin.com

# Set secret with GitHub CLI
gh secret set PRODUCTION_HOST -b "vibengin.com"
```

---

## Additional Resources

- **GitHub Secrets Documentation:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **SSH Key Generation Guide:** https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- **GitHub Actions Security:** https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
- **Our CI/CD Guide:** [CICD_SETUP.md](./CICD_SETUP.md)

---

**Last Updated:** 2025-11-09
**Status:** ✅ Complete and tested
