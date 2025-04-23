import { pokemonBase } from "../utils/data";
import { PokemonBase } from "../utils/method";
import { RouteNodeType } from "./route";

let NormalWild: PokemonBase[] = [];
let UncommonPokemon: PokemonBase[] = [];
let Legendary: PokemonBase[] = [];

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

const selectPokemon = () => {
  NormalWild.length = 0;
  UncommonPokemon.length = 0;
  Legendary.length = 0;
  for (const p of pokemonBase) {
    if (p.id == "0") continue;
    const baseSum = p.att + p.def + p.hp + p.spa + p.spd + p.spe;
    if (legendaryPokemonList.includes(p.id)) {
      Legendary.push({ ...p });
    } else if (baseSum >= 500) {
      const up = { ...p };
      up.att = up.att * 1.1;
      up.def = up.def * 1.1;
      up.hp = up.hp * 1.1;
      up.spa = up.spa * 1.1;
      up.spd = up.spd * 1.1;
      up.spe = up.spe * 1.1;
      UncommonPokemon.push(up);
    } else {
      const up = { ...p };
      up.att = up.att * 1.5;
      up.def = up.def * 1.5;
      up.hp = up.hp * 1.5;
      up.spa = up.spa * 1.5;
      up.spd = up.spd * 1.5;
      up.spe = up.spe * 1.5;
      NormalWild.push(up);
    }
  }
};
selectPokemon();

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
