import { SKILLS_CATALOG } from './domainsCatalog.ts';
import type {
  AssessmentDomainType,
  CareerDomainId,
  CodingChallenge,
  DomainPracticalTask,
  QuizQuestion,
} from './types.ts';

export const MEDICAL_SAFETY_DISCLAIMER =
  'Educational Simulation Only: This healthcare assessment is a conceptual study exercise and does not constitute medical advice, clinical diagnosis, clinical qualification, or authorization to treat patients. Real clinical practice requires accredited medical/nursing education and statutory licensure.';

export const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  // IT
  javascript: [
    {
      id: 'q_js_1',
      skillId: 'javascript',
      prompt: 'How does Promise.all behave when one of its input promises rejects?',
      options: [
        'It waits for all promises and returns partial results',
        'It rejects immediately as soon as any input promise rejects',
        'It retries the failed promise once automatically',
        'It converts rejections into null values',
      ],
      correctIndex: 1,
      explanation: 'Promise.all fails fast on the first rejection; use Promise.allSettled to collect every outcome.',
    },
    {
      id: 'q_js_2',
      skillId: 'javascript',
      prompt: 'Which statement accurately describes JavaScript closures?',
      options: [
        'A function bundled together with references to its lexical surrounding scope',
        'A class method that cannot access private properties',
        'A syntax that blocks the event loop until synchronous work completes',
        'An object frozen via Object.freeze()',
      ],
      correctIndex: 0,
      explanation: 'Closures retain lexical scope references even after the outer function has returned.',
    },
  ],
  react: [
    {
      id: 'q_react_1',
      skillId: 'react',
      prompt: 'Why should React list items use stable unique IDs as `key` props instead of array indices?',
      options: [
        'Array indices cause JSX syntax errors in strict mode',
        'Stable keys preserve component state and DOM identity across reordering or insertions',
        'Keys automatically encrypt component props',
        'Array indices disable CSS transitions',
      ],
      correctIndex: 1,
      explanation: 'Reconciliation relies on keys to match elements; index keys corrupt state when items shift.',
    },
    {
      id: 'q_react_2',
      skillId: 'react',
      prompt: 'When does a `useEffect` cleanup function execute?',
      options: [
        'Only when the browser tab closes',
        'Before the effect re-runs on dependency changes and when the component unmounts',
        'Immediately before the first render',
        'Only if an error boundary catches an exception',
      ],
      correctIndex: 1,
      explanation: 'Cleanups tear down subscriptions and timers prior to re-execution and unmount.',
    },
  ],
  python: [
    {
      id: 'q_py_1',
      skillId: 'python',
      prompt: 'Why is `def add_item(x, items=[]):` considered a Python pitfall?',
      options: [
        'Lists cannot be passed to functions in Python 3',
        'The default list is created once at function definition time and shared across calls',
        'Python raises a TypeError on the second call',
        'It allocates a new thread per call',
      ],
      correctIndex: 1,
      explanation: 'Use `items=None` and initialize `items = []` inside the function body.',
    },
    {
      id: 'q_py_2',
      skillId: 'python',
      prompt: 'What is the average membership lookup complexity `x in collection` for a `set` vs a `list`?',
      options: [
        'O(1) average for set, O(n) for list',
        'O(log n) for both',
        'O(n) for set, O(1) for list',
        'O(n log n) for set',
      ],
      correctIndex: 0,
      explanation: 'Sets are hash tables with O(1) average lookup; lists require linear O(n) scans.',
    },
  ],
  sql: [
    {
      id: 'q_sql_1',
      skillId: 'sql',
      prompt: 'What is the key difference between `WHERE` and `HAVING` in SQL?',
      options: [
        'WHERE filters rows before aggregation; HAVING filters groups after GROUP BY',
        'HAVING runs before FROM; WHERE runs after ORDER BY',
        'WHERE supports aggregate functions like SUM()',
        'They are identical aliases in ANSI SQL',
      ],
      correctIndex: 0,
      explanation: 'WHERE filters raw rows prior to grouping; HAVING filters aggregated groups.',
    },
    {
      id: 'q_sql_2',
      skillId: 'sql',
      prompt: 'What advantage do SQL window functions (`OVER (...)`) provide over standard `GROUP BY`?',
      options: [
        'They delete duplicate rows permanently',
        'They compute aggregates across partitions while preserving every individual row',
        'They disable database transactions',
        'They bypass foreign key constraints',
      ],
      correctIndex: 1,
      explanation: 'Window functions keep row-level granularity while adding running totals or rankings.',
    },
  ],
  typescript: [
    {
      id: 'q_ts_1',
      skillId: 'typescript',
      prompt: 'Why is `unknown` preferred over `any` for untrusted API payloads?',
      options: [
        'unknown runs faster in Node.js',
        'unknown requires type narrowing before property access or assignment',
        'any is deprecated in ES2023',
        'unknown strips all runtime checks automatically',
      ],
      correctIndex: 1,
      explanation: 'TypeScript enforces runtime validation/narrowing on `unknown`, preventing silent type holes.',
    },
    {
      id: 'q_ts_2',
      skillId: 'typescript',
      prompt: 'What enables exhaustive `switch` checking on a TypeScript discriminated union?',
      options: [
        'Assigning the default branch to `never`',
        'Marking every property optional',
        'Using `eval()` at compile time',
        'Disabling strictNullChecks',
      ],
      correctIndex: 0,
      explanation: 'Assigning an unhandled case to `never` causes a compile-time error if a union member is missed.',
    },
  ],

  // MEDICAL & HEALTHCARE
  pharmacology: [
    {
      id: 'q_pharm_1',
      skillId: 'pharmacology',
      prompt: 'In first-order pharmacokinetics, approximately how many elimination half-lives are required for a drug to reach steady-state plasma concentration (~97%) under constant-rate dosing?',
      options: [
        '1 half-life',
        '2 half-lives',
        '4 to 5 half-lives',
        '10 half-lives',
      ],
      correctIndex: 2,
      explanation: 'After 4–5 half-lives, 93.75%–96.88% of steady-state concentration is achieved in first-order elimination.',
    },
    {
      id: 'q_pharm_2',
      skillId: 'pharmacology',
      prompt: 'What characterizes a medication with a narrow therapeutic index (e.g., warfarin, digoxin, lithium)?',
      options: [
        'A wide margin between minimum effective concentration and toxic concentration',
        'A small separation between therapeutic efficacy and toxicity, requiring close monitoring',
        'Zero hepatic or renal clearance',
        'Guaranteed oral bioavailability of 100%',
      ],
      correctIndex: 1,
      explanation: 'Narrow therapeutic index medications require careful dosing calibration and lab monitoring because minor shifts risk toxicity.',
    },
  ],
  human_physiology: [
    {
      id: 'q_phys_1',
      skillId: 'human_physiology',
      prompt: 'How does the respiratory system rapidly compensate for metabolic acidosis in an educational physiology model?',
      options: [
        'Decreasing respiratory rate to retain CO2',
        'Increasing alveolar ventilation to blow off CO2 and raise arterial pH',
        'Stopping renal bicarbonate reabsorption immediately',
        'Decreasing cardiac output by 50%',
      ],
      correctIndex: 1,
      explanation: 'Hyperventilation lowers PaCO2 rapidly, shifting the bicarbonate buffer equilibrium to reduce H+ concentration.',
    },
    {
      id: 'q_phys_2',
      skillId: 'human_physiology',
      prompt: 'According to the Frank-Starling mechanism of the heart, what increases ventricular stroke volume?',
      options: [
        'Increased end-diastolic volume stretching myocardial sarcomeres within physiological limits',
        'Complete absence of venous return',
        'Lower preload during diastole',
        'Closed aortic valve during systole',
      ],
      correctIndex: 0,
      explanation: 'Greater venous return increases preload and sarcomere overlap, generating stronger systolic contraction.',
    },
  ],
  clinical_reasoning: [
    {
      id: 'q_clin_1',
      skillId: 'clinical_reasoning',
      prompt: 'In structured educational case synthesis, why are red-flag vital signs evaluated before narrow specialty differentials?',
      options: [
        'To prioritize immediate physiological stability and rule out high-acuity threats first',
        'Because vital signs replace laboratory diagnostics permanently',
        'To skip patient history entirely',
        'Only for outpatient billing codes',
      ],
      correctIndex: 0,
      explanation: 'Structured triage prioritizes airway, breathing, circulation, and hemodynamic red flags before narrow differentials.',
    },
    {
      id: 'q_clin_2',
      skillId: 'clinical_reasoning',
      prompt: 'How does Bayes’ theorem guide diagnostic test interpretation in clinical epidemiology?',
      options: [
        'Post-test probability depends on both pre-test probability and test sensitivity/specificity',
        'A positive screening test guarantees 100% disease presence regardless of prevalence',
        'Specificity only matters when prevalence is zero',
        'Pre-test probability is ignored after imaging',
      ],
      correctIndex: 0,
      explanation: 'Positive predictive value rises with higher pre-test probability and higher test specificity.',
    },
  ],

  // MECHANICAL ENGINEERING
  engineering_mechanics: [
    {
      id: 'q_mech_1',
      skillId: 'engineering_mechanics',
      prompt: 'Which set of scalar equations is necessary and sufficient for static equilibrium of a rigid body in 2D?',
      options: [
        'ΣFx = 0 and ΣFy = 0 only',
        'ΣFx = 0, ΣFy = 0, and ΣMz = 0 about any chosen point',
        'ΣMz = 0 only',
        'Kinetic energy equals potential energy',
      ],
      correctIndex: 1,
      explanation: 'Both net force in X/Y and net moment about any reference point must be zero for 2D static equilibrium.',
    },
    {
      id: 'q_mech_2',
      skillId: 'engineering_mechanics',
      prompt: 'In a cantilever beam of length L carrying a tip point load P, where does maximum bending moment occur?',
      options: [
        'At the free tip (moment = P·L)',
        'At the fixed wall support (magnitude = P·L)',
        'At the mid-span only',
        'Bending moment is zero everywhere',
      ],
      correctIndex: 1,
      explanation: 'The reaction moment at the fixed support balances the lever arm P·L.',
    },
  ],
  materials_strength: [
    {
      id: 'q_mat_1',
      skillId: 'materials_strength',
      prompt: 'Which stress criterion is standard for predicting yielding of ductile metals under multiaxial loading?',
      options: [
        'von Mises (distortion energy) equivalent stress compared to yield strength',
        'Ultimate brittle fracture strain alone',
        'Thermal conductivity coefficient',
        'Poisson ratio multiplied by density',
      ],
      correctIndex: 0,
      explanation: 'Ductile metals yield primarily via shear distortion energy, modeled accurately by von Mises stress.',
    },
    {
      id: 'q_mat_2',
      skillId: 'materials_strength',
      prompt: 'Doubling the height h of a rectangular beam cross-section increases its area moment of inertia I = b·h³/12 by what factor?',
      options: ['2×', '4×', '8×', '16×'],
      correctIndex: 2,
      explanation: 'Because I scales with h³, doubling depth increases bending stiffness 2³ = 8 times.',
    },
  ],
  thermodynamics: [
    {
      id: 'q_thermo_1',
      skillId: 'thermodynamics',
      prompt: 'What determines the theoretical maximum efficiency of any reversible heat engine operating between reservoirs Th and Tc (in Kelvin)?',
      options: [
        '1 - (Tc / Th)',
        'Tc / Th',
        '(Th - Tc) / Tc',
        'Working fluid density only',
      ],
      correctIndex: 0,
      explanation: 'Carnot efficiency η = 1 - Tc/Th depends solely on absolute Kelvin temperatures of the hot and cold reservoirs.',
    },
    {
      id: 'q_thermo_2',
      skillId: 'thermodynamics',
      prompt: 'In steady-state 1D Fourier heat conduction through a flat wall, heat flux q″ is proportional to:',
      options: [
        'Thermal conductivity k times the negative temperature gradient (-dT/dx)',
        'Velocity squared',
        'Specific heat times pressure squared',
        'Wall thickness squared',
      ],
      correctIndex: 0,
      explanation: 'Fourier’s law states q″ = -k (dT/dx), flowing from higher to lower temperature.',
    },
  ],

  // ELECTRONICS & ELECTRICAL
  circuit_analysis: [
    {
      id: 'q_circ_1',
      skillId: 'circuit_analysis',
      prompt: 'What is the time constant τ of a series RC circuit with resistance R and capacitance C?',
      options: ['τ = R / C', 'τ = R · C', 'τ = 1 / (R · C)', 'τ = √(R · C)'],
      correctIndex: 1,
      explanation: 'In a first-order RC network, τ = R × C (in seconds for Ohms × Farads).',
    },
    {
      id: 'q_circ_2',
      skillId: 'circuit_analysis',
      prompt: 'Kirchhoff’s Current Law (KCL) at any circuit node is a direct consequence of:',
      options: [
        'Conservation of electric charge',
        'Faraday magnetic induction',
        'Ohmic heating losses',
        'Skin effect at DC',
      ],
      correctIndex: 0,
      explanation: 'Charge cannot accumulate instantaneously at an ideal circuit node, so incoming and outgoing currents sum to zero.',
    },
  ],
  embedded_systems: [
    {
      id: 'q_emb_1',
      skillId: 'embedded_systems',
      prompt: 'Why should an Interrupt Service Routine (ISR) in embedded C avoid blocking delays or heap allocations?',
      options: [
        'Blocking inside an ISR delays higher/same-priority interrupts and risks priority inversion or watchdog resets',
        'Microcontrollers cannot execute integer math inside ISRs',
        'SPI buses require 10-second sleep calls in every ISR',
        'ISRs run only once at power-on',
      ],
      correctIndex: 0,
      explanation: 'Best practice keeps ISRs deterministic and short: set flags or push to a lock-free ring buffer for main/RTOS tasks.',
    },
    {
      id: 'q_emb_2',
      skillId: 'embedded_systems',
      prompt: 'Which communication bus supports multi-device addressing using only two open-drain lines (SDA, SCL) with pull-up resistors?',
      options: ['SPI', 'I2C', 'RS-232', 'JTAG'],
      correctIndex: 1,
      explanation: 'I2C uses SDA (data) and SCL (clock) with open-drain pull-ups and 7/10-bit device addressing.',
    },
  ],
  signal_processing: [
    {
      id: 'q_dsp_1',
      skillId: 'signal_processing',
      prompt: 'According to the Nyquist-Shannon sampling theorem, to avoid aliasing when digitizing a bandlimited signal of maximum frequency fmax, the sampling rate fs must satisfy:',
      options: ['fs > 2 · fmax', 'fs = fmax / 2', 'fs < fmax', 'fs = √fmax'],
      correctIndex: 0,
      explanation: 'Sampling strictly above 2·fmax prevents spectral replicas from overlapping and causing aliasing.',
    },
    {
      id: 'q_dsp_2',
      skillId: 'signal_processing',
      prompt: 'What is a key structural advantage of Finite Impulse Response (FIR) digital filters over IIR filters?',
      options: [
        'FIR filters are unconditionally stable and can achieve exact linear phase',
        'FIR filters always require fewer coefficients than 1st-order IIR filters',
        'FIR filters do not need discrete-time samples',
        'FIR filters amplify DC offsets infinitely',
      ],
      correctIndex: 0,
      explanation: 'Without feedback poles, non-recursive FIR filters are always BIBO stable and easily designed for linear phase.',
    },
  ],

  // ROBOTICS & AUTOMATION
  control_systems: [
    {
      id: 'q_ctrl_1',
      skillId: 'control_systems',
      prompt: 'Which PID controller term specifically eliminates steady-state error under a constant step disturbance or load?',
      options: [
        'Proportional (P) term alone',
        'Integral (I) term',
        'Derivative (D) term alone',
        'Sensor quantization noise',
      ],
      correctIndex: 1,
      explanation: 'The Integral action accumulates residual error over time until steady-state offset reaches zero.',
    },
    {
      id: 'q_ctrl_2',
      skillId: 'control_systems',
      prompt: 'What does excessive Derivative (D) gain typically cause in a physical robot actuator loop with noisy encoder feedback?',
      options: [
        'High-frequency motor chatter and control amplification of measurement noise',
        'Zero bandwidth response',
        'Infinite steady-state integral windup',
        'Elimination of encoder resolution limits',
      ],
      correctIndex: 0,
      explanation: 'Differentiating noisy sensor readings amplifies high-frequency jitter unless low-pass filtered.',
    },
  ],
  ros2_robotics: [
    {
      id: 'q_ros_1',
      skillId: 'ros2_robotics',
      prompt: 'In ROS 2, when should you use a `Service` or `Action` instead of a continuous `Topic`?',
      options: [
        'Use Topics for continuous sensor streams, Services for quick request/reply, and Actions for long-running preemptible goals like navigation',
        'Topics cannot carry numeric floats',
        'Actions replace URDF files completely',
        'Services broadcast high-frequency 100Hz LiDAR point clouds best',
      ],
      correctIndex: 0,
      explanation: 'ROS 2 separates pub/sub Topics, synchronous-style Services, and feedback-driven preemptible Actions.',
    },
    {
      id: 'q_ros_2',
      skillId: 'ros2_robotics',
      prompt: 'What is the role of the `TF2` transform tree (`map -> odom -> base_link -> lidar_link`) in a mobile robot?',
      options: [
        'Maintains time-indexed 3D coordinate transformations between reference frames across the robot and world',
        'Compiles C++ packages via colcon',
        'Replaces motor PWM drivers',
        'Stores Docker container images',
      ],
      correctIndex: 0,
      explanation: 'TF2 lets perception and navigation nodes accurately project sensor data across moving and fixed frames over time.',
    },
  ],
  sensors_actuators: [
    {
      id: 'q_sens_1',
      skillId: 'sensors_actuators',
      prompt: 'How does adding a 10:1 reduction gearbox (ignoring losses) affect output shaft torque and angular speed of a DC motor?',
      options: [
        'Output torque increases 10× while output speed decreases to 1/10',
        'Both torque and speed increase 10×',
        'Torque drops to 1/10 while speed increases 10×',
        'Neither torque nor speed changes',
      ],
      correctIndex: 0,
      explanation: 'Gear reduction trades angular velocity for mechanical torque advantage (P = τ · ω conserved).',
    },
    {
      id: 'q_sens_2',
      skillId: 'sensors_actuators',
      prompt: 'Why is an IMU gyroscope alone insufficient for long-horizon robot heading estimation without magnetometer/odometry fusion?',
      options: [
        'Integrating angular rate bias causes unbounded orientation drift over time',
        'Gyroscopes only work underwater',
        'Gyroscopes cannot measure yaw rotation',
        'IMUs have zero sampling latency',
      ],
      correctIndex: 0,
      explanation: 'Small zero-rate bias integrates linearly into growing angle error; Kalman/EKF fusion bounds drift.',
    },
  ],

  // CIVIL & ARCHITECTURE
  structural_analysis: [
    {
      id: 'q_str_1',
      skillId: 'structural_analysis',
      prompt: 'For a simply supported beam of span L carrying a uniformly distributed load w (kN/m), what is the maximum bending moment at mid-span?',
      options: ['w · L² / 8', 'w · L / 2', 'w · L² / 2', 'w · L³ / 12'],
      correctIndex: 0,
      explanation: 'Standard beam theory yields Mmax = wL²/8 at mid-span for a simply supported uniformly loaded span.',
    },
    {
      id: 'q_str_2',
      skillId: 'structural_analysis',
      prompt: 'In reinforced concrete beams under positive bending moment, why is steel rebar placed primarily near the bottom tension face?',
      options: [
        'Concrete is strong in compression but weak in tension, so steel carries tensile stresses',
        'Steel has higher thermal expansion at the top',
        'To reduce concrete weight by 90%',
        'Concrete resists tension better than steel',
      ],
      correctIndex: 0,
      explanation: 'Composite action pairs concrete compressive strength at the top with ductile steel tensile reinforcement at the bottom.',
    },
  ],
  construction_pm: [
    {
      id: 'q_cpm_1',
      skillId: 'construction_pm',
      prompt: 'In Critical Path Method (CPM) scheduling, how much Total Float do activities on the critical path possess?',
      options: ['Zero float (delays directly extend project completion)', '30 days minimum', 'Double the project duration', 'Equal to Cost Performance Index'],
      correctIndex: 0,
      explanation: 'Critical-path tasks have zero schedule slack; any slip delays the finish milestone.',
    },
    {
      id: 'q_cpm_2',
      skillId: 'construction_pm',
      prompt: 'In Earned Value Management, what does a Cost Performance Index (CPI = EV / AC) of 0.80 indicate?',
      options: [
        'The project is over budget (getting $0.80 of earned value per $1.00 spent)',
        'The project is 20% under budget',
        'The project is ahead of schedule by 80%',
        'Zero change orders occurred',
      ],
      correctIndex: 0,
      explanation: 'CPI < 1.0 indicates cost overrun; CPI > 1.0 indicates cost savings.',
    },
  ],

  // SCIENCE & RESEARCH
  statistics: [
    {
      id: 'q_stat_1',
      skillId: 'statistics',
      prompt: 'What does statistical power (1 - β) measure in experimental hypothesis testing?',
      options: [
        'The probability of correctly rejecting a false null hypothesis (detecting a true effect)',
        'The probability of committing a Type I false positive error',
        'The sample mean divided by variance',
        'The correlation coefficient squared',
      ],
      correctIndex: 0,
      explanation: 'Higher power (commonly 0.80+) reduces Type II false negatives when a genuine effect exists.',
    },
    {
      id: 'q_stat_2',
      skillId: 'statistics',
      prompt: 'Why should sample size be fixed before running a significance test rather than peeking and stopping once p < 0.05?',
      options: [
        'Optional stopping inflates the false-positive Type I error rate well above α = 0.05',
        'Larger samples lower statistical power',
        'p-values increase monotonically with sample size',
        'Peeking forces normal distributions to become uniform',
      ],
      correctIndex: 0,
      explanation: 'Repeated unadjusted peeking raises false-discovery probability; use preregistered sample sizes or sequential alpha spending.',
    },
  ],
  analytical_chemistry: [
    {
      id: 'q_chem_1',
      skillId: 'analytical_chemistry',
      prompt: 'According to the Beer-Lambert Law (A = ε · b · c), if path length b and molar absorptivity ε are constant, how does doubling analyte concentration c affect absorbance A (within linear range)?',
      options: [
        'Absorbance doubles linearly',
        'Absorbance halves',
        'Absorbance increases by c²',
        'Absorbance stays unchanged',
      ],
      correctIndex: 0,
      explanation: 'Within linear analytical calibration bounds, absorbance is directly proportional to molar concentration.',
    },
    {
      id: 'q_chem_2',
      skillId: 'analytical_chemistry',
      prompt: 'What is the purpose of running a reagent blank alongside calibration standards in spectrophotometry or HPLC?',
      options: [
        'To subtract background solvent/matrix signal and establish zero-analyte baseline',
        'To intentionally saturate the detector',
        'To replace internal calibration standards',
        'To double the sample molarity',
      ],
      correctIndex: 0,
      explanation: 'Blanks correct for solvent, cuvette, and reagent absorbance independent of the analyte.',
    },
  ],

  // BUSINESS & MANAGEMENT
  financial_modeling: [
    {
      id: 'q_fin_1',
      skillId: 'financial_modeling',
      prompt: 'What decision rule applies when evaluating an independent capital project using Net Present Value (NPV) discounted at the firm’s cost of capital?',
      options: [
        'Accept the project when NPV > 0 because discounted cash inflows exceed initial investment',
        'Accept only when NPV < 0',
        'Ignore the time value of money completely',
        'Choose the highest initial outlay regardless of cash flows',
      ],
      correctIndex: 0,
      explanation: 'Positive NPV indicates the project creates economic value above the required hurdle rate.',
    },
    {
      id: 'q_fin_2',
      skillId: 'financial_modeling',
      prompt: 'If a SaaS product generates $120 monthly ARPU at 75% gross margin and costs $540 to acquire a customer (CAC), what is the CAC payback period?',
      options: ['4 months', '6 months', '9 months', '12 months'],
      correctIndex: 1,
      explanation: 'Monthly gross profit = $120 × 0.75 = $90/mo; $540 / $90 = 6 months payback.',
    },
  ],
  operations_supply_chain: [
    {
      id: 'q_ops_1',
      skillId: 'operations_supply_chain',
      prompt: 'According to Little’s Law (L = λ · W), if average throughput λ is 20 orders/hour and average cycle time W is 1.5 hours, what is average Work-In-Process inventory L?',
      options: ['13.3 orders', '30 orders', '21.5 orders', '15 orders'],
      correctIndex: 1,
      explanation: 'L = λ × W = 20 × 1.5 = 30 orders concurrently in the system.',
    },
    {
      id: 'q_ops_2',
      skillId: 'operations_supply_chain',
      prompt: 'In Theory of Constraints, where does adding 1 hour of capacity directly increase total end-to-end system throughput?',
      options: [
        'At the system bottleneck station',
        'At the fastest upstream non-bottleneck station',
        'By increasing safety stock behind the bottleneck only',
        'Removing quality inspection downstream',
      ],
      correctIndex: 0,
      explanation: 'Only elevating the constraint (bottleneck) increases total line throughput.',
    },
  ],

  // DESIGN & CREATIVE
  design_foundations: [
    {
      id: 'q_des_1',
      skillId: 'design_foundations',
      prompt: 'What minimum contrast ratio does WCAG 2.2 Level AA require for normal-sized body text against its background?',
      options: ['2.0 : 1', '3.0 : 1', '4.5 : 1', '10.0 : 1'],
      correctIndex: 2,
      explanation: 'WCAG AA specifies 4.5:1 for normal text and 3:1 for large text (18pt+ or 14pt+ bold).',
    },
    {
      id: 'q_des_2',
      skillId: 'design_foundations',
      prompt: 'Why should UI status indicators pair color with an icon or explicit text label rather than color alone?',
      options: [
        'To remain perceivable for users with color-vision deficiency and screen readers',
        'Because CSS only supports three hex colors',
        'To increase vertical scroll height',
        'To disable responsive breakpoints',
      ],
      correctIndex: 0,
      explanation: 'WCAG 1.4.1 (Use of Color) mandates that color is never the sole visual means of conveying information.',
    },
  ],
  ux_research_ia: [
    {
      id: 'q_ux_1',
      skillId: 'ux_research_ia',
      prompt: 'Which research method is best suited for validating how users mentally group and label top-level navigation categories?',
      options: [
        'Open or closed card sorting combined with tree testing',
        'A/B testing button border radius only',
        'Measuring server CPU utilization',
        'Writing production SQL migrations',
      ],
      correctIndex: 0,
      explanation: 'Card sorting reveals users’ mental models; tree testing measures findability across the proposed IA hierarchy.',
    },
    {
      id: 'q_ux_2',
      skillId: 'ux_research_ia',
      prompt: 'Which Nielsen Norman usability heuristic states that users should always be informed about what is going on through timely feedback?',
      options: [
        'Visibility of system status',
        'Aesthetic and minimalist design',
        'Help and documentation',
        'Recognition rather than recall',
      ],
      correctIndex: 0,
      explanation: 'Visibility of system status ensures loading states, save confirmations, and progress indicators keep users oriented.',
    },
  ],

  // EDUCATION & TEACHING
  curriculum_instruction: [
    {
      id: 'q_edu_1',
      skillId: 'curriculum_instruction',
      prompt: 'In Backward Design (Understanding by Design), what is the correct first step when building a new unit?',
      options: [
        'Define desired learning outcomes and enduring understandings before choosing activities',
        'Pick textbook chapters at random and grade without a rubric',
        'Write final exam questions without aligning them to objectives',
        'Skip prerequisite checks for incoming learners',
      ],
      correctIndex: 0,
      explanation: 'Backward Design starts with desired outcomes, then evidence/assessments, then instructional activities.',
    },
    {
      id: 'q_edu_2',
      skillId: 'curriculum_instruction',
      prompt: 'Which Bloom taxonomy level asks learners to build, design, or synthesize an original artifact rather than merely recall facts?',
      options: ['Remember', 'Understand', 'Create', 'List'],
      correctIndex: 2,
      explanation: 'Create sits at the top of revised Bloom taxonomy and assesses synthesis and production.',
    },
  ],

  // FINANCE & ACCOUNTING
  financial_accounting: [
    {
      id: 'q_fin_acc_1',
      skillId: 'financial_accounting',
      prompt: 'Under the fundamental accounting equation, if a company purchases ₹5,00,000 of equipment using ₹2,00,000 cash and ₹3,00,000 bank loan, what happens to total assets and liabilities?',
      options: [
        'Assets increase by ₹3,00,000 net and Liabilities increase by ₹3,00,000',
        'Assets decrease by ₹5,00,000 and Equity increases by ₹5,00,000',
        'Assets stay unchanged and Liabilities decrease by ₹3,00,000',
        'Liabilities increase by ₹5,00,000 while Cash increases',
      ],
      correctIndex: 0,
      explanation: 'Equipment +₹5L and Cash -₹2L gives +₹3L net Assets; Bank Loan increases Liabilities by +₹3L, preserving Assets = Liabilities + Equity.',
    },
    {
      id: 'q_fin_acc_2',
      skillId: 'financial_accounting',
      prompt: 'Which financial statement reconciles opening cash to closing cash across Operating, Investing, and Financing activities?',
      options: [
        'Statement of Cash Flows',
        'Statement of Changes in Equity',
        'Trial Balance Only',
        'Fixed Asset Register',
      ],
      correctIndex: 0,
      explanation: 'The Statement of Cash Flows classifies cash movements into Operating, Investing, and Financing.',
    },
  ],

  // AGRICULTURE & ENVIRONMENTAL SCIENCE
  agronomy_soil_science: [
    {
      id: 'q_agri_1',
      skillId: 'agronomy_soil_science',
      prompt: 'Why is soil pH monitoring essential before applying NPK fertilizers to field crops?',
      options: [
        'Extreme acidic or alkaline pH locks up phosphorus and micronutrients, reducing plant uptake efficiency',
        'Soil pH only affects tractor tire traction',
        'Higher pH eliminates the need for irrigation water',
        'Soil pH replaces nitrogen fixation completely',
      ],
      correctIndex: 0,
      explanation: 'Nutrient availability peaks near pH 6.0–7.0 for most crops; out-of-range pH causes nutrient tie-up.',
    },
    {
      id: 'q_agri_2',
      skillId: 'agronomy_soil_science',
      prompt: 'What does an elevated Normalized Difference Vegetation Index (NDVI) value (e.g., 0.72) typically indicate in healthy cropland?',
      options: [
        'Dense, photosynthetically active green canopy reflecting near-infrared light strongly',
        'Bare dry concrete with zero chlorophyll',
        'Standing deep water with no vegetation',
        'Severe drought stress and complete leaf senescence',
      ],
      correctIndex: 0,
      explanation: 'Healthy chlorophyll absorbs red light and leaf cell structure reflects NIR, raising NDVI = (NIR - Red)/(NIR + Red).',
    },
  ],
};

