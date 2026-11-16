function seedState() {
  return {
    clubs: [
      { id: "vilnius", name: "Vilniaus sporto klubas" },
      { id: "kaunas", name: "Kauno sporto klubas" }
    ],
    members: [
      { id: "M104", name: "Mantas Jonaitis", clubId: "vilnius", active: true },
      { id: "M106", name: "Ieva Petrauskaitė", clubId: "vilnius", active: true },
      { id: "M107", name: "Tomas Kazlauskas", clubId: "vilnius", active: true },
      { id: "M108", name: "Austėja Rimkutė", clubId: "vilnius", active: true },
      { id: "K201", name: "Ema Vaitkutė", clubId: "kaunas", active: true },
      { id: "K202", name: "Lukas Stankus", clubId: "kaunas", active: true }
    ],
    trainings: [
      { id: "T205", clubId: "vilnius", title: "Joga", trainer: "Rūta", startsAt: "2026-11-18T18:00:00+02:00", endsAt: "2026-11-18T19:00:00+02:00", capacity: 2 },
      { id: "T199", clubId: "vilnius", title: "Pilatesas", trainer: "Darius", startsAt: "2026-11-18T17:45:00+02:00", endsAt: "2026-11-18T18:30:00+02:00", capacity: 8 },
      { id: "T206", clubId: "vilnius", title: "Jėgos treniruotė", trainer: "Rūta", startsAt: "2026-11-20T17:00:00+02:00", endsAt: "2026-11-20T18:00:00+02:00", capacity: 8 },
      { id: "K301", clubId: "kaunas", title: "Funkcinė treniruotė", trainer: "Simona", startsAt: "2026-11-19T18:00:00+02:00", endsAt: "2026-11-19T19:00:00+02:00", capacity: 6 }
    ],
    reservations: [
      { id: "R880", clubId: "vilnius", memberId: "M107", trainingId: "T199", status: "CONFIRMED", createdAt: "2026-11-10T10:00:00.000Z" },
      { id: "R900", clubId: "vilnius", memberId: "M106", trainingId: "T205", status: "CONFIRMED", createdAt: "2026-11-10T10:01:00.000Z" },
      { id: "R901", clubId: "vilnius", memberId: "M108", trainingId: "T205", status: "CONFIRMED", createdAt: "2026-11-10T10:02:00.000Z" }
    ],
    nextReservationNumber: 902
  };
}

module.exports = { seedState };
