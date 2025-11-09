# GitHub Configuration

This directory contains GitHub-specific configuration files for CI/CD, automation, and project management.

## 📁 Contents

### Workflows (`.github/workflows/`)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main/develop | Run tests, linting, and build |
| `deploy.yml` | Push to main | Deploy to production server |
| `codeql.yml` | Push/PR/Schedule | Security code scanning |
| `pr-checks.yml` | Pull request | PR validation and checks |
| `docker-build.yml` | Push/Tag | Build and push Docker images |

### Dependabot (`dependabot.yml`)

Automated dependency updates for:
- npm packages (root, backend, frontend)
- GitHub Actions versions

Runs weekly on Monday mornings.

## 🚀 Quick Start

### 1. Configure Deployment Secrets

Run the setup helper:
```bash
./scripts/setup-github-secrets.sh
```

Or set manually in GitHub:
- Settings → Secrets and Variables → Actions

Required secrets:
- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_SSH_PORT` (optional)
- `PRODUCTION_PROJECT_PATH` (optional)

### 2. Enable Workflows

Workflows are enabled by default. View status at:
```
https://github.com/YOUR_USERNAME/pustikorijen/actions
```

### 3. Deploy

Push to main branch:
```bash
git push origin main
```

Or trigger manually in GitHub Actions UI.

## 📚 Documentation

Full CI/CD documentation: [docs/CICD_SETUP.md](../docs/CICD_SETUP.md)

## 🔐 Security

- CodeQL scans run on every push/PR and weekly
- Dependabot checks for vulnerable dependencies
- PR checks validate dependencies before merge
- All secrets are encrypted by GitHub

## 🐛 Troubleshooting

**Workflow failed?**
1. Check logs in Actions tab
2. Verify secrets are set correctly
3. Check production server access
4. Review deployment logs

**Need help?**
- See [docs/CICD_SETUP.md](../docs/CICD_SETUP.md)
- Check workflow comments for details
