import { pokemonBase } from "../utils/data";
import { PokemonBase } from "../utils/method";
import { RouteNodeType } from "./route";

const NormalWild: PokemonBase[] = [];
const UncommonPokemon: PokemonBase[] = [];
const Legendary: PokemonBase[] = [];

const legendaryPokemonList = [
  "150",
  "151",
  "144",
  "145",
  "146",
  "249",
  "250",
  "251",
  "243",
  "244",
  "245",
  "378",
  "379",
  "340",
  "341",
  "342",
  "381",
  "380",
  "343",
  "344",
  "345",
  "346",
  "347",
  "315",
  "349",
  "348",
  "350",
  "351",
];

for (const p of pokemonBase) {
  if (p.id == "0") continue;
  const baseSum = p.att + p.def + p.hp + p.spa + p.spd + p.spe;
  if (legendaryPokemonList.includes(p.id)) {
    Legendary.push(p);
  } else if (baseSum >= 500) {
    p.att = p.att * 1.2;
    p.def = p.def * 1.2;
    p.hp = p.hp * 1.2;
    p.spa = p.spa * 1.2;
    p.spd = p.spd * 1.2;
    p.spe = p.spe * 1.2;
    UncommonPokemon.push(p);
  } else {
    p.att = p.att * 1.6;
    p.def = p.def * 1.6;
    p.hp = p.hp * 1.6;
    p.spa = p.spa * 1.6;
    p.spd = p.spd * 1.6;
    p.spe = p.spe * 1.6;
    NormalWild.push(p);
  }
}

export function getRandomPokemon(type: RouteNodeType): PokemonBase {
  let pokemon: PokemonBase[] = NormalWild;
  if (type == RouteNodeType.Elite) {
    pokemon = UncommonPokemon;
  } else if (type == RouteNodeType.Boss) {
    pokemon = Legendary;
  }
  const randomIndex = Math.floor(Math.random() * pokemon.length);
  return pokemon[randomIndex];
}
