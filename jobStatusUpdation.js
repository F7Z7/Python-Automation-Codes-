/**
 * PRODUCTION-GRADE AUTOMATED JOB APPLICATION LIFECYCLE TRACKER
 * Senior Software Engineer Refactored Architecture Implementation
 * * Major Improvements Built In:
 * 1. Confidence-Score Evaluation Engine to filter out job recommendations/newsletters.
 * 2. High-Fidelity Entity Extraction Filters (replaces garbage data like "https", "Kavya", etc.).
 * 3. Conditional, Bound-Restricted Gemini REST Flash Fallback Integration.
 * 4. Enhanced Monotonic Status Transition Lifecycle with custom priority matrices.
 */

// ==========================================
// 1. ADVANCED CONFIGURATION SYSTEM
// ==========================================
const CONFIG = {
  HEADERS: [
    "Company", "Company Email", "Position", "Job ID", "Status", 
    "Offer", "Applied Date", "Last Updated", "Gmail Thread ID", "Recruiter", "Notes"
  ],
  LABEL_NAME: "JobTracker/Processed",
  MAX_THREADS_PER_RUN: 75, // Increased processing bandwidth limit per transactional sweep
  
  // Scoring Threshold Filters
  CONFIDENCE_THRESHOLD: 5,        // Threads must score >= 5 to get logged into the database
  GEMINI_SCORE_RANGE: { MIN: 1, MAX: 7 }, // Trigger Gemini conditionally only if heuristics fall into ambiguity
  
  // Gemini Cognitive Layer Settings
  GEMINI: {
    ENABLED: false, // Turn on manually if desired
    API_KEY: "YOUR_GEMINI_API_KEY_HERE",
    ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
  },

  // Priority ranking for Status Lifecycle (Ensures structural history cannot be downgraded)
  STATUS_PRIORITY: {
    "Unknown": 0, "Applied": 1, "Application Received": 1, "Under Review": 2,
    "Assessment": 3, "Phone Screen": 4, "HR Interview": 5, "Technical Interview": 5,
    "Manager Interview": 5, "Final Interview": 6, "Withdrawn": 7, "Ghosted": 7,
    "Rejected": 8, "Offer": 9, "Accepted": 10, "Joined": 11
  },

  // Whitelists & Blacklists Core Framework
  BLACK_LIST_DOMAINS: [
    "glassdoor.com", "monsterindia.com", "foundit.in", "naukri.com", 
    "shine.com", "internshala.com", "unstop.com", "crio.in", 
    "coursera.org", "udemy.com", "skillshare.com"
  ],
  
  ATS_WHITE_LIST_TOKENS: [
    "workday", "greenhouse", "lever", "icims", "successfactors", 
    "ashby", "smartrecruiters", "oracle", "bamboohr", "dayforce", "myworkday"
  ],

  // Granular Status Heuristics Dictionary
  KEYWORDS: {
    "Rejected": [
      "unfortunately", "after careful consideration", "not moving forward", 
      "position has been filled", "application unsuccessful", "pursue other candidates",
      "decided to move forward with", "not selected", "thank you for your interest but",
      "no longer being considered"
    ],
    "Offer": [
      "congratulations", "offer letter", "pleased to offer", "employment offer",
      "offer details", "welcome to the team", "extending an offer"
    ],
    "Final Interview": [
      "final round", "final interview", "final discussion", "presentation round"
    ],
    "Technical Interview": [
      "technical interview", "technical discussion", "coding interview", 
      "architecture round", "live coding", "tech round"
    ],
    "Manager Interview": [
      "hiring manager interview", "manager round", "discussion with the manager"
    ],
    "HR Interview": [
      "hr interview", "hr round", "culture fit", "behavioral interview"
    ],
    "Phone Screen": [
      "phone screen", "phone interview", "initial call", "exploratory call", "screening call"
    ],
    "Interview": [ 
      "interview invitation", "schedule an interview", "invitation to interview", 
      "availability for a call", "speak with us", "online interview"
    ],
    "Assessment": [
      "coding assessment", "hackerrank", "codility", "testgorilla", 
      "online test", "technical assessment", "take-home assignment", "hacker earth"
    ],
    "Application Received": [
      "application received", "thank you for applying", "received your application",
      "successful submission", "confirming receipt", "acknowledgement of application"
    ]
  }
};