export const CODING_CHALLENGES: Record<string, CodingChallenge> = {
  javascript: {
    id: 'ch_javascript',
    skillId: 'javascript',
    skillName: 'JavaScript (ES2023+)',
    title: 'Prerequisite-Ready Skill Filter',
    description:
      'Implement `findReadySkills(skills, completedIds)` returning sorted IDs of skills that are NOT yet completed and have all prerequisites satisfied in `completedIds`.',
    language: 'javascript',
    functionName: 'findReadySkills',
    starterCode: `function findReadySkills(skills, completedIds) {
  // skills: Array<{ id: string, prerequisites: string[] }>
  // completedIds: string[]
  // Return sorted array of skill IDs ready to learn next
  return [];
}`,
    solutionHint: 'Convert completedIds into a Set, filter where !done.has(s.id) && s.prerequisites.every(p => done.has(p)), map to s.id, and sort().',
    testCases: [
      {
        id: 'tc_js_1',
        description: 'Unlocks JavaScript after HTML/CSS is complete, keeps React locked',
        inputJson:
          '[[{"id":"html_css","prerequisites":[]},{"id":"javascript","prerequisites":["html_css"]},{"id":"react","prerequisites":["javascript","html_css"]}],["html_css"]]',
        expectedJson: '["javascript"]',
      },
      {
        id: 'tc_js_2',
        description: 'Returns multiple ready skills sorted alphabetically',
        inputJson:
          '[[{"id":"sql","prerequisites":[]},{"id":"git","prerequisites":[]},{"id":"postgresql","prerequisites":["sql"]}],[]]',
        expectedJson: '["git","sql"]',
      },
      {
        id: 'tc_js_3',
        description: 'Excludes already completed skills',
        inputJson:
          '[[{"id":"git","prerequisites":[]},{"id":"docker","prerequisites":["linux"]}],["git","linux"]]',
        expectedJson: '["docker"]',
      },
    ],
  },
  react: {
    id: 'ch_react',
    skillId: 'react',
    skillName: 'React & Component Architecture',
    title: 'Immutable Roadmap Step Toggle Reducer',
    description:
      'Implement `toggleStepReducer(steps, stepId)` returning a NEW array where only the matching step has its `completed` boolean inverted, without mutating input objects.',
    language: 'javascript',
    functionName: 'toggleStepReducer',
    starterCode: `function toggleStepReducer(steps, stepId) {
  // Return a new array with matching stepId's completed flag toggled
  return steps;
}`,
    solutionHint: 'Use steps.map(step => step.id === stepId ? { ...step, completed: !step.completed } : step).',
    testCases: [
      {
        id: 'tc_react_1',
        description: 'Toggles false -> true for matching step',
        inputJson: '[[{"id":"s1","completed":false},{"id":"s2","completed":true}],"s1"]',
        expectedJson: '[{"id":"s1","completed":true},{"id":"s2","completed":true}]',
      },
      {
        id: 'tc_react_2',
        description: 'Toggles true -> false for matching step',
        inputJson: '[[{"id":"s1","completed":true}],"s1"]',
        expectedJson: '[{"id":"s1","completed":false}]',
      },
    ],
  },
  typescript: {
    id: 'ch_typescript',
    skillId: 'typescript',
    skillName: 'TypeScript',
    title: 'Weighted Role Readiness Calculator',
    description:
      'Implement `computeWeightedReadiness(requirements, userLevels)` returning rounded percentage (0-100) using `Math.min(1, level / targetLevel) * weight` summed over total weight.',
    language: 'javascript',
    functionName: 'computeWeightedReadiness',
    starterCode: `function computeWeightedReadiness(requirements, userLevels) {
  // requirements: Array<{ skillId: string, targetLevel: number, weight: number }>
  // userLevels: Record<string, number>
  return 0;
}`,
    solutionHint: 'Cap attainment at 1 per skill, multiply by weight, divide by total weight, and Math.round(* 100).',
    testCases: [
      {
        id: 'tc_ts_1',
        description: 'Computes partial weighted readiness accurately',
        inputJson:
          '[[{"skillId":"js","targetLevel":4,"weight":5},{"skillId":"sql","targetLevel":4,"weight":5}],{"js":2,"sql":4}]',
        expectedJson: '75',
      },
      {
        id: 'tc_ts_2',
        description: 'Caps over-qualified skill attainment at 100%',
        inputJson: '[[{"skillId":"py","targetLevel":3,"weight":4}],{"py":5}]',
        expectedJson: '100',
      },
    ],
  },
  python: {
    id: 'ch_python',
    skillId: 'python',
    skillName: 'Python Programming',
    title: 'Skill Level Deduplication & Max Merge',
    description:
      'Implement `mergeSkillLevels(records)` accepting `Array<{ skill: string, level: number }>` and returning a plain object mapping normalized lowercase skill names to their highest level.',
    language: 'javascript',
    functionName: 'mergeSkillLevels',
    starterCode: `function mergeSkillLevels(records) {
  // Normalize skill names (trim + lowercase) and retain highest level
  return {};
}`,
    solutionHint: 'Iterate records, normalize key = r.skill.trim().toLowerCase(), and store Math.max(acc[key] ?? 0, r.level).',
    testCases: [
      {
        id: 'tc_py_1',
        description: 'Merges duplicate casing entries keeping maximum level',
        inputJson: '[[{"skill":"Python","level":3},{"skill":" python ","level":4.5},{"skill":"SQL","level":4}]]',
        expectedJson: '{"python":4.5,"sql":4}',
      },
    ],
  },
  sql: {
    id: 'ch_sql',
    skillId: 'sql',
    skillName: 'SQL & Relational Modeling',
    title: 'At-Risk Cohort Query Filter',
    description:
      'Implement `filterAtRiskLearners(learners, threshold)` returning IDs of learners strictly below `threshold` readiness, sorted ascending by readiness.',
    language: 'javascript',
    functionName: 'filterAtRiskLearners',
    starterCode: `function filterAtRiskLearners(learners, threshold) {
  // learners: Array<{ id: string, readiness: number }>
  return [];
}`,
    solutionHint: 'Filter l.readiness < threshold, sort((a,b) => a.readiness - b.readiness), map(l => l.id).',
    testCases: [
      {
        id: 'tc_sql_1',
        description: 'Filters and orders lowest readiness learners first',
        inputJson:
          '[[{"id":"u1","readiness":65},{"id":"u2","readiness":42},{"id":"u3","readiness":28}],50]',
        expectedJson: '["u3","u2"]',
      },
    ],
  },
};

