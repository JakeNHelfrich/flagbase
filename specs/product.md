# Flagbase Product

## Vision

Flagbase is an open source feature flag platform built for developers who value great tooling, type safety, and deployment flexibility. We compete with Flagsmith, Unleash, and GrowthBook by offering the best developer experience in the market—particularly for TypeScript/JavaScript teams.

## Market Position

### Target Customer
- **Primary:** Developers and engineering teams who want control over their feature flag infrastructure
- **Secondary:** Startups and mid-market companies seeking cost-effective, flexible solutions
- **Model:** Developer-first / open source core with commercial offerings

### Competitive Landscape

| Competitor | Strength | Weakness | Our Advantage |
|------------|----------|----------|---------------|
| LaunchDarkly | Market leader, enterprise features | Cloud-only, expensive ($70k+ at scale) | Self-hosted option, transparent pricing |
| Flagsmith | Open source, flexible deployment | DX could be better | Superior TypeScript support, better local dev |
| Unleash | Privacy-focused, self-hosted | Complex setup | Simpler architecture, better docs |
| GrowthBook | Good A/B testing | Less focus on core flags | Better SDK ergonomics |

### Differentiation Strategy
**Best-in-class developer experience:**
- Type-safe SDKs with autocomplete for flag names
- First-class local development (offline mode, local overrides, CLI tools)
- Exceptional documentation with interactive examples
- Framework-native integrations (React hooks, Next.js support)

## Deployment Model

**Cloud + Self-hosted**
- Managed cloud service (Flagbase Cloud) for teams who want zero ops
- Self-hosted option for privacy-conscious organizations and enterprises with compliance requirements
- Same codebase, same features in both deployment modes

## MVP Feature Set

### Core Features (v1)

#### Feature Flags
- Boolean flags (on/off)
- Percentage rollouts (gradual rollout to X% of users)
- Kill switches (instant disable)

#### Targeting Rules (Basic)
- User ID targeting (specific users)
- Percentage-based targeting (random sampling)
- Simple attribute matching:
  - Country/region
  - Plan/subscription tier
  - Custom string attributes
- No complex AND/OR logic in v1 (keep it simple)

#### Environments
- Multiple environments per project (development, staging, production)
- Environment-specific flag values
- Easy environment switching

#### SDK Features
- Polling-based evaluation (configurable interval, default 30s)
- Local caching for offline resilience
- Type-safe flag access

### Out of Scope for MVP
- Real-time streaming (WebSocket/SSE) — polling is sufficient for v1
- A/B testing with statistical analysis
- Advanced targeting (segments, complex rules)
- Audit logs
- SSO/SAML
- Webhooks
- Flag scheduling

## Technical Architecture

### Tech Stack
- **Backend:** Node.js / TypeScript
- **Database:** PostgreSQL (primary), Redis (caching)
- **API:** REST + optional GraphQL
- **SDKs:** TypeScript-first

### SDK Priority (v1)
1. **JavaScript/TypeScript (Browser)** — React hooks, vanilla JS
2. **Node.js** — Server-side evaluation
3. **React** — Native hooks (`useFlag`, `useFlags`)

### SDK Design Principles
```typescript
// Type-safe flag access with autocomplete
const showNewDashboard = flagbase.getFlag('show-new-dashboard', false);

// React hook with type inference
const { enabled, loading } = useFlag('show-new-dashboard');

// Targeting context
flagbase.identify({
  userId: 'user-123',
  attributes: {
    country: 'US',
    plan: 'pro'
  }
});
```

### Local Development
```bash
# CLI for local development
flagbase dev                    # Start local server with flag overrides
flagbase flags list             # List all flags in project
flagbase flags enable <flag>    # Override flag locally
flagbase flags disable <flag>   # Override flag locally

# Local override file (.flagbase.local.json)
{
  "overrides": {
    "show-new-dashboard": true,
    "enable-beta-features": false
  }
}
```

## Pricing Model

**Fixed Tiers (no per-seat, no usage surprises)**

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| **Free** | $0/mo | 3 projects, 50 flags, 10k evaluations/mo | Core features, 1 environment |
| **Pro** | $49/mo | Unlimited projects/flags, 1M evaluations/mo | Multiple environments, API access |
| **Team** | $149/mo | Unlimited evaluations | Team collaboration, audit logs |
| **Enterprise** | Custom | Unlimited + SLA | SSO, dedicated support, SLA |

**Self-hosted:** Free forever (open source), optional paid support/enterprise features.

## Success Metrics

### Developer Experience
- Time to first flag evaluation < 5 minutes
- SDK bundle size < 5KB gzipped
- Documentation satisfaction score > 4.5/5

### Product
- GitHub stars (awareness)
- Weekly active projects (engagement)
- Evaluation volume (usage)
- Cloud conversion rate (revenue)

## Roadmap

### Phase 1: MVP (v0.1)
- [ ] Core flag evaluation engine
- [ ] Basic targeting rules
- [ ] JavaScript/TypeScript SDK
- [ ] React SDK
- [ ] Node.js SDK
- [ ] Web dashboard (basic)
- [ ] CLI tool
- [ ] Local development mode
- [ ] Documentation site

### Phase 2: Growth (v0.2)
- [ ] Real-time flag updates (WebSocket)
- [ ] Advanced targeting (segments, AND/OR rules)
- [ ] Flag scheduling
- [ ] Audit logs
- [ ] Team collaboration features

### Phase 3: Enterprise (v1.0)
- [ ] SSO/SAML
- [ ] A/B testing with analytics
- [ ] Webhooks
- [ ] API rate limiting
- [ ] Enterprise support SLA

## Open Source Strategy

### License
- **Core:** MIT or Apache 2.0 (true open source)
- **Enterprise features:** Commercial license

### Community
- Public GitHub repository
- Discord community for support
- Contributing guidelines
- RFC process for major features

---

## Appendix: Competitor Research Sources

- [Flagsmith: LaunchDarkly Alternatives](https://www.flagsmith.com/blog/launchdarkly-alternatives)
- [Unleash: Feature Flag Tools Comparison](https://www.getunleash.io/blog/feature-flag-tools-which-should-you-use-with-pricing)
- [Statsig: Feature Flag Platform Costs](https://www.statsig.com/blog/comparing-feature-flag-platform-costs)
- [GrowthBook: Feature Flag Best Practices](https://blog.growthbook.io/what-are-feature-flags/)
