import { ThinkingLevel, Type } from '@google/genai';
import { SKILLS_CATALOG } from '../../src/shared/seedData.ts';
import type {
  AIMode,
  CareerDomainId,
  EducationEntry,
  ParsedSkill,
  ProjectEntry,
} from '../../src/shared/types.ts';
import { GEMINI_MODEL, getActiveAIMode, getGeminiClient, withGeminiTimeout } from '../gemini.ts';

export interface ParsedResumeOutput {
  name?: string;
  currentTitle?: string;
  currentDomainId: CareerDomainId;
  experienceYears?: number;
  education: EducationEntry[];
  skills: ParsedSkill[];
  certifications: string[];
  projects: ProjectEntry[];
  aiMode: AIMode;
}

const SKILL_ALIASES: Record<string, string[]> = {
  // IT
  git: ['git', 'github', 'gitlab', 'pull request', 'version control'],
  linux: ['linux', 'ubuntu', 'rhel', 'bash', 'shell scripting', 'posix', 'systemd'],
  python: ['python', 'py', 'pip', 'pytest'],
  cpp_programming: ['c++', 'cpp', 'c/c++', 'stl', 'embedded c'],
  html_css: ['html', 'html5', 'css', 'css3', 'flexbox', 'grid'],
  javascript: ['javascript', 'es6', 'es2023', 'ecmascript', 'vanilla js'],
  typescript: ['typescript', 'tsc'],
  react: ['react', 'reactjs', 'react.js', 'jsx', 'hooks'],
  mobile_dev: ['react native', 'flutter', 'ios', 'android', 'mobile app', 'expo'],
  nodejs: ['node.js', 'nodejs', 'express', 'expressjs'],
  rest_apis: ['rest api', 'restful', 'openapi', 'swagger', 'http'],
  sql: ['sql', 'cte', 'window functions', 'joins', 'relational modeling'],
  postgresql: ['postgres', 'postgresql', 'psql'],
  pandas: ['pandas', 'polars', 'dataframe'],
  data_viz: ['matplotlib', 'seaborn', 'data visualization', 'tableau', 'power bi', 'plotly', 'd3'],
  machine_learning: ['machine learning', 'supervised', 'regression', 'random forest', 'xgboost', 'scikit-learn'],
  deep_learning: ['deep learning', 'neural network', 'pytorch', 'tensorflow', 'cnn', 'transformer'],
  nlp_llms: ['nlp', 'llm', 'rag', 'generative ai', 'hugging face', 'gemini'],
  docker: ['docker', 'container', 'dockerfile'],
  kubernetes: ['kubernetes', 'k8s', 'helm'],
  cloud_aws: ['aws', 'gcp', 'cloud architecture', 'ec2', 's3', 'iam', 'lambda'],
  cicd: ['ci/cd', 'github actions', 'jenkins', 'gitlab ci'],
  networking: ['tcp/ip', 'networking', 'dns', 'tls', 'vpc', 'firewall'],
  web_security: ['owasp', 'xss', 'csrf', 'sqli', 'cybersecurity', 'web security'],
  software_testing: ['playwright', 'vitest', 'jest', 'cypress', 'qa automation', 'software testing'],

  // Medical & Healthcare
  human_anatomy: ['human anatomy', 'anatomy', 'musculoskeletal', 'neuroanatomy', 'cadaver'],
  human_physiology: ['human physiology', 'physiology', 'homeostasis', 'cardiopulmonary', 'renal', 'acid-base'],
  pharmacology: ['pharmacology', 'pharmacokinetics', 'adme', 'drug interactions', 'dosing'],
  clinical_reasoning: ['clinical reasoning', 'differential diagnosis', 'triage', 'clinical case', 'patient assessment'],
  patient_care_nursing: ['patient care', 'nursing', 'infection control', 'aseptic', 'vital signs', 'bls', 'medication safety'],
  medical_diagnostics_lab: ['diagnostic assay', 'hematology', 'microbiology', 'pcr assay', 'clinical laboratory', 'blood bank'],
  medical_imaging_basics: ['radiology', 'x-ray', 'ct scan', 'mri', 'alara', 'medical imaging'],
  rehab_kinesiology: ['kinesiology', 'physiotherapy', 'physical therapy', 'gait', 'rehabilitation', 'biomechanics'],
  epidemiology_public_health: ['epidemiology', 'public health', 'outbreak', 'prevalence', 'incidence'],
  healthcare_operations: ['hipaa', 'ehr', 'healthcare operations', 'hospital workflow', 'healthcare compliance'],

  // Mechanical Engineering
  engineering_mechanics: ['statics', 'dynamics', 'engineering mechanics', 'free-body', 'torque', 'kinematics'],
  materials_strength: ['strength of materials', 'metallurgy', 'stress-strain', 'fatigue', 'yield strength'],
  thermodynamics: ['thermodynamics', 'heat transfer', 'carnot', 'rankine', 'hvac', 'thermal'],
  cad_3d_modeling: ['3d cad', 'solidworks', 'onshape', 'autocad', 'fusion 360', 'gd&t', 'cad'],
  fea_simulation: ['fea', 'finite element', 'ansys', 'von mises', 'structural stress'],
  manufacturing_processes: ['cnc', 'injection molding', 'six sigma', 'fmea', 'dfm', 'manufacturing processes', 'spc'],
  automotive_powertrain: ['automotive', 'powertrain', 'chassis', 'ev battery', 'drivetrain'],

  // Electronics & Electrical
  circuit_analysis: ['circuit analysis', 'kirchhoff', 'thevenin', 'oscilloscope', 'rc filter', 'dc/ac'],
  digital_electronics: ['digital logic', 'fpga', 'verilog', 'vhdl', 'flip-flop', 'fsm'],
  embedded_systems: ['embedded', 'microcontroller', 'stm32', 'arm cortex', 'rtos', 'spi', 'i2c', 'uart', 'pwm'],
  pcb_design: ['pcb', 'kicad', 'altium', 'schematic capture', 'signal integrity', 'emc'],
  vlsi_design: ['vlsi', 'cmos', 'asic', 'static timing', 'gdsii', 'rtl'],
  signal_processing: ['signal processing', 'dsp', 'fourier', 'fft', 'nyquist', 'fir', 'iir'],
  power_systems: ['power electronics', 'three-phase', 'transformer', 'microgrid', 'buck/boost', 'power systems'],

  // Robotics & Automation
  sensors_actuators: ['sensors', 'actuators', 'imu', 'lidar', 'encoder', 'bldc', 'stepper', 'mechatronics'],
  control_systems: ['control systems', 'pid', 'bode', 'kalman', 'state space', 'closed-loop'],
  ros2_robotics: ['ros2', 'ros 2', 'ros', 'slam', 'nav2', 'urdf', 'tf2'],
  computer_vision_robotics: ['opencv', 'computer vision', 'camera calibration', 'object detection'],
  industrial_plc_automation: ['plc', 'scada', 'ladder logic', 'iec 61131', 'industrial automation'],

  // Civil & Architecture
  structural_analysis: ['structural analysis', 'reinforced concrete', 'steel design', 'seismic', 'bending moment'],
  geotech_surveying: ['geotechnical', 'surveying', 'soil bearing', 'grading', 'total station'],
  bim_revit: ['bim', 'revit', 'navisworks', 'clash detection'],
  architectural_design: ['architectural design', 'egress', 'ada', 'ibc', 'daylighting', 'spatial programming'],
  construction_pm: ['construction project', 'critical path', 'cpm', 'earned value', 'osha', 'rfi'],

  // Science & Research
  statistics: ['statistics', 'probability', 'hypothesis testing', 'bayes', 'p-value', 'confidence interval'],
  experimental_design: ['experimental design', 'randomized control', 'reproducibility', 'doe'],
  molecular_biotech: ['molecular biology', 'crispr', 'pcr', 'cell culture', 'biotechnology', 'protein expression'],
  analytical_chemistry: ['analytical chemistry', 'spectroscopy', 'hplc', 'nmr', 'stoichiometry', 'molarity'],
  environmental_science: ['environmental science', 'gis', 'qgis', 'pollutant', 'remediation', 'watershed'],
  materials_science_research: ['materials characterization', 'xrd', 'sem', 'crystallography', 'polymer'],

  // Business & Management
  financial_modeling: ['financial modeling', 'dcf', 'npv', 'valuation', 'cac', 'ltv', 'three-statement'],
  business_strategy: ['business analysis', 'competitive strategy', 'bpmn', 'market sizing', 'stakeholder'],
  product_management: ['product management', 'prd', 'rice', 'roadmapping', 'product discovery', 'gtm'],
  marketing_analytics: ['marketing analytics', 'seo', 'sem', 'funnel conversion', 'roas', 'retention'],
  operations_supply_chain: ['supply chain', 'operations', 'eoq', 'little\'s law', 'bottleneck', 'inventory'],
  people_hr_ops: ['human resources', 'hr', 'shrm', 'compensation', 'talent analytics', 'hiring rubric'],

  // Design & Creative
  design_foundations: ['visual hierarchy', 'typography', 'color contrast', 'wcag', 'grid system'],
  ux_research_ia: ['ux research', 'usability testing', 'information architecture', 'card sorting', 'heuristic'],
  figma_prototyping: ['figma', 'design system', 'design tokens', 'prototyping', 'auto-layout'],
  industrial_product_design: ['industrial design', 'ergonomics', 'cmf', 'human factors'],
  content_brand_strategy: ['content strategy', 'ux microcopy', 'editorial voice', 'brand strategy', 'digital media'],

  // Education & Teaching
  curriculum_instruction: ['curriculum design', 'instructional design', 'lesson planning', 'bloom taxonomy', 'syllabus'],
  classroom_pedagogy: ['pedagogy', 'classroom management', 'active learning', 'udl', 'facilitation', 'teaching'],
  educational_assessment: ['rubric design', 'learning assessment', 'formative assessment', 'summative assessment', 'grading'],

  // Finance & Accounting
  financial_accounting: ['financial accounting', 'gaap', 'ind as', 'balance sheet', 'ledger', 'reconciliation', 'ifrs'],
  taxation_audit: ['auditing', 'statutory audit', 'internal controls', 'taxation', 'gst', 'tax compliance'],
  corporate_treasury: ['corporate treasury', 'working capital', 'wacc', 'capital budgeting', 'cash forecasting'],
  wealth_portfolio_mgmt: ['portfolio management', 'asset allocation', 'sharpe ratio', 'investment analysis', 'equity research'],

  // Agriculture & Environmental Science
  agronomy_soil_science: ['agronomy', 'soil science', 'crop nutrition', 'npk', 'irrigation', 'crop rotation'],
  precision_agriculture: ['precision agriculture', 'ndvi', 'remote sensing', 'agritech', 'variable-rate'],
  climate_sustainability: ['esg', 'carbon accounting', 'scope 1', 'climate resilience', 'sustainability reporting', 'ghg'],
};

