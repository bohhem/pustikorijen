# Core Features Specification

## Phase 1 - Foundation (MVP)

### 1. Family Tree Builder

#### Visual Tree Editor
- Drag-and-drop interface for arranging family members
- Multiple layout options: vertical, horizontal, circular
- Zoom and pan capabilities
- Expandable/collapsible branches
- Print and export options (PDF, PNG)

#### Person Profiles
- **Basic Information:**
  - Full name (with Bosnian naming conventions)
  - Birth date and place
  - Death date and place (if deceased)
  - Gender
  - Profile photo

- **Extended Information:**
  - Current location
  - Occupation
  - Education
  - Life story/biography
  - Migration path
  - Contact information (private, visible to family only)

#### Relationship Connections
- Parent-child relationships
- Spouse/partner relationships
- Sibling relationships
- Adoption support
- Multiple marriages support
- Step-family relationships

#### Multi-Generation Support
- Unlimited generations
- Generation numbering (G1, G2, G3...)
- Ancestor/descendant calculations
- Common ancestor finder

### 2. User Management

#### Registration & Authentication
- Email/password registration
- Email verification required
- Password reset functionality
- Two-factor authentication (optional)
- Social login (Google, Facebook) - optional

#### User Profiles
- Personal information
- Family branch memberships
- Contribution history
- Trust level/verification status
- Privacy preferences

#### Privacy Controls
- Public/family-only profile visibility
- Living persons protection (auto-hide if < 100 years)
- Granular field-level privacy (hide specific information)
- Block specific users
- Download your data (GDPR compliance)

### 3. Search & Discovery

#### Search Functionality
- **By Name:** First name, last name, full name
- **By Surname:** Find all branches with specific surname
- **By Location:** Birth place, current location, cities
- **By Date Range:** Birth year, death year
- **By Family Branch:** Search within specific branch
- **Advanced Filters:** Combine multiple criteria

#### Browse Features
- Browse all family branches
- Browse by geographic origin
- Browse by surname alphabetically
- Recent additions
- Most complete profiles

#### Connection Suggestions
- "You might know" based on shared surnames
- Same hometown suggestions
- Same generation suggestions
- DNA matches (future phase)

### 4. Basic Location Tracking

#### Location Fields
- Birth location (city, country)
- Current location (city, country)
- Death location (if applicable)
- Significant life locations

#### Geographic Visualization
- Country flags display
- Simple migration path visualization
- Location-based grouping
- Country statistics

---

## Phase 2 - Diaspora Connection

### 5. Interactive Diaspora Map

#### World Map Visualization
- Interactive map with family locations
- Click locations to see families
- Heat map mode (concentration visualization)
- Filter by branch, generation, time period

#### Migration Timeline
- Visual timeline of family migrations
- Historical context markers (wars, events)
- Generation-by-generation movement
- Export migration stories

#### Location Statistics
- Top destination countries
- Migration patterns
- Diaspora density
- Hometown connections remaining

### 6. Stories & Memories

#### Story Creation
- Rich text editor
- Photo/video attachments
- Tag family members
- Tag locations
- Set privacy level (public/family-only)

#### Story Types
- Personal memories
- Family recipes
- Historical events
- Photo albums
- Audio recordings
- Video interviews

#### Community Interaction
- Comment system
- Reaction system (heart, thank you, etc.)
- Share stories
- Save favorites
- Report inappropriate content

#### Story Organization
- Browse by family branch
- Browse by location
- Browse by time period
- Browse by story type
- Search within stories

### 7. Multilingual Support

#### Supported Languages
- **Primary:** Bosnian/Serbian/Croatian (BSC)
- **Secondary:** English
- **Tertiary:** German (large diaspora)

#### Language Features
- Seamless language switching
- User preference saved
- Interface translation
- User-generated content translation (optional)
- Right-to-left support (future: Arabic for Gulf diaspora)

#### Cultural Localization
- Date formats
- Name formats
- Address formats
- Cultural holidays/events

---

## Phase 3 - Community Growth

### 8. Events & Reunions

#### Event Management
- Create family events
- Set location, date, time
- Public/private events
- RSVP system
- Attendee list
- Event reminders

#### Event Types
- Family reunions
- Memorial services
- Celebrations (weddings, births)
- Cultural events
- Virtual meetups

#### Event Features
- Photo album from event
- Tag attendees
- Event discussion board
- Post-event memories
- Recurring events

### 9. Document Archive

#### Document Types
- Birth certificates
- Death certificates
- Marriage certificates
- Historical photos
- Old letters
- Military records
- Immigration documents
- Newspaper clippings

#### Document Management
- Upload and storage
- OCR text extraction (searchable)
- Document categorization
- Link to relevant people
- Verification status
- Access control (privacy)

#### Archive Features
- Timeline view of documents
- Document verification system
- Community annotation
- High-resolution image viewer
- Download originals

### 10. DNA/Heritage Integration (Future)

#### DNA Features
- Upload DNA results (23andMe, AncestryDNA, etc.)
- Match with other family members
- Suggest family connections
- Ethnicity breakdown
- Haplogroup information

#### Heritage Analysis
- Geographic ancestry
- Historical migration patterns
- Genetic relatives discovery
- Privacy-first approach (opt-in only)

---

## Cross-Cutting Features

### Notifications System
- Email notifications
- In-app notifications
- Notification preferences
- Daily/weekly digest options

### Activity Feed
- Recent family tree updates
- New stories published
- New members joined
- Upcoming events
- Dispute resolutions

### Mobile Experience
- Progressive Web App (PWA)
- Mobile-responsive design
- Touch-optimized interactions
- Offline capability (view cached data)
- Mobile photo uploads

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode
- Font size adjustment

### Performance
- Fast page loads (<2 seconds)
- Optimized images
- Lazy loading
- CDN for static assets
- Caching strategy

### Security
- HTTPS everywhere
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Regular security audits

### Analytics & Insights
- Branch statistics
- Engagement metrics
- Growth trends
- Popular content
- User journey analytics
