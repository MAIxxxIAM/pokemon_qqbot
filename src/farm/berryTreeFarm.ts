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
  weeding() {
    const weed = this.trees.filter((tree) => tree.berry_id == 67);
    if (weed.length == 0) return false;
    this.trees = this.trees.filter((tree) => tree.berry_id != 67);
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
      : berry_trees.findIndex((tree) => tree.berrytree === plantId) + 1;

    const berry = this.sends.find(
      (send) => send.id === _plantId && send.number > 0
    );
    if (!berry || this.trees.length >= this.farmLevel) return false;
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
        (tree) => tree.id === id && tree.event == Event["虫害"]
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
      const fruit = this.berry_bag.find((fruit) => fruit.id === harvest.id);
      if (fruit) {
        fruit.number += 1;
      } else {
        this.berry_bag.push({
          id: harvest.berry_id,
          name: harvest.berry,
          number: Math.floor(harvest.yield / 30),
        });
      }
      harvest.yield = 0;
      this.exp_farm += 20;
      if (this.exp_farm >= 100) {
        this.exp_farm = 0;
        this.farmLevel += 1;
      }
      (harvest.berry_id = 67),
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
        (tree) => tree.id === id && tree.event == Event["缺肥"]
      );
      if (!tree) return;
      const needFertilize = Math.min(100 - tree.yield, this.fertilizes, 20);
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
      if (this.water >= 30 && tree.event == Event["干涸"]) {
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
      tree.plantTime=new Date()
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
                Math.floor(Math.random() * 1000 * 60 * 60 * 6) +
                1000 * 60 * 60 * 6
            );
            tree.event = nextEvent;
            tree.eventTime = eventTime;
          }
          break;
        case Event["干涸"]:
          subyield = Math.floor(subtime) * 2;
          tree.yield -= subyield;
          tree.eventTime = new Date();
          break;
        case Event["缺肥"]:
          subyield = Math.floor(subtime) * 5;
          tree.yield -= subyield;
          tree.eventTime = new Date();
          break;
        case Event["虫害"]:
          subyield = Math.floor(subtime) * 3;
          tree.yield -= subyield;
          tree.eventTime = new Date();
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
