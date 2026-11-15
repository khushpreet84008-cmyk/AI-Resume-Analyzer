/**
 * Resume analysis engine.
 * Rule-based NLP: skill extraction, section detection, scoring, job matching.
 * Everything runs locally on the server - no external API needed.
 */

// ---------------------------------------------------------------------------
// 1. Skills dictionary  (category -> list of [display name, regex-safe aliases])
// ---------------------------------------------------------------------------
const SKILLS = {
  "Programming Languages": [
    ["JavaScript", ["javascript", "js", "es6"]],
    ["TypeScript", ["typescript"]],
    ["Python", ["python"]],
    ["Java", ["java"]],
    ["C++", ["c++"]],
    ["C#", ["c#"]],
    ["C", ["c language", "c programming"]],
    ["PHP", ["php"]],
    ["Go", ["golang"]],
    ["Kotlin", ["kotlin"]],
    ["Swift", ["swift"]],
    ["R", ["r programming", "r language"]],
    ["SQL", ["sql"]],
  ],
  "Frontend": [
    ["HTML", ["html", "html5"]],
    ["CSS", ["css", "css3"]],
    ["React", ["react", "reactjs", "react.js"]],
    ["Angular", ["angular", "angularjs"]],
    ["Vue.js", ["vue", "vuejs", "vue.js"]],
    ["Next.js", ["next.js", "nextjs"]],
    ["Redux", ["redux"]],
    ["Bootstrap", ["bootstrap"]],
    ["Tailwind CSS", ["tailwind", "tailwindcss"]],
    ["jQuery", ["jquery"]],
    ["SASS", ["sass", "scss"]],
  ],
  "Backend": [
    ["Node.js", ["node.js", "nodejs", "node js"]],
    ["Express.js", ["express.js", "expressjs", "express"]],
    ["Django", ["django"]],
    ["Flask", ["flask"]],
    ["FastAPI", ["fastapi"]],
    ["Spring Boot", ["spring boot", "springboot", "spring"]],
    ["REST API", ["rest api", "restful", "rest apis", "restful api"]],
    ["GraphQL", ["graphql"]],
    ["ASP.NET", ["asp.net", ".net core", ".net"]],
    ["Laravel", ["laravel"]],
    ["Microservices", ["microservices"]],
    ["JWT", ["jwt"]],
  ],
  "Databases": [
    ["MySQL", ["mysql"]],
    ["PostgreSQL", ["postgresql", "postgres"]],
    ["MongoDB", ["mongodb", "mongo db", "mongoose"]],
    ["Redis", ["redis"]],
    ["Firebase", ["firebase"]],
    ["SQLite", ["sqlite"]],
    ["Oracle", ["oracle"]],
  ],
  "DevOps & Cloud": [
    ["Git", ["git"]],
    ["GitHub", ["github"]],
    ["Docker", ["docker"]],
    ["Kubernetes", ["kubernetes", "k8s"]],
    ["AWS", ["aws", "amazon web services"]],
    ["Azure", ["azure"]],
    ["Google Cloud", ["gcp", "google cloud"]],
    ["CI/CD", ["ci/cd", "jenkins", "github actions"]],
    ["Linux", ["linux", "ubuntu"]],
    ["Nginx", ["nginx"]],
  ],
  "Data & AI": [
    ["Machine Learning", ["machine learning", "ml"]],
    ["Deep Learning", ["deep learning", "neural network", "neural networks"]],
    ["NLP", ["nlp", "natural language processing"]],
    ["Pandas", ["pandas"]],
    ["NumPy", ["numpy"]],
    ["scikit-learn", ["scikit-learn", "sklearn"]],
    ["TensorFlow", ["tensorflow"]],
    ["PyTorch", ["pytorch"]],
    ["Power BI", ["power bi", "powerbi"]],
    ["Tableau", ["tableau"]],
    ["Excel", ["excel", "ms excel"]],
    ["Data Analysis", ["data analysis", "data analytics", "data visualization"]],
    ["OpenCV", ["opencv"]],
  ],
  "Mobile": [
    ["Android", ["android"]],
    ["Flutter", ["flutter"]],
    ["React Native", ["react native"]],
    ["iOS", ["ios"]],
  ],
  "Testing & Tools": [
    ["Jest", ["jest"]],
    ["Selenium", ["selenium"]],
    ["Postman", ["postman"]],
    ["JIRA", ["jira"]],
    ["Figma", ["figma"]],
    ["Agile", ["agile", "scrum"]],
    ["Unit Testing", ["unit testing", "unit tests", "junit", "pytest"]],
  ],
  "Core CS": [
    ["Data Structures", ["data structures", "dsa"]],
    ["Algorithms", ["algorithms"]],
    ["OOP", ["oop", "oops", "object oriented", "object-oriented"]],
    ["DBMS", ["dbms"]],
    ["Operating Systems", ["operating system", "operating systems"]],
    ["Computer Networks", ["computer networks", "networking"]],
  ],
  "Soft Skills": [
    ["Communication", ["communication"]],
    ["Teamwork", ["teamwork", "team player", "collaboration"]],
    ["Leadership", ["leadership", "led a team", "team lead"]],
    ["Problem Solving", ["problem solving", "problem-solving"]],
    ["Time Management", ["time management"]],
  ],
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build one regex per skill. Boundaries are "not a letter/digit" so c++, c#, node.js work.
const SKILL_INDEX = [];
for (const [category, list] of Object.entries(SKILLS)) {
  for (const [name, aliases] of list) {
    const pattern = aliases.map(escapeRegex).join("|");
    SKILL_INDEX.push({
      name,
      category,
      regex: new RegExp(`(?<![a-z0-9+#])(?:${pattern})(?![a-z0-9]|\\+\\+|#)`, "i"),
    });
  }
}

function extractSkills(text) {
  const found = [];
  for (const s of SKILL_INDEX) {
    if (s.regex.test(text)) found.push({ name: s.name, category: s.category });
  }
  return found;
}

// ---------------------------------------------------------------------------
// 2. Job roles database
//    core  = skills that define the role (weighted heavily)
//    bonus = nice-to-have skills
// ---------------------------------------------------------------------------
const ROLES = [
  {
    title: "Full Stack Developer",
    summary: "Build complete web applications, from the user interface to the database.",
    core: ["JavaScript", "HTML", "CSS", "Node.js", "React", "MongoDB", "REST API"],
    bonus: ["Express.js", "Git", "MySQL", "TypeScript", "Docker", "PostgreSQL"],
    query: "Full Stack Developer",
    slug: "full-stack-developer",
  },
  {
    title: "Frontend Developer",
    summary: "Create fast, responsive and beautiful user interfaces.",
    core: ["HTML", "CSS", "JavaScript", "React"],
    bonus: ["TypeScript", "Redux", "Tailwind CSS", "Bootstrap", "Next.js", "Figma", "Git", "Angular", "Vue.js"],
    query: "Frontend Developer",
    slug: "frontend-developer",
  },
  {
    title: "Backend Developer",
    summary: "Design APIs, business logic and databases that power applications.",
    core: ["Node.js", "REST API", "MySQL", "MongoDB"],
    bonus: ["Express.js", "Python", "Java", "Django", "Spring Boot", "PostgreSQL", "Redis", "Docker", "JWT", "Git"],
    query: "Backend Developer",
    slug: "backend-developer",
  },
  {
    title: "MERN Stack Developer",
    summary: "Specialise in MongoDB, Express, React and Node.js applications.",
    core: ["MongoDB", "Express.js", "React", "Node.js"],
    bonus: ["JavaScript", "Redux", "REST API", "Git", "JWT", "HTML", "CSS"],
    query: "MERN Stack Developer",
    slug: "mern-stack-developer",
  },
  {
    title: "Python Developer",
    summary: "Develop backend services, automation and data tools using Python.",
    core: ["Python", "SQL"],
    bonus: ["Django", "Flask", "FastAPI", "REST API", "PostgreSQL", "Git", "Docker", "Pandas"],
    query: "Python Developer",
    slug: "python-developer",
  },
  {
    title: "Java Developer",
    summary: "Build enterprise-grade applications with Java and Spring.",
    core: ["Java", "SQL", "OOP"],
    bonus: ["Spring Boot", "REST API", "MySQL", "Microservices", "Git", "Unit Testing", "Data Structures"],
    query: "Java Developer",
    slug: "java-developer",
  },
  {
    title: "Software Engineer",
    summary: "Solve problems with code across the stack; strong CS fundamentals matter here.",
    core: ["Data Structures", "Algorithms", "OOP"],
    bonus: ["Java", "Python", "C++", "SQL", "Git", "DBMS", "Operating Systems", "Problem Solving"],
    query: "Software Engineer",
    slug: "software-engineer",
  },
  {
    title: "Data Analyst",
    summary: "Turn raw data into insights, dashboards and business decisions.",
    core: ["SQL", "Excel", "Data Analysis"],
    bonus: ["Python", "Pandas", "Power BI", "Tableau", "NumPy", "Communication"],
    query: "Data Analyst",
    slug: "data-analyst",
  },
  {
    title: "Machine Learning Engineer",
    summary: "Train, evaluate and deploy machine learning models.",
    core: ["Python", "Machine Learning"],
    bonus: ["TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "Deep Learning", "NLP", "Docker"],
    query: "Machine Learning Engineer",
    slug: "machine-learning-engineer",
  },
  {
    title: "DevOps Engineer",
    summary: "Automate build, deployment and cloud infrastructure.",
    core: ["Docker", "Linux", "Git", "CI/CD"],
    bonus: ["AWS", "Kubernetes", "Azure", "Nginx", "Python"],
    query: "DevOps Engineer",
    slug: "devops-engineer",
  },
  {
    title: "Android / Mobile App Developer",
    summary: "Create mobile apps for Android and iOS.",
    core: ["Android", "Kotlin", "Java", "Flutter", "React Native"],
    bonus: ["Firebase", "REST API", "Git", "SQLite"],
    query: "Mobile App Developer",
    slug: "mobile-app-developer",
    minCoreHits: 1,
  },
  {
    title: "QA / Test Engineer",
    summary: "Ensure software quality with manual and automated testing.",
    core: ["Selenium", "Unit Testing", "Postman"],
    bonus: ["JIRA", "Agile", "Java", "Python", "SQL", "JavaScript"],
    query: "QA Test Engineer",
    slug: "qa-test-engineer",
  },
  {
    title: "UI / UX Designer",
    summary: "Design intuitive experiences and visual interfaces.",
    core: ["Figma"],
    bonus: ["HTML", "CSS", "Communication", "Problem Solving"],
    query: "UI UX Designer",
    slug: "ui-ux-designer",
  },
];

// ---------------------------------------------------------------------------
// 3. Job site links (search pages - always live, never stale)
// ---------------------------------------------------------------------------
function jobLinks(role, location, isFresher) {
  const q = encodeURIComponent(role.query + (isFresher ? " fresher" : ""));
  const loc = encodeURIComponent(location);
  const locSlug = location.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const links = [
    {
      site: "LinkedIn",
      url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`,
    },
    {
      site: "Naukri",
      url: `https://www.naukri.com/${role.slug}${isFresher ? "-fresher" : ""}-jobs${
        locSlug && locSlug !== "india" ? "-in-" + locSlug : ""
      }`,
    },
    {
      site: "Indeed",
      url: `https://in.indeed.com/jobs?q=${q}&l=${loc}`,
    },
    {
      site: "Internshala",
      url: isFresher
        ? `https://internshala.com/internships/keywords-${encodeURIComponent(role.query.toLowerCase().replace(/\s+/g, "-"))}`
        : `https://internshala.com/jobs/${role.slug}-jobs`,
    },
    {
      site: "Glassdoor",
      url: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${q}`,
    },
  ];
  return links;
}

// ---------------------------------------------------------------------------
// 4. Resume sections, contact info, action verbs
// ---------------------------------------------------------------------------
const SECTION_PATTERNS = {
  "Summary / Objective": /\b(summary|objective|profile|about me|career objective)\b/i,
  Education: /\b(education|academic|qualification|b\.?tech|bachelor|master|degree|university|college)\b/i,
  Experience: /\b(experience|employment|work history|internship|intern\b|professional background)/i,
  Skills: /\b(skills|technical skills|technologies|tech stack|core competencies)\b/i,
  Projects: /\b(projects?|academic projects|personal projects)\b/i,
  "Certifications / Achievements": /\b(certifications?|certificates?|achievements?|awards?|courses?|training)\b/i,
};

const ACTION_VERBS = [
  "developed", "built", "designed", "implemented", "created", "led", "managed", "optimized",
  "optimised", "improved", "reduced", "increased", "launched", "deployed", "automated",
  "integrated", "engineered", "architected", "analyzed", "analysed", "delivered", "collaborated",
  "established", "streamlined", "migrated", "tested", "maintained", "mentored", "achieved",
];

function detectContact(text) {
  const email = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const phone = /(\+?\d{1,3}[\s-]?)?(\(?\d{3,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,5}/.test(
    text.replace(/\d{4}\s*[-–]\s*\d{4}/g, "")
  );
  const linkedin = /linkedin\.com|linkedin/i.test(text);
  const github = /github\.com|github/i.test(text);
  const portfolio = /portfolio|https?:\/\/(?!.*(linkedin|github))/i.test(text);
  return { email, phone, linkedin, github, portfolio };
}

function detectExperience(text) {
  const m = text.match(/(\d{1,2})\+?\s*(?:years?|yrs?)\b[^.\n]{0,25}experience/i) ||
    text.match(/experience[^.\n]{0,25}?(\d{1,2})\+?\s*(?:years?|yrs?)/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

// ---------------------------------------------------------------------------
// 5. Main analysis
// ---------------------------------------------------------------------------
function analyzeResume(rawText, options = {}) {
  const text = rawText.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const skills = extractSkills(text);
  const techSkills = skills.filter((s) => s.category !== "Soft Skills");
  const contact = detectContact(text);
  const years = detectExperience(text);

  // --- Sections ---
  const sectionsFound = {};
  for (const [name, re] of Object.entries(SECTION_PATTERNS)) {
    // A section counts only if a heading-like short line matches
    sectionsFound[name] = lines.some((l) => l.length < 45 && re.test(l));
  }
  // fallback: loose match on whole text for education / skills
  if (!sectionsFound.Education && SECTION_PATTERNS.Education.test(text)) sectionsFound.Education = true;
  if (!sectionsFound.Skills && techSkills.length >= 4) sectionsFound.Skills = true;

  // --- Impact: action verbs and numbers ---
  const verbHits = ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`, "i").test(lower));
  const numberHits = (text.match(/\b\d+(\.\d+)?\s?(%|\+|x|k|lpa|users|customers|projects|clients|ms|seconds|hours)/gi) || []).length;
  const bulletLines = lines.filter((l) => /^[•\-–*▪●◦]/.test(l)).length;

  // --- Experience level ---
  let level = options.experienceLevel;
  if (!level || level === "auto") {
    if (years !== null) level = years >= 3 ? "experienced" : "fresher";
    else level = "fresher";
  }
  const isFresher = level !== "experienced";

  // ---------------- Scoring (total 100) ----------------
  const breakdown = [];

  // Contact (15)
  let contactScore = 0;
  if (contact.email) contactScore += 5;
  if (contact.phone) contactScore += 4;
  if (contact.linkedin) contactScore += 3;
  if (contact.github || contact.portfolio) contactScore += 3;
  breakdown.push({ label: "Contact & Links", score: contactScore, max: 15 });

  // Sections (20)
  const secNames = Object.keys(sectionsFound);
  const secCount = secNames.filter((n) => sectionsFound[n]).length;
  const secScore = Math.round((secCount / secNames.length) * 20);
  breakdown.push({ label: "Resume Sections", score: secScore, max: 20 });

  // Skills (25) - 12+ technical skills is excellent
  const skillScore = Math.min(25, Math.round((techSkills.length / 12) * 25));
  breakdown.push({ label: "Skills & Keywords", score: skillScore, max: 25 });

  // Impact (25)
  const verbScore = Math.min(10, Math.round((verbHits.length / 8) * 10));
  const numScore = Math.min(10, Math.round((numberHits / 4) * 10));
  const bulletScore = Math.min(5, Math.round((bulletLines / 8) * 5));
  breakdown.push({ label: "Impact & Achievements", score: verbScore + numScore + bulletScore, max: 25 });

  // Length & readability (15)
  let lengthScore = 0;
  if (wordCount >= 250 && wordCount <= 900) lengthScore = 15;
  else if (wordCount >= 150 && wordCount < 250) lengthScore = 9;
  else if (wordCount > 900 && wordCount <= 1300) lengthScore = 10;
  else lengthScore = 4;
  breakdown.push({ label: "Length & Readability", score: lengthScore, max: 15 });

  const score = breakdown.reduce((a, b) => a + b.score, 0);

  let grade = "Needs Work";
  if (score >= 85) grade = "Excellent";
  else if (score >= 70) grade = "Good";
  else if (score >= 50) grade = "Fair";

  // ---------------- Suggestions ----------------
  const suggestions = [];
  const strengths = [];

  if (!contact.email) suggestions.push({ type: "critical", text: "Add a professional email address at the top of your resume." });
  else strengths.push("Email address is present.");
  if (!contact.phone) suggestions.push({ type: "critical", text: "Add your phone number so recruiters can reach you quickly." });
  if (!contact.linkedin) suggestions.push({ type: "tip", text: "Add your LinkedIn profile link. Most recruiters check it." });
  if (!contact.github && !contact.portfolio) suggestions.push({ type: "tip", text: "Add your GitHub or portfolio link to showcase your projects." });
  else strengths.push("GitHub / portfolio link found.");

  for (const name of secNames) {
    if (!sectionsFound[name]) {
      const critical = ["Education", "Skills", "Experience", "Projects"].includes(name);
      if (name === "Experience" && isFresher) {
        suggestions.push({ type: "tip", text: "Add an Internships / Experience section, even training or freelance work counts." });
      } else {
        suggestions.push({
          type: critical ? "important" : "tip",
          text: `Add a clear "${name}" section with a proper heading.`,
        });
      }
    }
  }
  if (secCount >= 5) strengths.push("Resume has a well-organised set of sections.");

  if (techSkills.length < 8) suggestions.push({ type: "important", text: `Only ${techSkills.length} technical skills were detected. List more relevant tools, languages and frameworks you know.` });
  else strengths.push(`${techSkills.length} technical skills detected, a solid skill set.`);

  if (verbHits.length < 5) suggestions.push({ type: "important", text: "Start bullet points with strong action verbs such as Developed, Built, Designed, Optimised, Deployed." });
  else strengths.push("Good use of action verbs.");

  if (numberHits < 2) suggestions.push({ type: "important", text: "Quantify your impact with numbers, e.g. \"improved load time by 40%\" or \"built an app used by 200+ users\"." });
  else strengths.push("Achievements include measurable numbers.");

  if (bulletLines < 4) suggestions.push({ type: "tip", text: "Use bullet points for projects and experience so the resume is easy to scan." });

  if (wordCount < 250) suggestions.push({ type: "important", text: `Your resume is short (${wordCount} words). Add project details, responsibilities and technologies used.` });
  else if (wordCount > 900) suggestions.push({ type: "tip", text: `Your resume is long (${wordCount} words). Try to keep it to 1 page (fresher) or 2 pages (experienced).` });
  else strengths.push("Resume length is in the ideal range.");

  const order = { critical: 0, important: 1, tip: 2 };
  suggestions.sort((a, b) => order[a.type] - order[b.type]);

  // ---------------- Job matching ----------------
  const have = new Set(skills.map((s) => s.name));
  const location = options.location || "India";

  const matches = ROLES.map((role) => {
    const coreHave = role.core.filter((s) => have.has(s));
    const bonusHave = role.bonus.filter((s) => have.has(s));
    const minCore = role.minCoreHits || Math.min(2, role.core.length);

    const coreRatio = role.minCoreHits
      ? Math.min(1, coreHave.length / role.minCoreHits)
      : coreHave.length / role.core.length;
    const bonusRatio = role.bonus.length ? bonusHave.length / role.bonus.length : 0;

    let match = Math.round((coreRatio * 0.7 + Math.min(1, bonusRatio * 1.5) * 0.3) * 100);
    if (coreHave.length < minCore) match = Math.min(match, 35);

    const missing = [...role.core, ...role.bonus].filter((s) => !have.has(s)).slice(0, 5);
    return {
      title: role.title,
      summary: role.summary,
      match,
      matchedSkills: [...coreHave, ...bonusHave],
      missingSkills: missing,
      links: jobLinks(role, location, isFresher),
    };
  })
    .filter((m) => m.match >= 35)
    .sort((a, b) => b.match - a.match)
    .slice(0, 6);

  // Group detected skills by category for the UI
  const grouped = {};
  for (const s of skills) {
    (grouped[s.category] = grouped[s.category] || []).push(s.name);
  }

  // Skills worth learning next = most common missing skills among top matches
  const gapCount = {};
  matches.slice(0, 3).forEach((m) => m.missingSkills.forEach((s) => (gapCount[s] = (gapCount[s] || 0) + 1)));
  const skillGaps = Object.entries(gapCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s]) => s);

  return {
    score,
    grade,
    breakdown,
    stats: { wordCount, technicalSkills: techSkills.length, actionVerbs: verbHits.length, sectionsFound: secCount },
    level: isFresher ? "Fresher / Entry level" : "Experienced",
    location,
    sections: sectionsFound,
    contact,
    skills: grouped,
    strengths,
    suggestions,
    jobs: matches,
    skillGaps,
  };
}

module.exports = { analyzeResume };
