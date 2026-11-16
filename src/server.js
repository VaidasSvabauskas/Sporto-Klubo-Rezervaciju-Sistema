const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");
const { BookingError, createReservation, cancelReservation, listForMember } = require("./booking-service");
const { readState, writeState } = require("./store");
const { seedState } = require("./seed");

const PORT = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "..", "public");
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; if (data.length > 1_000_000) reject(new Error("Request too large")); });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new BookingError(400, "INVALID_JSON", "Užklausa turi būti tinkamas JSON.")); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (req.method === "GET" && url.pathname === "/api/clubs") {
      return sendJson(res, 200, readState().clubs);
    }
    const membersMatch = url.pathname.match(/^\/api\/clubs\/([^/]+)\/members$/);
    if (req.method === "GET" && membersMatch) {
      const state = readState();
      const clubId = decodeURIComponent(membersMatch[1]);
      if (!state.clubs.some(club => club.id === clubId)) return sendJson(res, 404, { code: "CLUB_NOT_FOUND", message: "Klubas nerastas." });
      return sendJson(res, 200, state.members.filter(member => member.clubId === clubId).map(({ id, name }) => ({ id, name })));
    }
    const overviewMatch = url.pathname.match(/^\/api\/clubs\/([^/]+)\/overview$/);
    if (req.method === "GET" && overviewMatch) {
      const state = readState();
      return sendJson(res, 200, listForMember(state, decodeURIComponent(overviewMatch[1]), url.searchParams.get("memberId")));
    }
    const reservationMatch = url.pathname.match(/^\/api\/clubs\/([^/]+)\/reservations$/);
    if (req.method === "POST" && reservationMatch) {
      const state = readState();
      const body = await readBody(req);
      const result = createReservation(state, decodeURIComponent(reservationMatch[1]), body.memberId, body.trainingId);
      writeState(state);
      return sendJson(res, 201, result);
    }
    const cancelMatch = url.pathname.match(/^\/api\/clubs\/([^/]+)\/cancellations$/);
    if (req.method === "POST" && cancelMatch) {
      const state = readState();
      const body = await readBody(req);
      const result = cancelReservation(state, decodeURIComponent(cancelMatch[1]), body.memberId, body.reservationId);
      writeState(state);
      return sendJson(res, 200, result);
    }
    if (req.method === "GET" || req.method === "HEAD") {
      const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
      const file = path.resolve(publicDir, requested);
      if (!file.startsWith(publicDir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return sendJson(res, 404, { code: "NOT_FOUND", message: "Puslapis nerastas." });
      res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
      return req.method === "HEAD" ? res.end() : fs.createReadStream(file).pipe(res);
    }
    return sendJson(res, 404, { code: "NOT_FOUND", message: "API kelias nerastas." });
  } catch (error) {
    if (error instanceof BookingError) return sendJson(res, error.status, { code: error.code, message: error.message });
    console.error(error);
    return sendJson(res, 500, { code: "INTERNAL_ERROR", message: "Įvyko serverio klaida." });
  }
});

if (require.main === module) {
  if (!fs.existsSync(path.join(__dirname, "..", "data.json"))) writeState(seedState());
  server.listen(PORT, () => console.log(`Prototipas veikia: http://localhost:${PORT}`));
}

module.exports = { server };