// Global Pipeline Performance Metrics Tracker
const Telemetry = {
  processed: 0, updated: 0, added: 0, skipped: 0, errors: 0,
  log(msg) { Logger.log(msg); },
  printSummary() {
    Logger.log(`\n=== REFACTORED APPLICATION ENGINE METRICS ===\n` +
               `Processed Threads:   ${this.processed}\n` +
               `Rows Added:          ${this.added}\n` +
               `Rows Updated:        ${this.updated}\n` +
               `Threads Skipped:     ${this.skipped}\n` +
               `Errors Encountered:  ${this.errors}\n` +
               `============================================`);
  }
};

// ==========================================
// 2. PRIMARY ENTRY POINTS & EXECUTION CONTROL
// ==========================================

function fetchOldEmails() {
  Telemetry.log("Executing production-grade 365-day historical scan...");
  processGmailPipeline(365);
}

function scanRecentEmails() {
  Telemetry.log("Executing production-grade incremental 2-day system sweep...");
  processGmailPipeline(2);
}

function processGmailPipeline(daysBack) {
  try {
    const sheet = getOrInitializeSheet();
    const sheetData = readSheetIntoMemory(sheet);
    const processedLabel = getOrCreateLabel(CONFIG.LABEL_NAME);
    
    const threads = searchGmail(daysBack);
    Telemetry.log(`Discovered ${threads.length} sync-ready workspace threads.`);

    for (const thread of threads) {
      Telemetry.processed++;
      const threadId = thread.getId();
      
      try {
        if (hasLabel(thread, CONFIG.LABEL_NAME)) {
          Telemetry.skipped++;
          continue;
        }

        const messages = thread.getMessages();
        if (messages.length === 0) continue;

        // Extract complete thread data footprint
        let accumulatedBody = "";
        let finalSenderAddress = "";
        let finalFromRaw = "";
        let subject = "";
        
        messages.forEach(msg => {
          accumulatedBody += "\n" + msg.getPlainBody();
          if(!finalSenderAddress) {
            finalFromRaw = msg.getFrom();
            finalSenderAddress = extractEmailAddress(finalFromRaw);
            subject = msg.getSubject();
          }
        });

        // Confidence Engine Filtering
        const scoringPayload = calculateConfidenceScore(finalSenderAddress, finalFromRaw, subject, accumulatedBody);
        
        if (scoringPayload.score < CONFIG.CONFIDENCE_THRESHOLD) {
          Telemetry.log(`[Skipped Engine Check] Low confidence score (${scoringPayload.score}) on Subject: "${subject}". Reason: ${scoringPayload.reason}`);
          Telemetry.skipped++;
          // Label anyway to exclude from future high-cost routine iteration sweeps
          thread.addLabel(processedLabel);
          continue;
        }

        // Determine if conditional AI parser execution is necessary
        let useGeminiFallback = false;
        if (CONFIG.GEMINI.ENABLED && 
            scoringPayload.score >= CONFIG.GEMINI_SCORE_RANGE.MIN && 
            scoringPayload.score <= CONFIG.GEMINI_SCORE_RANGE.MAX) {
          useGeminiFallback = true;
          Telemetry.log(`[Triggering Gemini Fallback] Ambiguity detected. Confidence Score: ${scoringPayload.score}`);
        }

        let company, position, jobId, recruiter, detectedStatus;

        if (useGeminiFallback) {
          const geminiPayload = analyzeWithGemini(accumulatedBody, subject);
          company = geminiPayload.company || extractCompany(finalSenderAddress, finalFromRaw, accumulatedBody);
          position = geminiPayload.position || extractPosition(subject, accumulatedBody);
          jobId = geminiPayload.jobId || extractJobId(subject, accumulatedBody);
          recruiter = geminiPayload.recruiter || extractRecruiter(accumulatedBody);
          detectedStatus = geminiPayload.status || detectStatus(accumulatedBody, subject);
        } else {
          company = extractCompany(finalSenderAddress, finalFromRaw, accumulatedBody);
          position = extractPosition(subject, accumulatedBody);
          jobId = extractJobId(subject, accumulatedBody);
          recruiter = extractRecruiter(accumulatedBody);
          detectedStatus = detectStatus(accumulatedBody, subject);
        }

        // Integrity Assertions: Validate and protect entity integrity profiles
        if (company === "Farzan R.S" || company === "Unknown Company" || isGarbageValue(company)) {
          Telemetry.log(`[Validation Protection] Aborted entry insertion for Thread ID: ${threadId}. Company filtered.`);
          Telemetry.skipped++;
          thread.addLabel(processedLabel);
          continue;
        }

        const payload = {
          threadId: threadId, company: company, email: finalSenderAddress,
          position: position, jobId: jobId, status: detectedStatus,
          recruiter: recruiter, dateApplied: messages[0].getDate()
        };

        upsertToMemoryStorage(sheetData, payload);
        thread.addLabel(processedLabel);

      } catch (threadError) {
        Telemetry.errors++;
        Telemetry.log(`[Thread Execution Exception] Reference ID ${threadId}: ${threadError.message}`);
      }
    }

    flushMemoryToSheet(sheet, sheetData);
    Telemetry.printSummary();

  } catch (globalError) {
    Telemetry.log(`[Critical Master Engine Stall] Error: ${globalError.stack}`);
  }
}

