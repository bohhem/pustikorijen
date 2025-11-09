#!/bin/bash
# Helper script to setup GitHub Secrets for CI/CD

set -euo pipefail

echo "=== GitHub Secrets Setup Helper ==="
echo ""
echo "This script will help you configure the required GitHub secrets"
echo "for automatic deployment to production."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    echo ""
    echo "   Or set secrets manually at:"
    echo "   https://github.com/YOUR_USERNAME/pustikorijen/settings/secrets/actions"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_example=$3

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Setting: $secret_name"
    echo "Description: $secret_description"
    echo "Example: $secret_example"
    echo ""

    read -p "Enter value (or press Enter to skip): " secret_value

    if [ -z "$secret_value" ]; then
        echo "⏭️  Skipped"
        echo ""
        return
    fi

    if gh secret set "$secret_name" -b "$secret_value"; then
        echo "✅ Secret set successfully"
    else
        echo "❌ Failed to set secret"
    fi
    echo ""
}

# Set secrets
echo "🔐 Setting up deployment secrets..."
echo ""

set_secret "PRODUCTION_HOST" \
    "Production server hostname" \
    "vibengin.com"

set_secret "PRODUCTION_USER" \
    "SSH username for deployment" \
    "bohhem"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setting: PRODUCTION_SSH_KEY"
echo "Description: Private SSH key for deployment"
echo ""
echo "⚠️  This should be the PRIVATE key (not the .pub file)"
echo ""
read -p "Enter path to SSH private key file: " key_path

if [ -f "$key_path" ]; then
    if gh secret set PRODUCTION_SSH_KEY < "$key_path"; then
        echo "✅ SSH key set successfully"
    else
        echo "❌ Failed to set SSH key"
    fi
else
    echo "❌ File not found: $key_path"
fi
echo ""

set_secret "PRODUCTION_SSH_PORT" \
    "SSH port (optional, defaults to 22)" \
    "22"

set_secret "PRODUCTION_PROJECT_PATH" \
    "Full path to project on server" \
    "/home/bohhem/projects/pustikorijen"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Secrets setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push code to trigger CI/CD: git push origin main"
echo "2. Monitor workflow: https://github.com/$REPO/actions"
echo "3. Check deployment logs if needed"
echo ""
echo "🔗 View secrets at:"
echo "https://github.com/$REPO/settings/secrets/actions"
echo ""
