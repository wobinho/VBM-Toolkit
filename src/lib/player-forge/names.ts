/**
 * A tiny name generator — pairs a country to weighted first/last name pools so
 * a "random player" feels like they belong to their flag, not like a draw from
 * a global hat. Pools are intentionally small (≈8 each) — distinctive over
 * exhaustive.
 */

import { pick, randInt } from "./randomization";

type Pool = { first: readonly string[]; last: readonly string[] };

const POOLS: Record<string, Pool> = {
  Italy: {
    first: ["Marco", "Luca", "Matteo", "Andrea", "Davide", "Gianluca", "Simone", "Alessandro"],
    last: ["Rossi", "Conti", "Ferrari", "Russo", "Bianchi", "Romano", "Ricci", "Greco"],
  },
  Brazil: {
    first: ["Bruno", "Lucas", "Rafael", "Gabriel", "Thiago", "Felipe", "Henrique", "Wallace"],
    last: ["Silva", "Souza", "Santos", "Oliveira", "Pereira", "Lima", "Costa", "Almeida"],
  },
  Poland: {
    first: ["Bartosz", "Kamil", "Mateusz", "Wilfredo", "Tomasz", "Jakub", "Aleksander", "Pawel"],
    last: ["Kurek", "Bednorz", "Leon", "Sliwka", "Wlazly", "Kubiak", "Nowak", "Kaczmarek"],
  },
  France: {
    first: ["Antoine", "Earvin", "Jean", "Stephen", "Trevor", "Barthelemy", "Yacine", "Theo"],
    last: ["Brizard", "Ngapeth", "Patry", "Boyer", "Clevenot", "Chinenyeze", "Louati", "Faure"],
  },
  "United States": {
    first: ["Matthew", "Aaron", "Taylor", "Micah", "Garrett", "Erik", "Thomas", "David"],
    last: ["Anderson", "Russell", "Sander", "Christenson", "Muagututia", "Shoji", "Jaeschke", "Smith"],
  },
  Japan: {
    first: ["Hiro", "Yuki", "Yuji", "Ran", "Akihiro", "Tatsunori", "Kentaro", "Masahiro"],
    last: ["Tanaka", "Nishida", "Ishikawa", "Takahashi", "Yamamoto", "Sato", "Suzuki", "Kobayashi"],
  },
  Russia: {
    first: ["Andrei", "Maxim", "Dmitri", "Sergei", "Ivan", "Pavel", "Egor", "Roman"],
    last: ["Vasiliev", "Mikhailov", "Sokolov", "Volkov", "Klyuka", "Kliuka", "Spiridonov", "Pankov"],
  },
  Serbia: {
    first: ["Aleksandar", "Marko", "Uros", "Drazen", "Petar", "Nikola", "Stefan", "Milan"],
    last: ["Atanasijevic", "Kovacevic", "Lisinac", "Luburic", "Petric", "Podrascanin", "Jovovic", "Okolic"],
  },
  Argentina: {
    first: ["Diego", "Facundo", "Bruno", "Cristian", "Luciano", "Sebastian", "Agustin", "Nicolas"],
    last: ["Fernandez", "Gonzalez", "Conte", "Lima", "De Cecco", "Solé", "Loser", "Vicentin"],
  },
  Germany: {
    first: ["Lukas", "Georg", "Moritz", "Christian", "Tobias", "Ruben", "Anton", "Denys"],
    last: ["Kampa", "Grozer", "Reichert", "Fromm", "Krick", "Schott", "Brehme", "Kalandadze"],
  },
  Cuba: {
    first: ["Wilfredo", "Robertlandy", "Yoandy", "Osmany", "Yoandri", "Miguel", "Liber", "Marlon"],
    last: ["Leon", "Simon", "Leal", "Juantorena", "Bauza", "David", "Garcia", "Reyes"],
  },
  Iran: {
    first: ["Saeid", "Milad", "Amir", "Morteza", "Mohammad", "Aliasghar", "Esmail", "Adel"],
    last: ["Marouf", "Ebadipour", "Ghaemi", "Sharifi", "Mousavi", "Mojarrad", "Mosaferi", "Gholami"],
  },
  China: {
    first: ["Jiaxing", "Wei", "Liang", "Yifan", "Xinran", "Hao", "Yuetao", "Jingyin"],
    last: ["Zhang", "Wang", "Li", "Chen", "Liu", "Yang", "Huang", "Zhao"],
  },
  Netherlands: {
    first: ["Nimir", "Dirk", "Wessel", "Maarten", "Bennie", "Robbert", "Thomas", "Jasper"],
    last: ["Abdel-Aziz", "Sluiter", "Keemink", "van Garderen", "Tuinstra", "Andringa", "Koelewijn", "Diederen"],
  },
  Türkiye: {
    first: ["Murat", "Adis", "Ahmet", "Burutay", "Selim", "Volkan", "Yigit", "Efe"],
    last: ["Yenipazar", "Lagumdzija", "Tumer", "Yalcin", "Gulbey", "Doruk", "Bayram", "Mandiraci"],
  },
  Czechia: {
    first: ["Tomas", "Jan", "Petr", "Lukas", "Patrik", "Adam", "Filip", "Donovan"],
    last: ["Novak", "Svoboda", "Dvorak", "Cerny", "Sotola", "Kriz", "Reichl", "Indra"],
  },
  Denmark: {
    first: ["Kasper", "Mikkel", "Anders", "Jonas", "Mads", "Frederik", "Sander", "Lasse"],
    last: ["Lund", "Hansen", "Jensen", "Nielsen", "Pedersen", "Andersen", "Christensen", "Larsen"],
  },
};

const FALLBACK: Pool = {
  first: ["Alex", "Jordan", "Sam", "Chris", "Daniel", "Andrei", "Luca", "Diego"],
  last: ["Carter", "Mendez", "Petrov", "Rossi", "Silva", "Novak", "Walker", "Holm"],
};

export function randomNameFor(country: string): string {
  const pool = POOLS[country] ?? FALLBACK;
  const variant = randInt(1, 12);
  // 1 in 12 doubles the surname (de Souza, van Houten flavour) — texture only.
  const last =
    variant === 1
      ? `${pick(pool.last)}-${pick(pool.last)}`
      : pick(pool.last);
  return `${pick(pool.first)} ${last}`;
}
