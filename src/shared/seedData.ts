export { CAREER_DOMAINS, SKILLS_CATALOG, TARGET_ROLES } from './domainsCatalog.ts';
export { LEARNING_RESOURCES } from './resourcesCatalog.ts';
export {
  CODING_CHALLENGES,
  DOMAIN_PRACTICAL_TASKS,
  MEDICAL_SAFETY_DISCLAIMER,
  QUIZ_BANK,
  domainAssessmentType,
  getChallengeForSkill,
  getPracticalTaskForSkill,
  getQuizForSkill,
} from './assessmentsCatalog.ts';

import { CAREER_DOMAINS, SKILLS_CATALOG, TARGET_ROLES } from './domainsCatalog.ts';
import type { CareerDomainId, CohortLearner, RoleId } from './types.ts';

export interface SampleResumePreset {
  id: string;
  label: string;
  subtitle: string;
  domainId: CareerDomainId;
  name: string;
  email: string;
  currentTitle: string;
  currentRoleId?: RoleId;
  experienceYears: number;
  defaultTargetRole: RoleId;
  weeklyHours: number;
  educationDegree: string;
  educationField: string;
  educationInstitution: string;
  resumeText: string;
}

export const SAMPLE_RESUMES: SampleResumePreset[] = [
  {
    id: 'sample_maya_it',
    label: 'Maya Chen — Python/SQL Analyst → Full Stack',
    subtitle: 'Strong Python, SQL, Pandas & Git; missing JavaScript, React & TypeScript',
    domainId: 'information_technology',
    name: 'Maya Chen',
    email: 'maya.chen@skillora.demo',
    currentTitle: 'Junior Data & Systems Analyst',
    currentRoleId: 'data_analyst',
    experienceYears: 2,
    defaultTargetRole: 'fullstack_developer',
    weeklyHours: 12,
    educationDegree: 'B.S.',
    educationField: 'Computer Information Systems',
    educationInstitution: 'State Polytechnic University',
    resumeText: `Maya Chen
Junior Data & Systems Analyst — 2 years experience
Education: B.S. in Computer Information Systems, State Polytechnic University

Skills & Experience:
- Python Programming: 3 years building automated ETL scripts, REST data consumers, and analytics jobs.
- SQL & Relational Modeling: 3 years writing complex PostgreSQL CTEs, joins, and reporting schemas.
- Pandas: 2 years cleaning multi-table telemetry datasets in production.
- Git & Version Control: 2 years daily collaborative branching and pull requests.
- HTML5 & Modern CSS: 1 year basic internal dashboard pages.
- Linux: 1 year basic Ubuntu shell deployment scripts.

Certifications:
- Google Data Analytics Certificate
- PostgreSQL Associate Training

Projects:
- Telemetry Pipeline & KPI Reporter — Built a Python + PostgreSQL ingestion service reducing manual reporting by 6 hours/week.
- Internal Metrics Portal — Created a static HTML/CSS report viewer backed by automated SQL exports.`,
  },
  {
    id: 'sample_vikram_mech_to_robotics',
    label: 'Vikram Rao — Mechanical Eng → Robotics',
    subtitle: 'Strong Statics, CAD & Manufacturing; cross-domain transition to Robotics Engineer',
    domainId: 'mechanical_engineering',
    name: 'Vikram Rao',
    email: 'vikram.rao@skillora.demo',
    currentTitle: 'Mechanical Design Engineer',
    currentRoleId: 'mechanical_design_engineer',
    experienceYears: 3,
    defaultTargetRole: 'robotics_engineer',
    weeklyHours: 14,
    educationDegree: 'B.S.',
    educationField: 'Mechanical Engineering',
    educationInstitution: 'Institute of Engineering & Technology',
    resumeText: `Vikram Rao
Mechanical Design Engineer — 3 years experience
Education: B.S. in Mechanical Engineering, Institute of Engineering & Technology

Skills & Experience:
- Engineering Statics & Dynamics: 4 years analyzing rigid-body mechanisms, torque loads, and dynamic linkages.
- 3D CAD Modeling & GD&T: 3 years designing SolidWorks/Onshape assemblies and tolerance stack-ups in production.
- Strength of Materials & FEA Simulation: 3 years running structural stress validation on aluminum brackets.
- Manufacturing Processes: 2 years CNC fixture tooling and DFM reviews.
- Python: 1 year basic scripting for tolerance spreadsheets.

Certifications:
- Certified SolidWorks Professional (CSWP)

Projects:
- Dual-Axis Conveyor Actuator — Designed CAD housing, gearbox mount, and structural FEA validation for 45 kg payload.
- Automated Fixture Jig — Engineered machined aluminum assembly fixtures reducing cycle setup by 25%.`,
  },
  {
    id: 'sample_sofia_medical',
    label: 'Sofia Alvarez — Allied Health → Registered Nurse',
    subtitle: 'Anatomy & Lab Foundations; building Pharmacology & Simulated Clinical Reasoning',
    domainId: 'medical_healthcare',
    name: 'Sofia Alvarez',
    email: 'sofia.alvarez@skillora.demo',
    currentTitle: 'Clinical Biology & Health Sciences Graduate',
    experienceYears: 1,
    defaultTargetRole: 'registered_nurse',
    weeklyHours: 15,
    educationDegree: 'B.S.',
    educationField: 'Health & Biological Sciences',
    educationInstitution: 'Pacific Health Sciences College',
    resumeText: `Sofia Alvarez
Clinical Biology & Health Sciences Graduate — 1 year experience
Education: B.S. in Health & Biological Sciences, Pacific Health Sciences College

Skills & Experience:
- Human Anatomy & Structural Systems: 3 years university coursework and cadaver/model lab teaching assistant.
- Human Physiology & Homeostasis: 2 years studying cardiopulmonary, renal, and endocrine regulation.
- Patient Care & Clinical Safety Protocols: 1 year hospital volunteer safety rounding and infection control training.
- Clinical Laboratory & Diagnostic Assays: 1 year basic hematology and PCR sample prep.

Certifications:
- Basic Life Support (BLS) — AHA
- OSHA Bloodborne Pathogens Training

Projects:
- Outpatient Triage Checklist Study — Documented standardized intake screening flowcharts with nursing preceptors.`,
  },
  {
    id: 'sample_noah_ece',
    label: 'Noah Kim — Electrical Eng → Embedded Systems',
    subtitle: 'Strong Circuit Analysis & Digital Logic; scaling Embedded C++ & RTOS Firmware',
    domainId: 'electronics_electrical',
    name: 'Noah Kim',
    email: 'noah.kim@skillora.demo',
    currentTitle: 'Junior Hardware Test Engineer',
    currentRoleId: 'electronics_engineer',
    experienceYears: 2,
    defaultTargetRole: 'embedded_systems_engineer',
    weeklyHours: 12,
    educationDegree: 'B.S.',
    educationField: 'Electrical & Computer Engineering',
    educationInstitution: 'Midwest Technical University',
    resumeText: `Noah Kim
Junior Hardware Test Engineer — 2 years experience
Education: B.S. in Electrical & Computer Engineering, Midwest Technical University

Skills & Experience:
- DC/AC Circuit Analysis: 3 years oscilloscope bring-up, RC filtering, and mixed-signal board testing.
- Digital Logic & FPGA Design: 2 years Verilog state machines and timing verification.
- PCB Layout & Signal Integrity: 2 years KiCad 4-layer schematic capture and power routing.
- Git & Version Control: 2 years managing hardware test scripts.

Certifications:
- IPC-A-610 Electronics Assembly Standard

Projects:
- 4-Layer Sensor Data Acquisition Board — Routed mixed-signal STM32 carrier PCB with differential SPI isolation.`,
  },
  {
    id: 'sample_elena_business',
    label: 'Elena Rostova — Business Analyst → Product Manager',
    subtitle: 'Strong Business Strategy, SQL & Finance; growing UX Research & Product Roadmapping',
    domainId: 'business_management',
    name: 'Elena Rostova',
    email: 'elena.rostova@skillora.demo',
    currentTitle: 'Senior Business Analyst',
    currentRoleId: 'business_analyst',
    experienceYears: 4,
    defaultTargetRole: 'product_manager',
    weeklyHours: 10,
    educationDegree: 'B.B.A.',
    educationField: 'Business Administration & Finance',
    educationInstitution: 'Northbridge School of Business',
    resumeText: `Elena Rostova
Senior Business Analyst — 4 years experience
Education: B.B.A. in Business Administration & Finance, Northbridge School of Business

Skills & Experience:
- Business Analysis & Competitive Strategy: 4 years leading stakeholder workshops, BPMN workflows, and PRDs.
- Financial Analysis & Valuation Modeling: 3 years building ROI, CAC/LTV, and NPV business cases.
- SQL & Data Visualization: 3 years querying operational funnels and building executive KPI dashboards.
- Probability & Statistics: 2 years A/B experiment readout interpretation.

Certifications:
- Certified Business Analysis Professional (CBAP)

Projects:
- Checkout Funnel Friction Audit — Quantified ₹35L/yr drop-off recovery using SQL cohort telemetry.`,
  },
];

