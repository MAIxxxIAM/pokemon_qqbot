import { Pokebattle } from "..";
import { Skill } from "../battle";
import { PokemonList } from "../model";
import { Trainer } from "../trainer/type";
import pokemonCal from "./pokemon";

export class Robot implements Pokebattle {
  id: string;
  name: string;
  level: number;
  exp: number;
  monster_1: string;
  battlename: string;
  battleTimes: number;
  battleToTrainer: number;
  base: string[];
  power: string[];
  skill: number;
  skillSlot?: Skill[];
  trainer: string[];
  trainerIndex?: number;
  trainer_list?: Trainer[];
  relex: Date;

  constructor(level: number) {
    this.level = level >= 98 ? 100 : level + Math.floor(Math.random() * 5) - 2;
    this.id = "robot" + "-" + Math.random().toString(36).substring(2, 10);
    this.name = "洛托姆" + Math.floor(Math.random() * 1000) + "号";
    this.exp = 0;
    const p1 = pokemonCal.mathRandomInt(1, 420);
    const p2 = pokemonCal.mathRandomInt(1, 420);
    this.monster_1 = p1 + "." + p2;
    this.battlename = pokemonCal.pokemonlist(this.monster_1);
    this.base = pokemonCal.pokeBase(this.monster_1);
    const botpoke: PokemonList = {
      id: this.id,
      win_count: 0,
      pokemon: [
        {
          id: this.id,
          name: this.name,
          natures: {
            effect: "无",
            up: 0,
            down: 0,
          },
          natureLevel: 0,
          power: [255, 255, 255, 255, 255, 255],
        },
      ],
    };
    this.power = pokemonCal.power(
      this.base,
      this.level,
      botpoke,
      this.monster_1
    );
    this.skill = Math.floor(Math.random() * 537) + 1;
    this.skillSlot = [
      new Skill(Math.floor(Math.random() * 150) + 1),
      new Skill(Math.floor(Math.random() * 150) + 150),
      new Skill(Math.floor(Math.random() * 150) + 300),
      new Skill(Math.floor(Math.random() * (537 - 450)) + 450),
    ];
    this.trainer = ["robot"];
    this.battleTimes = 30;
    this.battleToTrainer = 30;
    this.relex = new Date(0);
    this.trainerIndex = 9999;
    this.trainer_list = [
      {
        tid: 9999,
        name: "robot",
        source_name: "robot",
      },
    ];
  }
}
