const clubSelect = document.querySelector("#club-select");
const memberSelect = document.querySelector("#member-select");
const trainingList = document.querySelector("#training-list");
const notice = document.querySelector("#notice");
const count = document.querySelector("#class-count");
let clubs = [];
let members = [];

const dateFormatter = new Intl.DateTimeFormat("lt-LT", { weekday: "short", day: "numeric", month: "short" });
const timeFormatter = new Intl.DateTimeFormat("lt-LT", { hour: "2-digit", minute: "2-digit" });

function showNotice(message, kind = "success") {
  notice.textContent = message;
  notice.className = `notice ${kind}`;
  notice.hidden = false;
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => { notice.hidden = true; }, 5000);
}

async function request(path, options = {}) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Nepavyko įvykdyti užklausos.");
  return data;
}

function activeClubMembers() {
  return members;
}

function populateMembers() {
  const previous = memberSelect.value;
  const available = activeClubMembers();
  memberSelect.innerHTML = available.map(member => `<option value="${member.id}">${member.name}</option>`).join("");
  if (available.some(member => member.id === previous)) memberSelect.value = previous;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function renderTraining(training) {
  const start = new Date(training.startsAt);
  const end = new Date(training.endsAt);
  const mine = training.myReservation;
  const status = mine?.status === "CONFIRMED"
    ? `<span class="status confirmed"><i></i> Vieta patvirtinta</span>`
    : mine?.status === "WAITLIST"
      ? `<span class="status waitlist"><i></i> Eilėje · ${mine.waitlistPosition} vieta</span>`
      : `<span class="availability">${training.availablePlaces > 0 ? `${training.availablePlaces} laisv. viet.` : "Vietų nėra"}</span>`;
  const action = mine
    ? `<button class="button secondary" data-cancel="${mine.id}">Atšaukti</button>`
    : `<button class="button" data-book="${training.id}" ${training.availablePlaces === 0 ? "data-full=\"true\"" : ""}>${training.availablePlaces > 0 ? "Rezervuoti" : "Stoti į eilę"}<span>↗</span></button>`;
  return `<article class="training-card">
    <div class="class-date"><span class="date-day">${escapeHtml(dateFormatter.format(start))}</span><span class="date-time">${timeFormatter.format(start)} <b>—</b> ${timeFormatter.format(end)}</span></div>
    <div class="class-info"><h3>${escapeHtml(training.title)}</h3><p>Treneris ${escapeHtml(training.trainer)} <span class="separator">·</span> ${training.confirmedCount}/${training.capacity} vietų</p></div>
    <div class="class-status">${status}</div><div class="class-action">${action}</div>
  </article>`;
}

async function loadOverview() {
  if (!clubSelect.value || !memberSelect.value) return;
  trainingList.innerHTML = `<div class="loading">Kraunamas tvarkaraštis<span>…</span></div>`;
  try {
    const data = await request(`/api/clubs/${encodeURIComponent(clubSelect.value)}/overview?memberId=${encodeURIComponent(memberSelect.value)}`);
    trainingList.innerHTML = data.trainings.map(renderTraining).join("") || `<p class="empty">Šiuo metu nėra planuotų treniruočių.</p>`;
    count.textContent = `${data.trainings.length} TRENIRUOTĖS`;
  } catch (error) {
    trainingList.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
}

trainingList.addEventListener("click", async event => {
  const bookButton = event.target.closest("[data-book]");
  const cancelButton = event.target.closest("[data-cancel]");
  try {
    if (bookButton) {
      await request(`/api/clubs/${encodeURIComponent(clubSelect.value)}/reservations`, { method: "POST", body: JSON.stringify({ memberId: memberSelect.value, trainingId: bookButton.dataset.book }) });
      showNotice(bookButton.dataset.full ? "Įtraukėme į laukiančiųjų eilę." : "Vieta patvirtinta. Iki susitikimo treniruotėje!");
      await loadOverview();
    }
    if (cancelButton) {
      const result = await request(`/api/clubs/${encodeURIComponent(clubSelect.value)}/cancellations`, { method: "POST", body: JSON.stringify({ memberId: memberSelect.value, reservationId: cancelButton.dataset.cancel }) });
      showNotice(result.promoted ? "Rezervacija atšaukta. Pirmajam laukiančiajam vieta patvirtinta." : "Rezervacija atšaukta.");
      await loadOverview();
    }
  } catch (error) { showNotice(error.message, "error"); }
});

clubSelect.addEventListener("change", async () => {
  members = await request(`/api/clubs/${encodeURIComponent(clubSelect.value)}/members`);
  populateMembers();
  loadOverview();
});
memberSelect.addEventListener("change", loadOverview);

async function init() {
  try {
    const clubData = await request("/api/clubs");
    clubs = clubData;
    clubSelect.innerHTML = clubs.map(club => `<option value="${club.id}">${escapeHtml(club.name)}</option>`).join("");
    members = await request(`/api/clubs/${encodeURIComponent(clubSelect.value)}/members`);
    populateMembers();
    await loadOverview();
  } catch (error) { showNotice(`Nepavyko prisijungti prie serverio: ${error.message}`, "error"); }
}

init();
