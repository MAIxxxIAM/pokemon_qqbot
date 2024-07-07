import { Skill } from "../battle";
import { PVP } from "../battle/pvp";
import { berry_trees } from "../utils/data";

export enum Event {
  "无事件",
  "干涸",
  "缺肥",
  "虫害",
}

export interface BerryFruit {
  id: number;
  name: string;
  number: number;
}

export interface Food {
  id: number;
  berrytree: string;
  effectCategory?: string;
  type?: string;
  effect?: number;
  effectMagnitude?: number;
  target?: string;
}

export class BerryFood implements Food {
  id: number;
  berrytree: string;
  effectCategory?: string;
  type?: string;
  effect?: number;
  effectMagnitude?: number;
  target?: string;
  constructor(berry: Food) {
    this.id = berry.id;
    this.berrytree = berry.berrytree;
    this.effectCategory = berry.effectCategory;
    this.type = berry.type;
    this.effect = berry.effect;
    this.effectMagnitude = berry.effectMagnitude;
    this.target = berry.target;
  }
  category(tar: PVP) {
    if (this.type !== "category") return;
    const value =
      tar.power[this.effectCategory] * this.effectMagnitude + this.effect;
    const categoryValue = this.target == "self" ? value : -value;
    tar.power[this.effectCategory] =
      tar.power[this.effectCategory] + categoryValue;
    tar.food = null;
  }
  subPower(useSkill: Skill, tar: PVP) {
    if (this.type !== "subPower") return;
    if (useSkill.type !== this.effectCategory) return;
    useSkill.dam = useSkill.dam * this.effectMagnitude;
    tar.food = null;
  }
}

export interface Farm {
  sends: BerrySend[];
  trees: BerryTree[];
  exp_farm: number;
  farmLevel: number;
  berry_bag: BerryFruit[];
  water: number;
  fertilizes: number;
}

export interface treesData {
  id: number;
  berrytree: string;
  imglink?: string;
}

export class BerrySend {
  id: number;
  name: string;
  number: number;
  constructor(id: number, count?: number) {
    this.id = id;
    this.name = berry_trees[id - 1].berrytree;
    this.number = count ? count : 1;
  }
}

export interface BerryTree {
  id: number;
  berry_id: number;
  berry: string;
  plantTime: Date;
  stage: number;
  event: Event;
  eventTime: Date;
  growth: number;
  water: number;
  yield: number;
}

export class PlantTree implements Farm {
  sends: BerrySend[];
  trees: BerryTree[];
  farmLevel: number;
  berry_bag: BerryFruit[];
  water: number;
  fertilizes: number;
  exp_farm: number;
  constructor(farm?: Farm) {
    if (farm) {
      this.sends = farm.sends;
      this.trees = farm.trees;
      this.farmLevel = farm.farmLevel;
      this.berry_bag = farm.berry_bag;
      this.water = farm?.water ? farm.water : 0;
      this.fertilizes = farm?.fertilizes ? farm.fertilizes : 100;
      this.exp_farm = farm?.exp_farm ? farm.exp_farm : 0;
    } else {
      this.sends = [];
      this.trees = [];
      this.farmLevel = 1;
      this.berry_bag = [];
      this.water = 0;
      this.fertilizes = 100;
      this.exp_farm = 0;
    }
  }
  take(id: number) {
    const tree = this.berry_bag.find(
      (berry) => berry.id === id + 1 && berry.number > 0
    );
    if (!tree) return false;
    this.berry_bag.forEach((berry) => {
      if (berry.id == id + 1) {
        berry.number -= 1;
      }
    });
    return true;
  }

  weeding() {
    const weed = this.trees.filter((tree) => tree.berry_id == 67);
    if (weed.length == 0) return false;
    this.trees = this.trees
      .filter((tree) => tree.berry_id != 67)
      .map((tree, index) => ({ ...tree, id: index + 1 }));
    const getFertilize =
      this.fertilizes >= 100 ? 0 : Math.floor(5 * weed.length);
    this.fertilizes += getFertilize;
    return getFertilize;
  }

  getSeed(seed: BerrySend) {
    const _seed = this.sends.find((send) => send.id === seed.id);
    if (_seed) {
      _seed.number += seed.number;
    } else {
      this.sends.push(seed);
    }
  }
  plant(plantId?: string) {
    if (!plantId) return;
    const id = parseInt(plantId);
    let _plantId = id;
    _plantId = id
      ? id
      : berry_trees.findIndex((tree) => tree.berrytree === plantId);

    const berry = this.sends.find(
      (send) => send.id === (1+_plantId) && send.number > 0
    );
    if (!berry || this.trees.length >= Math.min(this.farmLevel, 24))
      return false;
    this.sends.forEach((send) => {
      if (send.id == _plantId) {
        send.number -= 1;
      }
    });
    this.trees.push({
      id: this.trees.length + 1,
      berry_id: _plantId,
      berry: berry.name,
      plantTime: new Date(),
      stage: 0,
      event: Event["无事件"],
      eventTime: new Date(new Date().getTime() + 60 * 1000 * 60 * 6),
      growth: 0,
      water: 100,
      yield: 100,
    });
    return true;
  }

