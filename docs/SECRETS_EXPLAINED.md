# GitHub Secrets Explained

A visual guide explaining exactly what each secret does and why it's needed.

---

## 📋 All 5 Secrets Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    GitHub Repository Secrets                      │
│                                                                   │
│  🌐 PRODUCTION_HOST          →  Where to connect                │
│  👤 PRODUCTION_USER          →  Who to log in as                │
│  🔑 PRODUCTION_SSH_KEY       →  How to authenticate             │
│  🚪 PRODUCTION_SSH_PORT      →  Which port to use               │
│  📁 PRODUCTION_PROJECT_PATH  →  Where the code lives            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ PRODUCTION_HOST

**What it is:** Your server's address (domain name or IP address)

**Why we need it:** GitHub Actions needs to know which server to deploy to

**Examples:**
```bash
# Domain name (recommended)
PRODUCTION_HOST="vibengin.com"

# Subdomain
PRODUCTION_HOST="server.vibengin.com"

# IP address (works but less flexible)
PRODUCTION_HOST="192.168.1.100"
PRODUCTION_HOST="203.0.113.42"
```

**How it's used in workflow:**
```yaml
- name: Deploy
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.PRODUCTION_HOST }}  # ← Connects to this server
    ...
```

**Real SSH command equivalent:**
```bash
ssh bohhem@vibengin.com
#           ↑
#           This is PRODUCTION_HOST
```

**Common mistakes:**
- ❌ `http://vibengin.com` - Don't include http://
- ❌ `vibengin.com:22` - Don't include port here
- ❌ `vibengin.com/` - Don't include trailing slash
- ✅ `vibengin.com` - Just the hostname

---

## 2️⃣ PRODUCTION_USER

**What it is:** The username to log in with on your server

**Why we need it:** Linux servers require a username for SSH login

**Examples:**
```bash
# Your user account
PRODUCTION_USER="bohhem"

# Other common examples
PRODUCTION_USER="ubuntu"   # On Ubuntu servers
PRODUCTION_USER="admin"    # On some VPS providers
PRODUCTION_USER="root"     # ⚠️ Not recommended (security risk)
```

**How to find your username:**
```bash
# When logged into your server, run:
whoami
# Output: bohhem  ← This is your PRODUCTION_USER
```

**How it's used in workflow:**
```yaml
- name: Deploy
  uses: appleboy/ssh-action@v1.0.3
  with:
    username: ${{ secrets.PRODUCTION_USER }}  # ← Logs in as this user
    ...
```

**Real SSH command equivalent:**
```bash
ssh bohhem@vibengin.com
#   ↑
#   This is PRODUCTION_USER
```

**Important notes:**
- Must have permission to:
  - Access the project directory
  - Restart systemd service (needs sudo)
  - Run git, npm, node commands
- Should NOT be `root` for security reasons

---

## 3️⃣ PRODUCTION_SSH_KEY

**What it is:** A private SSH key that proves GitHub Actions is authorized

**Why we need it:** Password authentication doesn't work for automation

**What it looks like:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBqL7x5xGkXFKvP8N/lKj3E/HJQYHp9VBk5oEzQhXK3nwAAAJgH8p6XB/Ke
lwAAAAtzc2gtZWQyNTUxOQAAACBqL7x5xGkXFKvP8N/lKj3E/HJQYHp9VBk5oEzQhXK3nw
AAAEDqV+jFQB9TbVvz3qPQx8sYZx6oPQvXK8uT7qUmL9a7rWovvHnEaRcUq8/w3+UqPcT8
clBgen1UGTmgTNCFcrefAAAAGGdpdGh1Yi1hY3Rpb25zLWRlcGxveQECAwQF
-----END OPENSSH PRIVATE KEY-----
```

**How SSH keys work:**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Generate Key Pair on Production Server             │
│                                                             │
│  ssh-keygen -t ed25519                                     │
│                                                             │
│  Creates 2 files:                                          │
│  ├── github_deploy      (PRIVATE KEY - keep secret!)      │
│  └── github_deploy.pub  (PUBLIC KEY - safe to share)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├──────────────┬───────────────┐
                              ▼              ▼               ▼
        ┌───────────────────────────────┐   ┌───────────────────────────┐
        │   Public Key                  │   │   Private Key             │
        │   (github_deploy.pub)         │   │   (github_deploy)         │
        │                               │   │                           │
        │   Goes on Production Server   │   │   Goes to GitHub Secrets  │
        │   ~/.ssh/authorized_keys      │   │   PRODUCTION_SSH_KEY      │
        │                               │   │                           │
        │   ✅ Safe to see              │   │   🔒 Must keep secret     │
        └───────────────────────────────┘   └───────────────────────────┘
                    │                                    │
                    │                                    │
                    └──────────┬─────────────────────────┘
                               │
                               ▼
                    ┌────────────────────────┐
                    │  SSH Authentication    │
                    │                        │
                    │  Server checks:        │
                    │  "Does this private    │
                    │   key match any        │
                    │   public key in        │
                    │   authorized_keys?"    │
                    │                        │
                    │  ✅ YES → Allow login  │
                    │  ❌ NO  → Deny         │
                    └────────────────────────┘
```

