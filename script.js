/* ======================================================================
   DATA: sample values for screenshots. Replace with real backend data
   later and the page re-renders from these objects.
   ====================================================================== */
const DATA = {
  kpis: [
    { value: "42 kg", label: "Food waste this week, 31% lower than last week" },
    { value: "186",   label: "Meals sent to NGOs" },
    { value: "8%",    label: "Over-preparation, down from 19%" },
    { value: "74%",   label: "Waste put to a second use" }
  ],
  waste: [
    { day: "Mon", kg: 9 }, { day: "Tue", kg: 7 }, { day: "Wed", kg: 5 },
    { day: "Thu", kg: 6 }, { day: "Fri", kg: 11 }, { day: "Sat", kg: 3 }, { day: "Sun", kg: 1 }
  ],
  plan: [
    { dish: "Rajma", last: 60, suggested: 48 },
    { dish: "Steamed rice", last: 110, suggested: 96 },
    { dish: "Aloo gobhi", last: 45, suggested: 45 },
    { dish: "Chapati (pieces)", last: 1400, suggested: 1500 },
    { dish: "Curd", last: 30, suggested: 24 }
  ],
  dishes: [
    { dish: "Lauki sabzi", pct: 38, tip: "Swap with a higher-demand dish on Wednesdays." },
    { dish: "Plain dal", pct: 24, tip: "Cut the portion by 15% on weekends." },
    { dish: "Boiled rice", pct: 17, tip: "Cook in two batches instead of one." }
  ],
  expiring: [
    { item: "Paneer, 6 kg", when: "Expires tomorrow", level: "bad", idea: "Add to lunch gravy" },
    { item: "Tomatoes, 12 kg", when: "2 days left", level: "warn", idea: "Batch of tomato chutney" },
    { item: "Milk, 20 L", when: "2 days left", level: "warn", idea: "Kheer for Sunday dinner" }
  ],
  // minutesAgo = how long ago it was cooked; safeHours = safe window for pickup
  listings: [
    { dish: "Veg pulao", qty: "18 kg", minutesAgo: 75,  safeHours: 4, ngo: "Asha Food Bank", km: 2.4 },
    { dish: "Dal tadka", qty: "12 kg", minutesAgo: 170, safeHours: 4, ngo: "Seva Shelter", km: 3.1 },
    { dish: "Chapati",   qty: "200 pieces", minutesAgo: 30, safeHours: 6, ngo: "Care Kitchen", km: 1.8 }
  ],
  streams: [
    { type: "Edible surplus", to: "NGO partners", kg: 31, level: "ok" },
    { type: "Near-spoiled food", to: "Animal feed partner", kg: 6, level: "warn" },
    { type: "Inedible waste", to: "Compost and biogas unit", kg: 5, level: "bad" }
  ],
  // what the "AI" returns for a photo (mocked for the demo)
  aiGuess: { dish: "Rajma rice", confidence: 92, kg: 3.2 },
  logged: [
    { dish: "Aloo gobhi", kg: 2.1, time: "1:15 pm" },
    { dish: "Steamed rice", kg: 4.6, time: "1:40 pm" }
  ]
};

const $ = id => document.getElementById(id);

/* ---------------- Overview ---------------- */
function renderOverview(d){
  $("kpis").innerHTML = d.kpis.map(k =>
    `<div class="kpi"><b>${k.value}</b><span>${k.label}</span></div>`).join("");

  const max = Math.max(...d.waste.map(w => w.kg));
  $("bars").innerHTML = d.waste.map(w => `
    <div class="bar ${w.kg >= 10 ? "high" : ""}">
      <strong>${w.kg}</strong>
      <i style="height:${(w.kg / max) * 100}%"></i>
      <span>${w.day}</span>
    </div>`).join("");

  $("plan").innerHTML = `
    <tr><th>Dish</th><th class="num">Last time</th><th class="num">Suggested</th><th class="num">Change</th></tr>` +
    d.plan.map(p => {
      const diff = p.suggested - p.last;
      const pct = Math.round((diff / p.last) * 100);
      const cls = diff > 0 ? "delta up" : "delta";
      const txt = diff === 0 ? "No change" : (diff > 0 ? "+" : "") + pct + "%";
      return `<tr><td>${p.dish}</td><td class="num">${p.last}</td><td class="num"><b>${p.suggested}</b></td><td class="num ${cls}">${txt}</td></tr>`;
    }).join("");

  $("dishes").innerHTML = d.dishes.map(x => `
    <div class="row">
      <div class="head"><span>${x.dish}</span><span>${x.pct}% left on plates</span></div>
      <div class="meter"><i style="width:${x.pct * 2}%"></i></div>
      <small>${x.tip}</small>
    </div>`).join("");

  $("expiring").innerHTML = d.expiring.map(x => `
    <div class="row">
      <div class="head"><span>${x.item}</span><span class="chip ${x.level}">${x.when}</span></div>
      <small>Idea: ${x.idea}</small>
    </div>`).join("");
}