function inferDomainFromSkills(skills: ParsedSkill[], rawText: string): CareerDomainId {
  if (skills.length > 0) {
    const counts = new Map<CareerDomainId, number>();
    for (const sk of skills) {
      const def = SKILLS_CATALOG.find((c) => c.id === sk.skillId);
      if (def) {
        counts.set(def.domainId, (counts.get(def.domainId) ?? 0) + 1);
      }
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (ranked[0]) return ranked[0][0];
  }

  const low = rawText.toLowerCase();
  if (/\b(nursing|medical|clinical|pharmacology|anatomy|hospital)\b/.test(low)) return 'medical_healthcare';
  if (/\b(robotics|ros2|mechatronics|plc|autonomous)\b/.test(low)) return 'robotics_automation';
  if (/\b(mechanical|solidworks|cad|thermodynamics|cnc)\b/.test(low)) return 'mechanical_engineering';
  if (/\b(circuit|pcb|vlsi|fpga|embedded|stm32)\b/.test(low)) return 'electronics_electrical';
  if (/\b(structural|revit|bim|civil|architect|surveying)\b/.test(low)) return 'civil_architecture';
  if (/\b(curriculum|pedagogy|teacher|educator|classroom|instructional)\b/.test(low)) return 'education_teaching';
  if (/\b(accounting|auditing|chartered accountant|ind as|gaap|treasury|portfolio)\b/.test(low)) return 'finance_accounting';
  if (/\b(agronomy|soil science|crop|precision agriculture|ndvi|esg|sustainability)\b/.test(low)) return 'agriculture_environmental';
  if (/\b(chemistry|biology|pcr|spectroscopy|laboratory|research)\b/.test(low)) return 'science_research';
  if (/\b(finance|dcf|npv|product manager|marketing|supply chain)\b/.test(low)) return 'business_management';
  if (/\b(figma|ux research|typography|graphic design|industrial design)\b/.test(low)) return 'design_creative';
  return 'information_technology';
}

export function deterministicParseResume(rawText: string): ParsedResumeOutput {
  const trimmed = rawText.trim();

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const rawSkills = Array.isArray(parsed.skills) ? parsed.skills : [];
      const mappedSkills: ParsedSkill[] = [];

      for (const entry of rawSkills) {
        if (typeof entry === 'string') {
          const match = SKILLS_CATALOG.find(
            (s) => s.id === entry.toLowerCase() || s.name.toLowerCase().includes(entry.toLowerCase())
          );
          if (match) {
            mappedSkills.push({
              skillId: match.id,
              skillName: match.name,
              level: 2.5,
              confidence: 0.72,
              source: 'resume_extracted',
              evidence: 'Provided in structured JSON profile (unverified)',
            });
          }
        } else if (entry && typeof entry === 'object') {
          const obj = entry as Record<string, unknown>;
          const idOrName = String(obj.skillId ?? obj.name ?? '').toLowerCase();
          const match = SKILLS_CATALOG.find(
            (s) => s.id === idOrName || s.name.toLowerCase().includes(idOrName)
          );
          if (match) {
            mappedSkills.push({
              skillId: match.id,
              skillName: match.name,
              level: Math.min(4.5, Math.max(0, Number(obj.level ?? 2.5))),
              confidence: Math.min(0.9, Math.max(0.2, Number(obj.confidence ?? 0.75))),
              source: 'resume_extracted',
              evidence: String(obj.evidence ?? 'Structured JSON skill record'),
            });
          }
        }
      }

      if (mappedSkills.length > 0) {
        const education: EducationEntry[] = Array.isArray(parsed.education)
          ? (parsed.education as EducationEntry[])
          : [];
        return {
          name: typeof parsed.name === 'string' ? parsed.name : undefined,
          currentTitle: typeof parsed.currentTitle === 'string' ? parsed.currentTitle : undefined,
          currentDomainId: inferDomainFromSkills(mappedSkills, trimmed),
          experienceYears: typeof parsed.experienceYears === 'number' ? parsed.experienceYears : undefined,
          education,
          skills: mappedSkills,
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications.map(String) : [],
          projects: Array.isArray(parsed.projects) ? (parsed.projects as ProjectEntry[]) : [],
          aiMode: 'deterministic_fallback',
        };
      }
    } catch {
      // Fall through to plain text parser
    }
  }

  const lower = trimmed.toLowerCase();
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const skills: ParsedSkill[] = [];

  for (const skill of SKILLS_CATALOG) {
    const aliases = SKILL_ALIASES[skill.id] ?? [skill.name.toLowerCase()];
    const matchedLine = lines.find((line) => {
      const lineLow = line.toLowerCase();
      return aliases.some((alias) => {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
        return re.test(lineLow);
      });
    });

    if (matchedLine) {
      const ml = matchedLine.toLowerCase();
      // Never overclaim Level 5 from resume keywords alone — cap resume_extracted at 4.0 unless verified via Assessor
      let level = 2.5;
      let confidence = 0.72;
      if (/\b(4|5|6|7)\+?\s*year/i.test(ml) || /\b(lead|architect|principal)\b/i.test(ml)) {
        level = 4.0;
        confidence = 0.82;
      } else if (/\b(2|3)\s*year/i.test(ml) || /\b(production|built|automated|complex|designing)\b/i.test(ml)) {
        level = 3.5;
        confidence = 0.78;
      } else if (/\b(basic|intro|introductory|coursework|1\s*year|volunteer)\b/i.test(ml)) {
        level = 1.5;
        confidence = 0.62;
      }

      skills.push({
        skillId: skill.id,
        skillName: skill.name,
        level: Math.round(level * 10) / 10,
        confidence,
        source: 'resume_extracted',
        evidence: matchedLine.slice(0, 120),
      });
    }
  }

  const education: EducationEntry[] = [];
  const eduLine = lines.find((l) => /^education:/i.test(l) || /\b(B\.S\.|M\.S\.|B\.A\.|B\.B\.A\.|Ph\.D\.|MD|BSN|B\.Arch)\b/.test(l));
  if (eduLine) {
    const cleanEdu = eduLine.replace(/^education:\s*/i, '');
    const parts = cleanEdu.split(',').map((p) => p.trim());
    education.push({
      degree: parts[0]?.split(/\s+in\s+/i)[0] || 'Degree',
      field: parts[0]?.split(/\s+in\s+/i)[1] || parts[0] || 'General Studies',
      institution: parts[1] || 'Accredited Institution',
    });
  }

  const certifications: string[] = [];
  const certIdx = lines.findIndex((l) => /^certifications?/i.test(l));
  if (certIdx >= 0) {
    for (let i = certIdx + 1; i < lines.length; i++) {
      if (/^(projects?|experience|education|skills?|summary)/i.test(lines[i])) break;
      certifications.push(lines[i].replace(/^[-•*]\s*/, ''));
    }
  }

  const projects: ProjectEntry[] = [];
  const projIdx = lines.findIndex((l) => /^projects?/i.test(l));
  if (projIdx >= 0) {
    for (let i = projIdx + 1; i < lines.length; i++) {
      if (/^(certifications?|experience|education|skills?)/i.test(lines[i])) break;
      const clean = lines[i].replace(/^(\d+\.|[-•*])\s*/, '');
      const parts = clean.split(/\s+[—–-]\s+|:\s+/);
      const title = parts[0] || clean.slice(0, 48);
      const summary = parts.slice(1).join(' — ') || clean;
      const detectedSkills = skills
        .filter((s) => clean.toLowerCase().includes(s.skillId.replace('_', ' ')) || clean.toLowerCase().includes(s.skillName.split(' ')[0].toLowerCase()))
        .map((s) => s.skillId);
      projects.push({ title, summary, skills: detectedSkills });
    }
  }

  let experienceYears: number | undefined;
  const expMatch = lower.match(/(\d+)\s*\+?\s*years?\s*(?:of\s*)?experience/);
  if (expMatch) {
    experienceYears = Number(expMatch[1]);
  }

  return {
    name: lines[0] && lines[0].length < 40 && !lines[0].includes(':') ? lines[0] : undefined,
    currentDomainId: inferDomainFromSkills(skills, trimmed),
    experienceYears,
    education,
    skills,
    certifications,
    projects,
    aiMode: 'deterministic_fallback',
  };
}

function stripMarkdownJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

export async function runProfileAgent(rawText: string): Promise<ParsedResumeOutput> {
  const client = getGeminiClient();
  const mode = getActiveAIMode();
  if (!client || mode === 'deterministic_fallback') {
    return deterministicParseResume(rawText);
  }

  try {
    const validIds = SKILLS_CATALOG.map((s) => `${s.id}:${s.name}`).join(', ');
    const response = await withGeminiTimeout(
      client.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Parse this resume into structured skills mapped ONLY to valid catalog skill IDs.\n\nCatalog (id:name): ${validIds}\n\nResume:\n${rawText}`,
        config: {
          systemInstruction:
            'You are the SKILLORA Profile Agent supporting IT, Medicine, Engineering, Robotics, Civil, Science, Business, Design, Education, Finance, and Agriculture across 12 sectors. Extract skills accurately using ONLY exact catalog skill IDs. Never overclaim level 5 solely from resume text; cap unverified extracted skills at 4.0 and cite exact evidence. Return pure JSON matching the schema.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              currentTitle: { type: Type.STRING },
              experienceYears: { type: Type.NUMBER },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    degree: { type: Type.STRING },
                    field: { type: Type.STRING },
                    institution: { type: Type.STRING },
                  },
                },
              },
              skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skillId: { type: Type.STRING },
                    level: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER },
                    evidence: { type: Type.STRING },
                  },
                },
              },
              certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
            },
          },
        },
      }),
      25000
    );

    const cleanedText = stripMarkdownJsonFences(response.text ?? '{}');
    const parsed = JSON.parse(cleanedText) as {
      name?: string;
      currentTitle?: string;
      experienceYears?: number;
      education?: EducationEntry[];
      skills?: Array<{ skillId: string; level: number; confidence: number; evidence: string }>;
      certifications?: string[];
      projects?: ProjectEntry[];
    };

    const validatedSkills: ParsedSkill[] = [];
    for (const s of parsed.skills ?? []) {
      const catalog = SKILLS_CATALOG.find((c) => c.id === s.skillId);
      if (catalog) {
        validatedSkills.push({
          skillId: catalog.id,
          skillName: catalog.name,
          level: Math.min(4.0, Math.max(0, Math.round(Number(s.level) * 10) / 10)),
          confidence: Math.min(0.88, Math.max(0.15, Number(s.confidence ?? 0.76))),
          source: 'resume_extracted',
          evidence: String(s.evidence || 'Extracted by Gemini Profile Agent'),
        });
      }
    }

    if (validatedSkills.length === 0) {
      console.warn('Gemini Profile Agent returned 0 matched catalog skills; using deterministic parser.');
      return deterministicParseResume(rawText);
    }

    const fallbackParsed = deterministicParseResume(rawText);

    return {
      name: parsed.name || fallbackParsed.name,
      currentTitle: parsed.currentTitle || fallbackParsed.currentTitle,
      currentDomainId: inferDomainFromSkills(validatedSkills, rawText),
      experienceYears: parsed.experienceYears ?? fallbackParsed.experienceYears,
      education: parsed.education && parsed.education.length > 0 ? parsed.education : fallbackParsed.education,
      skills: validatedSkills,
      certifications:
        parsed.certifications && parsed.certifications.length > 0
          ? parsed.certifications
          : fallbackParsed.certifications,
      projects:
        parsed.projects && parsed.projects.length > 0 ? parsed.projects : fallbackParsed.projects,
      aiMode: 'gemini',
    };
  } catch (err) {
    console.warn('Gemini Profile Agent fallback triggered:', err instanceof Error ? err.message : err);
    return deterministicParseResume(rawText);
  }
}
