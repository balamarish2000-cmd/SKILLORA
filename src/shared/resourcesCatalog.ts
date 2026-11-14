import { SKILLS_CATALOG } from './domainsCatalog.ts';
import type { CareerDomainId, LearningResource, ResourceDifficulty, ResourceType } from './types.ts';

type RawRes = [string, string, string, string, ResourceType, ResourceDifficulty, number];

const RAW_RESOURCES: RawRes[] = [
  // ======================== A. INFORMATION TECHNOLOGY ========================
  // git
  ['git', 'Pro Git Book (Official)', 'Git SCM', 'https://git-scm.com/book/en/v2', 'textbook', 'Beginner', 6],
  ['git', 'Learn Git Branching Interactive', 'LearnGitBranching', 'https://learngitbranching.js.org/', 'practice', 'Beginner', 3],
  ['git', 'Atlassian Git Workflows Guide', 'Atlassian', 'https://www.atlassian.com/git/tutorials/comparing-workflows', 'tutorial', 'Intermediate', 3],

  // linux
  ['linux', 'Linux Journey Interactive Modules', 'Linux Journey', 'https://linuxjourney.com/', 'course', 'Beginner', 8],
  ['linux', 'The Missing Semester: Shell & Tools', 'MIT CSAIL', 'https://missing.csail.mit.edu/', 'course', 'Intermediate', 6],
  ['linux', 'OverTheWire Bandit Wargame', 'OverTheWire', 'https://overthewire.org/wargames/bandit/', 'practice', 'Beginner', 6],

  // python
  ['python', 'The Official Python Tutorial', 'Python.org', 'https://docs.python.org/3/tutorial/', 'documentation', 'Beginner', 10],
  ['python', 'Scientific Computing with Python', 'freeCodeCamp', 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', 'course', 'Beginner', 14],
  ['python', 'Exercism Python Track', 'Exercism', 'https://exercism.org/tracks/python', 'practice', 'Intermediate', 10],

  // cpp_programming
  ['cpp_programming', 'Learn C++ Modern Language Guide', 'LearnCpp', 'https://www.learncpp.com/', 'course', 'Beginner', 16],
  ['cpp_programming', 'cppreference Standard Library Docs', 'cppreference', 'https://en.cppreference.com/w/', 'documentation', 'Intermediate', 8],
  ['cpp_programming', 'Exercism C++ Practice Track', 'Exercism', 'https://exercism.org/tracks/cpp', 'practice', 'Intermediate', 10],

  // html_css
  ['html_css', 'MDN Learn Web Development: HTML & CSS', 'MDN Web Docs', 'https://developer.mozilla.org/en-US/docs/Learn/CSS', 'documentation', 'Beginner', 10],
  ['html_css', 'Responsive Web Design Certification', 'freeCodeCamp', 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', 'course', 'Beginner', 14],
  ['html_css', 'Web Accessibility Fundamentals', 'web.dev', 'https://web.dev/learn/accessibility/', 'tutorial', 'Intermediate', 4],

  // javascript
  ['javascript', 'JavaScript.info Modern Tutorial', 'JavaScript.info', 'https://javascript.info/', 'course', 'Beginner', 16],
  ['javascript', 'MDN JavaScript Guide & Reference', 'MDN Web Docs', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'documentation', 'Beginner', 10],
  ['javascript', 'JavaScript Algorithms & Data Structures', 'freeCodeCamp', 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/', 'practice', 'Intermediate', 14],

  // typescript
  ['typescript', 'The TypeScript Handbook', 'TypeScriptLang', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'documentation', 'Intermediate', 8],
  ['typescript', 'Total TypeScript Beginners Workshop', 'Total TypeScript', 'https://www.totaltypescript.com/tutorials/beginners-typescript', 'course', 'Beginner', 6],
  ['typescript', 'Type Challenges Practice Suite', 'Type Challenges', 'https://github.com/type-challenges/type-challenges', 'practice', 'Advanced', 10],

  // react
  ['react', 'React Official Learn & Thinking in React', 'React.dev', 'https://react.dev/learn', 'documentation', 'Beginner', 12],
  ['react', 'Full Stack Open: React Fundamentals', 'University of Helsinki', 'https://fullstackopen.com/en/part1', 'course', 'Intermediate', 14],
  ['react', 'React Managing State & Reducers', 'React.dev', 'https://react.dev/learn/managing-state', 'practice', 'Intermediate', 6],

  // mobile_dev
  ['mobile_dev', 'React Native Official Core Concepts', 'React Native', 'https://reactnative.dev/docs/getting-started', 'documentation', 'Intermediate', 10],
  ['mobile_dev', 'Flutter Official Codelabs & Docs', 'Flutter / Google', 'https://docs.flutter.dev/get-started/codelab', 'tutorial', 'Beginner', 8],
  ['mobile_dev', 'Expo Universal App Tutorial', 'Expo', 'https://docs.expo.dev/tutorial/introduction/', 'practice', 'Intermediate', 8],

  // nodejs
  ['nodejs', 'Node.js Official Learn Guides', 'Node.js', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', 'documentation', 'Beginner', 8],
  ['nodejs', 'Full Stack Open: NodeJS & Express', 'University of Helsinki', 'https://fullstackopen.com/en/part3', 'course', 'Intermediate', 12],
  ['nodejs', 'Express.js Routing & Middleware Guide', 'Express', 'https://expressjs.com/en/guide/routing.html', 'tutorial', 'Beginner', 6],

  // rest_apis
  ['rest_apis', 'MDN HTTP Overview & Status Codes', 'MDN Web Docs', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', 'documentation', 'Beginner', 4],
  ['rest_apis', 'Microsoft REST API Design Guidelines', 'Microsoft Learn', 'https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design', 'tutorial', 'Intermediate', 5],
  ['rest_apis', 'OpenAPI 3.1 Specification Guide', 'Swagger / OpenAPI', 'https://swagger.io/specification/', 'documentation', 'Intermediate', 4],

  // sql
  ['sql', 'SQLBolt Interactive Lessons', 'SQLBolt', 'https://sqlbolt.com/', 'practice', 'Beginner', 5],
  ['sql', 'Mode SQL Analytics Tutorial', 'Mode', 'https://mode.com/sql-tutorial/', 'course', 'Intermediate', 10],
  ['sql', 'Select Star SQL Interactive Book', 'Select Star SQL', 'https://selectstarsql.com/', 'practice', 'Intermediate', 6],

  // postgresql
  ['postgresql', 'PostgreSQL Official Documentation', 'PostgreSQL', 'https://www.postgresql.org/docs/current/tutorial.html', 'documentation', 'Beginner', 8],
  ['postgresql', 'PostgreSQL Exercises Practice', 'PGExercises', 'https://pgexercises.com/', 'practice', 'Intermediate', 6],
  ['postgresql', 'Use The Index, Luke! SQL Performance', 'Markus Winand', 'https://use-the-index-luke.com/', 'textbook', 'Advanced', 8],

  // pandas
  ['pandas', 'Kaggle Pandas Micro-Course', 'Kaggle', 'https://www.kaggle.com/learn/pandas', 'course', 'Beginner', 5],
  ['pandas', 'Pandas 10 Minutes & User Guide', 'PyData', 'https://pandas.pydata.org/docs/user_guide/10min.html', 'documentation', 'Beginner', 4],
  ['pandas', 'Data Cleaning Kaggle Practice', 'Kaggle', 'https://www.kaggle.com/learn/data-cleaning', 'practice', 'Intermediate', 5],

  // data_viz
  ['data_viz', 'Kaggle Data Visualization Track', 'Kaggle', 'https://www.kaggle.com/learn/data-visualization', 'course', 'Beginner', 5],
  ['data_viz', 'Fundamentals of Data Visualization', 'Claus Wilke', 'https://clauswilke.com/dataviz/', 'textbook', 'Intermediate', 8],
  ['data_viz', 'Power BI Guided Learning Path', 'Microsoft Learn', 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi', 'course', 'Intermediate', 8],

  // machine_learning
  ['machine_learning', 'Google Machine Learning Crash Course', 'Google Developers', 'https://developers.google.com/machine-learning/crash-course', 'course', 'Beginner', 15],
  ['machine_learning', 'Kaggle Intro to Machine Learning', 'Kaggle', 'https://www.kaggle.com/learn/intro-to-machine-learning', 'practice', 'Beginner', 4],
  ['machine_learning', 'An Introduction to Statistical Learning', 'ISLR / Springer', 'https://www.statlearning.com/', 'textbook', 'Intermediate', 16],

  // deep_learning
  ['deep_learning', 'Practical Deep Learning for Coders', 'fast.ai', 'https://course.fast.ai/', 'course', 'Intermediate', 18],
  ['deep_learning', 'PyTorch Official 60-Minute Blitz', 'PyTorch', 'https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html', 'tutorial', 'Intermediate', 4],
  ['deep_learning', 'Dive into Deep Learning (D2L)', 'D2L.ai', 'https://d2l.ai/', 'textbook', 'Advanced', 20],

  // nlp_llms
  ['nlp_llms', 'Hugging Face NLP & LLM Course', 'Hugging Face', 'https://huggingface.co/learn/nlp-course/chapter1/1', 'course', 'Intermediate', 14],
  ['nlp_llms', 'Gemini API Structured & Tool Docs', 'Google AI', 'https://ai.google.dev/gemini-api/docs', 'documentation', 'Intermediate', 5],
  ['nlp_llms', 'The Illustrated Transformer', 'Jay Alammar', 'https://jalammar.github.io/illustrated-transformer/', 'tutorial', 'Intermediate', 3],

  // docker
  ['docker', 'Docker Official Getting Started Guide', 'Docker', 'https://docs.docker.com/get-started/', 'documentation', 'Beginner', 6],
  ['docker', 'Play with Docker Interactive Labs', 'Docker', 'https://training.play-with-docker.com/', 'practice', 'Beginner', 4],
  ['docker', 'DevOps with Docker', 'University of Helsinki', 'https://devopswithdocker.com/', 'course', 'Intermediate', 12],

  // kubernetes
  ['kubernetes', 'Kubernetes Official Interactive Tutorials', 'Kubernetes.io', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', 'tutorial', 'Intermediate', 8],
  ['kubernetes', 'Kubernetes Concepts: Workloads & Services', 'Kubernetes.io', 'https://kubernetes.io/docs/concepts/', 'documentation', 'Intermediate', 8],
  ['kubernetes', 'DevOps with Kubernetes', 'University of Helsinki', 'https://devopswithkubernetes.com/', 'course', 'Advanced', 14],

  // cloud_aws
  ['cloud_aws', 'AWS Cloud Practitioner Essentials', 'AWS Skill Builder', 'https://explore.skillbuilder.aws/learn', 'course', 'Beginner', 8],
  ['cloud_aws', 'AWS Well-Architected Framework', 'AWS', 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html', 'documentation', 'Intermediate', 6],
  ['cloud_aws', 'Google Cloud Architecture Center', 'Google Cloud', 'https://cloud.google.com/architecture', 'documentation', 'Intermediate', 6],

  // cicd
  ['cicd', 'GitHub Actions Understanding & Workflows', 'GitHub Docs', 'https://docs.github.com/en/actions', 'documentation', 'Beginner', 5],
  ['cicd', 'GitHub Skills CI/CD Labs', 'GitHub Skills', 'https://skills.github.com/', 'practice', 'Intermediate', 4],
  ['cicd', 'Martin Fowler Continuous Integration', 'martinfowler.com', 'https://martinfowler.com/articles/continuousIntegration.html', 'tutorial', 'Intermediate', 3],

  // networking
  ['networking', 'Cloudflare Learning Center: DNS & TLS', 'Cloudflare', 'https://www.cloudflare.com/learning/', 'tutorial', 'Beginner', 6],
  ['networking', 'Beej Guide to Network Programming', 'Beej', 'https://beej.guide/guide/bgnet/', 'textbook', 'Intermediate', 10],
  ['networking', 'How HTTPS Works (Illustrated)', 'Julia Evans', 'https://howhttps.works/', 'tutorial', 'Beginner', 2],

  // web_security
  ['web_security', 'PortSwigger Web Security Academy', 'PortSwigger', 'https://portswigger.net/web-security', 'practice', 'Intermediate', 14],
  ['web_security', 'OWASP Top 10 Web Application Risks', 'OWASP', 'https://owasp.org/www-project-top-ten/', 'documentation', 'Beginner', 5],
  ['web_security', 'OWASP Juice Shop Security Lab', 'OWASP', 'https://owasp.org/www-project-juice-shop/', 'practice', 'Intermediate', 8],

  // software_testing
  ['software_testing', 'Playwright End-to-End Testing Docs', 'Microsoft Playwright', 'https://playwright.dev/docs/intro', 'documentation', 'Intermediate', 6],
  ['software_testing', 'Testing Library Guiding Principles', 'Testing Library', 'https://testing-library.com/docs/guiding-principles/', 'tutorial', 'Intermediate', 4],
  ['software_testing', 'Vitest Unit Testing Guide', 'Vitest', 'https://vitest.dev/guide/', 'documentation', 'Beginner', 4],

  // ======================== B. MEDICAL & HEALTHCARE ========================
  // human_anatomy
  ['human_anatomy', 'OpenStax Anatomy and Physiology 2e', 'OpenStax / Rice Univ', 'https://openstax.org/details/books/anatomy-and-physiology-2e', 'textbook', 'Beginner', 16],
  ['human_anatomy', 'Kenhub Anatomy Learning Guides', 'Kenhub', 'https://www.kenhub.com/en/library/anatomy', 'tutorial', 'Beginner', 8],
  ['human_anatomy', 'MedlinePlus Interactive Anatomy', 'NIH MedlinePlus', 'https://medlineplus.gov/anatomy.html', 'documentation', 'Beginner', 5],

  // human_physiology
  ['human_physiology', 'Khan Academy Health & Medicine Physiology', 'Khan Academy', 'https://www.khanacademy.org/science/health-and-medicine', 'course', 'Beginner', 12],
  ['human_physiology', 'OpenStax Physiology Chapters', 'OpenStax / Rice Univ', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction', 'textbook', 'Intermediate', 14],
  ['human_physiology', 'NCBI Bookshelf: Medical Physiology', 'NIH NCBI', 'https://www.ncbi.nlm.nih.gov/books/', 'documentation', 'Intermediate', 8],

  // pharmacology
  ['pharmacology', 'OpenRN Nursing Pharmacology Textbook', 'OpenRN / LibreTexts', 'https://med.libretexts.org/Bookshelves/Nursing/Nursing_Pharmacology_(OpenRN)', 'textbook', 'Intermediate', 14],
  ['pharmacology', 'NIH DailyMed Drug Reference Portal', 'NIH / NLM', 'https://dailymed.nlm.nih.gov/dailymed/', 'documentation', 'Intermediate', 6],
  ['pharmacology', 'Pharmacokinetics & Dosing Calculations', 'Khan Academy', 'https://www.khanacademy.org/science/health-and-medicine', 'practice', 'Intermediate', 6],

  // clinical_reasoning
  ['clinical_reasoning', 'NEJM Knowledge+ Clinical Reasoning Guide', 'NEJM Group', 'https://knowledgeplus.nejm.org/', 'course', 'Advanced', 12],
  ['clinical_reasoning', 'CDC Clinical Guidance & Case Prep', 'CDC', 'https://www.cdc.gov/', 'documentation', 'Intermediate', 6],
  ['clinical_reasoning', 'MedEdPORTAL Educational Case Modules', 'AAMC MedEdPORTAL', 'https://www.mededportal.org/', 'practice', 'Advanced', 10],

  // patient_care_nursing
  ['patient_care_nursing', 'OpenRN Nursing Skills & Patient Safety', 'OpenRN / LibreTexts', 'https://med.libretexts.org/Bookshelves/Nursing/Nursing_Skills_(OpenRN)', 'textbook', 'Beginner', 12],
  ['patient_care_nursing', 'WHO Patient Safety Curriculum Guide', 'World Health Org', 'https://www.who.int/teams/integrated-health-services/patient-safety', 'documentation', 'Beginner', 6],
  ['patient_care_nursing', 'CDC Infection Control Fundamentals', 'CDC', 'https://www.cdc.gov/infection-control/hcp/core-practices/', 'tutorial', 'Beginner', 5],

  // medical_diagnostics_lab
  ['medical_diagnostics_lab', 'Testing.com Lab Assays Reference', 'ASCLS / Testing.com', 'https://www.testing.com/', 'documentation', 'Intermediate', 6],
  ['medical_diagnostics_lab', 'CDC Laboratory Quality Management', 'CDC / WHO', 'https://www.cdc.gov/lab-quality/index.html', 'course', 'Intermediate', 8],
  ['medical_diagnostics_lab', 'NCBI StatPearls Clinical Lab Methods', 'NIH NCBI', 'https://www.ncbi.nlm.nih.gov/books/NBK430685/', 'textbook', 'Intermediate', 8],

  // medical_imaging_basics
  ['medical_imaging_basics', 'Radiopaedia Radiology Physics & Cases', 'Radiopaedia', 'https://radiopaedia.org/articles/radiation-protection', 'tutorial', 'Intermediate', 8],
  ['medical_imaging_basics', 'NIH NIBIB Medical Imaging Primer', 'NIH NIBIB', 'https://www.nibib.nih.gov/science-education/science-topics/medical-imaging', 'documentation', 'Beginner', 5],
  ['medical_imaging_basics', 'IAEA Radiation Protection in Medicine', 'IAEA', 'https://www.iaea.org/resources/rpop/health-professionals', 'course', 'Intermediate', 6],

  // rehab_kinesiology
  ['rehab_kinesiology', 'Physiopedia Biomechanics & Kinesiology', 'Physiopedia', 'https://www.physio-pedia.com/Biomechanics', 'documentation', 'Intermediate', 8],
  ['rehab_kinesiology', 'OpenStax Muscular & Skeletal Mechanics', 'OpenStax', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/9-1-classification-of-joints', 'textbook', 'Beginner', 8],
  ['rehab_kinesiology', 'MIT OCW Movement & Rehabilitation Notes', 'MIT OCW', 'https://ocw.mit.edu/', 'course', 'Intermediate', 10],

  // epidemiology_public_health
  ['epidemiology_public_health', 'CDC Principles of Epidemiology (SS1978)', 'CDC', 'https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/index.html', 'course', 'Beginner', 12],
  ['epidemiology_public_health', 'WHO OpenWHO Public Health Courses', 'WHO', 'https://openwho.org/', 'course', 'Intermediate', 10],
  ['epidemiology_public_health', 'Epidemiologist R Handbook', 'Applied Epi', 'https://epirhandbook.com/en/', 'practice', 'Intermediate', 10],

  // healthcare_operations
  ['healthcare_operations', 'HHS HIPAA Privacy & Security Guidance', 'U.S. HHS', 'https://www.hhs.gov/hipaa/for-professionals/index.html', 'documentation', 'Beginner', 5],
  ['healthcare_operations', 'IHI Patient Safety & Quality Improvement', 'Inst. Healthcare Imp.', 'https://www.ihi.org/education', 'course', 'Intermediate', 8],
  ['healthcare_operations', 'HL7 FHIR Healthcare Interoperability', 'HL7 International', 'https://hl7.org/fhir/overview.html', 'documentation', 'Intermediate', 6],

  // ======================== C. MECHANICAL ENGINEERING ========================
  // engineering_mechanics
  ['engineering_mechanics', 'Engineering Statics Open Textbook', 'LibreTexts / Baker', 'https://engineeringstatics.org/', 'textbook', 'Beginner', 14],
  ['engineering_mechanics', 'MIT 2.001 Mechanics & Materials I', 'MIT OCW', 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/', 'course', 'Intermediate', 16],
  ['engineering_mechanics', 'Khan Academy Torque & Equilibrium', 'Khan Academy', 'https://www.khanacademy.org/science/physics/torque-angular-momentum', 'practice', 'Beginner', 6],

  // materials_strength
  ['materials_strength', 'Mechanics of Materials Open Course', 'LibreTexts Engineering', 'https://eng.libretexts.org/Bookshelves/Mechanical_Engineering', 'textbook', 'Intermediate', 14],
  ['materials_strength', 'MIT 3.012 Fundamentals of Materials Science', 'MIT OCW', 'https://ocw.mit.edu/courses/3-012-fundamentals-of-materials-science-fall-2005/', 'course', 'Intermediate', 12],
  ['materials_strength', 'MatWeb Material Property Datasheets', 'MatWeb', 'https://www.matweb.com/', 'documentation', 'Beginner', 4],

  // thermodynamics
  ['thermodynamics', 'MIT 2.005 Thermal-Fluids Engineering I', 'MIT OCW', 'https://ocw.mit.edu/courses/2-005-thermal-fluids-engineering-i-spring-2008/', 'course', 'Intermediate', 16],
  ['thermodynamics', 'OpenStax University Physics Thermodynamics', 'OpenStax', 'https://openstax.org/books/university-physics-volume-2/pages/1-introduction', 'textbook', 'Beginner', 10],
  ['thermodynamics', 'Thermodynamics & Heat Transfer Notes', 'LibreTexts', 'https://eng.libretexts.org/Bookshelves/Mechanical_Engineering', 'practice', 'Intermediate', 8],

  // cad_3d_modeling
  ['cad_3d_modeling', 'Onshape Free CAD Learning Center', 'PTC Onshape', 'https://learn.onshape.com/', 'course', 'Beginner', 10],
  ['cad_3d_modeling', 'FreeCAD Official Modeling Tutorials', 'FreeCAD', 'https://wiki.freecad.org/Tutorials', 'practice', 'Beginner', 8],
  ['cad_3d_modeling', 'Autodesk Fusion Self-Paced Learning', 'Autodesk', 'https://www.autodesk.com/learn', 'tutorial', 'Intermediate', 8],

  // fea_simulation
  ['fea_simulation', 'SimScale Cloud FEA & CFD Academy', 'SimScale', 'https://www.simscale.com/academy/', 'course', 'Intermediate', 10],
  ['fea_simulation', 'MIT 2.080J Structural Mechanics & FEM', 'MIT OCW', 'https://ocw.mit.edu/courses/2-080j-structural-mechanics-fall-2013/', 'course', 'Advanced', 14],
  ['fea_simulation', 'CalculiX & FreeCAD FEM Workbench Guide', 'FreeCAD', 'https://wiki.freecad.org/FEM_Workbench', 'practice', 'Intermediate', 6],

  // manufacturing_processes
  ['manufacturing_processes', 'MIT 2.008 Design & Manufacturing II', 'MIT OCW', 'https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2004/', 'course', 'Intermediate', 14],
  ['manufacturing_processes', 'NIST Engineering Statistics (SPC / Cpk)', 'NIST', 'https://www.itl.nist.gov/div898/handbook/', 'documentation', 'Intermediate', 8],
  ['manufacturing_processes', 'Protolabs Design for Manufacturability', 'Protolabs', 'https://www.protolabs.com/resources/design-tips/', 'tutorial', 'Beginner', 5],

  // automotive_powertrain
  ['automotive_powertrain', 'SAE International Mobility Standards', 'SAE International', 'https://www.sae.org/learn', 'documentation', 'Intermediate', 6],
  ['automotive_powertrain', 'MIT Electric Vehicle Design Notes', 'MIT OCW', 'https://ocw.mit.edu/', 'course', 'Intermediate', 10],
  ['automotive_powertrain', 'NREL Battery Thermal & Powertrain Data', 'NREL', 'https://www.nrel.gov/transportation/', 'documentation', 'Advanced', 6],

  // ======================== D. ELECTRONICS & ELECTRICAL ENGINEERING ========================
  // circuit_analysis
  ['circuit_analysis', 'All About Circuits DC & AC Textbooks', 'All About Circuits', 'https://www.allaboutcircuits.com/textbook/', 'textbook', 'Beginner', 12],
  ['circuit_analysis', 'Khan Academy Electrical Engineering', 'Khan Academy', 'https://www.khanacademy.org/science/electrical-engineering', 'course', 'Beginner', 12],
  ['circuit_analysis', 'Falstad Interactive Circuit Simulator', 'Falstad', 'https://www.falstad.com/circuit/', 'practice', 'Beginner', 5],

  // digital_electronics
  ['digital_electronics', 'Nand2Tetris Hardware & Logic Course', 'Nand2Tetris', 'https://www.nand2tetris.org/', 'course', 'Beginner', 14],
  ['digital_electronics', 'HDLBits Verilog Practice Problems', 'HDLBits', 'https://hdlbits.01xz.net/wiki/Main_Page', 'practice', 'Intermediate', 10],
  ['digital_electronics', 'All About Circuits Digital Logic Guide', 'All About Circuits', 'https://www.allaboutcircuits.com/textbook/digital/', 'textbook', 'Beginner', 8],

  // embedded_systems
  ['embedded_systems', 'STM32 & ARM Cortex-M Embedded Guides', 'STMicroelectronics', 'https://wiki.st.com/stm32mcu/wiki/STM32StepByStep:STM32_step_by_step_overview', 'tutorial', 'Intermediate', 10],
  ['embedded_systems', 'FreeRTOS Official Kernel Fundamentals', 'FreeRTOS', 'https://www.freertos.org/Documentation/01-FreeRTOS-quick-start/01-Beginners-guide/00-Overview', 'documentation', 'Intermediate', 6],
  ['embedded_systems', 'Embedded Systems Shape The World (UT Austin)', 'UT Austin / edX', 'https://users.ece.utexas.edu/~valvano/Volume1/', 'textbook', 'Intermediate', 14],

  // pcb_design
  ['pcb_design', 'KiCad Official Getting Started & Docs', 'KiCad', 'https://docs.kicad.org/', 'documentation', 'Beginner', 8],
  ['pcb_design', 'Altium Academy PCB Stackup & Routing', 'Altium', 'https://resources.altium.com/p/pcb-design-basics', 'tutorial', 'Intermediate', 6],
  ['pcb_design', 'Sierra Circuits Signal Integrity Guide', 'Sierra Circuits', 'https://www.protoexpress.com/kb/', 'documentation', 'Advanced', 6],

  // vlsi_design
  ['vlsi_design', 'OpenLane RTL-to-GDSII ASIC Flow', 'Efabless / OpenROAD', 'https://openlane.readthedocs.io/en/latest/', 'documentation', 'Advanced', 10],
  ['vlsi_design', 'MIT 6.004 Computation Structures', 'MIT OCW', 'https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/', 'course', 'Intermediate', 16],
  ['vlsi_design', 'ASIC World Digital & Verilog Tutorials', 'ASIC World', 'https://www.asic-world.com/verilog/veritut.html', 'tutorial', 'Intermediate', 8],

  // signal_processing
  ['signal_processing', 'The Scientist & Engineer Guide to DSP', 'Steven W. Smith', 'https://www.dspguide.com/', 'textbook', 'Intermediate', 14],
  ['signal_processing', 'MIT RES.6-008 Digital Signal Processing', 'MIT OCW', 'https://ocw.mit.edu/resources/res-6-008-digital-signal-processing-spring-2011/', 'course', 'Intermediate', 16],
  ['signal_processing', 'SciPy Signal Processing Docs', 'SciPy', 'https://docs.scipy.org/doc/scipy/reference/signal.html', 'practice', 'Intermediate', 6],

  // power_systems
  ['power_systems', 'MIT 6.061 Introduction to Electric Power Systems', 'MIT OCW', 'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/', 'course', 'Intermediate', 14],
  ['power_systems', 'NREL Grid Modernization & Power Labs', 'NREL', 'https://www.nrel.gov/grid/', 'documentation', 'Intermediate', 6],
  ['power_systems', 'All About Circuits Power & Transformers', 'All About Circuits', 'https://www.allaboutcircuits.com/textbook/alternating-current/', 'textbook', 'Beginner', 8],

  // ======================== E. ROBOTICS & AUTOMATION ========================
  // sensors_actuators
  ['sensors_actuators', 'Modern Robotics: Sensors & Mechanisms', 'Northwestern Univ', 'https://hades.mech.northwestern.edu/index.php/Modern_Robotics', 'textbook', 'Intermediate', 12],
  ['sensors_actuators', 'All About Circuits Sensors & Motors', 'All About Circuits', 'https://www.allaboutcircuits.com/textbook/direct-current/', 'tutorial', 'Beginner', 6],
  ['sensors_actuators', 'Arduino & IMU Calibration Guides', 'Arduino Docs', 'https://docs.arduino.cc/learn/', 'practice', 'Beginner', 6],

  // control_systems
  ['control_systems', 'Control Tutorials for MATLAB & Python', 'Univ. of Michigan', 'https://ctms.engin.umich.edu/CTMS/index.php?aux=Home', 'tutorial', 'Intermediate', 12],
  ['control_systems', 'Brian Douglas Control Systems Lectures', 'Control Systems Lectures', 'https://engineeringmedia.com/', 'course', 'Beginner', 10],
  ['control_systems', 'MIT 2.004 Dynamics and Control II', 'MIT OCW', 'https://ocw.mit.edu/courses/2-004-dynamics-and-control-ii-spring-2008/', 'course', 'Advanced', 14],

  // ros2_robotics
  ['ros2_robotics', 'ROS 2 Official Documentation & Tutorials', 'Open Robotics', 'https://docs.ros.org/en/humble/Tutorials.html', 'documentation', 'Intermediate', 14],
  ['ros2_robotics', 'Nav2 Autonomous Navigation Docs', 'Open Navigation', 'https://docs.nav2.org/', 'tutorial', 'Advanced', 10],
  ['ros2_robotics', 'Gazebo Robotics Simulation Guides', 'Open Robotics', 'https://gazebosim.org/docs', 'practice', 'Intermediate', 8],

  // computer_vision_robotics
  ['computer_vision_robotics', 'OpenCV Official Python Tutorials', 'OpenCV', 'https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html', 'documentation', 'Intermediate', 10],
  ['computer_vision_robotics', 'Stanford CS231n Vision for Recognition', 'Stanford', 'https://cs231n.github.io/', 'course', 'Advanced', 16],
  ['computer_vision_robotics', 'Kaggle Computer Vision Micro-Course', 'Kaggle', 'https://www.kaggle.com/learn/computer-vision', 'practice', 'Beginner', 5],

  // industrial_plc_automation
  ['industrial_plc_automation', 'PLCopen IEC 61131-3 Standards Guide', 'PLCopen', 'https://plcopen.org/technical-activities/iec-61131-3', 'documentation', 'Intermediate', 6],
  ['industrial_plc_automation', 'AutomationDirect PLC Training Library', 'AutomationDirect', 'https://www.automationdirect.com/adc/overview/catalog/programmable_controllers', 'tutorial', 'Beginner', 8],
  ['industrial_plc_automation', 'NIST Industrial Control Systems Security', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/82/r3/final', 'documentation', 'Intermediate', 6],

  // ======================== F. CIVIL ENGINEERING & ARCHITECTURE ========================
  // structural_analysis
  ['structural_analysis', 'MIT 1.050 Solid Mechanics & Structures', 'MIT OCW', 'https://ocw.mit.edu/courses/1-050-solid-mechanics-fall-2004/', 'course', 'Intermediate', 14],
  ['structural_analysis', 'LibreTexts Structural Analysis Textbook', 'LibreTexts Civil', 'https://eng.libretexts.org/Bookshelves/Civil_Engineering/Structural_Analysis_(Udoeyo)', 'textbook', 'Intermediate', 12],
  ['structural_analysis', 'AISC Steel Construction Resources', 'AISC', 'https://www.aisc.org/education/', 'documentation', 'Advanced', 6],

  // geotech_surveying
  ['geotech_surveying', 'MIT 1.361 Advanced Soil Mechanics', 'MIT OCW', 'https://ocw.mit.edu/courses/1-361-advanced-soil-mechanics-fall-2004/', 'course', 'Advanced', 12],
  ['geotech_surveying', 'FHWA Geotechnical Engineering Circulars', 'U.S. DOT FHWA', 'https://www.fhwa.dot.gov/engineering/geotech/', 'documentation', 'Intermediate', 8],
  ['geotech_surveying', 'USGS Topographic & Surveying Guides', 'USGS', 'https://www.usgs.gov/programs/national-geospatial-program', 'tutorial', 'Beginner', 5],

  // bim_revit
  ['bim_revit', 'Autodesk Revit & BIM Learning Center', 'Autodesk', 'https://www.autodesk.com/learn', 'course', 'Beginner', 10],
  ['bim_revit', 'buildingSMART OpenBIM & IFC Standards', 'buildingSMART', 'https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/', 'documentation', 'Intermediate', 6],
  ['bim_revit', 'UK BIM Framework & ISO 19650 Guidance', 'UK BIM Framework', 'https://www.ukbimframework.org/guidance/', 'tutorial', 'Intermediate', 6],

  // architectural_design
  ['architectural_design', 'MIT 4.101 Architectural Design Fundamentals', 'MIT OCW', 'https://ocw.mit.edu/courses/architecture/', 'course', 'Intermediate', 12],
  ['architectural_design', 'U.S. DOE Building Energy Codes Guide', 'U.S. Dept of Energy', 'https://www.energycodes.gov/', 'documentation', 'Intermediate', 6],
  ['architectural_design', 'ADA Standards for Accessible Design', 'ADA.gov', 'https://www.ada.gov/law-and-regs/design-standards/', 'documentation', 'Beginner', 5],

  // construction_pm
  ['construction_pm', 'PMI Project Management Body of Knowledge', 'PMI', 'https://www.pmi.org/pmbok-guide-standards', 'documentation', 'Intermediate', 8],
  ['construction_pm', 'MIT 1.040 Project Management', 'MIT OCW', 'https://ocw.mit.edu/courses/1-040-project-management-spring-2009/', 'course', 'Intermediate', 12],
  ['construction_pm', 'OSHA Construction Safety Standards', 'OSHA', 'https://www.osha.gov/construction', 'documentation', 'Beginner', 5],

  // ======================== G. SCIENCE & RESEARCH ========================
  // statistics
  ['statistics', 'Seeing Theory: Visual Probability & Stats', 'Brown University', 'https://seeing-theory.brown.edu/', 'tutorial', 'Beginner', 6],
  ['statistics', 'Khan Academy Statistics & Probability', 'Khan Academy', 'https://www.khanacademy.org/math/statistics-probability', 'course', 'Beginner', 14],
  ['statistics', 'Think Stats: Exploratory Data Analysis', 'Allen Downey', 'https://greenteapress.com/wp/think-stats-2e/', 'textbook', 'Intermediate', 10],

  // experimental_design
  ['experimental_design', 'NIH Rigor & Reproducibility Modules', 'NIH', 'https://www.nih.gov/research-training/rigor-reproducibility/training', 'course', 'Intermediate', 6],
  ['experimental_design', 'NIST Design of Experiments (DOE) Handbook', 'NIST', 'https://www.itl.nist.gov/div898/handbook/pri/pri.htm', 'textbook', 'Intermediate', 10],
  ['experimental_design', 'OSF Open Science Preregistration Guide', 'Center for Open Science', 'https://www.cos.io/initiatives/prereg', 'tutorial', 'Beginner', 4],

  // molecular_biotech
  ['molecular_biotech', 'OpenStax Biology 2e: Molecular Genetics', 'OpenStax', 'https://openstax.org/books/biology-2e/pages/14-introduction', 'textbook', 'Beginner', 10],
  ['molecular_biotech', 'Addgene CRISPR & Molecular Protocols', 'Addgene', 'https://www.addgene.org/guides/crispr/', 'documentation', 'Intermediate', 6],
  ['molecular_biotech', 'NCBI BLAST & Sequence Analysis Guides', 'NIH NCBI', 'https://blast.ncbi.nlm.nih.gov/Blast.cgi', 'practice', 'Intermediate', 6],

  // analytical_chemistry
  ['analytical_chemistry', 'OpenStax Chemistry 2e: Stoichiometry', 'OpenStax', 'https://openstax.org/books/chemistry-2e/pages/4-introduction', 'textbook', 'Beginner', 10],
  ['analytical_chemistry', 'LibreTexts Analytical Chemistry 2.1', 'David Harvey / LibreTexts', 'https://chem.libretexts.org/Bookshelves/Analytical_Chemistry/Analytical_Chemistry_2.1_(Harvey)', 'textbook', 'Intermediate', 14],
  ['analytical_chemistry', 'NIST Chemistry WebBook Spectra Data', 'NIST', 'https://webbook.nist.gov/chemistry/', 'practice', 'Intermediate', 5],

  // environmental_science
  ['environmental_science', 'EPA Environmental Assessment & Modeling', 'U.S. EPA', 'https://www.epa.gov/environmental-topics', 'documentation', 'Beginner', 6],
  ['environmental_science', 'QGIS Official Training Manual', 'QGIS.org', 'https://docs.qgis.org/latest/en/docs/training_manual/', 'practice', 'Intermediate', 10],
  ['environmental_science', 'MIT 1.018J Fundamentals of Ecology', 'MIT OCW', 'https://ocw.mit.edu/courses/1-018j-fundamentals-of-ecology-fall-2009/', 'course', 'Intermediate', 12],

  // materials_science_research
  ['materials_science_research', 'MIT 3.091 Introduction to Solid-State Chemistry', 'MIT OCW', 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/', 'course', 'Intermediate', 16],
  ['materials_science_research', 'Materials Project Open Crystal Database', 'Lawrence Berkeley Lab', 'https://next-gen.materialsproject.org/', 'practice', 'Intermediate', 6],
  ['materials_science_research', 'DoITPoMS Materials Microstructure Library', 'Univ. of Cambridge', 'https://www.doitpoms.ac.uk/tlplib/index.php', 'tutorial', 'Intermediate', 8],

  // ======================== H. BUSINESS & MANAGEMENT ========================
  // financial_modeling
  ['financial_modeling', 'Corporate Finance Institute Modeling Guides', 'CFI', 'https://corporatefinanceinstitute.com/resources/financial-modeling/', 'tutorial', 'Beginner', 8],
  ['financial_modeling', 'Aswath Damodaran Valuation & DCF Course', 'NYU Stern', 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/home.htm', 'course', 'Intermediate', 14],
  ['financial_modeling', 'MIT 15.401 Finance Theory I', 'MIT Sloan OCW', 'https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/', 'course', 'Intermediate', 14],

  // business_strategy
  ['business_strategy', 'Harvard Business Review Strategy Essentials', 'MIT / Open Strategy', 'https://ocw.mit.edu/courses/15-900-competitive-strategy-spring-2008/', 'course', 'Intermediate', 10],
  ['business_strategy', 'IIBA Business Analysis Core Concept Guide', 'IIBA', 'https://www.iiba.org/career-resources/a-guide-to-the-business-analysis-body-of-knowledge-babok-guide/', 'documentation', 'Beginner', 6],
  ['business_strategy', 'Y Combinator Startup Library: Metrics & Strategy', 'Y Combinator', 'https://www.ycombinator.com/library', 'tutorial', 'Beginner', 5],

  // product_management
  ['product_management', 'Silicon Valley Product Group Articles', 'SVPG', 'https://www.svpg.com/articles/', 'tutorial', 'Intermediate', 6],
  ['product_management', 'Intercom on Product Management', 'Intercom', 'https://www.intercom.com/resources/books/intercom-product-management', 'textbook', 'Beginner', 5],
  ['product_management', 'Lenny Product & Growth Playbooks', 'Amplitude / Product Guides', 'https://amplitude.com/blog', 'tutorial', 'Intermediate', 6],

  // marketing_analytics
  ['marketing_analytics', 'Google Skillshop Analytics & Attribution', 'Google Skillshop', 'https://skillshop.withgoogle.com/', 'course', 'Beginner', 8],
  ['marketing_analytics', 'Google Search Central SEO Starter Guide', 'Google Search', 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', 'documentation', 'Beginner', 4],
  ['marketing_analytics', 'HubSpot Academy Growth & Marketing Analytics', 'HubSpot Academy', 'https://academy.hubspot.com/', 'course', 'Intermediate', 8],

  // operations_supply_chain
  ['operations_supply_chain', 'MIT 15.761 Introduction to Operations Mgmt', 'MIT Sloan OCW', 'https://ocw.mit.edu/courses/15-761-introduction-to-operations-management-spring-2013/', 'course', 'Intermediate', 14],
  ['operations_supply_chain', 'MITx MicroMasters Supply Chain Concepts', 'MIT CTL', 'https://ctl.mit.edu/education', 'documentation', 'Intermediate', 6],
  ['operations_supply_chain', 'NIST Manufacturing & Lean Operations', 'NIST MEP', 'https://www.nist.gov/mep', 'tutorial', 'Beginner', 5],

  // people_hr_ops
  ['people_hr_ops', 'Google re:Work Structured Hiring & People Ops', 'Google re:Work', 'https://rework.withgoogle.com/', 'tutorial', 'Beginner', 6],
  ['people_hr_ops', 'SHRM Competency & HR Operations Resources', 'SHRM', 'https://www.shrm.org/topics-tools', 'documentation', 'Intermediate', 6],
  ['people_hr_ops', 'U.S. EEOC Employment Compliance Guides', 'U.S. EEOC', 'https://www.eeoc.gov/employers', 'documentation', 'Beginner', 4],

  // ======================== I. DESIGN & CREATIVE PROFESSIONS ========================
  // design_foundations
  ['design_foundations', 'Refactoring UI & Typography Scale Principles', 'Material Design', 'https://m3.material.io/styles', 'documentation', 'Beginner', 6],
  ['design_foundations', 'W3C WCAG 2.2 Color Contrast & Accessibility', 'W3C WAI', 'https://www.w3.org/WAI/standards-guidelines/wcag/', 'documentation', 'Intermediate', 5],
  ['design_foundations', 'Butterick Practical Typography', 'Matthew Butterick', 'https://practicaltypography.com/', 'textbook', 'Beginner', 5],

  // ux_research_ia
  ['ux_research_ia', 'Nielsen Norman Group UX Research Articles', 'NN/g', 'https://www.nngroup.com/articles/', 'tutorial', 'Beginner', 8],
  ['ux_research_ia', 'Usability.gov Information Architecture Guide', 'Digital.gov', 'https://digital.gov/topics/usability/', 'documentation', 'Beginner', 5],
  ['ux_research_ia', '10 Usability Heuristics for User Interface Design', 'NN/g', 'https://www.nngroup.com/articles/ten-usability-heuristics/', 'practice', 'Intermediate', 4],

  // figma_prototyping
  ['figma_prototyping', 'Figma Learn Design Systems & Auto-Layout', 'Figma', 'https://help.figma.com/hc/en-us/categories/360002051613-Get-started', 'course', 'Beginner', 8],
  ['figma_prototyping', 'W3C Design Tokens Community Specification', 'W3C Design Tokens', 'https://www.w3.org/community/design-tokens/', 'documentation', 'Intermediate', 4],
  ['figma_prototyping', 'Figma Prototyping & Variables Practice', 'Figma Learn', 'https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma', 'practice', 'Intermediate', 6],

  // industrial_product_design
  ['industrial_product_design', 'IDSA Industrial Design Foundations', 'IDSA', 'https://www.idsa.org/', 'documentation', 'Intermediate', 6],
  ['industrial_product_design', 'MIT 2.009 Product Engineering Processes', 'MIT OCW', 'https://ocw.mit.edu/courses/2-009-the-product-engineering-process-fall-2007/', 'course', 'Intermediate', 14],
  ['industrial_product_design', 'NIST Human Factors & Ergonomics Standards', 'NIST / ISO', 'https://www.nist.gov/', 'documentation', 'Intermediate', 5],

  // content_brand_strategy
  ['content_brand_strategy', 'PlainLanguage.gov Federal Editorial Guidelines', 'PlainLanguage.gov', 'https://www.plainlanguage.gov/guidelines/', 'documentation', 'Beginner', 4],
  ['content_brand_strategy', 'Mailchimp Content Style & Voice Guide', 'Mailchimp', 'https://styleguide.mailchimp.com/', 'tutorial', 'Beginner', 4],
  ['content_brand_strategy', 'NN/g UX Writing & Microcopy Guidelines', 'NN/g', 'https://www.nngroup.com/topic/writing-web/', 'tutorial', 'Intermediate', 5],

  // ======================== J. EDUCATION & TEACHING ========================
  // curriculum_instruction
  ['curriculum_instruction', 'MIT Teaching & Learning Lab: Course Design & Alignment', 'MIT TLL', 'https://tll.mit.edu/teaching-resources/course-design/', 'documentation', 'Beginner', 6],
  ['curriculum_instruction', 'Vanderbilt Center for Teaching: Understanding by Design', 'Vanderbilt CFT', 'https://cft.vanderbilt.edu/guides-sub-pages/understanding-by-design/', 'tutorial', 'Beginner', 5],
  ['curriculum_instruction', 'NCERT & DIKSHA Open Curriculum Frameworks', 'NCERT / DIKSHA', 'https://diksha.gov.in/', 'course', 'Intermediate', 8],

  // classroom_pedagogy
  ['classroom_pedagogy', 'MIT TLL: Active Learning & Inclusive Pedagogy', 'MIT TLL', 'https://tll.mit.edu/teaching-resources/inclusive-teaching/', 'tutorial', 'Beginner', 6],
  ['classroom_pedagogy', 'CAST Universal Design for Learning (UDL) Guidelines', 'CAST', 'https://udlguidelines.cast.org/', 'documentation', 'Intermediate', 6],
  ['classroom_pedagogy', 'Harvard Bok Center Classroom Facilitation Guides', 'Harvard Bok Center', 'https://bokcenter.harvard.edu/teaching-resources', 'tutorial', 'Intermediate', 6],

  // educational_assessment
  ['educational_assessment', 'Vanderbilt CFT: Grading & Designing Rubrics', 'Vanderbilt CFT', 'https://cft.vanderbilt.edu/guides-sub-pages/grading-student-work/', 'documentation', 'Beginner', 4],
  ['educational_assessment', 'MIT TLL: Formative & Summative Assessment Strategies', 'MIT TLL', 'https://tll.mit.edu/teaching-resources/assessing-learning/', 'tutorial', 'Intermediate', 5],
  ['educational_assessment', 'OpenStax Introductory Statistics for Educators', 'OpenStax', 'https://openstax.org/details/books/introductory-statistics-2e', 'textbook', 'Intermediate', 8],

  // ======================== K. FINANCE & ACCOUNTING ========================
  // financial_accounting
  ['financial_accounting', 'OpenStax Principles of Financial Accounting', 'OpenStax', 'https://openstax.org/details/books/principles-financial-accounting', 'textbook', 'Beginner', 12],
  ['financial_accounting', 'MIT 15.501 Corporate Financial Accounting', 'MIT Sloan OCW', 'https://ocw.mit.edu/courses/15-501-corporate-financial-accounting-spring-2004/', 'course', 'Intermediate', 14],
  ['financial_accounting', 'ICAI Ind AS & Accounting Standards Portal', 'ICAI', 'https://www.icai.org/post/accounting-standards', 'documentation', 'Intermediate', 6],

  // taxation_audit
  ['taxation_audit', 'ICAI Auditing & Assurance Standards Handbook', 'ICAI', 'https://www.icai.org/post/auditing-and-assurance-standards', 'documentation', 'Intermediate', 8],
  ['taxation_audit', 'PCAOB Auditing Standards Reference', 'PCAOB', 'https://pcaobus.org/oversight/standards/auditing-standards', 'documentation', 'Intermediate', 6],
  ['taxation_audit', 'OpenStax Principles of Managerial & Cost Controls', 'OpenStax', 'https://openstax.org/details/books/principles-managerial-accounting', 'textbook', 'Beginner', 8],

  // corporate_treasury
  ['corporate_treasury', 'MIT 15.401 Finance Theory I (Corporate Finance)', 'MIT Sloan OCW', 'https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/', 'course', 'Intermediate', 16],
  ['corporate_treasury', 'Aswath Damodaran Corporate Finance Lecture Notes', 'NYU Stern', 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/CF.html', 'tutorial', 'Intermediate', 10],
  ['corporate_treasury', 'OpenStax Principles of Finance (WACC & Capital Budgeting)', 'OpenStax', 'https://openstax.org/details/books/principles-finance', 'textbook', 'Beginner', 8],

  // wealth_portfolio_mgmt
  ['wealth_portfolio_mgmt', 'MIT 15.402 Finance Theory II & Risk Analysis', 'MIT Sloan OCW', 'https://ocw.mit.edu/courses/15-402-finance-theory-ii-spring-2003/', 'course', 'Advanced', 14],
  ['wealth_portfolio_mgmt', 'CFA Institute Investment Foundations Curriculum', 'CFA Institute', 'https://www.cfainstitute.org/programs/investment-foundations-certificate', 'course', 'Intermediate', 10],
  ['wealth_portfolio_mgmt', 'SEBI & Investor Education Risk Literacy Guides', 'SEBI Investor', 'https://investor.sebi.gov.in/', 'documentation', 'Beginner', 4],

  // ======================== L. AGRICULTURE & ENVIRONMENTAL SCIENCE ========================
  // agronomy_soil_science
  ['agronomy_soil_science', 'FAO Soils Portal & Nutrient Management Guides', 'UN FAO', 'https://www.fao.org/soils-portal/en/', 'documentation', 'Beginner', 6],
  ['agronomy_soil_science', 'USDA NRCS Soil Health & Agronomy Resources', 'USDA NRCS', 'https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soils/soil-health', 'tutorial', 'Beginner', 6],
  ['agronomy_soil_science', 'ICAR Open Agricultural Extension Manuals', 'ICAR', 'https://icar.org.in/', 'documentation', 'Intermediate', 8],

  // precision_agriculture
  ['precision_agriculture', 'NASA ARSET Remote Sensing for Agriculture Training', 'NASA ARSET', 'https://appliedsciences.nasa.gov/what-we-do/capacity-building/arset/agriculture', 'course', 'Intermediate', 10],
  ['precision_agriculture', 'QGIS Training Manual for Spatial Field Analysis', 'QGIS Project', 'https://docs.qgis.org/latest/en/docs/training_manual/', 'practice', 'Intermediate', 8],
  ['precision_agriculture', 'USGS Earth Resources & NDVI Spectral Indices', 'USGS', 'https://www.usgs.gov/landsat-missions/landsat-normalized-difference-vegetation-index', 'documentation', 'Beginner', 4],

  // climate_sustainability
  ['climate_sustainability', 'GHG Protocol Corporate & Scope 1-3 Standards', 'GHG Protocol', 'https://ghgprotocol.org/standards', 'documentation', 'Intermediate', 8],
  ['climate_sustainability', 'MIT Climate Primer & Carbon Accounting', 'MIT Climate', 'https://climate.mit.edu/', 'tutorial', 'Beginner', 5],
  ['climate_sustainability', 'UNEP Sustainability & Environmental Assessment Guides', 'UNEP', 'https://www.unep.org/resources', 'documentation', 'Intermediate', 6],
];

const skillDomainMap = new Map<string, CareerDomainId>(
  SKILLS_CATALOG.map((s) => [s.id, s.domainId])
);

export const LEARNING_RESOURCES: LearningResource[] = RAW_RESOURCES.map(
  ([skillId, title, provider, url, type, difficulty, hours], idx) => ({
    id: `res_${String(idx + 1).padStart(3, '0')}`,
    skillId,
    domainId: skillDomainMap.get(skillId) ?? 'information_technology',
    title,
    provider,
    url,
    verified: true,
    type,
    difficulty,
    hours,
  })
);