export const DOMAIN_PRACTICAL_TASKS: Record<string, DomainPracticalTask> = {
  // MEDICAL & HEALTHCARE (with explicit educational disclaimer)
  pharmacology: {
    id: 'pt_pharmacology',
    skillId: 'pharmacology',
    skillName: 'Pharmacology & Pharmacokinetics',
    domainId: 'medical_healthcare',
    assessmentType: 'medical_case',
    title: 'Educational Pharmacokinetic Clearance Exercise',
    safetyDisclaimer: MEDICAL_SAFETY_DISCLAIMER,
    scenarioPrompt:
      'Educational Study Model: A simulated antimicrobial compound follows first-order elimination with a half-life (t1/2) of 6 hours. An initial educational loading dose produces a peak plasma concentration of 80 mg/L.',
    questionPrompt:
      'Assuming no additional doses are administered, what will the simulated plasma concentration (in mg/L) be after 18 hours (3 half-lives)?',
    inputMode: 'numeric',
    unitLabel: 'mg/L',
    expectedNumericValue: 10,
    numericTolerance: 0.5,
    solutionExplanation:
      'After 18 hours (18 / 6 = 3 half-lives), plasma concentration halves three times: 80 -> 40 -> 20 -> 10 mg/L.',
    referenceSampleAnswer: '10',
  },
  clinical_reasoning: {
    id: 'pt_clinical_reasoning',
    skillId: 'clinical_reasoning',
    skillName: 'Simulated Clinical Case Reasoning',
    domainId: 'medical_healthcare',
    assessmentType: 'medical_case',
    title: 'Educational Triage & Case Reasoning Simulation',
    safetyDisclaimer: MEDICAL_SAFETY_DISCLAIMER,
    scenarioPrompt:
      'Educational Vignette: A simulated 54-year-old presents in a textbook case study with sudden pleuritic chest discomfort, tachycardia (HR 118 bpm), tachypnea (RR 26), SpO2 89% on room air, and 3 days of unilateral calf swelling after an 11-hour flight.',
    questionPrompt:
      'Which structured educational reasoning step represents the highest-priority initial triage consideration in this textbook scenario?',
    inputMode: 'scenario_choice',
    options: [
      'Schedule routine elective follow-up in 4 weeks without acute evaluation',
      'Prioritize acute cardiopulmonary stability assessment and evaluate high-probability pulmonary embolism differential',
      'Attribute symptoms exclusively to mild dietary indigestion',
      'Discontinue oxygen saturation monitoring immediately',
    ],
    correctOptionIndex: 1,
    solutionExplanation:
      'Hypoxemia, tachycardia, tachypnea, pleuritic pain, and unilateral leg swelling after prolonged travel are classic textbook red flags requiring urgent cardiopulmonary evaluation.',
    referenceSampleAnswer: '1',
  },
  human_physiology: {
    id: 'pt_human_physiology',
    skillId: 'human_physiology',
    skillName: 'Human Physiology & Homeostasis',
    domainId: 'medical_healthcare',
    assessmentType: 'medical_case',
    title: 'Cardiopulmonary Cardiac Output Calculation',
    safetyDisclaimer: MEDICAL_SAFETY_DISCLAIMER,
    scenarioPrompt:
      'Educational Physiology Model: A simulated adult during moderate aerobic exercise has a heart rate of 140 beats/min and a stroke volume of 100 mL/beat.',
    questionPrompt: 'Calculate the simulated Cardiac Output (CO = HR × SV) in Liters per minute (L/min).',
    inputMode: 'numeric',
    unitLabel: 'L/min',
    expectedNumericValue: 14,
    numericTolerance: 0.3,
    solutionExplanation:
      'CO = 140 beats/min × 100 mL/beat = 14,000 mL/min = 14.0 L/min.',
    referenceSampleAnswer: '14',
  },
  patient_care_nursing: {
    id: 'pt_patient_care_nursing',
    skillId: 'patient_care_nursing',
    skillName: 'Patient Care & Clinical Safety Protocols',
    domainId: 'medical_healthcare',
    assessmentType: 'medical_case',
    title: 'Medication Safety Verification Protocol',
    safetyDisclaimer: MEDICAL_SAFETY_DISCLAIMER,
    scenarioPrompt:
      'Educational Safety Drill: During an educational nursing simulation, an order reads "1000 mL normal saline over 8 hours" using an infusion pump calibrated in mL/hr.',
    questionPrompt: 'What infusion rate (in mL/hr) should be verified on the simulated pump?',
    inputMode: 'numeric',
    unitLabel: 'mL/hr',
    expectedNumericValue: 125,
    numericTolerance: 1,
    solutionExplanation: 'Infusion rate = 1000 mL / 8 hours = 125 mL/hr.',
    referenceSampleAnswer: '125',
  },

  // MECHANICAL ENGINEERING
  engineering_mechanics: {
    id: 'pt_engineering_mechanics',
    skillId: 'engineering_mechanics',
    skillName: 'Engineering Statics & Dynamics',
    domainId: 'mechanical_engineering',
    assessmentType: 'engineering_calc',
    title: 'Cantilever Beam Reaction Moment Problem',
    scenarioPrompt:
      'A horizontal robotic gantry arm is modeled as a cantilever beam of length L = 2.5 m fixed at the base wall, supporting a downward actuator tip load of P = 400 N (neglect beam self-weight).',
    questionPrompt: 'Calculate the magnitude of the reaction bending moment at the fixed wall support in Newton-meters (N·m).',
    inputMode: 'numeric',
    unitLabel: 'N·m',
    expectedNumericValue: 1000,
    numericTolerance: 5,
    solutionExplanation: 'M = P × L = 400 N × 2.5 m = 1000 N·m.',
    referenceSampleAnswer: '1000',
  },
  materials_strength: {
    id: 'pt_materials_strength',
    skillId: 'materials_strength',
    skillName: 'Strength of Materials & Metallurgy',
    domainId: 'mechanical_engineering',
    assessmentType: 'engineering_calc',
    title: 'Axial Tensile Stress & Safety Factor Check',
    scenarioPrompt:
      'A 6061-T6 aluminum link (yield strength Sy = 275 MPa) has a rectangular cross-section of 20 mm × 10 mm and carries an axial tensile load of 22,000 N.',
    questionPrompt: 'Calculate the Factor of Safety (FoS = Yield Strength / Applied Axial Stress).',
    inputMode: 'numeric',
    unitLabel: 'FoS',
    expectedNumericValue: 2.5,
    numericTolerance: 0.1,
    solutionExplanation:
      'Area = 200 mm² = 2e-4 m². Applied stress σ = 22,000 N / 200 mm² = 110 MPa. FoS = 275 / 110 = 2.5.',
    referenceSampleAnswer: '2.5',
  },
  thermodynamics: {
    id: 'pt_thermodynamics',
    skillId: 'thermodynamics',
    skillName: 'Thermodynamics & Heat Transfer',
    domainId: 'mechanical_engineering',
    assessmentType: 'engineering_calc',
    title: 'Carnot Thermal Efficiency Analysis',
    scenarioPrompt:
      'An idealized heat engine operates between a hot reservoir at Th = 800 K and a cold ambient sink at Tc = 300 K.',
    questionPrompt: 'Calculate the theoretical maximum Carnot thermal efficiency as a percentage (%).',
    inputMode: 'numeric',
    unitLabel: '%',
    expectedNumericValue: 62.5,
    numericTolerance: 0.5,
    solutionExplanation: 'η = (1 - Tc/Th) × 100% = (1 - 300/800) × 100% = 62.5%.',
    referenceSampleAnswer: '62.5',
  },

  // ELECTRONICS & ELECTRICAL
  circuit_analysis: {
    id: 'pt_circuit_analysis',
    skillId: 'circuit_analysis',
    skillName: 'DC/AC Circuit Analysis',
    domainId: 'electronics_electrical',
    assessmentType: 'engineering_calc',
    title: 'RC Low-Pass Filter Time Constant',
    scenarioPrompt:
      'An analog sensor anti-aliasing filter uses a series resistor R = 10 kΩ (10,000 Ω) and a shunt capacitor C = 4.7 µF (4.7 × 10⁻⁶ F).',
    questionPrompt: 'Calculate the RC time constant τ = R × C in milliseconds (ms).',
    inputMode: 'numeric',
    unitLabel: 'ms',
    expectedNumericValue: 47,
    numericTolerance: 0.5,
    solutionExplanation: 'τ = 10,000 Ω × 4.7×10⁻⁶ F = 0.047 s = 47 ms.',
    referenceSampleAnswer: '47',
  },
  signal_processing: {
    id: 'pt_signal_processing',
    skillId: 'signal_processing',
    skillName: 'Signals, Systems & DSP',
    domainId: 'electronics_electrical',
    assessmentType: 'engineering_calc',
    title: 'Nyquist Minimum Sampling Rate',
    scenarioPrompt:
      'An industrial vibration accelerometer captures bearing harmonics up to a maximum bandlimited frequency of fmax = 4,500 Hz.',
    questionPrompt: 'What is the theoretical Nyquist rate (2 × fmax) in Hz required to prevent aliasing?',
    inputMode: 'numeric',
    unitLabel: 'Hz',
    expectedNumericValue: 9000,
    numericTolerance: 10,
    solutionExplanation: 'Nyquist rate = 2 × 4,500 Hz = 9,000 Hz (practical systems oversample further at 2.5×–10×).',
    referenceSampleAnswer: '9000',
  },
  embedded_systems: {
    id: 'pt_embedded_systems',
    skillId: 'embedded_systems',
    skillName: 'Embedded C & Microcontrollers',
    domainId: 'electronics_electrical',
    assessmentType: 'engineering_calc',
    title: 'STM32 PWM Timer Frequency Calculation',
    scenarioPrompt:
      'An ARM Cortex-M timer receives a 48 MHz (48,000,000 Hz) peripheral clock. You configure Prescaler PSC = 47 (dividing by PSC + 1 = 48) and Auto-Reload Register ARR = 999 (period = ARR + 1 = 1000 ticks).',
    questionPrompt: 'Calculate the resulting PWM output frequency in Hz.',
    inputMode: 'numeric',
    unitLabel: 'Hz',
    expectedNumericValue: 1000,
    numericTolerance: 5,
    solutionExplanation: 'Timer tick = 48 MHz / 48 = 1 MHz. PWM freq = 1,000,000 Hz / 1000 = 1000 Hz.',
    referenceSampleAnswer: '1000',
  },

  // ROBOTICS & AUTOMATION
  sensors_actuators: {
    id: 'pt_sensors_actuators',
    skillId: 'sensors_actuators',
    skillName: 'Sensors, Actuators & Mechatronics',
    domainId: 'robotics_automation',
    assessmentType: 'robotics_logic',
    title: 'Mobile Robot Wheel Torque & Gear Sizing',
    scenarioPrompt:
      'A drive motor produces continuous torque of 0.35 N·m coupled through a 12:1 planetary gearbox with 85% mechanical efficiency (η = 0.85).',
    questionPrompt: 'Calculate the net deliverable wheel shaft torque in N·m (rounded to 2 decimals).',
    inputMode: 'numeric',
    unitLabel: 'N·m',
    expectedNumericValue: 3.57,
    numericTolerance: 0.1,
    solutionExplanation: 'τ_out = τ_motor × GearRatio × η = 0.35 × 12 × 0.85 = 3.57 N·m.',
    referenceSampleAnswer: '3.57',
  },
  control_systems: {
    id: 'pt_control_systems',
    skillId: 'control_systems',
    skillName: 'Control Systems & PID / State Space',
    domainId: 'robotics_automation',
    assessmentType: 'robotics_logic',
    title: 'Closed-Loop PID Tuning & Stability Diagnosis',
    scenarioPrompt:
      'A robotic joint position loop exhibits persistent 4-degree steady-state sag under gravity load, even though Proportional gain Kp is high and step rise time is fast.',
    questionPrompt: 'Which control adjustment directly eliminates the constant gravity-load steady-state offset without destabilizing high-frequency derivative response?',
    inputMode: 'scenario_choice',
    options: [
      'Disable feedback encoders completely',
      'Introduce calibrated Integral (Ki) action (or gravity feedforward) with anti-windup clamping',
      'Multiply Derivative gain Kd by 50× without filtering',
      'Reduce sampling frequency to 0.5 Hz',
    ],
    correctOptionIndex: 1,
    solutionExplanation: 'Integral action (or model-based gravity compensation) integrates residual error to drive steady-state position error to zero.',
    referenceSampleAnswer: '1',
  },
  ros2_robotics: {
    id: 'pt_ros2_robotics',
    skillId: 'ros2_robotics',
    skillName: 'ROS2 Middleware & Robot Navigation',
    domainId: 'robotics_automation',
    assessmentType: 'robotics_logic',
    title: 'ROS 2 QoS Profile & Transform Diagnostics',
    scenarioPrompt:
      'A ROS 2 LiDAR publisher broadcasts high-rate scans using `Best Effort` reliability QoS, while a mapping subscriber uses `Reliable` QoS — resulting in zero received messages.',
    questionPrompt: 'Why did the ROS 2 DDS discovery fail to connect the publisher and subscriber, and what is the correct fix?',
    inputMode: 'scenario_choice',
    options: [
      'A Best Effort publisher cannot satisfy a Reliable subscriber (RxO incompatibility); align subscriber QoS to SensorDataQoS (Best Effort)',
      'ROS 2 requires Python 2.7 for LaserScan messages',
      'TF2 transforms must be deleted before subscribing',
      'Reliable QoS only works over Wi-Fi, never localhost',
    ],
    correctOptionIndex: 0,
    solutionExplanation: 'DDS Request-vs-Offered (RxO) rules prevent a Best Effort publisher from pairing with a Reliable subscriber; use SensorDataQoS on both.',
    referenceSampleAnswer: '0',
  },

  // CIVIL & ARCHITECTURE
  structural_analysis: {
    id: 'pt_structural_analysis',
    skillId: 'structural_analysis',
    skillName: 'Structural Analysis & Concrete/Steel Design',
    domainId: 'civil_architecture',
    assessmentType: 'engineering_calc',
    title: 'Simply Supported Girder Bending Moment',
    scenarioPrompt:
      'A simply supported steel floor girder spans L = 8.0 m and carries a factored uniformly distributed load of w = 15 kN/m.',
    questionPrompt: 'Calculate the maximum mid-span bending moment Mmax = w·L² / 8 in kN·m.',
    inputMode: 'numeric',
    unitLabel: 'kN·m',
    expectedNumericValue: 120,
    numericTolerance: 2,
    solutionExplanation: 'Mmax = (15 kN/m × 8² m²) / 8 = (15 × 64) / 8 = 120 kN·m.',
    referenceSampleAnswer: '120',
  },
  construction_pm: {
    id: 'pt_construction_pm',
    skillId: 'construction_pm',
    skillName: 'Construction Project Management & Scheduling',
    domainId: 'civil_architecture',
    assessmentType: 'engineering_calc',
    title: 'Earned Value CPI Variance Calculation',
    scenarioPrompt:
      'At month 4 of a civic infrastructure project, Planned Value (PV) = $500,000, Earned Value (EV) = $450,000, and Actual Cost (AC) = $500,000.',
    questionPrompt: 'Calculate the Cost Performance Index (CPI = EV / AC).',
    inputMode: 'numeric',
    unitLabel: 'CPI',
    expectedNumericValue: 0.9,
    numericTolerance: 0.02,
    solutionExplanation: 'CPI = EV / AC = $450,000 / $500,000 = 0.90 (project is running 10% over cost per unit work completed).',
    referenceSampleAnswer: '0.9',
  },

  // SCIENCE & RESEARCH
  analytical_chemistry: {
    id: 'pt_analytical_chemistry',
    skillId: 'analytical_chemistry',
    skillName: 'Analytical Chemistry & Spectroscopy',
    domainId: 'science_research',
    assessmentType: 'science_experiment',
    title: 'UV-Vis Beer-Lambert Concentration Determination',
    scenarioPrompt:
      'A standard UV-Vis assay measures an analyte with molar absorptivity ε = 5,000 L/(mol·cm) in a b = 1.0 cm quartz cuvette. Blank-corrected absorbance is A = 0.75.',
    questionPrompt: 'Calculate the analyte concentration c = A / (ε · b) in millimolar (mM, where 1 mM = 10⁻³ mol/L).',
    inputMode: 'numeric',
    unitLabel: 'mM',
    expectedNumericValue: 0.15,
    numericTolerance: 0.01,
    solutionExplanation: 'c = 0.75 / (5000 × 1.0) = 0.00015 mol/L = 0.15 mM.',
    referenceSampleAnswer: '0.15',
  },
  statistics: {
    id: 'pt_statistics',
    skillId: 'statistics',
    skillName: 'Probability & Statistics',
    domainId: 'science_research',
    assessmentType: 'science_experiment',
    title: 'Standard Error of the Mean Calculation',
    scenarioPrompt:
      'An empirical lab experiment records n = 100 independent measurements with sample standard deviation s = 12.0 units.',
    questionPrompt: 'Calculate the Standard Error of the Mean (SE = s / √n).',
    inputMode: 'numeric',
    unitLabel: 'units',
    expectedNumericValue: 1.2,
    numericTolerance: 0.05,
    solutionExplanation: 'SE = 12.0 / √100 = 12.0 / 10 = 1.2 units.',
    referenceSampleAnswer: '1.2',
  },

  // BUSINESS & MANAGEMENT
  financial_modeling: {
    id: 'pt_financial_modeling',
    skillId: 'financial_modeling',
    skillName: 'Financial Analysis & Valuation Modeling',
    domainId: 'business_management',
    assessmentType: 'business_case',
    title: 'Discounted Cash Flow (NPV) Capital Decision',
    scenarioPrompt:
      'An automation upgrade requires $100,000 upfront investment (Year 0) and generates a single guaranteed cash inflow of $132,000 at Year 1. The firm discount rate is 10% (r = 0.10).',
    questionPrompt: 'Calculate the Net Present Value (NPV = -100,000 + 132,000 / 1.10) in USD ($).',
    inputMode: 'numeric',
    unitLabel: 'USD',
    expectedNumericValue: 20000,
    numericTolerance: 100,
    solutionExplanation: 'PV of Year 1 inflow = $132,000 / 1.10 = $120,000. NPV = $120,000 - $100,000 = $20,000.',
    referenceSampleAnswer: '20000',
  },
  operations_supply_chain: {
    id: 'pt_operations_supply_chain',
    skillId: 'operations_supply_chain',
    skillName: 'Operations & Supply Chain Optimization',
    domainId: 'business_management',
    assessmentType: 'business_case',
    title: 'Little’s Law Fulfillment WIP Sizing',
    scenarioPrompt:
      'A distribution center processes λ = 45 customer shipments per hour with an average order dwell time of W = 2.0 hours inside packing lanes.',
    questionPrompt: 'Using Little’s Law (L = λ × W), how many orders are concurrently in-process inside the packing zone?',
    inputMode: 'numeric',
    unitLabel: 'orders',
    expectedNumericValue: 90,
    numericTolerance: 1,
    solutionExplanation: 'L = 45 orders/hr × 2.0 hrs = 90 orders.',
    referenceSampleAnswer: '90',
  },

  // DESIGN & CREATIVE
  design_foundations: {
    id: 'pt_design_foundations',
    skillId: 'design_foundations',
    skillName: 'Visual Hierarchy, Typography & Color',
    domainId: 'design_creative',
    assessmentType: 'design_critique',
    title: 'WCAG Accessibility & Hierarchy Audit',
    scenarioPrompt:
      'You are auditing a clinical scheduling portal whose primary submit button uses light gray text (#94a3b8) on a white background (#ffffff, contrast ~2.5:1) and conveys validation errors solely via a 1px red border.',
    questionPrompt: 'Which pair of design fixes resolves both accessibility compliance issues?',
    inputMode: 'scenario_choice',
    options: [
      'Increase text/background contrast to >= 4.5:1 (e.g. #ffffff on #1d4ed8) and add explicit inline error copy + alert icon',
      'Reduce font size to 9px and remove button labels',
      'Replace button text with an unlabelled pulsing dot',
      'Use light yellow text on white for softer contrast',
    ],
    correctOptionIndex: 0,
    solutionExplanation: 'WCAG 2.2 AA requires >= 4.5:1 contrast for standard UI text and non-color-dependent error messaging.',
    referenceSampleAnswer: '0',
  },
  ux_research_ia: {
    id: 'pt_ux_research_ia',
    skillId: 'ux_research_ia',
    skillName: 'UX Research & Information Architecture',
    domainId: 'design_creative',
    assessmentType: 'design_critique',
    title: 'Usability Completion Rate Evaluation',
    scenarioPrompt:
      'During a moderated usability study of a new onboarding workflow, 16 out of 20 participants completed task #1 without assistance.',
    questionPrompt: 'Calculate the unassisted task completion rate as a percentage (%).',
    inputMode: 'numeric',
    unitLabel: '%',
    expectedNumericValue: 80,
    numericTolerance: 1,
    solutionExplanation: '(16 / 20) × 100% = 80% unassisted completion rate.',
    referenceSampleAnswer: '80',
  },

  // EDUCATION & TEACHING
  curriculum_instruction: {
    id: 'pt_curriculum_instruction',
    skillId: 'curriculum_instruction',
    skillName: 'Curriculum Design & Instructional Planning',
    domainId: 'education_teaching',
    assessmentType: 'education_case',
    title: 'Mastery Cohort Pass Rate Calculation',
    scenarioPrompt:
      'After redesigning an applied science module with formative exit checks, 27 out of 30 students achieved >= 80% on the summative rubric.',
    questionPrompt: 'Calculate the cohort mastery rate as a percentage (%).',
    inputMode: 'numeric',
    unitLabel: '%',
    expectedNumericValue: 90,
    numericTolerance: 1,
    solutionExplanation: '(27 / 30) × 100% = 90% mastery rate.',
    referenceSampleAnswer: '90',
  },

  // FINANCE & ACCOUNTING
  financial_accounting: {
    id: 'pt_financial_accounting',
    skillId: 'financial_accounting',
    skillName: 'Financial Accounting & Ind AS / GAAP Reporting',
    domainId: 'finance_accounting',
    assessmentType: 'finance_case',
    title: 'Current Ratio Liquidity Check',
    scenarioPrompt:
      'A company balance sheet reports Total Current Assets of ₹24,00,000 and Total Current Liabilities of ₹12,00,000 at fiscal year-end.',
    questionPrompt: 'Calculate the Current Ratio (Current Assets / Current Liabilities).',
    inputMode: 'numeric',
    unitLabel: 'x',
    expectedNumericValue: 2.0,
    numericTolerance: 0.05,
    solutionExplanation: 'Current Ratio = ₹24,00,000 / ₹12,00,000 = 2.0x.',
    referenceSampleAnswer: '2.0',
  },

  // AGRICULTURE & ENVIRONMENTAL SCIENCE
  agronomy_soil_science: {
    id: 'pt_agronomy_soil_science',
    skillId: 'agronomy_soil_science',
    skillName: 'Agronomy, Soil Science & Crop Nutrition',
    domainId: 'agriculture_environmental',
    assessmentType: 'agriculture_case',
    title: 'Nitrogen Fertilizer Application Sizing',
    scenarioPrompt:
      'An agronomy field plan prescribes 92 kg of elemental Nitrogen (N) per hectare using Urea (46% N by weight).',
    questionPrompt: 'How many kilograms of Urea fertilizer are required per hectare (kg/ha)?',
    inputMode: 'numeric',
    unitLabel: 'kg/ha',
    expectedNumericValue: 200,
    numericTolerance: 2,
    solutionExplanation: 'Urea needed = 92 kg N / 0.46 = 200 kg/ha.',
    referenceSampleAnswer: '200',
  },
};

