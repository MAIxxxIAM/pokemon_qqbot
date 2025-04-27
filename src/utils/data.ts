import exptolv from "../assets/json/ExpToLv.json";
import expbase from "../assets/json/expbase.json";
import skillMachines from "../assets/json/skillMachine.json";
import Base from "../assets/json/PokemonBase.json";
import Type from "../assets/json/pokemonType.json";
import bType from "../assets/json/battleType.json";
import nature from "../assets/json/natures.json";
import { Skills } from "../battle";
import { Natures } from "../model";
import Fishing from "../assets/json/fishing.json";
import { FishItem } from "../fishing/type";
import DigItems from "../assets/json/digItem.json";
import { DigItem } from "../dig_game/type";
import { PokemonBase } from "./method";
import trainerList from "../assets/json/trainerList.json";
import { Trainer } from "../trainer/type";
import BerryTrees from "../assets/json/berrytree.json";
import yaml from "js-yaml";
import fs from "fs";
import { resolve } from "path";
import { Food, treesData } from "../farm/berryTreeFarm";
import { dirname } from "../dirname";
import { Emojis } from "../pokeEmoji/type";
import emojiList from "../assets/json/pokeEmoji.json";
import emojiList2 from "../assets/json/pokeEmoji2.json";

export const expToLv = exptolv;
export const expBase = expbase;
export const skillMachine = skillMachines;
export const pokemonBase: PokemonBase[] = Base.Base;
export const type = Type;
export const battleType = bType;

export const skills = new Skills(skillMachines.skill);
export const natures: Natures[] = nature;
export const fishing: FishItem[] = Fishing;
export const digItems: DigItem[] = DigItems;
export const trainer_list: Trainer[] = trainerList;
export const emojis: Emojis[] = emojiList;
export const emojis2: Emojis[] = emojiList2;
export const md_ky: any = yaml.load(
  fs.readFileSync(resolve(dirname, "../markdown.yaml"), "utf8")
);
export const berry_trees: treesData[] = BerryTrees;
export const berry_food: Food[] = BerryTrees;

import path from "path";

const pokemonPath = path.join(dirname, "./pokemole/data/pokemon");
const movesPath = path.join(dirname, "./pokemole/data/move");
const labelPath = path.join(dirname, "./pokemole/data/label");
const abilitiesPath = path.join(dirname, "./pokemole/data/ability");

const jsonFiles = (Path: string) => {
  return fs.readdirSync(Path).filter((file) => file.endsWith(".json"));
};

const Data = (Path: string) => {
  return jsonFiles(Path).map((file) => {
    const filePath = path.join(Path, file);
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  });
};

export interface PokemonJson {
  name: string;
  index: string;
  name_en: string;
  name_jp: string;
  profile: string;
  forms: [
    {
      name: string;
      index: string;
      is_mega: boolean;
      is_gmax: boolean;
      image: string;
      types: string[];
      genus: string;
      ability: {
        name: string;
        is_hidden: boolean;
      }[];
      experience: {
        number: string;
        speed: string;
      };
      height: string;
      weight: string;
      gender_rate: {
        male: string;
        female: string;
      };
      shape: string;
      color: string;
      catch_rate: {
        number: string;
        rate: string;
      };
      egg_groups: string[];
    }
  ];
  stats: [
    {
      form: string;
      data: {
        hp: string;
        attack: string;
        defense: string;
        sp_attack: string;
        sp_defense: string;
        speed: string;
      };
    }
  ];
  flavor_texts: {
    name: string;
    versions: {
      name: string;
      group: string;
      text: string;
    }[];
  }[];

  evolution_chains: {
    name: string;
    stage: string;
    text: string;
    image: string;
    back_text: string;
    from: string;
    form_name: string;
  }[][];

  names: {
    zh_hans: string;
    zh_hant: string;
    en: string;
    fr: string;
    de: string;
    it: string;
    es: string;
    ja: string;
    ko: string;
  };
  home_images: [
    {
      name: string;
      image: string;
      shiny: string;
    }
  ];
}

export interface LabelJson {
  class: string;
  pokemon: string[];
}

export const PokemonData: PokemonJson[] = Data(pokemonPath);
export const MovesData = Data(movesPath);
export const LabelData: LabelJson[] = Data(labelPath);
export const AbilitiesData = Data(abilitiesPath);
