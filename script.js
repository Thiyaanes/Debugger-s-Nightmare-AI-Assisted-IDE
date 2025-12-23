/* =========================
   STARTER TEMPLATES
========================= */
const starter = { 
  javascript: `// JS Starter\nconsole.log("Hello Chaos!");`,
  python: `# Python Starter\nprint("Hello Chaos!")`,
  cpp: `// C++ Starter\n#include <iostream>\nusing namespace std;\nint main(){ \n\tcout<<"Hello Chaos!"; \n\treturn 0; \n}`
};

/* =========================
   MESSAGES
========================= */
const errors = [
  "💁SyntaxError: Unexpected 'success' near line 42",
  "♾️RuntimeError: Infinite loop of regret detected.",
  "🤯Segmentation fault: You blinked too fast.",
  "😭SyntaxError: 'fun' is not defined.",
  "🤐MemoryLeakError: Your code is crying.",
  "TypeError: Expected genius, got confusion.",
  "StackOverflow: Your logic fell down the stairs.",
  "⚠️Warning: You fixed one bug and created three.",
  "FatalError: Coffee not found ☕"
];

const sarcasm = [
  "💁Probably running fine. Probably.",
  "Looks okay... if you squint hard enough.",
  "It compiled! That’s suspicious.",
  "🤐Wow, zero errors? Impossible.",
  "Your code runs on pure chaos energy.",
  "Working as intended... maybe?",
  "⚠️Error: You're too optimistic."
];

/* =========================
   DOM & STATE
========================= */
let countdown = 15, timer;
const cdEl = document.getElementById("countdown");
const logEl = document.getElementById("consoleLog");
const outputBox = document.getElementById("outputBox");
const langSelect = document.getElementById("langSelect");
const difficultySelect = document.getElementById("difficultySelect");
const modeSelect = document.getElementById("modeSelect");

const editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/python");
editor.setValue(starter.python, -1);

let injectionStack = [];
let cleanBase = null;
let injectedCode = null;
let lastError = null;
let lastSarcasm = null;

modeSelect.value = "nightmare";

/* =========================
   UTILITIES
========================= */
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}

function log(msg) {
  logEl.innerHTML += "\n" + msg;
  logEl.scrollTop = logEl.scrollHeight;
}

function getSarcasm() {
  let s;
  do { s = sarcasm[Math.floor(Math.random() * sarcasm.length)]; }
  while (s === lastSarcasm);
  lastSarcasm = s;
  return s;
}

/* =========================
   TIMER
========================= */
function startTimer() {
  countdown = 15;
  cdEl.textContent = countdown;
  clearInterval(timer);
  timer = setInterval(() => {
    countdown--;
    cdEl.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(timer);
      autoRun();
    }
  }, 1000);
}

/* =========================
   BUG INJECTION
========================= */
function injectBug(code, lang, difficulty) {
  let lines = code.split('\n');
  let desc = '';
  const choice = Math.floor(Math.random() * 3);

  if (lang === 'python') {
    if (difficulty === 'beginner') {
      if (choice === 0) lines.splice(1,0,'print(unknown_var)');
      else if (choice === 1) lines.splice(1,0,'print("Hello"');
      else lines.splice(1,0,'if True\n    print(1)');
    } else {
      lines.push('while True:\n  pass');
    }
  }

  if (lang === 'javascript') {
    if (choice === 0) lines.push('console.log(unknownVar);');
    else if (choice === 1) lines.push('if(true) console.log("oops"');
    else lines.push('while(true){}');
  }

  if (lang === 'cpp') lines.push('while(true){}');

  return { code: lines.join('\n'), description: desc };
}

