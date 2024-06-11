import { Context } from "koishi";
import { PlantTree, BerryTree, Event, Farm, BerrySend } from "./berryTreeFarm";
import { berry_trees } from "../utils/data";
import { button, sendMarkdown, toUrl } from "../utils/method";
import { drawFarm } from "./utils";
import imageSize from "image-size";

export async function apply(ctx: Context) {
  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("种植 <seed:string>")
    .action(async ({ session }, seed) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      if (!seed) return `请输入要种植的种子名称`;
      // const seeds = new BerrySend(1, 1);
      const farm = new PlantTree(player.farm);
      // farm.getSeed(seeds);
      farm.triggerEvent();
      const isplant = farm.plant(seed);
      if (!isplant) {
        await session.send("种植失败,请检查土壤是否有空位或者背包是否有种子");
        return;
      }
      farm.triggerEvent();
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        {
          farm: farm,
        }
      );
      const farmImage = await drawFarm(ctx, farm);
      const a = await toUrl(ctx, session, farmImage.attrs.src);
      const md = `<@${player.id}> 种植成功
---
![farmimg #${128 * 4}px #${128 * Math.ceil(farm.trees.length / 4)}px](${a})
当前土壤数：${farm.farmLevel}
可用土壤数：${farm.farmLevel - farm.trees.length}`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, "种植", "种植", session.userId, "p", false),
                  button(2, "浇水", "浇水", session.userId, "w", false),
                  button(2, "农场信息", "农场信息", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "施肥", "施肥", session.userId, "f", false),
                  button(2, "收获", "收获", session.userId, "g"),
                  button(2, "树果背包", "树果背包", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "除草", "除草", session.userId, "b", false),
                  button(2, "除虫", "除虫", session.userId, "b", false),
                  button(2, "种子背包", "种子背包", session.userId, "i"),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });

  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("农场信息")
    .action(async ({ session }) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      let farmImage: any;
      let a = "";
      if (farm.trees.length > 0) {
        farmImage = await drawFarm(ctx, farm);
        a = await toUrl(ctx, session, farmImage.attrs.src);
      }

      const md = `<@${player.id}> 农场信息

---
> 当前为测试功能，树果无实际用途

${
  farm.trees.length == 0
    ? ""
    : `![farmimg #${128 * 4}px #${
        128 * Math.ceil(farm.trees.length / 4)
      }px](${a})`
}
当前土壤数：${farm.farmLevel}
可用土壤数：${farm.farmLevel - farm.trees.length}`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, "种植", "种植", session.userId, "p", false),
                  button(2, "浇水", "浇水", session.userId, "w", false),
                  button(2, "农场信息", "农场信息", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "施肥", "施肥", session.userId, "f", false),
                  button(2, "收获", "收获", session.userId, "g"),
                  button(2, "树果背包", "树果背包", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "除草", "除草", session.userId, "b", false),
                  button(2, "除虫", "除虫", session.userId, "b", false),
                  button(2, "种子背包", "种子背包", session.userId, "i"),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });

  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("浇水 [...id:number]")
    .action(async ({ session }, ...id) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      if (id.length == 0) return `请输入要浇水的树果id,多个id请用空格隔开`;
      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      const isWater = farm.watering(id);
      if (!isWater) {
        return `浇水失败，储水量不足，可以通过钓鱼补充`;
      }
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      const farmImage = await drawFarm(ctx, farm);
      const a = await toUrl(ctx, session, farmImage.attrs.src);
      const md = `<@${player.id}> 浇水成功
---
![farmimg #${128 * 4}px #${128 * Math.ceil(farm.trees.length / 4)}px](${a})
当前土壤数：${farm.farmLevel}
可用土壤数：${farm.farmLevel - farm.trees.length}`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, "种植", "种植", session.userId, "p", false),
                  button(2, "浇水", "浇水", session.userId, "w", false),
                  button(2, "农场信息", "农场信息", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "施肥", "施肥", session.userId, "f", false),
                  button(2, "收获", "收获", session.userId, "g"),
                  button(2, "树果背包", "树果背包", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "除草", "除草", session.userId, "b", false),
                  button(2, "除虫", "除虫", session.userId, "b", false),
                  button(2, "种子背包", "种子背包", session.userId, "i"),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });
  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("施肥 [...id:number]")
    .action(async ({ session }, ...id) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      if (id.length == 0) return `请输入要施肥的树果id,多个id请用空格隔开`;
      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      const isFertilize = farm.fertilize(id);
      if (!isFertilize) {
        return `当前肥料不足`;
      }
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      const farmImage = await drawFarm(ctx, farm);
      const a = await toUrl(ctx, session, farmImage.attrs.src);
      const md = `<@${player.id}> 施肥成功
---
![farmimg #${128 * 4}px #${128 * Math.ceil(farm.trees.length / 4)}px](${a})

> 只有缺肥状态可以施肥
当前土壤数：${farm.farmLevel}
可用土壤数：${farm.farmLevel - farm.trees.length}`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, "种植", "种植", session.userId, "p", false),
                  button(2, "浇水", "浇水", session.userId, "w", false),
                  button(2, "农场信息", "农场信息", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "施肥", "施肥", session.userId, "f", false),
                  button(2, "收获", "收获", session.userId, "g"),
                  button(2, "树果背包", "树果背包", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "除草", "除草", session.userId, "b", false),
                  button(2, "除虫", "除虫", session.userId, "b", false),
                  button(2, "种子背包", "种子背包", session.userId, "i"),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });
  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("收获")
    .action(async ({ session }) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      const isHarvest = farm.harvest();
      if (!isHarvest) {
        return `当前没有可收获的果实`;
      }
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      const farmImage = await drawFarm(ctx, farm);
      const a = await toUrl(ctx, session, farmImage.attrs.src);
      const md = `<@${player.id}> 树果已放入树果背包
---
![farmimg #${128 * 4}px #${128 * Math.ceil(farm.trees.length / 4)}px](${a})
当前土壤数：${farm.farmLevel}
可用土壤数：${farm.farmLevel - farm.trees.length}`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, "种植", "种植", session.userId, "p", false),
                  button(2, "浇水", "浇水", session.userId, "w", false),
                  button(2, "农场信息", "农场信息", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "施肥", "施肥", session.userId, "f", false),
                  button(2, "收获", "收获", session.userId, "g"),
                  button(2, "树果背包", "树果背包", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "除草", "除草", session.userId, "b", false),
                  button(2, "除虫", "除虫", session.userId, "b", false),
                  button(2, "种子背包", "种子背包", session.userId, "i"),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });
  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("树果背包")
    .action(async ({ session }) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      if (farm.berry_bag.length == 0) return `树果背包为空`;
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      const md = `<@${player.id}> 树果背包
---
> ${farm.berry_bag
        .map((fruit) => `${fruit.name} x${fruit.number}`)
        .join("\n")}`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, "种植", "种植", session.userId, "p", false),
                  button(2, "浇水", "浇水", session.userId, "w", false),
                  button(2, "农场信息", "农场信息", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "施肥", "施肥", session.userId, "f", false),
                  button(2, "收获", "收获", session.userId, "g"),
                  button(2, "树果背包", "树果背包", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "除草", "除草", session.userId, "b", false),
                  button(2, "除虫", "除虫", session.userId, "b", false),
                  button(2, "种子背包", "种子背包", session.userId, "i"),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });
  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("种子背包")
    .action(async ({ session }) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      if (farm.sends.length == 0) return `种子背包为空`;
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      const seed_bag = farm.sends
        .filter((seed) => seed.number > 0)
        .map((seed) => `${seed.name} x${seed.number}`);
      const md = `<@${player.id}> 种子背包

---
> ${seed_bag.length == 0 ? "背包空无一物" : seed_bag.join("\n")}`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, "种植", "种植", session.userId, "p", false),
                  button(2, "浇水", "浇水", session.userId, "w", false),
                  button(2, "农场信息", "农场信息", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "施肥", "施肥", session.userId, "f", false),
                  button(2, "收获", "收获", session.userId, "g"),
                  button(2, "树果背包", "树果背包", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "除草", "除草", session.userId, "b", false),
                  button(2, "除虫", "除虫", session.userId, "b", false),
                  button(2, "种子背包", "种子背包", session.userId, "i"),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });
  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("除草")
    .action(async ({ session }) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      const isWeed = farm.weeding();
      console.log(isWeed);
      if (isWeed===false) {
        return `当前没有杂草`;
      }
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      const md = `<@${player.id}> 除草成功
---
> 获得肥料数：${isWeed==0?'肥料已满':isWeed}`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, "种植", "种植", session.userId, "p", false),
                  button(2, "浇水", "浇水", session.userId, "w", false),
                  button(2, "农场信息", "农场信息", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "施肥", "施肥", session.userId, "f", false),
                  button(2, "收获", "收获", session.userId, "g"),
                  button(2, "树果背包", "树果背包", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "除草", "除草", session.userId, "b", false),
                  button(2, "除虫", "除虫", session.userId, "b", false),
                  button(2, "种子背包", "种子背包", session.userId, "i"),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });
  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("除虫 [...id:number]")
    .action(async ({ session }, ...id) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      if (id.length == 0) return `请输入要除虫的树果id,多个id请用空格隔开`;
      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      const isBug = farm.bug(id);
      if (!isBug) {
        return `当前没有虫害`;
      }
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      const farmImage = await drawFarm(ctx, farm);
      const a = await toUrl(ctx, session, farmImage.attrs.src);
      const md = `<@${player.id}> 除虫成功
---
![farmimg #${128 * 4}px #${128 * Math.ceil(farm.trees.length / 4)}px](${a})`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, "种植", "种植", session.userId, "p", false),
                  button(2, "浇水", "浇水", session.userId, "w", false),
                  button(2, "农场信息", "农场信息", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "施肥", "施肥", session.userId, "f", false),
                  button(2, "收获", "收获", session.userId, "g"),
                  button(2, "树果背包", "树果背包", session.userId, "i"),
                ],
              },
              {
                buttons: [
                  button(2, "除草", "除草", session.userId, "b", false),
                  button(2, "除虫", "除虫", session.userId, "b", false),
                  button(2, "种子背包", "种子背包", session.userId, "i"),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });
}
