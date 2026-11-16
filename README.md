# Sporto klubo treniruočių rezervavimo prototipas

Prototipas leidžia nariui peržiūrėti treniruotes, rezervuoti vietą, stoti į laukiančiųjų eilę ir atšaukti rezervaciją. Atšaukus patvirtintą vietą, pirmas tinkamas eilės narys automatiškai paaukštinamas.

## Reikalavimai

- Node.js 20 arba naujesnė versija
- NPM (įdiegiamas kartu su Node.js)

Prototipas naudoja tik Node.js standartines bibliotekas, todėl papildomų paketų diegti nereikia.

## Paleidimas

Projekto kataloge paleiskite:

```bash
npm start
```

Atverkite [http://localhost:3000](http://localhost:3000). Pirmo paleidimo metu sukuriamas `data.json` su demonstraciniais duomenimis. Norėdami grąžinti pradinę būseną, sustabdykite serverį ir ištrinkite `data.json`, tada paleiskite dar kartą.

## Testai

```bash
npm test
```

Testai tikrina patvirtintą rezervaciją, laukiančiųjų eilę ir vietos paaukštinimą, laiko konfliktą, dviejų klubų duomenų izoliaciją bei neaktyvaus abonemento klaidą.

## Demonstraciniai duomenys

Sąsajoje galima persijungti tarp Vilniaus ir Kauno klubų bei jų narių. Vilniaus klubo jogos treniruotė `T205` jau užpildyta, todėl galima pademonstruoti laukiančiųjų eilę. Narys `M107` turi persidengiančią Pilateso rezervaciją `T199`, todėl jo bandymas rezervuoti `T205` atmetamas su `TIME_CONFLICT`.

## Gyvo demonstravimo seka

1. Pasirinkite Vilniaus klubą ir narį `M104`, rezervuokite jėgos treniruotę `T206`; būsena tampa `CONFIRMED`.
2. Pasirinkite narį `M107` ir bandykite rezervuoti jogą `T205`; sąsajoje parodoma laiko konflikto klaida.
3. Pasirinkite narį `M104`, prisijunkite prie pilnos jogos laukiančiųjų eilės, tada pasirinkite `M106` ir atšaukite jo rezervaciją `T205`. `M104` eilės įrašas automatiškai paaukštinamas į `CONFIRMED`.
4. Perjunkite klubą į Kauną ir parodykite, kad rodomi tik Kauno nariai bei treniruotės.
5. Terminale paleiskite `npm test` ir parodykite, kad visi penki testai praeina.

Jei norite demonstraciją pradėti nuo pradinių duomenų, sustabdykite serverį, ištrinkite `data.json` ir paleiskite `npm start` dar kartą.

## Pagrindinės API užklausos

- `GET /api/clubs` – klubų sąrašas.
- `GET /api/clubs/{clubId}/members` – tik pasirinkto klubo nariai.
- `GET /api/clubs/{clubId}/overview?memberId={memberId}` – pasirinkto klubo tvarkaraštis ir nario rezervacijų būsenos.
- `POST /api/clubs/{clubId}/reservations` – sukuria rezervaciją arba įtraukia į eilę. JSON: `{"memberId":"M104","trainingId":"T205"}`.
- `POST /api/clubs/{clubId}/cancellations` – atšaukia rezervaciją. JSON: `{"memberId":"M106","reservationId":"R900"}`.

Visos su klubu susijusios užklausos tikrina, kad narys, treniruotė ir rezervacija priklausytų tam pačiam klubui. Verslo logika laikoma `src/booking-service.js`, HTTP API – `src/server.js`, demonstraciniai duomenys – `src/seed.js`, o sąsaja – `public/` kataloge.

## Projekto apimtis

Tai demonstracinis vietinis prototipas: duomenys saugomi `data.json`, nėra prisijungimo, vaidmenų sistemos, mokėjimų ar išorinių pranešimų. Užduoties apimčiai pateikiami du atskiri klubų kontekstai ir jų izoliacijos testas. Ši greitai paleidžiama versija naudoja Node.js ir JSON failą; pirmoje projektavimo dalyje numatytą Spring Boot, React ir PostgreSQL architektūrą galima realizuoti kaip atskirą perkėlimą, jei dėstytojas reikalauja nekeisti patvirtinto technologijų pasirinkimo.
