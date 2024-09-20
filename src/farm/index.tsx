import { $, Context } from "koishi";
import { PlantTree, BerryFood } from "./berryTreeFarm";
import { berry_food, berry_trees } from "../utils/data";
import { actionbutton, button, sendMarkdown, toUrl } from "../utils/method";
import { drawFarm } from "./utils";
import { Pokedex } from "../pokedex/pokedex";
import pokemonCal from "../utils/pokemon";
import { config } from "..";

export async function apply(ctx: Context) {
  //   ctx.on("interaction/button", async (session) => {
  //     const { id, d } = session.event._data;
  //     const state = d.data.resolved.button_id;
  //     const { group_openid, op_member_openid } = session.event._data.d;
  //     const [player] = await ctx.database.get("pokebattle", op_member_openid);
  //     if (state !== "mix") return;
  //     await ctx.database.set(
  //       "pokebattle",
  //       { id: op_member_openid },
  //       {
  //         isfish: false,
  //       }
  //     );
  //     const kb = {
  //       keyboard: {
  //         content: {
  //           rows: [
  //             {
  //               buttons: [
  //                 button(2, `继续混合`, "/树果混合", session.userId, "1", false),
  //               ],
  //             },
  //           ],
  //         },
  //       },
  //     };
  //     const pokeDex = new Pokedex(player);
  //     const mixData = JSON.parse(d.data.resolved.button_data.split("=")[1]);
  //     const time = parseInt(d.data.resolved.button_data.split("=")[0]);
  //     const isPoke =
  //       time > session.timestamp + mixData.perfectClick - 500 &&
  //       time < session.timestamp + mixData.perfectClick + 500;
  //     const isEvent =
  //       player.lap >= 3 && player.level >= 90 && isPoke && !pokeDex.check("380");
  //     if (isEvent) {
  //       if (player.ultra?.["380.380"] < 9 || !player.ultra?.["380.380"]) {
  //         if (player?.ultra["380.380"] === undefined) {
  //           player.ultra["380.380"] = 0;
  //         }
  //         player.ultra["380.380"] = player?.ultra["380.380"] + 1;
  //         const md = `收集度+10%
  // 你混合树果的香气，吸引了一个奇怪的宝可梦
  // ![img#512px #512px](${await toUrl(
  //           ctx,
  //           session,
  //           `${
  //             pokemonCal
  //               .pokemomPic("380.380", false)
  //               .toString()
  //               .match(/src="([^"]*)"/)[1]
  //           }`
  //         )})
  // ---
  // ![img#20px #20px](${await toUrl(
  //           ctx,
  //           session,
  //           `${config.图片源}/sr/${"380.380".split(".")[0]}.png`
  //         )}) : ${player.ultra["380.380"] * 10}% ${
  //           "🟩".repeat(Math.floor(player.ultra["380.380"] / 2)) +
  //           "🟨".repeat(player.ultra["380.380"] % 2) +
  //           "⬜⬜⬜⬜⬜".substring(Math.round(player.ultra["380.380"] / 2))
  //         }

  // ---
  // **传说宝可梦——${pokemonCal.pokemonlist("380.380")}**`;
  //         await sendMarkdown(ctx, md, session, kb, id);
  //         await ctx.database.set(
  //           "pokebattle",
  //           { id: session.userId },
  //           {
  //             ultra: player.ultra,
  //             cyberMerit: 0,
  //           }
  //         );
  //         return;
  //       }
  //       if (player.ultra["380.380"] >= 9) {
  //         let getMd = "";
  //         if (!pokeDex.check("380.380".split(".")[0])) {
  //           player.ultra["380.380"] = 10;
  //           getMd = `<@${session.userId}>成功获得
  // ![img#512px #512px](${await toUrl(
  //             ctx,
  //             session,
  //             `${
  //               pokemonCal
  //                 .pokemomPic("380.380", false)
  //                 .toString()
  //                 .match(/src="([^"]*)"/)[1]
  //             }`
  //           )})
  // ---
  // ![img#20px #20px](${await toUrl(
  //             ctx,
  //             session,
  //             `${config.图片源}/sr/${"380.380".split(".")[0]}.png`
  //           )}) : ${player.ultra["380.380"] * 10}% ${
  //             "🟩".repeat(Math.floor(player.ultra["380.380"] / 2)) +
  //             "🟨".repeat(player.ultra["380.380"] % 2) +
  //             "⬜⬜⬜⬜⬜".substring(Math.round(player.ultra["380.380"] / 2))
  //           }

  // ---
  // **传说宝可梦——${pokemonCal.pokemonlist("380.380")}**

  // 已经放入图鉴`;
  //           pokeDex.pull("380.380", player);
  //           await ctx.database.set(
  //             "pokebattle",
  //             { id: session.userId },
  //             {
  //               ultra: player.ultra,
  //               pokedex: player.pokedex,
  //               cyberMerit: 0,
  //             }
  //           );

  //           await sendMarkdown(ctx, getMd, session, kb, id);
  //           return;
  //         }
  //       }
  //     }
  //     if (mixData.GorP) {
  //       await ctx.database.set(
  //         "pokemon.resourceLimit",
  //         { id: session.userId },
  //         (row) => ({
  //           rankScore: $.add(row.rankScore, mixData.get),
  //         })
  //       );
  //     } else {
  //       await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
  //         gold: $.add(row.gold, mixData.get),
  //       }));
  //     }
  //     const md = `<@${session.userId}> 混合成功
  // ---
  // > 获得${mixData.get}${mixData.GorP ? "积分" : "金币"}`;
  //     await sendMarkdown(ctx, md, session, kb, id);
  //   });

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
        await session.send(
          "种植失败,请检查土壤是否有空位或者背包是否有种子，种子在捕捉宝可梦时可能会获得,土壤上限为24块"
        );
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
      if (id.length == 0) {
        if (player.vip < 1)
          return `非vip用户无法使用一键浇水。请输入要浇水的树果id,多个id请用空格隔开`;
        await session.send("一键浇水中，请稍等");
      }

      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      const isWater = player.vip < 1 ? farm.watering(id) : farm.VIPwatering();
      farm.triggerEvent();
      if (!isWater) {
        return `浇水失败，储水量不足，可以通过钓鱼补充`;
      }
      if (farm.trees.length == 0) return `当前农场没有果树`;
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
      if (id.length == 0) {
        if (player.vip < 1)
          return `非vip用户无法使用一键施肥。请输入要施肥的树果id,多个id请用空格隔开`;
        await session.send("一键施肥中，请稍等");
        id=player.farm.trees.filter(tree => new Date(tree.eventTime).getTime() < new Date().getTime() &&tree.event == Event["缺肥"]).map(tree => tree.id);
      }
      const farm = new PlantTree(player.farm);
      farm.triggerEvent();
      const isFertilize = farm.fertilize(id);
      farm.triggerEvent();
      if (!isFertilize) {
        return `当前肥料不足，挖掘化石或者铲除枯树可以获得`;
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
      farm.triggerEvent();
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
        .map((fruit) => `[${fruit.name} x${fruit.number}]`)
        .join("||")}`;
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
              {
                buttons: [
                  button(
                    2,
                    "携带树果",
                    "携带树果 ",
                    session.userId,
                    "t",
                    false
                  ),
                  button(
                    2,
                    "💻 树果混合器",
                    "树果混合 ",
                    session.userId,
                    "t",
                    false
                  ),
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
        .map((seed) => `[${seed.name} x${seed.number}]`);
      const md = `<@${player.id}> 种子背包

---
> ${seed_bag.length == 0 ? "背包空无一物" : seed_bag.join("||")}`;
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
      farm.triggerEvent();
      if (isWeed === false) {
        return `当前没有杂草`;
      }
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      const md = `<@${player.id}> 除草成功
---
> 获得肥料数：${isWeed == 0 ? "肥料已满" : isWeed}`;
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
      farm.triggerEvent();
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
  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("携带树果 <id:string>")
    .action(async ({ session }, id) => {
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
      const openBerrys = berry_food.filter((berry) => !!berry.type);
      const openBerrysName = openBerrys.map((berry) => berry.berrytree);
      const openBerrysdes = openBerrys.map((berry) => {
        const sx = {
          hp: "生命",
          attack: "攻击",
          defense: "防御",
          specialAttack: "特攻",
          specialDefense: "特防",
          speed: "速度",
        };
        return `${berry.berrytree}：${
          berry.type == "category"
            ? `${
                berry.effectCategory == "hp" ? `生命值剩余50%时` : `对战时`
              } 增加一定量的${sx[berry.effectCategory]}`
            : `当对方${berry.effectCategory}属性招式命中要害时，伤害降低${berry.effectMagnitude}倍`
        }`;
      });
      if (!openBerrysName.includes(id))
        return `当前第一批开放树果为: \n${openBerrysdes.join(
          "\n\n"
        )} \n请检查输入`;
      const _id = parseInt(id);
      let _plantId = _id
        ? _id
        : berry_trees.findIndex((tree) => tree.berrytree === id);
      const isTake = farm.take(_plantId);
      if (player.berry_food) await session.send(`将直接覆盖已携带的树果`);
      if (!isTake) {
        return `没有该树果为空或者名字错误`;
      }
      const berry = berry_food.find((berry) => berry.id == _plantId);
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm, berry_food: new BerryFood(berry) }
      );
      const md = `<@${player.id}> 携带树果${berry.berrytree}成功`;
      await sendMarkdown(ctx, md, session);
    });

  ctx
    .command("宝可梦")
    .subcommand("树果农场")
    .subcommand("树果混合 [...id:string]")
    .action(async ({ session }, ...id) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.send("自动注册中，请稍等");
        await session.execute("签到");
        return;
      }
      if (id.length < 2 || id.length > 4) return `请放入2-4个树果,用空格隔开`;
      const farm = new PlantTree(player.farm);
      const isMix = farm.mix(id);
      if (!isMix) {
        return `树果混合失败`;
      }
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { farm: farm }
      );
      const mixData = JSON.stringify(isMix);
      const md = `是否混合树果${id.join(" ")}?`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  actionbutton(
                    "确认",
                    mixData,
                    session.userId,
                    "mix",
                    new Date().getTime()
                  ),
                  button(2, "取消 (不退回树果)", "取消", session.userId, "c"),
                ],
              },
            ],
          },
        },
      };
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        { isMix: true }
      );
      await sendMarkdown(ctx, md, session, kb);
      ctx.setTimeout(async () => {
        const [playerOut] = await ctx.database.get(
          "pokebattle",
          session.userId
        );
        playerOut.isMix
          ? await ctx.database.set("pokebattle", session.userId, (row) => ({
              isMix: false,
            }))
          : null;
      }, 10000);
    });
}