/* =========================
   EXECUTION
========================= */
async function executeEditorCode(code, lang) {
  try {
    if (lang === "javascript") {
      new Function(code)();
      return { output:"", error:null };
    }

    if (lang === "python") {
      const res = await fetch("http://127.0.0.1:5000/execute", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (/Error|Traceback/.test(data.output)) return { output:null, error:data.output };
      return { output:data.output, error:null };
    }

    return { output:"(C++ execution simulated)", error:null };
  } catch (e) {
    return { output:null, error:String(e) };
  }
}

/* =========================
   RENDER
========================= */
function renderResult(statusHtml, result) {
  let body = "";
  if (result.error) {
    lastError = result.error;
    body = `<pre class="errorMsg">${escapeHtml(result.error)}</pre>`;
  } else {
    body = `<pre class="correctOutput">${escapeHtml(result.output || "(no output)")}</pre>`;
  }
  outputBox.innerHTML = `${statusHtml}<div class="resultArea">${body}</div>`;
}

async function runAndShow(code, lang, statusHtml) {
  const res = await executeEditorCode(code, lang);
  renderResult(statusHtml, res);
}

/* =========================
   AUTO RUN
========================= */
async function autoRun() {
  const sarcasmMsg = getSarcasm();
  log("⏱️ " + sarcasmMsg);
  await runAndShow(editor.getValue(), langSelect.value,
    `<div class="sarcastic">${escapeHtml(sarcasmMsg)}</div>`
  );
}

/* =========================
   RUN BUTTON
========================= */
document.getElementById("runBtn").onclick = async () => {
  clearInterval(timer);
  const lang = langSelect.value;
  const mode = modeSelect.value;
  const diff = difficultySelect.value;

  if (mode === "nightmare") {
    if (!cleanBase) cleanBase = editor.getValue(); // save only once

const currentCode = editor.getValue(); 
const injected = injectBug(currentCode, lang, diff);
editor.setValue(injected.code, -1);

    log(getSarcasm());
    startTimer();
  } else {
    await runAndShow(editor.getValue(), lang, `<div class="correctMsg">Running...</div>`);
  }
};

/* =========================
   GIVE UP
========================= */
document.getElementById("giveUpBtn").onclick = async () => {
  clearInterval(timer);
  editor.setValue(cleanBase || editor.getValue(), -1);
  cleanBase = null;
  await runAndShow(editor.getValue(), langSelect.value,
    `<div class="sarcastic">💀 Gave up. Restored safe code.</div>`
  );
};

/* =========================
   LANGUAGE SWITCH
========================= */
langSelect.addEventListener("change", () => {
  clearInterval(timer);
  const lang = langSelect.value;
  editor.session.setMode(
    lang === "javascript" ? "ace/mode/javascript" :
    lang === "cpp" ? "ace/mode/c_cpp" :
    "ace/mode/python"
  );
  editor.setValue(starter[lang], -1);
});

/* =========================
   AI / GEMINI (FIXED)
========================= */
const aiChat = document.getElementById("aiChat");
const aiInput = document.getElementById("aiUserInput");
const aiSendBtn = document.getElementById("aiSendBtn");
const aiGemBtn = document.getElementById("aiGem");

function addMsg(text, who="ai") {
  const div = document.createElement("div");
  div.className = `ai-msg ${who}`;
  div.textContent = text;
  aiChat.appendChild(div);
  aiChat.scrollTop = aiChat.scrollHeight;
}

async function askGemini(prompt) {
  try {
    const res = await fetch("http://127.0.0.1:5000/gemini", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        prompt,
        code: editor.getValue(),
        error: lastError || "No error"
      })
    });
    const data = await res.json();
    return data.reply || "⚠️ Empty response from Gemini";
  } catch {
    return "⚠️ Gemini backend not reachable.";
  }
}

async function sendToGemini(userText) {
  addMsg(userText, "user");
  aiInput.value = "";
  addMsg("⏳ Thinking...", "ai");

  const reply = await askGemini(userText);
  aiChat.lastChild.remove();
  addMsg(reply, "ai");
}

aiSendBtn.onclick = () => {
  const text = aiInput.value.trim();
  if (text) sendToGemini(text);
};

aiInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    aiSendBtn.click();
  }
});

if (aiGemBtn) {
  aiGemBtn.onclick = () => {
    const panel = document.getElementById("aiPanel");

    // TOGGLE instead of always open
    panel.classList.toggle("open");

    if (panel.classList.contains("open")) {
      if (aiChat.children.length === 0) {
        addMsg("👋 Ask me to explain errors or fix code 😈", "ai");
      }
    }
  };
}
