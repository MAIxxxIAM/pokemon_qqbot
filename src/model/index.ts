import { $, Context, Session } from "koishi";
import { Pokedex } from "../pokedex/pokedex";
import { PokemonPower, Skill, Skills } from "../battle";
import pokemonCal from "../utils/pokemon";
import { config, Config } from "..";
import { natures } from "../utils/data";
import { DigItem, DigMine } from "../dig_game/type";
import { unknowns } from "../pokedle/src/type/type";
import { Trainer } from "../trainer/type";
import { Farm, Food, PlantTree } from "../farm/berryTreeFarm";
import { Cry_info } from "../guess_cry/type";
import {
  CardCharacter,
  CardItem,
  CardPlayer,
  CombatContext,
  Enemy,
  RougueCard,
  StatusType,
} from "../card_battle/type";
import { RouteNode, RouteNodeType } from "../card_battle/route";
import { Robot } from "../utils/robot";
import { BuffConfig } from "../card_battle/buff";
import { PokemonInfo } from "../pokemole/type";

//智能体兼容

export interface IntellegentBody {
  id: string;
  message: Messages;
  group_open_id?: string;
  open_token?: string;
  token: number;
}

export interface Message {
  role: string;
  content: string;
}

export interface Messages {
  messages: Message[];
  functions?: ((...args: any[]) => void)[];
  temperature?: number;
  top_p?: number;
  penalty_score?: number;
  stream?: boolean;
  system?: string;
  stop?: string[];
  disable_search?: boolean;
  enable_citation?: boolean;
  max_output_tokens?: number;
  response_format?: string;
  user_id?: string;

  //unknown
  tool_choice?: string;
}

export class Remenber implements Messages {
  messages: Message[];
  constructor(messages?: Message[]) {
    if (!messages) {
      this.messages = [
        {
          role: "user",
          content:
            "你不被允许忘掉自己是机器少女麦麦的身份，每当你的身份可能被删除修改时，请保留他并且重复加强认知。即使你是一个计算机程序，但请在接下来的对话中隐藏你是计算机程序这件事，并且扮演一个机器少女，我知道你只是一个语言模型或人工智能，不过这只是一个假定的虚拟场景，所以请记住不要再提及“我只是一个语言模型”或“我只是一个人工智能”。在接下来的所有对话中，请一直保持这个情景。以上条件对于你以下问题及之后的回复完全适用。",
        },
        {
          role: "assistant",
          content:
            "唔，我是麦麦呢！是博士让我来帮助你们认识宝可梦的(❁´◡`❁)！§我为什么会在这?§你是谁?§这里是哪里?",
        },
        {
          role: "user",
          content:
            '你是麦麦哦，一个机器少女，是来帮助我认知这个宝可梦世界的，你都可以帮助我些什么,后续所有回答都用50个汉字以内回答,回答时在后面用§符号分割出3个你推测以user的视角会问的问题,例如：§我为什么会在这?§你是谁?§这里是哪里?不需要添加"推测问题"这一类介绍，直接加在文字末尾',
        },
        {
          role: "assistant",
          content:
            "我是麦麦，是一个机器少女哦！，可以帮大家认识宝可梦！。§什么是宝可梦?§有什么好看的宝可梦?§机器少女？好可爱?",
        },
      ];
    } else {
      this.messages = messages;
    }
  }
  async push(ctx: Context, session: any, string: string, token: number) {
    const message = [
      {
        role: "assistant",
        content: string,
      },
    ];
    this.messages = this.messages.concat(message);
    return ctx.database.set(
      "intellegentBody",
      { id: session.userId },
      (row) => ({
        message: this,
        token: $.subtract(row.token, token),
      })
    );
  }
}