const SYNTHETIC_LEARNERS_BLUEPRINT: Array<{
  name: string;
  cohortName: string;
  domainId: CareerDomainId;
  roleId: RoleId;
  readinessPct: number;
  completionPct: number;
  weeklyHours: number;
  lastActiveDaysAgo: number;
  failedAssessmentsCount: number;
}> = [
  // Information Technology (4)
  { name: 'Liam Patel', cohortName: 'Full-Stack Accelerator', domainId: 'information_technology', roleId: 'fullstack_developer', readinessPct: 68, completionPct: 62, weeklyHours: 14, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Zoe Martinez', cohortName: 'Applied AI Fellowship', domainId: 'information_technology', roleId: 'ai_engineer', readinessPct: 44, completionPct: 31, weeklyHours: 8, lastActiveDaysAgo: 5, failedAssessmentsCount: 2 },
  { name: 'Caleb Brooks', cohortName: 'Cloud & Security Lab', domainId: 'information_technology', roleId: 'devops_engineer', readinessPct: 79, completionPct: 75, weeklyHours: 16, lastActiveDaysAgo: 0, failedAssessmentsCount: 0 },
  { name: 'Nadia Okafor', cohortName: 'Cloud & Security Lab', domainId: 'information_technology', roleId: 'cybersecurity_analyst', readinessPct: 39, completionPct: 24, weeklyHours: 6, lastActiveDaysAgo: 7, failedAssessmentsCount: 2 },

  // Medical & Healthcare (4)
  { name: 'Hannah Cho', cohortName: 'Health Sciences Prep', domainId: 'medical_healthcare', roleId: 'registered_nurse', readinessPct: 64, completionPct: 58, weeklyHours: 15, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Tariq Hassan', cohortName: 'Pre-Clinical Scholars', domainId: 'medical_healthcare', roleId: 'medical_doctor', readinessPct: 52, completionPct: 45, weeklyHours: 18, lastActiveDaysAgo: 2, failedAssessmentsCount: 1 },
  { name: 'Claire Bennett', cohortName: 'Health Sciences Prep', domainId: 'medical_healthcare', roleId: 'pharmacist', readinessPct: 41, completionPct: 29, weeklyHours: 9, lastActiveDaysAgo: 6, failedAssessmentsCount: 2 },
  { name: 'Devon Morales', cohortName: 'Public Health Cohort', domainId: 'medical_healthcare', roleId: 'public_health_professional', readinessPct: 74, completionPct: 70, weeklyHours: 12, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },

  // Mechanical Engineering (4)
  { name: 'Arjun Nair', cohortName: 'Mechanical CAD Studio', domainId: 'mechanical_engineering', roleId: 'mechanical_design_engineer', readinessPct: 76, completionPct: 68, weeklyHours: 12, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Megan Kowalski', cohortName: 'EV Powertrain Track', domainId: 'mechanical_engineering', roleId: 'automotive_engineer', readinessPct: 48, completionPct: 36, weeklyHours: 10, lastActiveDaysAgo: 4, failedAssessmentsCount: 1 },
  { name: 'Owen Gallagher', cohortName: 'Precision Manufacturing', domainId: 'mechanical_engineering', roleId: 'manufacturing_engineer', readinessPct: 63, completionPct: 54, weeklyHours: 11, lastActiveDaysAgo: 2, failedAssessmentsCount: 0 },
  { name: 'Priya Subramanian', cohortName: 'Mechanical CAD Studio', domainId: 'mechanical_engineering', roleId: 'thermal_engineer', readinessPct: 37, completionPct: 22, weeklyHours: 6, lastActiveDaysAgo: 8, failedAssessmentsCount: 2 },

  // Electronics & Electrical (4)
  { name: 'Ethan Park', cohortName: 'Silicon & Embedded Lab', domainId: 'electronics_electrical', roleId: 'embedded_systems_engineer', readinessPct: 72, completionPct: 65, weeklyHours: 14, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Ananya Verma', cohortName: 'Silicon & Embedded Lab', domainId: 'electronics_electrical', roleId: 'vlsi_engineer', readinessPct: 58, completionPct: 48, weeklyHours: 15, lastActiveDaysAgo: 2, failedAssessmentsCount: 1 },
  { name: 'Lucas Weber', cohortName: 'Grid & Power Systems', domainId: 'electronics_electrical', roleId: 'power_systems_engineer', readinessPct: 43, completionPct: 30, weeklyHours: 8, lastActiveDaysAgo: 5, failedAssessmentsCount: 2 },
  { name: 'Sora Takahashi', cohortName: 'Hardware PCB Studio', domainId: 'electronics_electrical', roleId: 'pcb_design_engineer', readinessPct: 81, completionPct: 78, weeklyHours: 12, lastActiveDaysAgo: 0, failedAssessmentsCount: 0 },

  // Robotics & Automation (4)
  { name: 'Vikram Rao', cohortName: 'Mechatronics Bridge', domainId: 'robotics_automation', roleId: 'robotics_engineer', readinessPct: 51, completionPct: 42, weeklyHours: 14, lastActiveDaysAgo: 1, failedAssessmentsCount: 1 },
  { name: 'Elena Novak', cohortName: 'Autonomous Navigation', domainId: 'robotics_automation', roleId: 'ros2_developer', readinessPct: 69, completionPct: 61, weeklyHours: 16, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Mateo Silva', cohortName: 'Factory Automation Lab', domainId: 'robotics_automation', roleId: 'industrial_automation_engineer', readinessPct: 42, completionPct: 28, weeklyHours: 7, lastActiveDaysAgo: 6, failedAssessmentsCount: 2 },
  { name: 'Chloe Laurent', cohortName: 'Autonomous Navigation', domainId: 'robotics_automation', roleId: 'autonomous_systems_engineer', readinessPct: 75, completionPct: 71, weeklyHours: 15, lastActiveDaysAgo: 0, failedAssessmentsCount: 0 },

  // Civil & Architecture (4)
  { name: 'Daniel Osei', cohortName: 'Structural & AEC Guild', domainId: 'civil_architecture', roleId: 'structural_engineer', readinessPct: 67, completionPct: 59, weeklyHours: 12, lastActiveDaysAgo: 2, failedAssessmentsCount: 0 },
  { name: 'Isabel Morales', cohortName: 'Digital BIM Studio', domainId: 'civil_architecture', roleId: 'bim_engineer', readinessPct: 78, completionPct: 73, weeklyHours: 11, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Ryan Fitzpatrick', cohortName: 'Capital Projects Cohort', domainId: 'civil_architecture', roleId: 'construction_project_manager', readinessPct: 46, completionPct: 35, weeklyHours: 8, lastActiveDaysAgo: 5, failedAssessmentsCount: 1 },
  { name: 'Amira Al-Mansoor', cohortName: 'Digital BIM Studio', domainId: 'civil_architecture', roleId: 'architect', readinessPct: 61, completionPct: 52, weeklyHours: 10, lastActiveDaysAgo: 2, failedAssessmentsCount: 0 },

  // Science & Research (4)
  { name: 'Dr. Nina Lindqvist', cohortName: 'Translational Biotech', domainId: 'science_research', roleId: 'biotechnologist', readinessPct: 73, completionPct: 66, weeklyHours: 12, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Samuel Adeyemi', cohortName: 'Analytical Lab Track', domainId: 'science_research', roleId: 'chemist', readinessPct: 44, completionPct: 33, weeklyHours: 8, lastActiveDaysAgo: 6, failedAssessmentsCount: 2 },
  { name: 'Grace Henderson', cohortName: 'Climate & GIS Research', domainId: 'science_research', roleId: 'environmental_scientist', readinessPct: 64, completionPct: 57, weeklyHours: 10, lastActiveDaysAgo: 2, failedAssessmentsCount: 0 },
  { name: 'Kenji Watanabe', cohortName: 'Advanced Materials Lab', domainId: 'science_research', roleId: 'materials_scientist', readinessPct: 56, completionPct: 49, weeklyHours: 12, lastActiveDaysAgo: 3, failedAssessmentsCount: 1 },

  // Business & Management (4)
  { name: 'Rachel Goldstein', cohortName: 'Product Leadership Lab', domainId: 'business_management', roleId: 'product_manager', readinessPct: 71, completionPct: 64, weeklyHours: 10, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Omar Farooq', cohortName: 'Valuation & FP&A Track', domainId: 'business_management', roleId: 'financial_analyst', readinessPct: 45, completionPct: 34, weeklyHours: 7, lastActiveDaysAgo: 5, failedAssessmentsCount: 1 },
  { name: 'Tessa Van Der Berg', cohortName: 'Supply Chain Analytics', domainId: 'business_management', roleId: 'operations_manager', readinessPct: 62, completionPct: 55, weeklyHours: 11, lastActiveDaysAgo: 2, failedAssessmentsCount: 0 },
  { name: 'Marcus Reid', cohortName: 'Strategy & Advisory', domainId: 'business_management', roleId: 'management_consultant', readinessPct: 38, completionPct: 26, weeklyHours: 6, lastActiveDaysAgo: 7, failedAssessmentsCount: 2 },

  // Design & Creative (4)
  { name: 'Freya Lindholm', cohortName: 'Product Design Studio', domainId: 'design_creative', roleId: 'ui_ux_designer', readinessPct: 80, completionPct: 76, weeklyHours: 12, lastActiveDaysAgo: 0, failedAssessmentsCount: 0 },
  { name: 'Jordan Alvarez', cohortName: 'Product Design Studio', domainId: 'design_creative', roleId: 'product_designer', readinessPct: 54, completionPct: 46, weeklyHours: 9, lastActiveDaysAgo: 3, failedAssessmentsCount: 1 },
  { name: 'Hana Suzuki', cohortName: 'Hardware Ergonomics Lab', domainId: 'design_creative', roleId: 'industrial_designer', readinessPct: 47, completionPct: 38, weeklyHours: 8, lastActiveDaysAgo: 4, failedAssessmentsCount: 1 },
  { name: 'Beatrice Vance', cohortName: 'Editorial & Brand Systems', domainId: 'design_creative', roleId: 'content_strategist', readinessPct: 69, completionPct: 60, weeklyHours: 10, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },

  // Education & Teaching (4)
  { name: 'Kavita Deshmukh', cohortName: 'STEM Pedagogy Guild', domainId: 'education_teaching', roleId: 'school_educator', readinessPct: 77, completionPct: 72, weeklyHours: 10, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'David Sterling', cohortName: 'EdTech Curriculum Lab', domainId: 'education_teaching', roleId: 'instructional_designer', readinessPct: 62, completionPct: 54, weeklyHours: 11, lastActiveDaysAgo: 2, failedAssessmentsCount: 0 },
  { name: 'Meera Krishnan', cohortName: 'Academic Leadership', domainId: 'education_teaching', roleId: 'academic_coordinator', readinessPct: 45, completionPct: 33, weeklyHours: 7, lastActiveDaysAgo: 5, failedAssessmentsCount: 1 },
  { name: 'Lucas Fernandez', cohortName: 'EdTech Curriculum Lab', domainId: 'education_teaching', roleId: 'instructional_designer', readinessPct: 71, completionPct: 66, weeklyHours: 12, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },

  // Finance & Accounting (4)
  { name: 'Rohan Malhotra', cohortName: 'Statutory Audit & Ind AS', domainId: 'finance_accounting', roleId: 'chartered_accountant_audit', readinessPct: 74, completionPct: 69, weeklyHours: 14, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Siddharth Joshi', cohortName: 'Corporate Treasury Cohort', domainId: 'finance_accounting', roleId: 'corporate_finance_associate', readinessPct: 58, completionPct: 49, weeklyHours: 12, lastActiveDaysAgo: 2, failedAssessmentsCount: 1 },
  { name: 'Claire DuPont', cohortName: 'Portfolio Risk Fellowship', domainId: 'finance_accounting', roleId: 'investment_risk_analyst', readinessPct: 42, completionPct: 30, weeklyHours: 8, lastActiveDaysAgo: 6, failedAssessmentsCount: 2 },
  { name: 'Nikhil Agarwal', cohortName: 'Statutory Audit & Ind AS', domainId: 'finance_accounting', roleId: 'chartered_accountant_audit', readinessPct: 66, completionPct: 60, weeklyHours: 11, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },

  // Agriculture & Environmental Science (4)
  { name: 'Asha Kulkarni', cohortName: 'Sustainable Agronomy Lab', domainId: 'agriculture_environmental', roleId: 'agronomist', readinessPct: 72, completionPct: 67, weeklyHours: 12, lastActiveDaysAgo: 1, failedAssessmentsCount: 0 },
  { name: 'Karan Gill', cohortName: 'Precision AgriTech Track', domainId: 'agriculture_environmental', roleId: 'precision_ag_specialist', readinessPct: 53, completionPct: 44, weeklyHours: 10, lastActiveDaysAgo: 3, failedAssessmentsCount: 1 },
  { name: 'Helena Vargas', cohortName: 'Climate & ESG Analytics', domainId: 'agriculture_environmental', roleId: 'sustainability_esg_analyst', readinessPct: 79, completionPct: 74, weeklyHours: 13, lastActiveDaysAgo: 0, failedAssessmentsCount: 0 },
  { name: 'Benny Okafor', cohortName: 'Climate & ESG Analytics', domainId: 'agriculture_environmental', roleId: 'sustainability_esg_analyst', readinessPct: 44, completionPct: 32, weeklyHours: 8, lastActiveDaysAgo: 5, failedAssessmentsCount: 1 },
];

export function generateCohortLearners(): CohortLearner[] {
  const domainNameMap = new Map(CAREER_DOMAINS.map((d) => [d.id, d.name]));
  const skillNameMap = new Map(SKILLS_CATALOG.map((s) => [s.id, s.name]));

  return SYNTHETIC_LEARNERS_BLUEPRINT.map((item, idx) => {
    const role = TARGET_ROLES.find((r) => r.id === item.roleId) ?? TARGET_ROLES[0];
    const missingSkills = role.requirements
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((req) => skillNameMap.get(req.skillId) ?? req.skillId);

    let riskLevel: CohortLearner['riskLevel'] = 'On Track';
    if (item.readinessPct < 48 || item.failedAssessmentsCount >= 2 || item.lastActiveDaysAgo >= 6) {
      riskLevel = 'At Risk';
    } else if (item.readinessPct < 65 || item.failedAssessmentsCount >= 1) {
      riskLevel = 'Watch';
    }

    return {
      id: `cohort_learner_${String(idx + 1).padStart(2, '0')}`,
      name: item.name,
      cohortName: item.cohortName,
      domainId: item.domainId,
      domainName: domainNameMap.get(item.domainId) ?? item.domainId,
      targetRoleId: role.id,
      targetRoleTitle: role.title,
      readinessPct: item.readinessPct,
      roadmapCompletionPct: item.completionPct,
      weeklyHours: item.weeklyHours,
      lastActiveDaysAgo: item.lastActiveDaysAgo,
      riskLevel,
      topBottleneckSkill: missingSkills[0] ?? 'Core Foundations',
      missingSkills,
      failedAssessmentsCount: item.failedAssessmentsCount,
    };
  });
}
