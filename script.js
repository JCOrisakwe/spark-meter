const input = document.getElementById("raw-input");
const results = document.getElementById("results");
const emptyState = document.getElementById("empty-state");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-btn");
const locationSelect = document.querySelector("#location");
const RowStart = document.querySelector("#new-row-start");

const copyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

// Normalizes a raw tag like "77A(G)" -> {tag:"077AG", id:"077}
// and "54G" -> {tag:"054G", id:"054"}, "184" -> {tag:"184", id:"184"}
function normalizeTag(rawTag) {
  const cleaned = rawTag.replace(/[()]/g, "").toUpperCase();
  const digitsMatch = cleaned.match(/\d+/);
  const digits = digitsMatch ? digitsMatch[0] : "0";
  const letters = cleaned.replace(/[0-9]/g, "");
  const paddedDigits = digits.padStart(3, "0");
  return { tag: paddedDigits + letters, id: paddedDigits };
}

function parseLine(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return { error: true, raw: line };
  console.log(tokens);
  const reference = tokens[0].slice(-4);
  const rawTag = tokens[tokens.length - 1];
  const name = tokens.slice(1, -1).join(" ");
  const { tag, id } = normalizeTag(rawTag);
  return {
    error: false,
    raw: line,
    name,
    userCode: `ACOB_${locationSelect.value.split(/[ -]/)[0]}_${id}`,
    location: locationSelect.value,
    reference,
    tag,
  };
}

async function copyValue(text, btnEl, rowEl) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  btnEl.classList.add("copied");
  btnEl.innerHTML = checkIcon;
  rowEl.classList.add("copied");
  setTimeout(() => {
    btnEl.classList.remove("copied");
    btnEl.innerHTML = copyIcon;
    rowEl.classList.remove("copied");
  }, 1000);
}

function fieldRow(label, value) {
  const row = document.createElement("div");
  row.className = "field-row";

  const lab = document.createElement("div");
  lab.className = "label";
  lab.textContent = label;

  const val = document.createElement("div");
  val.className = "value";
  val.textContent = value;
  val.title = value;

  const btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.innerHTML = copyIcon;
  btn.addEventListener("click", () => copyValue(value, btn, row));

  row.appendChild(lab);
  row.appendChild(val);
  row.appendChild(btn);
  return row;
}

let firstRow = 1;
function render() {
  const lines = input.value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  results.innerHTML = "";

  if (lines.length === 0) {
    results.appendChild(emptyState);
    countEl.textContent = "0 rows parsed";
    return;
  }

  let ok = 0;
  lines.forEach((line, i) => {
    const rec = parseLine(line);
    const card = document.createElement("div");
    card.className = "card" + (rec.error ? " error" : "");

    const head = document.createElement("div");
    head.className = "card-head";
    head.innerHTML = `<span>ROW ${i + firstRow}</span><span class="raw">${rec.raw}</span>`;
    card.appendChild(head);

    if (rec.error) {
      const msg = document.createElement("div");
      msg.className = "error-msg";
      msg.textContent =
        "Could not parse — expected: REFERENCE NAME... TAG (at least 3 space-separated tokens).";
      card.appendChild(msg);
    } else {
      ok++;
      card.appendChild(fieldRow("NAME", rec.name));
      card.appendChild(fieldRow("U.CODE", rec.userCode));
      card.appendChild(fieldRow("LOC", rec.location));
      card.appendChild(fieldRow("REF", rec.reference));
      card.appendChild(fieldRow("TAG", rec.tag));
    }

    results.appendChild(card);
  });

  countEl.textContent = `${ok} of ${lines.length} row${lines.length === 1 ? "" : "s"} parsed`;
}

input.addEventListener("input", render);
locationSelect.addEventListener("change", render);
clearBtn.addEventListener("click", () => {
  input.value = "";
  render();
  input.focus();
});
RowStart.addEventListener("input", () => {
  firstRow = Number(RowStart.value);
  render();
});

render();