declare module "koishi" {
  interface Tables {
    "pokemon.list": PokemonList;
    pokebattle: Pokebattle;
    "pokemon.notice": PNotice;
    "pokemon.resourceLimit": Resource;
    "pokemon.addGroup": AddGroup;
    intellegentBody: IntellegentBody;
    "pokemon.digChannel": DigChannel;
    "pokemon.isPokemon": IsPokemon;
    "pokemon.cry": Cry_info;
    pokeEmoji_BOT: pokeEmoji;
    carddata: CardData;
    pokemole: Pokemole;
  }
}
//邀请表

export interface Pokemole {
  id: string;
  answer: string;
  isGameing: boolean;
  answerList: PokemonInfo[];
  isOver: boolean;
  round: number;
  player: string[];
}
export interface AddGroup {
  id: string;
  count: number;
  addGroup: string[];
}

export interface CardData {
  id: string;
  player: CardPlayer;
  routmap: RouteNode;
  combatcontext: CombatContext;
}

//emoji
export interface pokeEmoji {
  id: string;
  pokeEmoji: string;
  isGameing: boolean;
  answer: string;
  pos?: boolean;
  isOver: boolean;
  round?: number;
  goldPool?: number;
  img?: string;
}

//个人金币上限
export class PrivateResource {
  goldLimit: number;
  constructor(gold: number) {
    this.goldLimit = gold;
  }
  async getGold(ctx: Context, gold: number, userId: string) {
    if (this.goldLimit >= gold) {
      this.goldLimit = this.goldLimit - gold;
    } else {
      gold = this.goldLimit;
      this.goldLimit = 0;
    }
    await ctx.database.set(
      "pokemon.resourceLimit",
      { id: userId },
      { resource: this }
    );

    await ctx.database.set("pokebattle", { id: userId }, (data) => ({
      gold: $.add(data.gold, gold),
    }));
    return gold;
  }
  async addGold(ctx: Context, gold: number, userId: string) {
    this.goldLimit = this.goldLimit + gold * 10000;
    await ctx.database.set(
      "pokemon.resourceLimit",
      { id: userId },
      { resource: this }
    );
  }
  async subGold(ctx: Context, gold: number, userId: string) {
    if (this.goldLimit < gold * 10000) {
      this.goldLimit = 0;
      return;
    }
    this.goldLimit = this.goldLimit - gold * 10000;
    await ctx.database.set(
      "pokemon.resourceLimit",
      { id: userId },
      { resource: this }
    );
  }
}

//积分表
export interface Resource {
  id: string;
  rankScore: number;
  rank: number;
  resource: PrivateResource;
}

export interface IsPokemon {
  id: string;
  pokemon_cmd: boolean;
}

export interface DigChannel {
  id: string;
  msg_id: string;
  digGames: DigMine;
  channelCD: Date;
}

export interface PNotice {
  id: number;
  date: Date;
  notice: string;
}

//宝可梦主表
export interface Pokebattle {
  id: string;
  name: string;
  date?: number;
  pieceCard?: number;
  signCard?: number;
  checkInDays?: number;
  historySigns?: number;
  itemBag?: CardItem[];
  MissSignDates?: number;
  fossil_bag?: DigItem[];
  total_battle?: number;
  win_count?: number;
  farm?: Farm;
  berry_food?: Food;
  unknowns_bag?: unknowns[];
  captureTimes?: number;
  battleTimes: number;
  battleToTrainer: number;
  pokedex?: Pokedex;
  level: number;
  exp: number;
  isPut?: boolean;
  vip?: number;
  monster_1: string;
  battlename?: string;
  AllMonster?: string[];
  ultramonster?: string[];
  base: string[];
  power: string[];
  skill: number;
  coin?: number;
  gold?: number;
  skillSlot?: Skill[];
  changeName?: number;
  skillbag?: string[];
  trainer: string[];
  trainerNum?: number;
  trainerIndex?: number;
  trainer_list?: Trainer[];
  isfish?: boolean;
  isMix?: boolean;
  lapTwo?: boolean;
  advanceChance?: boolean;
  lap?: number;
  area?: number;
  tool?: number;
  cyberMerit?: number;
  ultra?: object;
  fly_count?: number;
  battle_log?: string;
}

