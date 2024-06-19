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
export const md_ky = yaml.load(
  fs.readFileSync(resolve(__dirname, "../../markdown.yaml"), "utf8")
);
export const berry_trees: treesData[] = BerryTrees;
export const berry_food: Food[] = BerryTrees;
