import { CAREER_DOMAINS, TARGET_ROLES } from './domainsCatalog.ts';
import type {
  CareerDomainId,
  LearnerProfile,
  VerifiedSearchChannel,
} from './types.ts';

interface PortalTemplate {
  id: string;
  platform: string;
  type: 'job' | 'internship';
  titleSuffix: string;
  description: string;
  supportsDomains: CareerDomainId[] | 'all';
  buildUrl: (query: string, location: string) => string;
}

const PORTAL_TEMPLATES: PortalTemplate[] = [
  {
    id: 'portal_linkedin_jobs',
    platform: 'LinkedIn Jobs',
    type: 'job',
    titleSuffix: 'Live Role Search',
    description:
      'Official LinkedIn Jobs search filtered by your target career title and preferred location.',
    supportsDomains: 'all',
    buildUrl: (query, location) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
  },
  {
    id: 'portal_naukri_jobs',
    platform: 'Naukri.com',
    type: 'job',
    titleSuffix: 'India Roles Search',
    description:
      'Direct Naukri search for full-time openings across Indian tech, engineering, healthcare, and business employers.',
    supportsDomains: 'all',
    buildUrl: (query, location) => {
      const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const locSlug = location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `https://www.naukri.com/${slug}-jobs${locSlug ? `-in-${locSlug}` : ''}`;
    },
  },
  {
    id: 'portal_indeed_jobs',
    platform: 'Indeed India',
    type: 'job',
    titleSuffix: 'Verified Employer Listings',
    description:
      'Live Indeed India search aggregated from company career pages and verified job boards.',
    supportsDomains: 'all',
    buildUrl: (query, location) =>
      `https://in.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`,
  },
  {
    id: 'portal_wellfound_jobs',
    platform: 'Wellfound',
    type: 'job',
    titleSuffix: 'Startup & Product Roles',
    description:
      'Direct startup hiring search on Wellfound for product, AI, engineering, and design talent.',
    supportsDomains: ['information_technology', 'design_creative', 'business_management', 'robotics_automation'],
    buildUrl: (query) =>
      `https://wellfound.com/jobs?q=${encodeURIComponent(query)}`,
  },
  {
    id: 'portal_google_careers',
    platform: 'Google Careers',
    type: 'job',
    titleSuffix: 'Official Career Portal',
    description:
      'Official Google Careers search matching your role title and location preferences.',
    supportsDomains: ['information_technology', 'electronics_electrical', 'robotics_automation', 'business_management', 'design_creative'],
    buildUrl: (query, location) =>
      `https://www.google.com/about/careers/applications/jobs/results/?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
  },
  {
    id: 'portal_internshala_internships',
    platform: 'Internshala',
    type: 'internship',
    titleSuffix: 'Live Internships Search',
    description:
      'Official Internshala search for verified paid internships matching your target career and skills.',
    supportsDomains: 'all',
    buildUrl: (query) => {
      const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `https://internshala.com/internships/${slug}-internship/`;
    },
  },
  {
    id: 'portal_linkedin_internships',
    platform: 'LinkedIn Internships',
    type: 'internship',
    titleSuffix: 'Student & Trainee Internships',
    description:
      'Official LinkedIn search filtered specifically to Internship-level roles in your location.',
    supportsDomains: 'all',
    buildUrl: (query, location) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&f_E=1`,
  },
  {
    id: 'portal_unstop_internships',
    platform: 'Unstop',
    type: 'internship',
    titleSuffix: 'Campus & Hiring Challenges',
    description:
      'Live Unstop search for domain internships, hiring hackathons, and early-career tracks.',
    supportsDomains: 'all',
    buildUrl: (query) =>
      `https://unstop.com/internships?search=${encodeURIComponent(query)}`,
  },
];

export function buildVerifiedSearchChannels(profile: LearnerProfile): {
  targetRoleTitle: string;
  targetDomainId: CareerDomainId;
  targetRoleSalaryRange: string;
  preferredLocation: string;
  channels: VerifiedSearchChannel[];
  sourceNotice: string;
} {
  const role = TARGET_ROLES.find((r) => r.id === profile.targetRoleId) ?? TARGET_ROLES[0];
  const domain = CAREER_DOMAINS.find((d) => d.id === role.domainId);
  const location = (profile.preferredLocation || 'India').trim() || 'India';
  const topSkillNames = profile.skills
    .slice()
    .sort((a, b) => b.level - a.level)
    .slice(0, 2)
    .map((s) => s.skillName);

  const searchQuery =
    topSkillNames.length > 0 && role.domainId === 'information_technology'
      ? `${role.title} ${topSkillNames[0]}`
      : role.title;

  const channels: VerifiedSearchChannel[] = PORTAL_TEMPLATES.filter(
    (tpl) => tpl.supportsDomains === 'all' || tpl.supportsDomains.includes(role.domainId)
  ).map((tpl) => ({
    id: `${tpl.id}_${role.id}`,
    platform: tpl.platform,
    type: tpl.type,
    channelTitle: `${tpl.platform} · ${role.title} ${tpl.titleSuffix}`,
    description: `${tpl.description} (${domain?.shortName ?? 'Multi-sector'} · Target ${role.avgSalaryRange})`,
    searchQuery,
    locationLabel: location,
    url: tpl.buildUrl(searchQuery, location),
    supportsDomains: tpl.supportsDomains,
  }));

  return {
    targetRoleTitle: role.title,
    targetDomainId: role.domainId,
    targetRoleSalaryRange: role.avgSalaryRange,
    preferredLocation: location,
    channels,
    sourceNotice:
      'No live employer feed API is connected. SKILLORA generates verified live search links on real job & internship portals tailored to your target role, skills, and preferred location — without fabricating listings, salaries, or deadlines.',
  };
}
