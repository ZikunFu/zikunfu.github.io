---
layout: default
title: "Home"
---

# Zikun Fu — ML/NLP · AI Automation · Data Systems

MSc Computer Science graduate (Ontario Tech University, 2026) working at the intersection of **language models and structured data**. My thesis formalized Database Entity Recognition and reached **93.2% F1** with a T5 + MiniLM pipeline; the work was published at **IEEE IRI 2025**. Recently I've been building **grounded LLM systems and AI automation** — an analytics assistant measured at **100% grounding / 0% hallucination**, an automated SEO-audit pipeline with cost and human-review gates, and an LLM grading pipeline that processed a 70-student exam for ~$10. Strong Python, PyTorch/Transformers, SQL, Docker.

- Location: Oshawa, ON (open to Toronto/Ottawa/remote)
- Email: [Zikun.Fu@ontariotechu.net](mailto:Zikun.Fu@ontariotechu.net)
- LinkedIn: [linkedin.com/in/zikun-fu](https://www.linkedin.com/in/zikun-fu/)
- GitHub: [github.com/ZikunFu](https://github.com/ZikunFu/)
- Resume: [Resume_ZikunFu.pdf](https://zikunfu.github.io/assets/resume/Resume_ZikunFu.pdf)

---

## Highlights

| Area | Result |
|------|--------|
| **Research → publication** | Formalized the DB-ER task; **80.8% F1** open-world tagger, **93.2% F1** with closed-world verification; published at IEEE IRI 2025 |
| **Grounded LLM analytics** | Read-only, provenance-carrying analytics chatbot: **100% grounding accuracy, 0% hallucination** on an oracle-backed harness; 59 unit tests |
| **LLM automation with cost control** | Graded ~70 scanned handwritten finals via Claude for **$10.34 total (~$0.15/student)**, with confidence flags and a human-review loop |
| **Platform migration** | Led Symfony/Laravel → Dockerized LimeSurvey+MySQL migration serving 60+ research groups; Python ETL of 3,400+ multilingual records |

---

## Projects

### Hermes Clinic Analytics — grounded AI analytics assistant
[github.com/ZikunFu/hermes-clinic-analytics](https://github.com/ZikunFu/hermes-clinic-analytics) · *2026*

A chat assistant that answers business questions over a simulated optometry clinic's data with **structural** anti-hallucination guarantees: a read-only DuckDB engine, a `sqlglot`-parsed SQL allowlist, charts built from query results (never model-typed numbers), and exact SQL provenance on every answer. An oracle-backed scoring harness measures **100% grounding accuracy and 0% hallucination**; 59 offline unit tests plus a live bypass-safety suite verify the guarantees hold. Built on the Hermes agent platform with Open WebUI as the front-end.

### Web Presence Report — automated local-SEO audit pipeline
*2026, ongoing client engagement*

An automated pipeline for **a local optometry clinic** that turns its scattered online footprint — Google Business Profile, reviews, PageSpeed, 25-point geo-grid rankings, backlinks, on-page health — into a graded, client-ready report with a 30/60/90-day action plan. Built-in **cost gates** (estimated spend approved before any paid API call; a full run is under $1) and **human-review gates** for health-content compliance (every clinical claim is flagged for clinician sign-off; review text is never reproduced verbatim). LLM use is interpretation-only: the AI writes the narrative, never the numbers.

### LLM Exam Grading Pipeline
*2026*

Auto-grades scanned handwritten final exams for a 4th-year compilers course by sending per-question page images to Claude (via OpenRouter) with model solutions and strict grading rules. Produces per-sub-question scores with confidence and legibility ratings, a human-review flag list, and a full audit trail; prompt caching keeps costs low — **~70 students graded for $10.34 total (~$0.15/student)**. Flagged items go through a scripted human-review adjustment workflow.

---

## Research

### MSc Thesis: Database Entity Recognition using Language Models
*Defended April 2026 (passed)* · [Thesis (Ontario Tech repository)](https://hdl.handle.net/10155/2082)

Natural-language interfaces to databases must ground user questions to the tables, columns, and values of a schema. The thesis formalizes **Database Entity Recognition (DB-ER)** as sequence labeling over {O, Table, Column, Value} and studies two settings: an open-world T5 tagger and a closed-world verifier that grounds predictions against a target database via semantic similarity.

**Contributions**:
- **Formalization** of DB-ER as a sequence labeling task
- **Benchmark**: 1,000-example human-annotated dataset derived from Spider & BIRD
- **Synthetic data pipeline**: 15,000 training examples generated from paired SQL via AST parsing and integer linear programming
- **Results**: T5-Large with synthetic augmentation reaches **80.8% F1**; closed-world MiniLM verification raises this to **93.2% F1**

---

## Publications & Talks

- **Z. Fu**, C. Yang, K. Davoudi, K. Q. Pu. "Database Entity Recognition with Data Augmentation and Deep Learning." *IEEE IRI 2025*, San Jose, CA. [DOI: 10.1109/IRI66576.2025.00071](https://doi.org/10.1109/IRI66576.2025.00071)
- Ontario Database Day 2024: [Transforming Text-to-SQL Datasets into Closed-Domain NER Benchmarks](https://ondbd.ca/talk_2024/talk_32.pdf)

---

## Experience

### Research Assistant
**Ontario Tech University** | *May 2026 – Present*

- Building grounded LLM systems over structured business data — analytics with hard anti-hallucination guarantees and automated, human-gated reporting pipelines (see Projects above).

### Teaching Assistant — CSCI 4020U Compilers
**Ontario Tech University** | *Jan 2024 – May 2026*

- TA for the 4th-year compilers course (Kotlin), including lab support and exam marking.
- Built an LLM-assisted grading pipeline for handwritten finals with confidence flagging and human review (see Projects above).

### GREx Redevelopment Project Manager
**Mitch and Leslie Frazer Faculty of Education, Ontario Tech University** | *Dec 2024 – Apr 2025*

- Led the migration of the GREx research platform from a legacy Symfony/Laravel stack to a Dockerized LimeSurvey 6.x + MySQL environment; deployed to production on DigitalOcean with automated TLS.
- Wrote Python ETL against the LimeSurvey REST API importing 3,400+ multilingual records across 60+ research groups; built PHP plugin modules and Chart.js dashboards.

---

## Technical Skills

**Languages**: Python, SQL, Kotlin, PHP, JavaScript, Bash

**ML/NLP**: PyTorch, Hugging Face Transformers (T5, BERT, MiniLM), scikit-learn; sequence labeling/NER, embeddings & semantic similarity, fine-tuning, evaluation harness design

**LLM Engineering**: grounded/tool-using agents, SQL generation with allowlist validation (sqlglot), prompt design & prompt caching, structured-output parsing, hallucination measurement, cost tracking & gating; Claude API, OpenRouter, OpenAI-compatible endpoints, Open WebUI

**Data & Pipelines**: DuckDB, pandas, NumPy, ETL, SQL parsing (sqlglot, pglast), constraint optimization (OR-Tools CP-SAT); MySQL, PostgreSQL, SQLite, MongoDB

**Backend/Infra**: REST API integration, Docker & Docker Compose, Apache reverse proxy, Linux, DigitalOcean, Git/GitHub, automated TLS (Let's Encrypt), pytest

---

## Education

**Ontario Tech University** — MSc, Computer Science | *Jan 2024 – Apr 2026* | GPA: 4.24/4.3
Thesis: *Database Entity Recognition using Language Models*

**Ontario Tech University** — BSc (Hons) Computer Science, Data Science specialization | *2019 – 2023* | GPA: 3.86/4.3