// ==========================================
// 3. ADVANCED MATRIX CONFIDENCE SCORE SYSTEM
// ==========================================

function calculateConfidenceScore(email, fromRaw, subject, body) {
  let score = 0;
  let matches = [];

  const normalizedText = (subject + " " + body).toLowerCase();
  const normalizedEmail = email.toLowerCase();
  const normalizedFrom = fromRaw.toLowerCase();

  // Rule 1: Master Sender Domain Restrictions
  const matchesBlacklist = CONFIG.BLACK_LIST_DOMAINS.some(domain => normalizedEmail.includes(domain));
  if (matchesBlacklist) {
    score -= 8;
    matches.push("Blacklisted Sourced Platform");
  }

  // Rule 2: Multi-tenant ATS Identifier Verification
  const matchesWhitelist = CONFIG.ATS_WHITE_LIST_TOKENS.some(token => normalizedEmail.includes(token) || normalizedFrom.includes(token));
  if (matchesWhitelist) {
    score += 6;
    matches.push("ATS Certified Gateway Signature");
  }

  // Rule 3: Anti-Noise Marketing Exclusion Block Filters
  const transactionalExclusions = /newsletter|job alerts?|recommendations?|picks for you|unstop notifications|resume-worthy|built a li-ion|otp for login|verification code|security alert|login alert/i;
  if (transactionalExclusions.test(subject) || transactionalExclusions.test(normalizedEmail)) {
    score -= 8;
    matches.push("Promotional/OTP/Alert System Flag");
  }

  // Rule 4: Action Status Tracking Points Evaluation Matrix
  if (containsKeywords(normalizedText, CONFIG.KEYWORDS["Application Received"])) { score += 5; matches.push("Recieved Confirmation Tag"); }
  if (containsKeywords(normalizedText, CONFIG.KEYWORDS["Interview"]) || containsKeywords(normalizedText, CONFIG.KEYWORDS["Phone Screen"])) { score += 5; matches.push("Interview Hook"); }
  if (containsKeywords(normalizedText, CONFIG.KEYWORDS["Assessment"])) { score += 5; matches.push("Assessment Hook"); }
  if (containsKeywords(normalizedText, CONFIG.KEYWORDS["Offer"])) { score += 6; matches.push("Offer Progression Hook"); }
  if (containsKeywords(normalizedText, CONFIG.KEYWORDS["Rejected"])) { score += 6; matches.push("Rejection Lifecycle Trigger"); }

  // Rule 5: Secondary Structure Integrity Checks
  if (/(?:job\s*id|req\s*id|requisition\s*id|job\s*number)[:\s#]*[A-Za-z0-9\-]{3,15}/i.test(normalizedText)) {
    score += 5;
    matches.push("Job Identifier Validation Match");
  }
  if (/thank you for applying|successful submission|received your application/i.test(normalizedText)) {
    score += 5;
    matches.push("Direct Submission Receipt Verbiage");
  }

  return { score: score, reason: matches.join(", ") };
}

// ==========================================
// 4. REGEX REFACTORED DATA EXTRACTION ENGINES
// ==========================================

function extractEmailAddress(fromStr) {
  const matches = fromStr.match(/<([^>]+)>/);
  return normalizeText(matches ? matches[1] : fromStr);
}

function extractCompany(email, fromRaw, body) {
  // Filter out personal name variations before evaluating display blocks
  let cleanFromRaw = fromRaw.replace(/(farzan\s*r\.?s\.?|kavya)/i, '').trim();

  // Extraction Layer 1: Whitelist Parsing checks
  for (const token of CONFIG.ATS_WHITE_LIST_TOKENS) {
    if (email.includes(token) && cleanFromRaw.includes("<")) {
      let displayName = cleanFromRaw.split("<")[0].replace(/['"]+/g, '').trim();
      displayName = displayName.replace(/(careers?|jobs?|recruitment|hr|talent|team|hiring|via)/i, '').replace(/[-\s]+$/, '').trim();
      if (displayName.length > 1 && !isGarbageValue(displayName)) return displayName;
    }
  }

  // Extraction Layer 2: Natural Display Context Blocks
  if (cleanFromRaw.includes("<")) {
    let displayName = cleanFromRaw.split("<")[0].replace(/['"]+/g, '').trim();
    displayName = displayName.replace(/(careers?|jobs?|recruitment|hr|talent|team|hiring|notifications|apply)/i, '').replace(/[-\s]+$/, '').trim();
    if (displayName.length > 1 && !isGarbageValue(displayName)) return displayName;
  }

  // Extraction Layer 3: Base Domain Architecture Interception
  const domain = email.split('@')[1];
  if (domain && !/gmail|yahoo|outlook|hotmail|live|icloud|workday|greenhouse|lever|successfactors/i.test(domain)) {
    const cleanComp = domain.split('.')[0];
    const formatted = cleanComp.charAt(0).toUpperCase() + cleanComp.slice(1);
    if (!isGarbageValue(formatted)) return formatted;
  }

  // Extraction Layer 4: Text structural anchor checks
  const contextPatterns = [
    /thank you for your interest in ([A-Z][A-Za-z0-9\s,.&]{2,25})(?:\.|!|\sfor)/,
    /welcome to ([A-Z][A-Za-z0-9\s,.&]{2,25}) (?:careers|talent|team)/i
  ];
  for (const regex of contextPatterns) {
    const contextMatch = body.match(regex);
    if (contextMatch && !isGarbageValue(contextMatch[1])) return contextMatch[1].trim();
  }

  return "Unknown Company";
}

function extractPosition(subject, body) {
  let cleanedSubject = subject.replace(/fwd:|re:|interview invitation:|application update:/i, '').trim();
  
  const patterns = [
    /(?:position|job title|role|applied for|opening|vacancy|designation)[:\s\-]+([A-Za-z0-9\s#\-\(\)\/]{3,35})/i,
    /application for\s+([A-Za-z0-9\s#\-\(\)\/]{3,35})/i,
    /status of your\s+([A-Za-z0-9\s#\-\(\)\/]{3,35})\s+application/i
  ];

  for (const regex of patterns) {
    const match = body.match(regex) || cleanedSubject.match(regex);
    if (match && match[1]) {
      const parsedVal = match[1].trim().replace(/\s+/g, ' ');
      if (!isGarbageValue(parsedVal)) return parsedVal;
    }
  }

  return isGarbageValue(cleanedSubject) ? "Job Applicant Position" : cleanedSubject;
}

function extractJobId(subject, body) {
  const patterns = [
    /(?:job\s*id|req\s*id|reference\s*id|requisition\s*id|job\s*number)[:\s#]*([A-Za-z0-9\-]{3,15})/i,
    /\b(JR\d{4,6}|REQ-\d{3,6}|R-\d{3,6}|\d{6})\b/i
  ];

  for (const regex of patterns) {
    const match = body.match(regex) || subject.match(regex);
    if (match && match[1]) return match[1].trim().toUpperCase();
  }
  return "N/A";
}

function extractRecruiter(body) {
  const patterns = [
    /(?:regards|thanks|best|sincerely),\s*\n+([A-Z][a-z]+\s[A-Z][a-z]+)/,
    /(?:recruiter|point of contact|hiring team)[:\s]+([A-Z][a-z]+\s[A-Z][a-z]+)/i
  ];

  // Structural strict validation array checks for signature extraction filtering
  const corporateFalsePositives = /human resources|recruitment team|talent acquisition|hiring team|the talent|even opens|on behalf|your wika|company recruiter/i;

  for (const regex of patterns) {
    const match = body.match(regex);
    if (match && match[1]) {
      const candidateName = match[1].trim();
      if (!corporateFalsePositives.test(candidateName) && candidateName.length > 2) {
         return candidateName;
      }
    }
  }
  return "Not Identified";
}

function detectStatus(body, subject) {
  const combinedText = (subject + " " + body).toLowerCase();
  
  const statusOrder = [
    "Offer", "Rejected", "Final Interview", "Technical Interview", 
    "Manager Interview", "HR Interview", "Phone Screen", "Assessment", "Application Received"
  ];

  for (const status of statusOrder) {
    const wordList = CONFIG.KEYWORDS[status];
    if (wordList && containsKeywords(combinedText, wordList)) {
      return status;
    }
  }
  return "Applied";
}

function containsKeywords(targetText, keywordArray) {
  return keywordArray.some(keyword => targetText.includes(keyword.toLowerCase()));
}

function isGarbageValue(val) {
  if (!val) return true;
  const lowercaseVal = val.toLowerCase().trim();
  const garbageTokens = [
    "https", "http", "clicks", "alle", "alert", "picks for you", 
    "market really this difficult", "farzan r.s", "farzan", "kavya", "team crio", "crio"
  ];
  if (garbageTokens.some(token => lowercaseVal.includes(token))) return true;
  if (lowercaseVal.length <= 1) return true;
  return false;
}

function normalizeText(text) {
  return text ? text.trim().toLowerCase() : "";
}

// ==========================================
// 5. DATA COMPACTION & MEMORY CORE WRITE SYSTEM
// ==========================================

function upsertToMemoryStorage(sheetData, payload) {
  const headers = sheetData.headers;
  const db = sheetData.rows;
  
  let targetedRowIndex = findExistingRowIndex(db, headers, payload);

  const statusPriorityCurrent = CONFIG.STATUS_PRIORITY[payload.status] || 0;
  const stampDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  const appliedDateStr = Utilities.formatDate(payload.dateApplied, Session.getScriptTimeZone(), "yyyy-MM-dd");

  if (targetedRowIndex !== -1) {
    const existingRow = db[targetedRowIndex];
    const existingStatus = existingRow[headers.indexOf("Status")] || "Unknown";
    const statusPriorityExisting = CONFIG.STATUS_PRIORITY[existingStatus] || 0;

    // Strict Progression Rule Check
    if (statusPriorityCurrent > statusPriorityExisting) {
      existingRow[headers.indexOf("Status")] = payload.status;
      Telemetry.log(`[Status Escalation Matches] Thread ID: ${payload.threadId} progressed forward to: ${payload.status}`);
      if (payload.status === "Offer") Telemetry.log(`[Offer Notification Event Flagged] Processing thread complete.`);
      if (payload.status === "Rejected") Telemetry.log(`[Rejection Notification Event Flagged] Processing thread complete.`);
    } else {
      Telemetry.log(`[Duplicate Tracker Match] Structural lifecycle duplicate matched for Thread ID: ${payload.threadId}. Blocked downgrade protection sweep logic.`);
    }

    if (payload.status === "Offer") existingRow[headers.indexOf("Offer")] = "YES";
    if (payload.jobId !== "N/A" && existingRow[headers.indexOf("Job ID")] === "N/A") {
      existingRow[headers.indexOf("Job ID")] = payload.jobId;
    }
    
    existingRow[headers.indexOf("Last Updated")] = stampDate;
    db[targetedRowIndex] = existingRow; 
    Telemetry.updated++;
  } else {
    // Structural Appending Build Sequence Execution
    const newRow = new Array(headers.length).fill("");
    newRow[headers.indexOf("Company")] = payload.company;
    newRow[headers.indexOf("Company Email")] = payload.email;
    newRow[headers.indexOf("Position")] = payload.position;
    newRow[headers.indexOf("Job ID")] = payload.jobId;
    newRow[headers.indexOf("Status")] = payload.status;
    newRow[headers.indexOf("Offer")] = (payload.status === "Offer") ? "YES" : "No";
    newRow[headers.indexOf("Applied Date")] = appliedDateStr;
    newRow[headers.indexOf("Last Updated")] = stampDate;
    newRow[headers.indexOf("Gmail Thread ID")] = payload.threadId;
    newRow[headers.indexOf("Recruiter")] = payload.recruiter;
    newRow[headers.indexOf("Notes")] = "Production Automated Pipeline Match Logged";

    db.push(newRow);
    Telemetry.log(`[Application Logged Successfully] Logging tracked entry details: ${payload.company} - ${payload.position}`);
    Telemetry.added++;
  }
}

function findExistingRowIndex(rows, headers, payload) {
  const tIdIdx = headers.indexOf("Gmail Thread ID");
  const compIdx = headers.indexOf("Company");
  const jIdIdx = headers.indexOf("Job ID");
  const posIdx = headers.indexOf("Position");

  // Multi-tier structural cascading lookup matching engine
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][tIdIdx] === payload.threadId) return i;
  }
  if (payload.jobId !== "N/A") {
    for (let i = 0; i < rows.length; i++) {
      if (normalizeText(rows[i][compIdx]) === normalizeText(payload.company) && 
          normalizeText(rows[i][jIdIdx]) === normalizeText(payload.jobId)) return i;
    }
  }
  for (let i = 0; i < rows.length; i++) {
    if (normalizeText(rows[i][compIdx]) === normalizeText(payload.company) && 
        normalizeText(rows[i][posIdx]) === normalizeText(payload.position)) return i;
  }
  return -1;
}

// ==========================================
// 6. IO STORAGE ASSIGNMENT SUBSYSTEMS
// ==========================================

function getOrInitializeSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CONFIG.HEADERS);
    sheet.getRange(1, 1, 1, CONFIG.HEADERS.length)
         .setFontWeight("bold")
         .setBackground("#EFA1A1")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readSheetIntoMemory(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return { headers: CONFIG.HEADERS, rows: [] };
  
  const fullRangeValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  return { headers: fullRangeValues[0].map(h => h.toString().trim()), rows: fullRangeValues.slice(1) };
}

function flushMemoryToSheet(sheet, sheetData) {
  if (sheetData.rows.length === 0) return;
  sheet.getRange(2, 1, sheetData.rows.length, sheetData.headers.length).setValues(sheetData.rows);
}

function searchGmail(daysBack) {
  const dateOffset = new Date();
  dateOffset.setDate(dateOffset.getDate() - daysBack);
  const formattedDate = dateOffset.getFullYear() + "/" + (dateOffset.getMonth() + 1) + "/" + dateOffset.getDate();
  
  // Advanced query logic explicitly removing system notifications or alerts before scanning raw text payloads
  const query = `after:${formattedDate} -label:${CONFIG.LABEL_NAME} -"job alert" -"recommendation" -"picks for you" (subject:(application OR interview OR assessment OR onboarding OR offer OR hiring OR role OR position) OR "thank you for applying" OR "received your application")`;
  
  return GmailApp.search(query, 0, CONFIG.MAX_THREADS_PER_RUN);
}

function getOrCreateLabel(name) {
  let label = GmailApp.getUserLabelByName(name);
  return label ? label : GmailApp.createLabel(name);
}

function hasLabel(thread, labelName) {
  return thread.getLabels().some(l => l.getName() === labelName);
}

// ==========================================
// 7. REST AI COGNITIVE PARSING RUNTIME LAYER
// ==========================================

function analyzeWithGemini(emailText, subjectLine) {
  const fallbackStructure = { company: "", position: "", jobId: "", recruiter: "", status: "" };
  try {
    const promptPayload = `You are a data validation system for corporate tracking sheets. 
    Analyze the following email metadata and text payload context from a job applicant search history.
    
    Subject Line Context: "${subjectLine}"
    Body Payload Context: "${emailText}"
    
    Parse specific structural tokens. Return a plain text standard JSON response matching these properties. 
    Do not wrap output inside markdown blocks like \`\`\`json. Output raw JSON object strings text only.
    If properties cannot be identified with complete certainty, map them directly to blank string configurations "".
    
    Expected JSON Structure Schema Output format:
    {
      "company": "Cleaned Corporate Trading Entity name only, without junk trailing text descriptors",
      "position": "Accurate clear job variant title role parsed",
      "jobId": "Parsed code alphanumeric ID strings or empty string if not found",
      "recruiter": "Individual actual point-of-contact structural name parsed",
      "status": "Map exclusively to one of these: Applied, Application Received, Under Review, Assessment, Phone Screen, HR Interview, Technical Interview, Manager Interview, Final Interview, Rejected, Offer"
    }`;

    const payload = { contents: [{ parts: [{ text: promptPayload }] }] };
    const options = {
      method: "post", contentType: "application/json",
      payload: JSON.stringify(payload), muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(`${CONFIG.GEMINI.ENDPOINT}?key=${CONFIG.GEMINI.API_KEY}`, options);
    const jsonParsed = JSON.parse(response.getContentText());
    
    if (jsonParsed.candidates && jsonParsed.candidates[0].content.parts[0].text) {
      const parsedText = jsonParsed.candidates[0].content.parts[0].text.trim();
      return JSON.parse(parsedText);
    }
  } catch (err) {
    Logger.log(`[AI Extraction Fallback Skipped Alert] Execution skipped. Reason: ${err.message}`);
  }
  return fallbackStructure;
}
