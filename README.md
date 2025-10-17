# Pustikorijen

> **Connecting Bosnian families across generations and borders**

Pustikorijen (meaning "roots" in Bosnian) is a family genealogy platform designed to connect Bosnian diaspora with their homeland through collaborative family trees, stories, and cultural preservation.

## 🌳 Project Vision

A platform where Bosnian families can:
- Build and maintain collaborative family trees
- Connect with relatives across the globe
- Preserve family stories and cultural heritage
- Bridge the gap between diaspora and homeland
- Discover older ancestors and expand their family history

## ✨ Key Features

- **🏘️ Family Branches** - Multiple families with the same surname can coexist with geographic disambiguation
- **👥 Collaborative Genealogy** - Family members work together to build accurate trees with governance and quality controls
- **🌍 Diaspora Mapping** - Visualize family migration patterns across the world
- **📖 Stories & Memories** - Share family recipes, photos, and cultural traditions
- **⚖️ Dispute Resolution** - Three-tier process for resolving conflicting information
- **🌱 Tree Evolution** - Family trees can grow upward as older ancestors are discovered
- **🔒 Privacy First** - Granular privacy controls and GDPR compliance

## 🚀 Quick Start

**Note:** Project is currently in Phase 0 (Setup). See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

```bash
# Clone repository
git clone https://github.com/[username]/pustikorijen.git
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

- **[Quick Start Guide](QUICKSTART.md)** - Get started quickly
- **[Project Status](PROJECT_STATUS.md)** - Current status and progress
- **[Implementation Roadmap](docs/08-implementation-roadmap.md)** - Detailed task breakdown
- **[Technical Architecture](docs/07-technical-architecture.md)** - System design and tech stack
- **[Full Documentation](docs/README.md)** - Complete documentation index

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js 20 + Express + TypeScript + Prisma
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Storage:** S3-compatible (MinIO)
- **DevOps:** Docker, GitHub Actions

## 🤝 Contributing

We welcome contributions! Please see our [contribution guidelines](CONTRIBUTING.md) (coming soon).

**How to contribute:**
1. Check [GitHub Projects](https://github.com/[username]/pustikorijen/projects) for available tasks
2. Pick an issue from the "Ready" column
3. Comment on the issue to get assigned
4. Create a feature branch
5. Submit a pull request

**Good first issues:** Look for issues labeled `good first issue`

## 📋 Project Status

**Current Phase:** Phase 0 - Project Setup (In Progress)

**Progress:**
- ✅ Design & Documentation (100%)
- 🚧 Project Setup (10%)
- ⏳ Authentication (0%)
- ⏳ Family Branches (0%)
- ⏳ Family Tree (0%)

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed progress.

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

## 🌐 Multilingual Support

- 🇧🇦 Bosnian/Serbian/Croatian (primary)
- 🇬🇧 English
- 🇩🇪 German (large diaspora)

## 📄 License

[License to be determined]

## 👥 Team

**Maintainer:** [To be added]

## 🔗 Links

- **GitHub:** [github.com/[username]/pustikorijen](https://github.com/[username]/pustikorijen)
- **Projects Board:** [View Progress](https://github.com/[username]/pustikorijen/projects)
- **Documentation:** [docs/](docs/)
- **Issues:** [Report a bug or request a feature](https://github.com/[username]/pustikorijen/issues)

## 💬 Support

- **Documentation:** Check the [docs](docs/) folder
- **Questions:** Create a [GitHub Discussion](https://github.com/[username]/pustikorijen/discussions)
- **Bugs:** Report via [GitHub Issues](https://github.com/[username]/pustikorijen/issues)

---

**Made with ❤️ for Bosnian families worldwide**

*Connecting roots, bridging distances, preserving heritage*