  bug(id: number[]) {
    const bugs = this.trees.filter((tree) => tree.event == Event["虫害"]);
    if (bugs.length <= 0) return false;
    id.forEach((id) => {
      const tree = this.trees.find(
        (tree) =>
          new Date(tree.eventTime).getTime() < new Date().getTime() &&
          tree.id === id &&
          tree.event == Event["虫害"]
      );
      if (!tree) return;
      tree.growth += Math.floor(Math.random() * 10 + 5);
      tree.event = Event["无事件"];
    });
    return true;
  }
  harvest() {
    const harvests = this.trees.filter((tree) => tree.stage == 3);
    if (harvests.length === 0) return false;
    harvests.forEach((harvest) => {
      const fruit = this.berry_bag.find(
        (fruit) => fruit.id === harvest.berry_id
      );
      if (fruit) {
        fruit.number += Math.floor(harvest.yield / 30);
      } else {
        this.berry_bag.push({
          id: harvest.berry_id,
          name: harvest.berry,
          number: Math.floor(harvest.yield / 30),
        });
      }
      [];
      harvest.yield = 0;
      harvest.event = Event["无事件"];
      this.exp_farm += 34;
      if (this.exp_farm >= 100) {
        this.exp_farm = 0;
        this.farmLevel += 1;
      }
      (harvest.berry_id = 68),
        (harvest.berry = "枯树"),
        (harvest.plantTime = new Date()),
        (harvest.stage = 0),
        (harvest.event = Event["无事件"]),
        (harvest.eventTime = new Date()),
        (harvest.growth = 0),
        (harvest.water = 0),
        (harvest.yield = 0);
    });
    return true;
  }

  fertilize(id: number[]) {
    if (this.fertilizes <= 0) return false;
    id.forEach((id) => {
      const tree = this.trees.find(
        (tree) =>
          new Date(tree.eventTime).getTime() < new Date().getTime() &&
          tree.id === id &&
          tree.event == Event["缺肥"]
      );
      if (!tree) return;
      const needFertilize = Math.min(120 - tree.yield, this.fertilizes, 20);
      tree.yield += needFertilize;
      this.fertilizes -= needFertilize;
      tree.growth += Math.floor(needFertilize / 3);
      tree.event = Event["无事件"];
    });
    return true;
  }

  watering(id: number[]) {
    if (this.water <= 0) return false;
    id.forEach((id) => {
      const tree = this.trees.find((tree) => tree.id === id);
      if (!tree || this.water <= 0 || tree.water >= 100) return;
      const waterNeeded = Math.min(100 - tree.water, this.water, 10);
      tree.water += waterNeeded;
      this.water -= waterNeeded;
      tree.growth += waterNeeded / 2;
      if (tree.water >= 30 && tree.event == Event["干涸"]) {
        tree.event = Event["无事件"];
      }
    });
    return true;
  }
  VIPwatering() {
    if (this.water <= 0) return false;
    this.trees.forEach((tree) => {
      if (tree.water >= 100) return;
      const waterNeeded = Math.min(100 - tree.water, this.water);
      tree.water += waterNeeded;
      this.water -= waterNeeded;
      tree.growth += waterNeeded / 2;
      if (tree.water >= 30 && tree.event == Event["干涸"]) {
        tree.event = Event["无事件"];
      }
    });
    return true;
  }
  triggerEvent() {
    this.trees.forEach((tree) => {
      if (tree.growth >= 100 && tree.stage < 3) {
        tree.stage += 1;
        tree.growth = 0;
      }
      const plantTime = new Date(tree.plantTime).getTime();
      const currentTime = new Date().getTime();
      const time = (currentTime - plantTime) / 1000 / 60 / 60;
      const spendWater =
        Math.floor(time) * (10 + Math.floor(Math.random() * 5 + 5));
      tree.water = tree.water - spendWater;
      tree.water = tree.water > 0 ? tree.water : 0;
      tree.plantTime = spendWater > 0 ? new Date() : tree.plantTime;
      if (new Date(tree.eventTime).getTime() > new Date().getTime()) return;
      const startTime = new Date(tree.eventTime).getTime() / 1000 / 60 / 60;
      const endTime = new Date().getTime() / 1000 / 60 / 60;
      const subtime = endTime - startTime;
      let subyield: number;
      switch (tree.event) {
        case Event["无事件"]:
          if (tree.water <= 30) {
            if (tree.water <= 0) {
              tree.water = 0;
            }
            tree.event = Event["干涸"];
            tree.eventTime = new Date();
          } else {
            const nextEvent = Math.floor(Math.random() * 2) + 2;
            const eventTime = new Date(
              new Date().getTime() +
                Math.floor(Math.random() * 1000 * 60 * 60 * 2) +
                1000 * 60 * 60 * 0.5
            );
            tree.event = nextEvent;
            tree.eventTime = eventTime;
          }
          break;
        case Event["干涸"]:
          subyield = Math.floor(subtime);
          tree.yield -= subyield;
          tree.eventTime = subyield > 0 ? new Date() : tree.eventTime;
          break;
        case Event["缺肥"]:
          subyield = Math.floor(subtime) * 1;
          tree.yield -= subyield;
          tree.eventTime = subyield > 0 ? new Date() : tree.eventTime;
          break;
        case Event["虫害"]:
          subyield = Math.floor(subtime) * 2;
          tree.yield -= subyield;
          tree.eventTime = subyield > 0 ? new Date() : tree.eventTime;
          break;
        default:
          break;
      }
      if (tree.yield <= 0) {
        tree.yield = 0;
        (tree.berry_id = 67),
          (tree.berry = "枯树"),
          (tree.plantTime = new Date()),
          (tree.stage = 0),
          (tree.event = Event["无事件"]),
          (tree.eventTime = new Date()),
          (tree.growth = 0),
          (tree.water = 0),
          (tree.yield = 0);
      }
    });
  }
}