**How to get it:**
```bash
# On production server
cat ~/.ssh/github_deploy

# Copy EVERYTHING including the BEGIN/END lines
```

**How it's used in workflow:**
```yaml
- name: Deploy
  uses: appleboy/ssh-action@v1.0.3
  with:
    key: ${{ secrets.PRODUCTION_SSH_KEY }}  # ← Authenticates with this
    ...
```

**Security notes:**
- 🔒 **Never** commit private keys to repository
- 🔒 **Never** share private keys
- ✅ Private key stays in GitHub secrets (encrypted)
- ✅ Public key goes on server (safe to see)

**Real SSH command equivalent:**
```bash
ssh -i ~/.ssh/github_deploy bohhem@vibengin.com
#       ↑
#       This is PRODUCTION_SSH_KEY
```

---

## 4️⃣ PRODUCTION_SSH_PORT

**What it is:** The port number that SSH listens on

**Why we need it:** Some servers use non-standard SSH ports for security

**Default value:**
```bash
PRODUCTION_SSH_PORT="22"  # Standard SSH port
```

**Custom port examples:**
```bash
PRODUCTION_SSH_PORT="2222"  # Common alternative
PRODUCTION_SSH_PORT="22000" # Another alternative
```

**How to check your SSH port:**
```bash
# On your production server
sudo grep "^Port" /etc/ssh/sshd_config

# Output examples:
# Port 22      ← Using default port
# Port 2222    ← Using custom port
```

**How it's used in workflow:**
```yaml
- name: Deploy
  uses: appleboy/ssh-action@v1.0.3
  with:
    port: ${{ secrets.PRODUCTION_SSH_PORT || 22 }}  # ← Uses this port
    ...
```

**Real SSH command equivalent:**
```bash
ssh -p 22 bohhem@vibengin.com
#   ↑
#   This is PRODUCTION_SSH_PORT
```

**When to change it:**
- ✅ If your server uses non-standard SSH port
- ✅ If firewall requires specific port
- ⚠️ Make sure firewall allows the port
- ⚠️ Test manually first: `ssh -p 2222 user@server`

**Most common:**
- `22` - 95% of servers use this
- `2222` - Common alternative
- Leave as `22` if unsure

---

## 5️⃣ PRODUCTION_PROJECT_PATH

**What it is:** Full path to your project directory on the production server

**Why we need it:** GitHub Actions needs to know where to deploy the code

**Examples:**
```bash
# Your current setup
PRODUCTION_PROJECT_PATH="/home/bohhem/projects/pustikorijen"

# Other common patterns
PRODUCTION_PROJECT_PATH="/var/www/pustikorijen"
PRODUCTION_PROJECT_PATH="/opt/applications/pustikorijen"
PRODUCTION_PROJECT_PATH="/home/deploy/apps/pustikorijen"
```

**How to find your path:**
```bash
# On your production server, go to project directory
cd ~/projects/pustikorijen

# Display full path
pwd
# Output: /home/bohhem/projects/pustikorijen
#         ↑ This is PRODUCTION_PROJECT_PATH
```

**How it's used in workflow:**
```yaml
script: |
  # Navigate to project
  cd ${{ secrets.PRODUCTION_PROJECT_PATH }}
  #   ↑ Changes to this directory

  # Pull latest code
  git pull origin main

  # Build and deploy
  npm run build
  ...
```

**Directory structure expected:**
```
/home/bohhem/projects/pustikorijen/
├── .git/                    # Git repository
├── backend/                 # Backend code
│   ├── dist/               # Built backend
│   ├── src/                # Source code
│   └── package.json
├── frontend/               # Frontend code
│   ├── dist/              # Built frontend
│   ├── src/               # Source code
│   └── package.json
├── node_modules/          # Dependencies
└── package.json           # Root package.json
```

**Verification:**
```bash
# On production server
ls -la /home/bohhem/projects/pustikorijen

# Should show:
# drwxr-xr-x  backend/
# drwxr-xr-x  frontend/
# drwxr-xr-x  .git/
# -rw-r--r--  package.json
# etc.
```

**Common mistakes:**
- ❌ `/home/bohhem/projects` - Missing project name
- ❌ `~/projects/pustikorijen` - Use full path, not ~
- ❌ `/home/bohhem/projects/pustikorijen/` - Don't include trailing slash
- ✅ `/home/bohhem/projects/pustikorijen` - Correct!

---

