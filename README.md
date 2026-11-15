# ResumeIQ - AI Resume Analyzer & Job Recommendation Website

A full stack project: upload a resume (PDF / DOCX / TXT), get an instant score out of 100,
improvement tips, matching job roles with a match percentage, and direct links to apply
on LinkedIn, Naukri, Indeed, Internshala and Glassdoor.

## Tech stack
- Frontend: HTML5, CSS3, vanilla JavaScript (drag-and-drop upload, animated score ring, job cards)
- Backend: Node.js + Express
- File handling: multer (upload, kept in memory only), pdf-parse (PDF), mammoth (DOCX)
- Analysis engine: `analyzer.js` (rule-based NLP, no paid API needed)

## How to run
1. Install Node.js 18 or newer from https://nodejs.org
2. Open a terminal in the `backend` folder and run:
   ```
   cd backend
   npm install
   npm start
   ```
3. Open http://localhost:3000 in your browser.

## Project structure
```
ai-resume-analyzer/
  frontend/
    index.html     Page layout
    style.css      Design (colours, buttons, cards, responsive)
    app.js         Upload logic and rendering of results
  backend/
    server.js      Express server and /api/analyze endpoint
    analyzer.js    Skill extraction, scoring, job matching, apply links
    package.json   Backend dependencies and start scripts
  README.md
```

## How the score works (100 points)
| Part | Points | What is checked |
|------|--------|-----------------|
| Contact & Links | 15 | email, phone, LinkedIn, GitHub / portfolio |
| Resume Sections | 20 | summary, education, experience, skills, projects, certifications |
| Skills & Keywords | 25 | number of technical skills found (100+ technologies recognised) |
| Impact & Achievements | 25 | action verbs, numbers / percentages, bullet points |
| Length & Readability | 15 | ideal range is 250 to 900 words |

## How job matching works
Each of 13 roles (Full Stack, Frontend, Backend, MERN, Python, Java, Data Analyst, ML Engineer,
DevOps, Mobile, QA, UI/UX, Software Engineer) has core skills and bonus skills. The match % is
70% core-skill coverage + 30% bonus-skill coverage. Roles below 35% are hidden.
Apply links open live search results on each job site for that role and your chosen location.

## Ideas to extend it (for extra marks)
- Add a real jobs API (Adzuna, JSearch on RapidAPI) to show actual listings inside the page
- Add user login and save analysis history with MongoDB
- Add a job description box and compare it against the resume
- Use an LLM API (for example the Claude API) for written feedback on each resume section
- Deploy on Render or Railway and add your live link to the project report


## Run on Windows
1. Extract the ZIP file.
2. Open the extracted `ai-resume-analyzer` folder.
3. Open a terminal in the `backend` folder.
4. Run `npm install` once to install dependencies.
5. Run `npm start`.
6. Visit http://localhost:3000 in your browser.

The `node_modules` folder is intentionally not included. It is recreated locally by
running `npm install`. Resume upload and analysis continue to use the existing
`/api/analyze` endpoint.