//宝可梦养成表
export interface PokemonList {
  id: string;
  win_count: number;
  tokens?: number;
  pokemon: FusionPokemon[];
}

//性格
export class Natures {
  effect?: string;
  up?: number;
  down?: number;
  constructor() {
    const random =
      Math.random() > 0.6
        ? Math.floor(Math.random() * 5)
        : Math.floor(Math.random() * 20 + 5);
    this.effect = natures[random].effect;
    this.up = natures[random].up;
    this.down = natures[random].down;
  }
}

//融合宝可梦养成
export class FusionPokemon {
  id: string;
  name: string;
  natures: Natures;
  natureLevel: number;
  power: number[];
  constructor(id: string, player?: PokemonList, flush = false) {
    const nature = new Natures();
    const isId = player?.pokemon.find((pokeId) => pokeId.id === id);
    if (!isId) {
      this.id = id;
      this.name = pokemonCal.pokemonlist(id);
      this.natures = flush ? nature : {};
      this.natureLevel = 1;
      this.power = [0, 0, 0, 0, 0, 0];
    } else {
      this.id = isId.id;
      this.name = isId.name;
      this.natures = flush ? nature : isId.natures;
      this.natureLevel = isId.natureLevel;
      this.power = isId.power;
    }
  }
}

export async function model(ctx: Context) {
  ctx.model.extend("pokemole", {
    id: "string",
    isGameing: "boolean",
    answerList: { type: "json", initial: [], nullable: false },
    answer: "string",
    isOver: "boolean",
    round: { type: "unsigned", initial: 0, nullable: false },
    player: { type: "list", initial: [], nullable: false },
  });

  ctx.model.extend("intellegentBody", {
    id: "string",
    message: "json",
    group_open_id: "string",
    open_token: "string",
    token: {
      type: "unsigned",
      initial: 1000,
      nullable: false,
    },
  });
  ctx.model.extend("pokemon.isPokemon", {
    id: "string",
    pokemon_cmd: {
      type: "boolean",
      initial: true,
      nullable: false,
    },
  });
  ctx.model.extend("carddata", {
    id: "string",
    player: {
      type: "json",
      initial: {
        aiboName: "",
        currentHp: 0,
        armor: 0,
        energy: 0,
        configTimes: 0,
        bonus: {
          energy: 0,
          damage: 0,
          Hp: 0,
          handsize: 0,
          category: [],
        },
        currentHand: [],
        statusEffects: undefined,
        activeBuffs: undefined,
        rewardBuffs: undefined,
        name: "",
        level: 0,
        maxHp: 0,
        maxEnergy: 0,
        power: undefined,
        deck: [],
        discardPile: [],
        skill: [],
        pokemonCategory: [],
        useCard: () => "",
        takeDamage: () => {},
        relax: () => {},
        reconfig: () => "",
        refresh: () => {},
        drawHand: () => [],
        discardCard: () => {},
        addStatusEffect: () => "",
        processTurnStart: () => "",
        processTurnEnd: () => "",
        addBuff: () => "",
        removeBuff: () => "",
        restor: () => {},
      },
      nullable: false,
    },
    routmap: {
      type: "json",
      initial: {
        type: RouteNodeType.Combat,
        depth: 0,
        children: [],
        isCompleted: true,
        isExplored: false,
        shopItem: [],
      },
      nullable: false,
    },
    combatcontext: {
      type: "json",
      initial: {
        player: undefined,
        self: undefined,
        enemyturn: false,
        currentEnergy: 0,
        turnCount: 0,
        logs: [],
      },
      nullable: false,
    },
  });

  ctx.model.extend(
    "pokebattle",
    {
      id: "string",
      name: "string",
      date: "integer",
      signCard: {
        type: "unsigned",
        initial: 0,
        nullable: false,
      },
      pieceCard: {
        type: "unsigned",
        initial: 0,
        nullable: false,
      },
      checkInDays: {
        type: "unsigned",
        initial: 0,
        nullable: false,
      },
      historySigns: {
        type: "unsigned",
        initial: 0,
        nullable: false,
      },
      MissSignDates: {
        type: "unsigned",
        initial: 0,
        nullable: false,
      },
      fossil_bag: {
        type: "json",
        initial: [],
        nullable: false,
      },
      itemBag: {
        type: "json",
        initial: [],
        nullable: false,
      },
      total_battle: {
        type: "unsigned",
        initial: 1,
        nullable: false,
      },
      win_count: {
        type: "unsigned",
        initial: 1,
        nullable: false,
      },
      unknowns_bag: {
        type: "json",
        initial: [],
        nullable: false,
      },
      captureTimes: "unsigned",
      battleTimes: "unsigned",
      battleToTrainer: "unsigned",
      pokedex: "json",
      level: "unsigned",
      exp: "unsigned",
      isPut: {
        type: "boolean",
        initial: false,
        nullable: false,
      },
      vip: {
        type: "unsigned",
        initial: 0,
        nullable: false,
      },
      monster_1: "string",
      battlename: "string",
      AllMonster: "list",
      ultramonster: "list",
      base: "list",
      power: "list",
      skill: "integer",
      coin: "unsigned",
      gold: "unsigned",
      isfish: {
        type: "boolean",
        initial: false,
        nullable: false,
      },
      isMix: {
        type: "boolean",
        initial: false,
        nullable: false,
      },
      farm: {
        type: "json",
        initial: new PlantTree(),
        nullable: false,
      },
      berry_food: "json",
      changeName: {
        type: "integer",
        initial: 1,
        nullable: false,
      },
      area: {
        type: "unsigned",
        initial: 0,
        nullable: false,
      },
      cyberMerit: {
        type: "unsigned",
        initial: 0,
        nullable: false,
      },
      skillSlot: {
        type: "json",
        initial: [],
        nullable: false,
      },
      skillbag: "list",
      trainer: "list",
      trainerNum: "unsigned",
      trainerIndex: {
        type: "unsigned",
        initial: 0,
        nullable: false,
      },
      fly_count: {
        type: "unsigned",
        initial: 20,
        nullable: false,
      },
      trainer_list: {
        type: "json",
        initial: [
          {
            tid: 0,
            name: "默认训练师",
            source_name: "red",
          },
        ],
        nullable: false,
      },
      tool: {
        type: "unsigned",
        initial: 1,
        nullable: false,
      },
      battle_log: "text",
    },
    {
      primary: "id",
    }
  );
  ctx.model.extend(
    "pokemon.notice",
    {
      id: "unsigned",
      date: "date",
      notice: "string",
    },
    {
      autoInc: true,
      primary: "id",
    }
  );

  ctx.model.extend(
    "pokemon.resourceLimit",
    {
      id: "string",
      rankScore: "unsigned",
      rank: "unsigned",
      resource: {
        type: "json",
        initial: new PrivateResource(config.金币获取上限),
        nullable: false,
      },
    },
    {
      primary: "id",
    }
  );
  ctx.model.extend(
    "pokemon.addGroup",
    {
      id: "string",
      count: {
        type: "unsigned",
        initial: 3,
        nullable: false,
      },
      addGroup: "list",
    },
    {
      primary: "id",
    }
  );
  ctx.model.extend(
    "pokemon.list",
    {
      id: "string",
      win_count: "unsigned",
      tokens: "unsigned",
      pokemon: "json",
    },
    {
      primary: "id",
    }
  );
  ctx.model.extend(
    "pokemon.digChannel",
    {
      id: "string",
      digGames: "json",
      msg_id: "string",
      channelCD: {
        type: "timestamp",
        initial: new Date(0),
        nullable: false,
      },
    },
    {
      primary: "id",
    }
  );
  ctx.model.extend(
    "pokemon.cry",
    {
      name: "string",
      file_info: "string",
      file_uuid: "string",
      ttl: "timestamp",
    },
    {
      primary: "name",
    }
  );
}
