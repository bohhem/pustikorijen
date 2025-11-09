# Pustikorijen

> **Connecting families across generations and borders**

Pustikorijen (meaning "roots" in Bosnian/Serbian/Croatian) is a family genealogy platform designed to help families worldwide preserve their heritage through collaborative family trees, stories, and cultural preservation.

## 🌳 Project Vision

A platform where families can:
- Build and maintain collaborative family trees
- Connect with relatives across the globe
- Preserve family stories and cultural heritage
- Bridge the gap between diaspora and homeland
- Discover older ancestors and expand their family history

## ✨ Key Features

### **✅ Implemented Features**
- **🏘️ Family Branches** - Create and manage family branches with geographic disambiguation
- **👥 Member Management** - Guru-based governance with role promotion system 🆕
- **🏢 Business Addresses** - Store multiple labeled branch addresses and pick a current one 🆕
- **🌳 Interactive Family Tree** - Visual tree with zoom, pan, and generation filtering
- **💑 Partnership Visualization** - See marriages and relationships in the tree 🆕
- **👤 Person Profiles** - Detailed person pages with life information and family connections
- **🌍 Multilingual** - Full support for Bosnian, English, and German 🆕
- **🔐 Privacy Controls** - Public, family-only, and private visibility levels
- **📊 Generation Tracking** - Automatic generation calculation and grouping

### **⏳ Planned Features**
- **📖 Stories & Memories** - Share family recipes, photos, and cultural traditions
- **⚖️ Dispute Resolution** - Three-tier process for resolving conflicting information
- **🌱 Tree Evolution** - Family trees can grow upward as older ancestors are discovered
- **🔍 Advanced Search** - Find relatives and discover connections
- **📤 Data Export** - GEDCOM export for genealogy software compatibility

## 🚀 Quick Start

**Live Demo:** https://pustikorijen.vibengin.com

To run locally, see [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

```bash
# Clone repository
git clone https://github.com/bohhem/pustikorijen.git
cd pustikorijen

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development services
docker-compose -f docker/docker-compose.dev.yml up -d

# Run migrations and seed
cd backend
npm run db:migrate
npm run db:seed

# Start dev servers
npm run dev  # backend
npm run dev  # frontend (separate terminal)
```

## 📚 Documentation

- **[Project Status (STATUS.md)](STATUS.md)** - Current implementation status and progress 🆕
- **[Quick Start Guide](QUICKSTART.md)** - Get started quickly
- **[CI/CD Setup Guide](docs/CICD_SETUP.md)** - Automated deployment and DevOps 🆕
- **[Multilingual Support](docs/MULTILINGUAL_SUPPORT.md)** - i18n implementation guide 🆕
- **[Implementation Roadmap](docs/08-implementation-roadmap.md)** - Detailed task breakdown
- **[Technical Architecture](docs/07-technical-architecture.md)** - System design and tech stack
- **[Full Documentation](docs/README.md)** - Complete documentation index

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js 20 + Express + TypeScript + Prisma
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Storage:** S3-compatible (MinIO)
- **DevOps:** Docker, GitHub Actions, Automated CI/CD 🆕

## 🚀 CI/CD & DevOps 🆕

**Fully automated deployment pipeline:**
- ✅ **Continuous Integration** - Automated testing, linting, and builds
- ✅ **Continuous Deployment** - Auto-deploy to production on merge to main
- ✅ **Security Scanning** - CodeQL analysis for vulnerabilities
- ✅ **Dependency Updates** - Automated Dependabot PRs
- ✅ **Docker Support** - Containerized builds and deployments
- ✅ **Health Checks** - Automated post-deployment verification

**Workflows:**
- `ci.yml` - Run tests and builds on every push/PR
- `deploy.yml` - Auto-deploy to production (main branch)
- `codeql.yml` - Weekly security scans
- `pr-checks.yml` - PR validation and quality checks
- `docker-build.yml` - Build and push Docker images

See [CI/CD Setup Guide](docs/CICD_SETUP.md) for complete configuration details.

## 🤝 Contributing

We welcome contributions! Please see our [contribution guidelines](CONTRIBUTING.md) (coming soon).

**How to contribute:**
1. Check [GitHub Projects](https://github.com/bohhem/pustikorijen/projects) for available tasks
2. Pick an issue from the "Ready" column
3. Comment on the issue to get assigned
4. Create a feature branch
5. Submit a pull request

**Good first issues:** Look for issues labeled `good first issue`

## 📋 Project Status

**Current Phase:** Phase 3 - Family Tree & Features (In Progress)
**Version:** v0.3.0-alpha
**Live Site:** https://pustikorijen.vibengin.com

**Progress:**
- ✅ Project Setup (100%)
- ✅ Authentication (100%)
- ✅ Family Branches (95%)
- ✅ Person Management (85%)
- ✅ Family Tree Visualization (80%)
- ✅ Multilingual Support (100%) 🆕
- ✅ Member Management (100%) 🆕

See [STATUS.md](STATUS.md) for detailed progress and feature list.

## 🎯 Roadmap

**Phase 0: Project Setup** (Week 1)
- Development environment
- Project structure
- Database schema

**Phase 1: Authentication** (Week 2)
- User registration & login
- Email verification
- Password reset

**Phase 2: Family Branches** (Week 3)
- Branch creation
- Join requests
- Branch management

**Phase 3: Family Tree** (Week 4-5)
- Person management
- Interactive tree visualization
- Relationship linking

**Phase 4-7:** Stories, Disputes, Root Changes, Testing (Week 6-10)

See [full roadmap](docs/08-implementation-roadmap.md) for details.

## 📖 Key Concepts

### Family Branch
A distinct family lineage identified by geographic origin and surname.
- Format: `FB-{CITY}-{SURNAME}-{SEQ}`
- Example: `FB-SA-HODZIC-001` (Sarajevo Hodžić family, branch 1)

### Family Guru
Guardian/administrator of a family branch (1-3 per branch) responsible for:
- Approving changes
- Resolving disputes
- Maintaining data quality

### Tree Evolution
Family trees can grow upward when older ancestors are discovered, with automatic generation recalculation while preserving all data integrity.

## 🌐 Multilingual Support ✅

**Fully Implemented** with react-i18next:
- 🇧🇦 **Bosnian** (default) - Bosanski
- 🇬🇧 **English** - English
- 🇩🇪 **German** - Deutsch

All 13 pages and 260+ UI elements support language switching with persistent preference.

## 📄 License

[License to be determined]

## 👥 Team

**Maintainer:** [To be added]

## 🔗 Links

- **GitHub:** [github.com/bohhem/pustikorijen](https://github.com/bohhem/pustikorijen)
- **Projects Board:** [View Progress](https://github.com/bohhem/pustikorijen/projects)
- **Documentation:** [docs/](docs/)
- **Issues:** [Report a bug or request a feature](https://github.com/bohhem/pustikorijen/issues)

## 💬 Support

- **Documentation:** Check the [docs](docs/) folder
- **Questions:** Create a [GitHub Discussion](https://github.com/bohhem/pustikorijen/discussions)
- **Bugs:** Report via [GitHub Issues](https://github.com/bohhem/pustikorijen/issues)

---

**Made with ❤️ for Bosnian families worldwide**

*Connecting roots, bridging distances, preserving heritage*