/* ---------------- Log waste ---------------- */
const SAMPLE_PLATE = `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sample plate of rajma and rice">
  <rect width="300" height="200" fill="#e9efe6"/>
  <circle cx="150" cy="100" r="86" fill="#fff" stroke="#cfd9cb" stroke-width="4"/>
  <circle cx="150" cy="100" r="64" fill="#f7f7f2"/>
  <ellipse cx="128" cy="100" rx="34" ry="30" fill="#f4efe0"/>
  <ellipse cx="176" cy="96" rx="30" ry="28" fill="#9b3a26"/>
  <circle cx="168" cy="90" r="5" fill="#7a2818"/><circle cx="183" cy="100" r="5" fill="#7a2818"/>
  <circle cx="172" cy="106" r="5" fill="#7a2818"/><circle cx="190" cy="88" r="4" fill="#7a2818"/>
</svg>`;

function renderLogged(d){
  $("logged").innerHTML = d.logged.map(l => `
    <div class="row"><div class="head"><span>${l.dish}</span><span>${l.kg} kg</span></div><small>${l.time}</small></div>`).join("");
}

function setupLog(d){
  const photo = $("photo"), analyse = $("analyse");

  photo.addEventListener("change", () => {
    const file = photo.files[0];
    if (!file) return;
    $("preview").src = URL.createObjectURL(file);
    $("preview").hidden = false;
    $("dropText").hidden = true;
    analyse.disabled = false;
  });

  $("sample").addEventListener("click", () => {
    $("drop").innerHTML = SAMPLE_PLATE;
    analyse.disabled = false;
  });

  analyse.addEventListener("click", () => {
    const g = d.aiGuess;
    $("result").className = "found";
    $("result").innerHTML = `
      <span class="chip ok">${g.confidence}% sure</span>
      <div class="dish">${g.dish}</div>
      <label for="kg">Estimated quantity in kg. Change it if it looks off.</label>
      <input id="kg" type="number" step="0.1" value="${g.kg}">
      <div style="margin-top:14px"><button class="btn" id="confirm">Confirm and log</button></div>`;
    $("confirm").addEventListener("click", () => {
      d.logged.unshift({ dish: g.dish, kg: $("kg").value, time: "Just now" });
      renderLogged(d);
      $("result").className = "empty";
      $("result").textContent = "Logged. Add another photo to continue.";
    });
  });
}

/* ---------------- Surplus and NGOs ---------------- */
function renderListings(d){
  const now = Date.now();
  $("listings").innerHTML = d.listings.map((l, i) => {
    l.safeUntil = now - l.minutesAgo * 60000 + l.safeHours * 3600000;
    l.total = l.safeHours * 3600000;
    return `
    <article class="listing">
      <div><div class="dish">${l.dish}</div><small>${l.qty}, cooked ${l.minutesAgo} min ago</small></div>
      <div><div class="timer" id="t${i}"></div><small>left to collect safely</small></div>
      <div class="safebar" id="b${i}"><i></i></div>
      <div class="ngo"><b>Matched: ${l.ngo}</b>${l.km} km away, verified partner</div>
      <button class="btn" data-i="${i}">Send pickup request</button>
    </article>`;
  }).join("");

  document.querySelectorAll(".listing .btn").forEach(b => b.addEventListener("click", () => {
    b.textContent = "Request sent";
    b.disabled = true;
  }));
}

function tick(d){
  d.listings.forEach((l, i) => {
    const left = Math.max(0, l.safeUntil - Date.now());
    const h = Math.floor(left / 3600000);
    const m = String(Math.floor(left % 3600000 / 60000)).padStart(2, "0");
    const s = String(Math.floor(left % 60000 / 1000)).padStart(2, "0");
    const low = left < 3600000;
    $("t" + i).textContent = `${h}:${m}:${s}`;
    $("t" + i).classList.toggle("low", low);
    $("b" + i).classList.toggle("low", low);
    $("b" + i).firstElementChild.style.width = (left / l.total * 100) + "%";
  });
}

function renderStreams(d){
  $("streams").innerHTML = d.streams.map(s => `
    <div class="stream"><span><b>${s.type}</b> goes to ${s.to}</span><span class="chip ${s.level}">${s.kg} kg</span></div>`).join("");
}

/* ---------------- Tabs and start-up ---------------- */
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x === t));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === t.dataset.tab));
}));

renderOverview(DATA);
renderLogged(DATA);
setupLog(DATA);
renderListings(DATA);
renderStreams(DATA);
tick(DATA);
setInterval(() => tick(DATA), 1000);
