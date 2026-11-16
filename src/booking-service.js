const ACTIVE = "CONFIRMED";
const WAITING = "WAITLIST";

class BookingError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function findClub(state, clubId) {
  const club = state.clubs.find(item => item.id === clubId);
  if (!club) throw new BookingError(404, "CLUB_NOT_FOUND", "Klubas nerastas.");
  return club;
}

function findTraining(state, clubId, trainingId) {
  const training = state.trainings.find(item => item.id === trainingId && item.clubId === clubId);
  if (!training) throw new BookingError(404, "TRAINING_NOT_FOUND", "Treniruotė šiame klube nerasta.");
  return training;
}

function findMember(state, clubId, memberId) {
  const member = state.members.find(item => item.id === memberId && item.clubId === clubId);
  if (!member) throw new BookingError(404, "MEMBER_NOT_FOUND", "Narys šiame klube nerastas.");
  if (!member.active) throw new BookingError(403, "MEMBERSHIP_INACTIVE", "Rezervuoti gali tik aktyvų abonementą turintis narys.");
  return member;
}

function confirmedForTraining(state, clubId, trainingId) {
  return state.reservations.filter(item => item.clubId === clubId && item.trainingId === trainingId && item.status === ACTIVE);
}

function intervalsOverlap(first, second) {
  return new Date(first.startsAt) < new Date(second.endsAt) && new Date(first.endsAt) > new Date(second.startsAt);
}

function checkNoConflict(state, clubId, memberId, targetTraining) {
  const conflict = state.reservations.some(item => {
    if (item.clubId !== clubId || item.memberId !== memberId || item.status !== ACTIVE) return false;
    const existing = state.trainings.find(training => training.id === item.trainingId && training.clubId === clubId);
    return existing && intervalsOverlap(existing, targetTraining);
  });
  if (conflict) throw new BookingError(409, "TIME_CONFLICT", "Šiuo metu jau turite kitą patvirtintą treniruotę.");
}

function createReservation(state, clubId, memberId, trainingId, now = new Date()) {
  findClub(state, clubId);
  findMember(state, clubId, memberId);
  const training = findTraining(state, clubId, trainingId);
  if (new Date(now).getTime() >= new Date(training.startsAt).getTime() - 30 * 60 * 1000) {
    throw new BookingError(409, "REGISTRATION_CLOSED", "Registracija uždaroma likus 30 minučių iki treniruotės.");
  }
  const duplicate = state.reservations.some(item => item.clubId === clubId && item.memberId === memberId && item.trainingId === trainingId && item.status !== "CANCELLED");
  if (duplicate) throw new BookingError(409, "DUPLICATE_RESERVATION", "Jau turite šios treniruotės rezervaciją.");
  checkNoConflict(state, clubId, memberId, training);

  const full = confirmedForTraining(state, clubId, trainingId).length >= training.capacity;
  const reservation = {
    id: `R${state.nextReservationNumber++}`,
    clubId,
    memberId,
    trainingId,
    status: full ? WAITING : ACTIVE,
    createdAt: new Date(now).toISOString()
  };
  state.reservations.push(reservation);
  return { ...reservation, waitlistPosition: full ? waitlistFor(state, clubId, trainingId).findIndex(item => item.id === reservation.id) + 1 : null };
}

function waitlistFor(state, clubId, trainingId) {
  return state.reservations
    .filter(item => item.clubId === clubId && item.trainingId === trainingId && item.status === WAITING)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

function cancelReservation(state, clubId, memberId, reservationId) {
  findClub(state, clubId);
  findMember(state, clubId, memberId);
  const reservation = state.reservations.find(item => item.id === reservationId && item.clubId === clubId && item.memberId === memberId && item.status !== "CANCELLED");
  if (!reservation) throw new BookingError(404, "RESERVATION_NOT_FOUND", "Aktyvi rezervacija nerasta.");
  const freedConfirmedPlace = reservation.status === ACTIVE;
  reservation.status = "CANCELLED";
  let promoted = null;
  if (freedConfirmedPlace) {
    const training = findTraining(state, clubId, reservation.trainingId);
    const queue = waitlistFor(state, clubId, reservation.trainingId);
    promoted = queue.find(candidate => {
      const member = state.members.find(item => item.id === candidate.memberId && item.clubId === clubId && item.active);
      if (!member) return false;
      try { checkNoConflict(state, clubId, candidate.memberId, training); return true; }
      catch (error) { if (error.code === "TIME_CONFLICT") return false; throw error; }
    }) || null;
    if (promoted) promoted.status = ACTIVE;
  }
  return { cancelled: reservation.id, promoted: promoted ? promoted.id : null };
}

function listForMember(state, clubId, memberId) {
  const club = findClub(state, clubId);
  const member = findMember(state, clubId, memberId);
  const trainings = state.trainings.filter(item => item.clubId === clubId).map(training => {
    const confirmed = confirmedForTraining(state, clubId, training.id);
    const mine = state.reservations.find(item => item.clubId === clubId && item.memberId === memberId && item.trainingId === training.id && item.status !== "CANCELLED");
    const queue = waitlistFor(state, clubId, training.id);
    return {
      ...training,
      confirmedCount: confirmed.length,
      availablePlaces: Math.max(0, training.capacity - confirmed.length),
      myReservation: mine ? { ...mine, waitlistPosition: mine.status === WAITING ? queue.findIndex(item => item.id === mine.id) + 1 : null } : null
    };
  });
  return { club, member: { id: member.id, name: member.name }, trainings };
}

module.exports = { BookingError, createReservation, cancelReservation, listForMember, waitlistFor, intervalsOverlap };
