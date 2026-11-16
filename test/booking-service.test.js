const test = require("node:test");
const assert = require("node:assert/strict");
const { seedState } = require("../src/seed");
const { BookingError, createReservation, cancelReservation, listForMember } = require("../src/booking-service");

const beforeTraining = new Date("2026-11-16T12:00:00.000Z");

test("įprastas atvejis: laisva vieta patvirtinama", () => {
  const state = seedState();
  const result = createReservation(state, "vilnius", "M104", "T206", beforeTraining);
  assert.equal(result.status, "CONFIRMED");
  assert.equal(state.reservations.filter(item => item.trainingId === "T206" && item.status === "CONFIRMED").length, 1);
});

test("ribinis atvejis: pilna treniruotė įrašo į eilę ir atšaukus paaukština narį", () => {
  const state = seedState();
  const queued = createReservation(state, "vilnius", "M104", "T205", beforeTraining);
  assert.equal(queued.status, "WAITLIST");
  assert.equal(queued.waitlistPosition, 1);
  const result = cancelReservation(state, "vilnius", "M106", "R900");
  assert.equal(result.promoted, queued.id);
  assert.equal(state.reservations.find(item => item.id === queued.id).status, "CONFIRMED");
});

test("konfliktas: persidengianti treniruotė atmetama su TIME_CONFLICT", () => {
  const state = seedState();
  assert.throws(
    () => createReservation(state, "vilnius", "M107", "T205", beforeTraining),
    error => error instanceof BookingError && error.status === 409 && error.code === "TIME_CONFLICT"
  );
});

test("klientų izoliacija: Vilniaus klubas negali pasiekti Kauno nario ar treniruotės", () => {
  const state = seedState();
  assert.throws(() => listForMember(state, "vilnius", "K201"), error => error.code === "MEMBER_NOT_FOUND");
  assert.throws(() => createReservation(state, "vilnius", "M104", "K301", beforeTraining), error => error.code === "TRAINING_NOT_FOUND");
});

test("klaidos atvejis: neaktyvus abonementas negali rezervuoti", () => {
  const state = seedState();
  state.members.find(item => item.id === "M104").active = false;
  assert.throws(() => createReservation(state, "vilnius", "M104", "T206", beforeTraining), error => error.code === "MEMBERSHIP_INACTIVE");
});