export function domainAssessmentType(domainId: CareerDomainId): AssessmentDomainType {
  switch (domainId) {
    case 'information_technology':
      return 'coding';
    case 'medical_healthcare':
      return 'medical_case';
    case 'mechanical_engineering':
    case 'electronics_electrical':
    case 'civil_architecture':
      return 'engineering_calc';
    case 'robotics_automation':
      return 'robotics_logic';
    case 'science_research':
      return 'science_experiment';
    case 'business_management':
      return 'business_case';
    case 'design_creative':
      return 'design_critique';
    case 'education_teaching':
      return 'education_case';
    case 'finance_accounting':
      return 'finance_case';
    case 'agriculture_environmental':
      return 'agriculture_case';
  }
}

export function getQuizForSkill(skillId: string): QuizQuestion[] {
  if (QUIZ_BANK[skillId]) return QUIZ_BANK[skillId];
  const skill = SKILLS_CATALOG.find((s) => s.id === skillId);
  const name = skill?.name ?? skillId;
  const domain = skill?.domainId ?? 'information_technology';
  const prereqLabel =
    skill && skill.prerequisites.length > 0
      ? skill.prerequisites.join(', ')
      : 'core domain fundamentals';

  return [
    {
      id: `q_${skillId}_1`,
      skillId,
      prompt: `Which practice demonstrates verifiable applied mastery of ${name}?`,
      options: [
        skill?.practicalIndicator ?? `Completing validated real-world deliverables in ${name}`,
        'Memorizing terminology without applying methods or verification checks',
        'Skipping prerequisite foundations entirely',
        'Ignoring quality, safety, or reproducibility checks',
      ],
      correctIndex: 0,
      explanation: `Mastery in ${name} requires repeatable execution: ${skill?.practicalIndicator ?? 'verified real-world outputs'}.`,
    },
    {
      id: `q_${skillId}_2`,
      skillId,
      prompt: `Why does ${name} build upon ${prereqLabel} in a structured competency roadmap?`,
      options: [
        'Downstream tasks depend on foundational mental models, terminology, and verification tolerances',
        'Prerequisites are purely decorative labels with zero technical dependency',
        'Foundations should always be learned after capstone mastery',
        domain === 'medical_healthcare'
          ? 'Clinical reasoning bypasses human physiology completely'
          : 'Complex systems work reliably without foundational principles',
      ],
      correctIndex: 0,
      explanation: `Mastering ${prereqLabel} prevents downstream errors and accelerates fluency in ${name}.`,
    },
  ];
}

