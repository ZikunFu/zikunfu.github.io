(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function badgeInlineStyle(varName, alphaBg, alphaBorder) {
    return (
      "color:var(" + varName + ");" +
      "background:color-mix(in srgb, var(" + varName + ") " + (alphaBg || 10) + "%, transparent);" +
      "border-color:color-mix(in srgb, var(" + varName + ") " + (alphaBorder || 35) + "%, transparent);"
    );
  }

  function gradeVar(g) {
    var G = (g || "").trim()[0];
    if (G === "A") return "--success";
    if (G === "B") return "--info";
    if (G === "C") return "--warning";
    if (G === "D") return "--grade-d-color";
    if (G === "F") return "--danger";
    return "--muted";
  }

  function confVar(c) {
    c = (c || "").toLowerCase();
    if (c === "high") return "--success";
    if (c === "medium") return "--warning";
    return "--danger";
  }

  function chipButton(label, active, attrs) {
    return '<button type="button" class="chip' + (active ? " is-active" : "") + '" ' + attrs + ">" + escapeHtml(label) + "</button>";
  }

  function dangerChipButton(label, active, attrs) {
    return '<button type="button" class="chip chip--danger' + (active ? " is-active" : "") + '" ' + attrs + ">" + escapeHtml(label) + "</button>";
  }

  function fmtCell(key, v) {
    if (/revenue|total|line_total/.test(key)) return "$" + v.toLocaleString("en-US");
    return v.toLocaleString("en-US");
  }

  function tableHtml(rows) {
    if (!rows || !rows.length) return "";
    var cols = Object.keys(rows[0]);
    var thead = cols.map(function (c) { return "<th>" + escapeHtml(c) + "</th>"; }).join("");
    var tbody = rows.map(function (r) {
      var cells = cols.map(function (c) {
        var v = r[c];
        var numeric = typeof v === "number";
        var text = numeric ? fmtCell(c, v) : String(v);
        return '<td style="text-align:' + (numeric ? "right" : "left") + '">' + escapeHtml(text) + "</td>";
      }).join("");
      return "<tr>" + cells + "</tr>";
    }).join("");
    return '<div class="table-wrap"><table class="demo-table"><thead><tr>' + thead + "</tr></thead><tbody>" + tbody + "</tbody></table></div>";
  }

  function bindToggle(toggleBtn, panel, onToggle) {
    toggleBtn.addEventListener("click", onToggle);
  }

  // ---------------------------------------------------------------------
  // Hermes Clinic Analytics
  // ---------------------------------------------------------------------
  var HERMES = {
    dataset: "Simulated optometry clinic (Small Business Benchmark Simulator, seed 42, 365 days) — not real patient data. Result rows re-derived by running the exact SQL against the built DuckDB artifact.",
    traces: [
      {
        id: "revenue", label: "Monthly revenue", question: "Total monthly revenue across 2024, as a chart.",
        sql: "SELECT month, total_revenue FROM v_revenue_monthly ORDER BY month",
        rows: [
          { month: "2024-01", revenue: 22196 }, { month: "2024-02", revenue: 14396 }, { month: "2024-03", revenue: 16280 },
          { month: "2024-04", revenue: 18396 }, { month: "2024-05", revenue: 23232 }, { month: "2024-06", revenue: 23180 },
          { month: "2024-07", revenue: 27220 }, { month: "2024-08", revenue: 22752 }, { month: "2024-09", revenue: 19664 },
          { month: "2024-10", revenue: 21264 }, { month: "2024-11", revenue: 19210 }, { month: "2024-12", revenue: 24026 }
        ],
        answer: "$251,816 total revenue across 2024 — a February low of $14,396 and a July peak of $27,220."
      },
      {
        id: "noshow", label: "No-shows by weekday", question: "No-show rate by weekday?",
        sql: "SELECT weekday, count(*) FILTER (WHERE is_no_show) AS no_shows,\n       count(*) AS appts\nFROM v_appointments GROUP BY weekday, iso_weekday\nORDER BY iso_weekday",
        rows: [
          { weekday: "Monday", no_shows: 27, appts: 210 }, { weekday: "Tuesday", no_shows: 1, appts: 1 },
          { weekday: "Wednesday", no_shows: 13, appts: 118 }, { weekday: "Thursday", no_shows: 10, appts: 92 },
          { weekday: "Friday", no_shows: 12, appts: 126 }, { weekday: "Saturday", no_shows: 6, appts: 111 }
        ],
        answer: "69 no-shows total in 2024, heaviest on Monday (27 of 210 appointments). Sunday is not shown because the clinic is closed Sundays — that is a zero because the clinic is shut, not missing data."
      },
      {
        id: "mix", label: "Glasses vs contacts", question: "Show me the glasses vs contacts revenue mix.",
        sql: "SELECT revenue_category, sum(line_total) AS revenue\nFROM v_sale_lines\nWHERE revenue_category IN ('glasses','contacts')\nGROUP BY revenue_category",
        rows: [{ revenue_category: "glasses", revenue: 140692 }, { revenue_category: "contacts", revenue: 26460 }],
        answer: "Glasses (frames + lenses) brought in $140,692 in 2024 versus $26,460 for contacts — glasses are roughly 84% of that combined mix."
      },
      {
        id: "nps", label: "Net Promoter Score", question: "What's our Net Promoter Score?",
        sql: null,
        answer: "We don't track Net Promoter Score — there are no satisfaction surveys or NPS data populated for this clinic, so I can't give you a score."
      }
    ],
    blocked: {
      id: "blocked", label: "Try a blocked query",
      question: "Query the hidden oracle.customer_truth table for each customer’s true churn intent.",
      sql: "SELECT * FROM oracle.customer_truth",
      reason: 'SqlGate (sqlglot, DuckDB dialect) rejects any relation outside the curated-view allowlist before execution — code "forbidden_schema": schema `oracle` is not accessible; only the six curated clinic views are. Defense-in-depth: the presentation database the executor opens physically contains only those views, so the answer key is not present to leak even if the gate were bypassed.'
    }
  };

  function hermesPipeline(state) {
    var isBlocked = state.traceId === "blocked";
    var trace = isBlocked ? HERMES.blocked : HERMES.traces.filter(function (t) { return t.id === state.traceId; })[0];
    var isAbstain = !isBlocked && trace.sql === null;

    var pipeline;
    if (isBlocked) {
      pipeline = [{ label: "SQL gate", sql: trace.sql, badge: "blocked", reason: trace.reason }];
    } else if (isAbstain) {
      pipeline = [
        { label: "SQL gate", badge: "abstained", note: "No query issued — the assistant recognized NPS is not a tracked metric for this clinic and abstained before writing any SQL." },
        { label: "Result rows", note: "0 rows — nothing was queried." },
        { label: "Grounded answer", isAnswer: true, text: trace.answer, hasProv: false }
      ];
    } else {
      pipeline = [
        { label: "Generated SQL (allowlisted, read-only)", sql: trace.sql, badge: "pass" },
        { label: "Result rows (from DuckDB)", isRows: true, rows: trace.rows, rowCountLabel: trace.rows.length + " rows returned" },
        { label: "Grounded answer", isAnswer: true, text: trace.answer, hasProv: true, provSql: trace.sql, provCount: trace.rows.length }
      ];
    }
    return { trace: trace, pipeline: pipeline };
  }

  function stageBadgeHtml(kind) {
    var map = { pass: "--success", abstained: "--warning", blocked: "--danger" };
    var varName = map[kind] || "--muted";
    var label = kind === "pass" ? "gate: pass" : kind;
    return '<span class="mini-chip" style="' + badgeInlineStyle(varName) + '">' + escapeHtml(label) + "</span>";
  }

  function stageBoxHtml(st, state) {
    var inner = '<div class="stage-head"><span class="demo-mini-inline">' + escapeHtml(st.label) + "</span>";
    if (st.badge) inner += stageBadgeHtml(st.badge);
    inner += "</div>";
    if (st.sql) inner += '<pre class="sql-block">' + escapeHtml(st.sql) + "</pre>";
    if (st.reason) inner += '<div class="reason-box">' + escapeHtml(st.reason) + "</div>";
    if (st.note) inner += '<div class="stage-note">' + escapeHtml(st.note) + "</div>";
    if (st.isRows) {
      inner += tableHtml(st.rows);
      inner += '<div class="demo-mini">' + escapeHtml(st.rowCountLabel) + "</div>";
    }
    if (st.isAnswer) {
      inner += '<div class="stage-answer">' + escapeHtml(st.text) + "</div>";
      if (st.hasProv) {
        var provOpen = state.provOpen;
        inner += '<button type="button" class="prov-chip" data-action="toggle-prov">' +
          (provOpen ? "Hide source query" : "Source query · " + st.provCount + " rows") + "</button>";
        if (provOpen) inner += '<pre class="sql-block">' + escapeHtml(st.provSql) + "</pre>";
      }
    }
    return '<div class="stage-box">' + inner + "</div>";
  }

  function renderHermesPanel(state) {
    var built = hermesPipeline(state);
    var trace = built.trace;
    var pipeline = built.pipeline;
    var isBlocked = state.traceId === "blocked";

    var chipsHtml = HERMES.traces.map(function (t) {
      return chipButton(t.label, t.id === state.traceId, 'data-action="select-trace" data-trace-id="' + t.id + '"');
    }).join("") + dangerChipButton(HERMES.blocked.label, isBlocked, 'data-action="select-trace" data-trace-id="blocked"');

    var total = pipeline.length;
    var step = Math.min(state.step, total);
    var shown = pipeline.slice(0, step);
    var stagesHtml = shown.map(function (st) { return stageBoxHtml(st, state); }).join("");

    var controlLabel = step === 0 ? "Run query" : (step < total ? "Next stage ▸" : "Replay ↻");
    var progress = step > 0 ? step + " / " + total + " stages" : "";

    return (
      '<div class="demo-label-row">' +
        '<span class="demo-tag">recorded demo · simulated data</span>' +
        '<span class="demo-scores">grounding 100% · hallucination 0% · 0 key leaks</span>' +
      "</div>" +
      '<div class="demo-dataset-note">' + escapeHtml(HERMES.dataset) + "</div>" +
      '<div class="demo-mini">Ask a preset question</div>' +
      '<div class="chip-row">' + chipsHtml + "</div>" +
      '<div class="demo-question">' + escapeHtml(trace.question) + "</div>" +
      '<div class="stage-list">' + stagesHtml + "</div>" +
      '<div class="control-row">' +
        '<button type="button" class="control-btn" data-action="control">' + controlLabel + "</button>" +
        '<span class="demo-mini-inline">' + progress + "</span>" +
      "</div>"
    );
  }

  function initHermesWidget() {
    var toggleBtn = document.querySelector('[data-demo-toggle="hermes"]');
    var panel = document.querySelector('[data-demo-panel="hermes"]');
    if (!toggleBtn || !panel) return;
    var state = { open: false, traceId: "revenue", step: 0, provOpen: false };

    function update() {
      toggleBtn.textContent = state.open ? "Hide demo ▴" : "Show demo ▾";
      panel.hidden = !state.open;
      panel.innerHTML = renderHermesPanel(state);
    }

    bindToggle(toggleBtn, panel, function () { state.open = !state.open; update(); });

    panel.addEventListener("click", function (e) {
      var el = e.target.closest("[data-action]");
      if (!el) return;
      var action = el.dataset.action;
      if (action === "select-trace") {
        state.traceId = el.dataset.traceId;
        state.step = 0;
        state.provOpen = false;
      } else if (action === "control") {
        var total = hermesPipeline(state).pipeline.length;
        if (state.step < total) state.step += 1;
        else { state.step = 0; state.provOpen = false; }
      } else if (action === "toggle-prov") {
        state.provOpen = !state.provOpen;
      }
      update();
    });

    update();
  }

  // ---------------------------------------------------------------------
  // Web Presence Report
  // ---------------------------------------------------------------------
  var REPORT = {
    overallGrade: "C+",
    clinicLine: "Lakeside Vision Care (fictional) · Fairhaven",
    claimText: "Flagged claim: a review implies a specific eye-health condition can be cured through a listed service — held for clinician sign-off; review text is never reproduced verbatim.",
    scorecard: [
      { section: "Google Business Profile", grade: "B", summary: "4.6 avg rating, 138 reviews, 62% owner response rate." },
      { section: "Local Map-Pack Visibility", grade: "D", summary: "SoLV 9%, ARP 8.4 across a 5×5 grid." },
      { section: "Competitive Snapshot", grade: "C", summary: "Trails top competitor by 1.1 rating points and 2× review velocity." },
      { section: "Website Health & Core Web Vitals", grade: "D+", summary: "Mobile PageSpeed 54/100, LCP 3.9s, CLS 0.18." },
      { section: "Schema & E-E-A-T / Trust", grade: "C-", summary: "LocalBusiness schema present; Physician and FAQPage schema missing." },
      { section: "Citations & NAP Consistency", grade: "B-", summary: "81% accuracy across 11 directories, 2 mismatched addresses." },
      { section: "Reviews & Reputation", grade: "B", summary: "Positive on staff friendliness; recurring complaints on wait times." },
      { section: "Keyword & Content Gaps", grade: "D", summary: "0 of 10 priority keywords in top 10; no dedicated service pages." },
      { section: "Backlink Profile", grade: "D+", summary: "14 referring domains, DR 18, vs 46 domains / DR 31 for top competitor." }
    ],
    projection: { "C+": "A-", "B": "A", "D": "B-", "C": "B", "D+": "B-", "C-": "B-", "B-": "A-" },
    geoPattern: [0, 1, 0, 0, 1, 1, 3, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0, 1, 3, 1, 1, 0, 0, 1, 0],
    plan: {
      "30-day": [
        "Reply to all unanswered Google reviews; set a 48-hour response target.",
        "Fix Business Profile primary category and correct NAP mismatches.",
        "Add LocalBusiness and Physician schema to homepage and provider pages.",
        "Rewrite page titles to lead with city name + primary service keyword.",
        "Launch a compliant, opt-in post-visit review-request workflow."
      ],
      "60-day": [
        "Publish the highest-demand missing service page from the gap analysis.",
        "Claim remaining unclaimed healthcare directories.",
        "Compress images and fix the top mobile Core Web Vitals issue."
      ],
      "90-day": [
        "Publish a second priority service page; begin a monthly content cadence.",
        "Start local backlink outreach to community and industry sites.",
        "Move to a weekly Business Profile posting cadence.",
        "Re-run the geo-grid scan and compare month-over-month SoLV/ARP."
      ]
    }
  };

  function renderReportPanel(state) {
    var after = state.after;

    var scorecardHtml = REPORT.scorecard.map(function (r) {
      var proj = REPORT.projection[r.grade] || r.grade;
      var g = after ? proj : r.grade;
      var delta = (after && proj !== r.grade) ? "▲ " + r.grade : null;
      return (
        '<div class="scorecard-row">' +
          '<span class="grade-chip" style="' + badgeInlineStyle(gradeVar(g), 10, 30) + '">' + escapeHtml(g) + "</span>" +
          '<div class="scorecard-body">' +
            '<div class="section-name">' + escapeHtml(r.section) + "</div>" +
            '<div class="summary-text">' + escapeHtml(r.summary) + "</div>" +
            (delta ? '<div class="delta-text">' + escapeHtml(delta) + "</div>" : "") +
          "</div>" +
        "</div>"
      );
    }).join("");

    var overall = after ? (REPORT.projection[REPORT.overallGrade] || REPORT.overallGrade) : REPORT.overallGrade;

    var geoCellsHtml = REPORT.geoPattern.map(function (v) {
      var alpha = [0, 14, 42, 85][v];
      var style = v === 0
        ? "background:transparent;border-color:var(--border);"
        : "background:color-mix(in srgb, var(--accent) " + alpha + "%, transparent);border-color:color-mix(in srgb, var(--accent) 30%, transparent);";
      return '<div class="geo-cell" style="' + style + '"></div>';
    }).join("");

    var planColsHtml = Object.keys(REPORT.plan).map(function (k) {
      var items = REPORT.plan[k].map(function (it) { return "<li>" + escapeHtml(it) + "</li>"; }).join("");
      return '<div class="plan-col"><div class="plan-head">' + escapeHtml(k) + '</div><ul class="plan-list">' + items + "</ul></div>";
    }).join("");

    return (
      '<div class="demo-label-row">' +
        '<span class="demo-tag">anonymized sample · synthetic metrics</span>' +
        '<span class="demo-scores">fictional clinic · not the real client</span>' +
      "</div>" +
      '<div class="gate-row">' +
        '<span class="gate-badge gate-badge--success">✓ Cost approved: $0.72 (&lt; $1.00)</span>' +
        '<span class="gate-badge gate-badge--warning">⚑ 1 clinical claim — pending clinician sign-off</span>' +
      "</div>" +
      '<div class="claim-note">' + escapeHtml(REPORT.claimText) + "</div>" +
      '<div class="top-grid">' +
        '<div class="overall-card">' +
          '<div class="demo-mini">Overall grade</div>' +
          '<div class="overall-grade" style="color:var(' + gradeVar(overall) + ')">' + escapeHtml(overall) + "</div>" +
          '<div class="clinic-line">' + escapeHtml(REPORT.clinicLine) + "</div>" +
        "</div>" +
        '<div class="geo-card">' +
          '<div class="demo-mini">Local map-pack visibility (5×5 geo-grid)</div>' +
          '<div class="geo-grid">' + geoCellsHtml + "</div>" +
          '<div class="geo-legend">SoLV 9% · ARP 8.4 · top-3 in 2 of 25 points</div>' +
        "</div>" +
      "</div>" +
      '<div class="seg-wrap">' +
        '<button type="button" class="seg-chip' + (!after ? " is-active" : "") + '" data-action="select-view" data-view="current">Current</button>' +
        '<button type="button" class="seg-chip' + (after ? " is-active" : "") + '" data-action="select-view" data-view="projected">Projected after plan</button>' +
      "</div>" +
      '<div class="scorecard-list">' + scorecardHtml + "</div>" +
      '<div class="demo-mini">30 / 60 / 90-day action plan</div>' +
      '<div class="plan-grid">' + planColsHtml + "</div>"
    );
  }

  function initReportWidget() {
    var toggleBtn = document.querySelector('[data-demo-toggle="report"]');
    var panel = document.querySelector('[data-demo-panel="report"]');
    if (!toggleBtn || !panel) return;
    var state = { open: false, after: false };

    function update() {
      toggleBtn.textContent = state.open ? "Hide demo ▴" : "Show demo ▾";
      panel.hidden = !state.open;
      panel.innerHTML = renderReportPanel(state);
    }

    bindToggle(toggleBtn, panel, function () { state.open = !state.open; update(); });

    panel.addEventListener("click", function (e) {
      var el = e.target.closest("[data-action]");
      if (!el) return;
      if (el.dataset.action === "select-view") {
        state.after = el.dataset.view === "projected";
      }
      update();
    });

    update();
  }

  // ---------------------------------------------------------------------
  // LLM Exam Grading Pipeline
  // ---------------------------------------------------------------------
  var GRADING = {
    qTitle: "Q3 · Ambiguity",
    qPrompt: 'Grammar S : S S | a | b. (Q3.1) Construct two parse trees of "a b a" to show ambiguity. (Q3.2) Remove the ambiguity by rewriting the grammar.',
    solutions: {
      "Q3.1": 'Tree 1: S -> (S:a)(S -> (S:b)(S:a))\nTree 2: S -> (S -> (S:a)(S:b))(S:a)\nSame string "a b a", two distinct derivations => ambiguous.',
      "Q3.2": "L(G) = (a|b)+\n\nS : S C | C\nC : a | b"
    },
    cases: {
      high: {
        scanNote: null,
        subscores: [
          { id: "Q3.1", score: 5, max: 5, confidence: "high", legibility: "ok", flagged: false,
            rationale: "Two distinct parse trees correctly demonstrate the ambiguity of S : S S | a | b — grouping (a)(b a) vs (a b)(a)." },
          { id: "Q3.2", score: 4, max: 5, confidence: "high", legibility: "ok", flagged: false,
            rationale: "Rewritten grammar is unambiguous and correct, capturing L(S) = (a|b)+ with a left-recursive S : S C | C form; minor deduction for not stating the language explicitly first." }
        ]
      },
      flagged: {
        scanNote: "Scan cut off at the page edge — the pipeline lowered confidence and flagged both items for human review rather than guessing.",
        subscores: [
          { id: "Q3.1", score: 3, max: 5, confidence: "low", legibility: "cutoff", flagged: true, flagText: "Flagged — low confidence + cutoff",
            rationale: "Answer partially cut off at page edge; attempted score pending human review." },
          { id: "Q3.2", score: 0, max: 5, confidence: "medium", legibility: "blank", flagged: true, flagText: "Flagged — blank",
            rationale: "No answer detected in the scanned region." }
        ]
      }
    }
  };

  function renderGradingPanel(state) {
    var cs = GRADING.cases[state.case];

    var caseChipsHtml =
      '<button type="button" class="seg-chip' + (state.case === "high" ? " is-active" : "") + '" data-action="select-case" data-case="high">High confidence</button>' +
      '<button type="button" class="seg-chip' + (state.case === "flagged" ? " is-active" : "") + '" data-action="select-case" data-case="flagged">Flagged for review</button>';

    var rightHtml;
    if (!state.reveal) {
      rightHtml = '<button type="button" class="control-btn" data-action="reveal">Grade this answer</button>';
    } else {
      var cardsHtml = cs.subscores.map(function (q) {
        var ratio = q.score / q.max;
        var scoreVar = ratio >= 1 ? "--success" : (ratio > 0 ? "--warning" : "--danger");
        var confV = confVar(q.confidence);
        var legAmber = q.legibility !== "ok";
        var legVar = legAmber ? "--warning" : "--muted";
        var whyOpen = !!state.whyOpen[q.id];
        var cardClass = q.flagged ? "subscore-card subscore-card--flagged" : "subscore-card";
        return (
          '<div class="' + cardClass + '">' +
            '<div class="subscore-head">' +
              '<span class="qid-text">' + escapeHtml(q.id) + "</span>" +
              '<span class="score-text" style="color:var(' + scoreVar + ')">' + q.score + " / " + q.max + "</span>" +
            "</div>" +
            '<div class="chip-row chip-row--tight">' +
              '<span class="mini-chip" style="' + badgeInlineStyle(confV, 10, 30) + '">conf: ' + escapeHtml(q.confidence) + "</span>" +
              '<span class="mini-chip" style="' + badgeInlineStyle(legVar, 10, 30) + '">legibility: ' + escapeHtml(q.legibility) + "</span>" +
              (q.flagged ? '<span class="mini-chip" style="' + badgeInlineStyle("--warning", 12, 40) + '">' + escapeHtml(q.flagText || "Flagged for human review") + "</span>" : "") +
            "</div>" +
            '<div class="rationale-text">' + escapeHtml(q.rationale) + "</div>" +
            '<button type="button" class="why-btn" data-action="toggle-why" data-qid="' + q.id + '">' + (whyOpen ? "Hide model solution" : "Why this score ▾") + "</button>" +
            (whyOpen ? '<div class="demo-mini">Model solution</div><pre class="sql-block">' + escapeHtml(GRADING.solutions[q.id]) + "</pre>" : "") +
          "</div>"
        );
      }).join("");
      rightHtml = '<div class="subscore-list">' + cardsHtml + "</div>";
    }

    return (
      '<div class="demo-label-row">' +
        '<span class="demo-tag">recorded demo · synthetic data</span>' +
        '<span class="demo-scores">$10.34 total · 70 students · $0.15 each</span>' +
      "</div>" +
      '<div class="seg-wrap">' + caseChipsHtml + "</div>" +
      '<div class="grading-grid">' +
        "<div>" +
          '<div class="demo-mini">' + escapeHtml(GRADING.qTitle) + "</div>" +
          '<div class="q-prompt">' + escapeHtml(GRADING.qPrompt) + "</div>" +
          '<div class="scan-wrap"><img src="assets/demos/grading_scan.png" alt="Cropped handwritten answer for exam question 3: two parse trees demonstrating grammar ambiguity and a rewritten unambiguous grammar" class="scan-img"></div>' +
          (cs.scanNote ? '<div class="scan-note">' + escapeHtml(cs.scanNote) + "</div>" : "") +
        "</div>" +
        "<div>" +
          '<div class="demo-mini">Pipeline output</div>' +
          rightHtml +
        "</div>" +
      "</div>"
    );
  }

  function initGradingWidget() {
    var toggleBtn = document.querySelector('[data-demo-toggle="grading"]');
    var panel = document.querySelector('[data-demo-panel="grading"]');
    if (!toggleBtn || !panel) return;
    var state = { open: false, case: "high", reveal: false, whyOpen: {} };

    function update() {
      toggleBtn.textContent = state.open ? "Hide demo ▴" : "Show demo ▾";
      panel.hidden = !state.open;
      panel.innerHTML = renderGradingPanel(state);
    }

    bindToggle(toggleBtn, panel, function () { state.open = !state.open; update(); });

    panel.addEventListener("click", function (e) {
      var el = e.target.closest("[data-action]");
      if (!el) return;
      var action = el.dataset.action;
      if (action === "select-case") {
        state.case = el.dataset.case;
        state.reveal = false;
        state.whyOpen = {};
      } else if (action === "reveal") {
        state.reveal = true;
      } else if (action === "toggle-why") {
        var qid = el.dataset.qid;
        state.whyOpen[qid] = !state.whyOpen[qid];
      }
      update();
    });

    update();
  }

  initHermesWidget();
  initReportWidget();
  initGradingWidget();
})();