## 🔄 How All Secrets Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Runner                         │
│                                                                  │
│  "I need to deploy to production..."                            │
│                                                                  │
│  1. Where? → PRODUCTION_HOST (vibengin.com)                     │
│  2. What port? → PRODUCTION_SSH_PORT (22)                       │
│  3. As who? → PRODUCTION_USER (bohhem)                          │
│  4. How to authenticate? → PRODUCTION_SSH_KEY                   │
│  5. Where to deploy? → PRODUCTION_PROJECT_PATH                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Connects via SSH
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ssh bohhem@vibengin.com -p 22                       │
│              using private key for authentication                │
│                                                                  │
│  ✅ Connection established!                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Navigate to project
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              cd /home/bohhem/projects/pustikorijen              │
│                                                                  │
│  ✅ In project directory!                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Deploy code
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              git pull origin main                                │
│              npm run build                                       │
│              sudo systemctl restart pustikorijen-backend        │
│                                                                  │
│  ✅ Deployment complete!                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Complete Example

**Your production server details:**
```yaml
Server: vibengin.com
SSH Port: 22 (default)
Username: bohhem
Home directory: /home/bohhem
Project location: /home/bohhem/projects/pustikorijen
SSH key: Generated specifically for GitHub Actions
```

**GitHub Secrets values:**
```bash
PRODUCTION_HOST="vibengin.com"
PRODUCTION_USER="bohhem"
PRODUCTION_SSH_KEY="-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAA...
[... rest of private key ...]
-----END OPENSSH PRIVATE KEY-----"
PRODUCTION_SSH_PORT="22"
PRODUCTION_PROJECT_PATH="/home/bohhem/projects/pustikorijen"
```

**What the workflow does:**
```yaml
# Translates to this SSH command:
ssh -i <private_key> -p 22 bohhem@vibengin.com

# Once connected, runs:
cd /home/bohhem/projects/pustikorijen
git pull origin main
npm ci
npm run build
sudo systemctl restart pustikorijen-backend
```

**Equivalent manual process:**
```bash
# What you would do manually (before automation)
ssh bohhem@vibengin.com
cd /home/bohhem/projects/pustikorijen
git pull origin main
cd backend && npm run build
cd ../frontend && npm run build
sudo systemctl restart pustikorijen-backend
exit
```

---

## ✅ Verification Checklist

Before you start, verify:

**On Production Server:**
```bash
# 1. Check SSH is running
sudo systemctl status ssh
# Should show: active (running)

# 2. Check your username
whoami
# Should show: bohhem

# 3. Check project exists
ls -la /home/bohhem/projects/pustikorijen
# Should show project files

# 4. Check SSH port
sudo grep "^Port" /etc/ssh/sshd_config || echo "Using default port 22"

# 5. Check git is installed
git --version
# Should show: git version 2.x.x

# 6. Check Node.js is installed
node --version
# Should show: v20.x.x

# 7. Check systemd service exists
sudo systemctl status pustikorijen-backend
# Should show service (even if not running)
```

**Generate and Configure SSH Key:**
```bash
# 1. Generate key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy
# Press Enter twice (no passphrase)

# 2. Add public key
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# 3. Fix permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_deploy

# 4. Copy private key (for GitHub secret)
cat ~/.ssh/github_deploy
# Copy ALL output
```

**Test SSH Key Works:**
```bash
# From another terminal or local machine
ssh -i ~/.ssh/github_deploy bohhem@vibengin.com

# Should connect without asking for password
# If it asks for password, key setup failed
```

**In GitHub:**
```bash
# Go to: https://github.com/bohhem/pustikorijen/settings/secrets/actions

# Add all 5 secrets with correct values
# Verify all show green checkmark
```

---

## 🎯 Quick Decision Tree

**Not sure what values to use?**

```
Do you know your server's hostname?
├─ Yes → Use it for PRODUCTION_HOST
└─ No → Run: echo $SSH_CONNECTION | awk '{print $3}'

Do you know your username?
├─ Yes → Use it for PRODUCTION_USER
└─ No → SSH to server and run: whoami

Do you know SSH port?
├─ Yes → Use it for PRODUCTION_SSH_PORT
├─ No, using default → Use "22"
└─ Not sure → Run: sudo grep "^Port" /etc/ssh/sshd_config

Do you have SSH key?
├─ Yes → Use it for PRODUCTION_SSH_KEY
└─ No → Generate: ssh-keygen -t ed25519 -f ~/.ssh/github_deploy

Do you know project path?
├─ Yes → Use it for PRODUCTION_PROJECT_PATH
└─ No → SSH to server, cd to project, run: pwd
```

---

## 📚 Additional Resources

**Quick Setup:**
- [SECRETS_QUICK_START.md](./SECRETS_QUICK_START.md) - 10-minute setup

**Detailed Guide:**
- [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) - Complete documentation

**CI/CD Overview:**
- [CICD_SETUP.md](./CICD_SETUP.md) - Full deployment pipeline

**Helper Script:**
```bash
./scripts/setup-github-secrets.sh
```

---

## 🆘 Need Help?

**If stuck:**
1. Read [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) troubleshooting section
2. Verify each secret value individually
3. Test SSH connection manually first
4. Check server logs: `sudo journalctl -xe`
5. Open issue: https://github.com/bohhem/pustikorijen/issues

---

**Last Updated:** 2025-11-09