export function getChallengeForSkill(skillId: string): CodingChallenge | null {
  const skill = SKILLS_CATALOG.find((s) => s.id === skillId);
  if (CODING_CHALLENGES[skillId]) return CODING_CHALLENGES[skillId];
  if (skill && skill.domainId !== 'information_technology') {
    return null;
  }
  const name = skill?.name ?? skillId;
  return {
    id: `ch_${skillId}_generic`,
    skillId,
    skillName: name,
    title: `${name} Readiness Check`,
    description: `Implement \`evaluateMastery(scores)\` returning \`{ avg, passed }\` where \`avg\` is the rounded mean of the numeric scores array and \`passed\` is true when \`avg >= 70\`.`,
    language: 'javascript',
    functionName: 'evaluateMastery',
    starterCode: `function evaluateMastery(scores) {
  // Return { avg: number, passed: boolean }
  return { avg: 0, passed: false };
}`,
    solutionHint: 'Sum scores with reduce, divide by scores.length, round with Math.round, and compare avg >= 70.',
    testCases: [
      {
        id: 'tc_gen_1',
        description: 'Passing mastery scores [80, 90, 70]',
        inputJson: '[[80,90,70]]',
        expectedJson: '{"avg":80,"passed":true}',
      },
      {
        id: 'tc_gen_2',
        description: 'Sub-threshold scores [40, 50, 60]',
        inputJson: '[[40,50,60]]',
        expectedJson: '{"avg":50,"passed":false}',
      },
    ],
  };
}

