export type PlayerRank = {
  name: string
  url: string
  min: number
  max: number
  rank: number
}

export const PlayerRanks: Record<string, PlayerRank> = {
  // Requires 10 matches to get the placement rank.
  NO_RANK: {
    name: "Placement",
    url: "/icons/ranks/00_placement_medium.webp",
    min: -1,
    max: -1,
    rank: 0,
  },
  // All other ranks after completing 10 matches.
  BRASS_3: {
    name: "Brass 3",
    url: "/icons/ranks/01_brass_03_medium.webp",
    min: 0,
    max: 299,
    rank: 0,
  },
  BRASS_2: {
    name: "Brass 2",
    url: "/icons/ranks/01_brass_02_medium.webp",
    min: 300,
    max: 599,
    rank: 0,
  },
  BRASS_1: {
    name: "Brass 1",
    url: "/icons/ranks/01_brass_01_medium.webp",
    min: 600,
    max: 799,
    rank: 0,
  },
  BRONZE_3: {
    name: "Bronze 3",
    url: "/icons/ranks/02_bronze_03_medium.webp",
    min: 800,
    max: 999,
    rank: 0,
  },
  BRONZE_2: {
    name: "Bronze 2",
    url: "/icons/ranks/02_bronze_02_medium.webp",
    min: 1000,
    max: 1049,
    rank: 0,
  },
  BRONZE_1: {
    name: "Bronze 1",
    url: "/icons/ranks/02_bronze_01_medium.webp",
    min: 1050,
    max: 1099,
    rank: 0,
  },
  IRON_3: {
    name: "Iron 3",
    url: "/icons/ranks/03_iron_03_medium.webp",
    min: 1100,
    max: 1149,
    rank: 0,
  },
  IRON_2: {
    name: "Iron 2",
    url: "/icons/ranks/03_iron_02_medium.webp",
    min: 1150,
    max: 1199,
    rank: 0,
  },
  IRON_1: {
    name: "Iron 1",
    url: "/icons/ranks/03_iron_01_medium.webp",
    min: 1200,
    max: 1249,
    rank: 0,
  },
  SILVER_3: {
    name: "Silver 3",
    url: "/icons/ranks/04_silver_03_medium.webp",
    min: 1250,
    max: 1299,
    rank: 0,
  },
  SILVER_2: {
    name: "Silver 2",
    url: "/icons/ranks/04_silver_02_medium.webp",
    min: 1300,
    max: 1349,
    rank: 0,
  },
  SILVER_1: {
    name: "Silver 1",
    url: "/icons/ranks/04_silver_01_medium.webp",
    min: 1350,
    max: 1399,
    rank: 0,
  },
  GOLD_3: {
    name: "Gold 3",
    url: "/icons/ranks/05_gold_03_medium.webp",
    min: 1400,
    max: 1499,
    rank: 0,
  },
  GOLD_2: {
    name: "Gold 2",
    url: "/icons/ranks/05_gold_02_medium.webp",
    min: 1500,
    max: 1599,
    rank: 0,
  },
  // Not in the top 50 players per leaderboard.
  GOLD_1: {
    name: "Gold 1",
    url: "/icons/ranks/05_gold_01_medium.webp",
    min: 1600,
    max: 5000,
    rank: 0,
  },
  // These ranks need the special "top" field to identify those players above +1600 ELO in the leaderboard.
  CHALLENGER_5: {
    name: "Challenger 5",
    url: "/icons/ranks/06_master_05_medium.webp",
    min: 1600,
    max: 5000,
    rank: 50,
  },
  CHALLENGER_4: {
    name: "Challenger 4",
    url: "/icons/ranks/06_master_04_medium.webp",
    min: 1600,
    max: 5000,
    rank: 25,
  },
  CHALLENGER_3: {
    name: "Challenger 3",
    url: "/icons/ranks/06_master_03_medium.webp",
    min: 1600,
    max: 5000,
    rank: 10,
  },
  CHALLENGER_2: {
    name: "Challenger 2",
    url: "/icons/ranks/06_master_02_medium.webp",
    min: 1600,
    max: 5000,
    rank: 5,
  },
  CHALLENGER_1: {
    name: "Challenger 1",
    url: "/icons/ranks/06_master_01_medium.webp",
    min: 1600,
    max: 5000,
    rank: 1,
  },
}

type OfficialMapValue = {
  name: string
  /** Flag to filter out those official maps that are excluded from "ranked". */
  // automatch: boolean;
}

export const maps: Record<string, OfficialMapValue> = {
  twin_beach_2p_mkii: {
    name: "Twin Beaches",

    // automatch: true,
  },
  desert_village_2p_mkiii: {
    name: "Road to Tunis",

    // automatch: true,
  },
  cliff_crossing_2p: {
    name: "Taranto Coastline",

    // automatch: true,
  },
  rails_and_sand_4p: {
    name: "Campbell's Convoy",

    // automatch: true,
  },
  rural_town_4p: {
    name: "Pachino Farmlands",

    // automatch: true,
  },
  torrente_4p_mkiii: {
    name: "Torrente",

    // automatch: true,
  },
  rural_castle_4p: {
    name: "Aere Perennius",

    // automatch: true,
  },
  desert_airfield_6p_mkii: {
    name: "Gazala Landing Ground",

    // automatch: true,
  },
  industrial_railyard_6p_mkii: {
    name: "L'Aquila",

    // automatch: true,
  },
  winter_line_8p_mkii: {
    name: "Winter Line",

    // automatch: true,
  },
  mountain_ruins_8p_mkii: {
    name: "Mignano Gap",

    // automatch: true,
  },
  mountain_ruins_6p: {
    name: "Mignano Summit",

    // automatch: true,
  },
  gardens_2p_mm: {
    name: "Gardens",

    // automatch: true,
  },
  pachino_2p: {
    name: "Pachino Stalemate",

    // automatch: true,
  },
  rural_town_2p_mkii: {
    name: "Pachino Farmlands",

    // automatch: true,
  },
  monte_cavo_8p: {
    name: "Monte Cavo",

    // automatch: true,
  },
  benghazi_6p: {
    name: "Benghazi",

    // automatch: true,
  },
  sousse_wetlands_8p: {
    name: "Sousse Wetlands",

    // automatch: true,
  },
  catania_crossing_6p: {
    name: "Catania Crossing",

    // automatch: false,
  },
  day_101_4p: {
    name: "Day 101",

    // automatch: true,
  },
  villa_fiore_2p_mkii: {
    name: "Villa Fiore",

    // automatch: true,
  },
  /* ------------------------- 1.5.0 Maps ---------------------------- */
  semois_2p: {
    name: "Semois",
  },
  elst_outskirts_4p: {
    name: "Elst Outskirts",
  },
  montherme_6p: {
    name: "Montherme",
  },
  sangro_river_crossing_6p: {
    name: "Sangro River Crossing",
  },
  sousse_stronghold_8p: {
    name: "Sousse Stronghold",
  },
  faymonville: {
    name: "Faymonville",
  },
  steppe_8p: {
    name: "Steppes",
  },
  /* ------------------------- 1.6.0 Maps ---------------------------- */
  eindhoven: {
    name: "Operation Eindhoven",
  },
  gothic_line_8p: {
    name: "Gothic Line",
  },
  oasis_depot_8p: {
    name: "Oasis Depot",
  },
  /* ------------------------- 1.7.0 Maps ---------------------------- */
  black_gold_8p: {
    name: "Black Gold",
  },
}