export function getPracticalTaskForSkill(skillId: string): DomainPracticalTask | null {
  if (DOMAIN_PRACTICAL_TASKS[skillId]) return DOMAIN_PRACTICAL_TASKS[skillId];
  const skill = SKILLS_CATALOG.find((s) => s.id === skillId);
  if (!skill || skill.domainId === 'information_technology') {
    return null;
  }

  const assessmentType = domainAssessmentType(skill.domainId);
  const isMedical = skill.domainId === 'medical_healthcare';

  return {
    id: `pt_${skillId}_generic`,
    skillId,
    skillName: skill.name,
    domainId: skill.domainId,
    assessmentType,
    title: `${skill.name}: Applied Domain Verification`,
    safetyDisclaimer: isMedical ? MEDICAL_SAFETY_DISCLAIMER : undefined,
    scenarioPrompt: `Applied Scenario (${skill.category}): A practitioner is preparing a deliverable that requires "${skill.practicalIndicator}".`,
    questionPrompt: `Which verification standard confirms reliable competency in ${skill.name}?`,
    inputMode: 'scenario_choice',
    options: [
      `Validate calculations, edge cases, and "${skill.practicalIndicator}" before sign-off`,
      'Proceed directly to production or deployment without verification or peer review',
      'Ignore domain tolerances, units, and prerequisite constraints',
      'Skip documentation so outcomes cannot be reproduced',
    ],
    correctOptionIndex: 0,
    solutionExplanation: `Reliable practice in ${skill.name} demands verifiable tolerance checks and adherence to: ${skill.practicalIndicator}.`,
    referenceSampleAnswer: '0',
  };
}
