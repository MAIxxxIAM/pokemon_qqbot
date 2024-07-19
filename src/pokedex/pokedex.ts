import { Context, h } from "koishi";
import { Pokebattle, config, testcanvas, Config } from "..";
import { resolve } from "path";
import pokemonCal from "../utils/pokemon";
import { button, sendMarkdown, toUrl } from "../utils/method";
import { expBase } from "../utils/data";
import { dirname } from "../dirname";

export class Pokedex {
  dex: number[][];
  constructor(player: Pokebattle) {
    this.dex = [[]];
    if (!player?.pokedex?.dex) {
      for (let i in player?.AllMonster) {
        const pokemon = player.AllMonster[i].split(".")[0];
        if (this.dex[0].includes(parseInt(pokemon))) {
          continue;
        }
        this.dex[0].push(parseInt(pokemon));
        this.dex[0].sort((a, b) => a - b);
      }
      return;
    }
    this.dex = player.pokedex.dex;
  }
  pull(pokemon: string, player: Pokebattle) {
    if (this.check(pokemon)) {
      return;
    }
    const id = parseInt(pokemon.split(".")[0]);
    if (this.dex[this.dex.length - 1].length >= 15) {
      this.dex.push([]);
    }
    this.dex[this.dex.length - 1].push(id);
    const flatArrayA = [].concat(...this.dex);
    const flatArray = [...new Set(flatArrayA)];
    flatArray.sort((a, b) => a - b);
    let a = [];
    for (let i = 0; i < flatArray.length; i += 15) {
      a.push(flatArray.slice(i, i + 15));
    }
    this.dex = a;
    player.pokedex.dex = this.dex;
  }
  check(pokemon: string) {
    for (let box in this.dex) {
      if (this.dex[box].includes(parseInt(pokemon.split(".")[0]))) {
        return true;
      }
    }
    const id = expBase.exp.find((Pid) => Pid.name === pokemon);
    for (let box in this.dex) {
      if (this.dex[box].includes(parseInt(id?.id))) {
        return true;
      }
    }
    return false;
  }
  find(lap: number = 1) {
    const dex = [151, 251, 420];
    let allDex = Array.from({ length: dex[lap - 1] }, (_, k) => k + 1);
    const flatArrayA = [].concat(...this.dex);
    const flatArray = [...new Set(flatArrayA)];
    let missingpokemon = [];
    missingpokemon = allDex.filter((x) => !flatArray.includes(x));
    let missingpokemonName: string = "";
    let count = 0;
    for (let pokemon in missingpokemon) {
      count++;
      missingpokemonName +=
        pokemonCal.pokemonlist(
          `${missingpokemon[pokemon]}.${missingpokemon[pokemon]}`
        ) + `> ${missingpokemon[pokemon]}  `;
      if (count >= 30) {
        break;
      }
      if (count % 3 == 0) missingpokemonName += "\n\n";
    }
    return [missingpokemonName, missingpokemon.length];
  }
}

export async function apply(ctx) {
  ctx
    .command("宝可梦")
    .subcommand("查看图鉴 [page:number]", "查看宝可梦图鉴")
    .action(async ({ session }, page: number) => {
      const players: Pokebattle[] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      page ? (page = page) : (page = 1);
      if (players.length === 0) {
        await session.execute("宝可梦签到");
        return;
      }
      const player: Pokebattle = players[0];
      if (!player.pokedex?.dex) {
        const pokedex = new Pokedex(player);
        player.pokedex = pokedex;
        await ctx.database.upsert("pokebattle", [player]);
      }
      if (!player.pokedex?.dex?.[page - 1]) {
        return `第${page}页空无一物`;
      }
      let dexImage = [];
      for (let pokemon in player.pokedex.dex[page - 1]) {
        dexImage.push(
          await ctx.canvas.loadImage(
            `${config.图片源}/sr/${player.pokedex.dex[page - 1][pokemon]}.png`
          )
        );
      }
      const boxImage = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(dirname, `./assets/img/components/box.png`)}`
      );
      const pokeDexImage = await ctx.canvas.render(324, 296, async (ctx) => {
        ctx.drawImage(boxImage, 0, 0, 324, 296);
        for (let i = 0; i < dexImage.length; i++) {
          ctx.drawImage(
            dexImage[i],
            (i % 5) * 60 + 12,
            Math.floor(i / 5) * 74 + 50,
            60,
            60
          );
          ctx.font = "normal 12px zpix";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const pokemonId = player.pokedex.dex[page - 1][i];
          ctx.fillText(
            pokemonCal.pokemonlist(`${pokemonId}.${pokemonId}`),
            (i % 5) * 60 + 42,
            Math.floor(i / 5) * 74 + 117
          );
          ctx.fillText(
            pokemonId,
            (i % 5) * 60 + 42,
            Math.floor(i / 5) * 74 + 129
          );
        }
        ctx.font = "normal 15px zpix";
        ctx.fillStyle = "black";
        ctx.fillText(`第 ${page} 页`, 48, 25);
        ctx.fillStyle = "white";
        ctx.fillText(player.name, 210, 25);
      });
      try {
        const { src } = pokeDexImage.attrs;

        const md = `<@${session.userId}>的图鉴
---
![img#324px #296px](${await toUrl(ctx, session, src)})`;
        const kb = {
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(
                      2,
                      "📖 我的图鉴",
                      "/查看图鉴",
                      session.userId,
                      "cmd"
                    ),
                    button(
                      2,
                      "💻 接收宝可梦",
                      "/接收",
                      session.userId,
                      "cmd",
                      false
                    ),
                  ],
                },
                {
                  buttons: [
                    button(2, "🖊 签到", "/签到", session.userId, "1"),
                    button(2, "💳 信息", "/查看信息", session.userId, "1"),
                  ],
                },
                {
                  buttons: [
                    button(2, "🔍 图鉴检查", "/图鉴检查", session.userId, "1"),
                  ],
                },

                page < 2
                  ? {
                      buttons: [
                        button(
                          0,
                          "下一页",
                          `/查看图鉴 ${page + 1}`,
                          session.userId,
                          "cmd2"
                        ),
                      ],
                    }
                  : {
                      buttons: [
                        button(
                          0,
                          "上一页",
                          `/查看图鉴 ${page - 1}`,
                          session.userId,
                          "cmd1"
                        ),
                        button(
                          0,
                          "下一页",
                          `/查看图鉴 ${page + 1}`,
                          session.userId,
                          "cmd2"
                        ),
                      ],
                    },
              ],
            },
          },
        };
        await sendMarkdown(ctx, md, session, kb);
      } catch (e) {
        return pokeDexImage;
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("接收宝可梦 <Pid>", "从图鉴中接收宝可梦，花费1200金币")
    .alias("接收")
    .action(async ({ session }, Pid) => {
      const players: Pokebattle[] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      const { platform } = session;
      let pokedex: Pokedex;
      if (players.length === 0) {
        await session.execute("宝可梦签到");
        return;
      }
      const player: Pokebattle = players[0];
      if (player.gold < 1200) {
        return `金币不足以付邮费`;
      }
      if (!Pid) {
        await session.execute("查看图鉴");
        return `请查询到正确的宝可梦编号后，再指令后面带上编号`;
      }
      pokedex = new Pokedex(player);
      if (!pokedex.check(Pid.toString())) return `你还没有捕捉到这个宝可梦`;
      let poke = `${Pid}.${Pid}`;
      Number(Pid)
        ? (poke = `${Number(Pid)}.${Number(Pid)}`)
        : (poke = `${Number(
            expBase.exp.find((id) => id.name === Pid).id
          )}.${Number(expBase.exp.find((id) => id.name === Pid).id)}`);
      const md = `<@${session.userId}>成功接收宝可梦${pokemonCal.pokemonlist(
        poke
      )}
---
![img#512px #512px](${await toUrl(
        ctx,
        session,
        `${
          pokemonCal
            .pokemomPic(poke, false)
            .toString()
            .match(/src="([^"]*)"/)[1]
        }`
      )})
        
---
花费1200金币接收到了${pokemonCal.pokemonlist(poke)}`;

      await sendMarkdown(ctx, md, session);

      if (player.AllMonster.length < 6) {
        //背包空间
        let five: string = "";
        if (player.AllMonster.length === 5)
          five = `\n你的背包已经满了,你可以通过 放生 指令，放生宝可梦`; //背包即满
        player.AllMonster.push(poke);
        await ctx.database.set(
          "pokebattle",
          { id: session.userId },
          {
            gold: player.gold - 1200,
            AllMonster: player.AllMonster,
            pokedex: player.pokedex,
          }
        );

        return five;
      }
      let pokemonimg1: string[] = [];
      const bgImg = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(dirname, "./assets/img/components", "bag.png")}`
      );
      for (let i = 0; i < player.AllMonster.length; i++) {
        pokemonimg1[i] = await ctx.canvas.loadImage(
          `${config.图片源}/sr/${player.AllMonster[i].split(".")[0]}.png`
        );
      }
      const img = await ctx.canvas.render(512, 381, async (ctx) => {
        ctx.drawImage(bgImg, 0, 0, 512, 381);
        ctx.font = "bold 20px zpix";
        for (let i = 0; i < pokemonimg1.length; i++) {
          if (i % 2 == 0) {
            ctx.drawImage(pokemonimg1[i], 28, 60 + 90 * (i / 2), 64, 64);
            ctx.fillText(
              "【" +
                (i + 1) +
                "】" +
                pokemonCal.pokemonlist(player.AllMonster[i]),
              82,
              100 + 90 * (i / 2)
            );
          } else {
            ctx.drawImage(pokemonimg1[i], 276, 72 + 90 * ((i - 1) / 2), 64, 64);
            ctx.fillText(
              "【" +
                (i + 1) +
                "】" +
                pokemonCal.pokemonlist(player.AllMonster[i]),
              330,
              112 + 90 * ((i - 1) / 2)
            );
          }
        }
      });
      const { src } = img.attrs;
      //图片服务
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(
                    0,
                    pokemonCal.pokemonlist(player.AllMonster[0]),
                    "1",
                    session.userId,
                    "1"
                  ),
                  button(
                    0,
                    pokemonCal.pokemonlist(player.AllMonster[1]),
                    "2",
                    session.userId,
                    "2"
                  ),
                ],
              },
              {
                buttons: [
                  button(
                    0,
                    pokemonCal.pokemonlist(player.AllMonster[2]),
                    "3",
                    session.userId,
                    "3"
                  ),
                  button(
                    0,
                    pokemonCal.pokemonlist(player.AllMonster[3]),
                    "4",
                    session.userId,
                    "4"
                  ),
                ],
              },
              {
                buttons: [
                  button(
                    0,
                    pokemonCal.pokemonlist(player.AllMonster[4]),
                    "5",
                    session.userId,
                    "5"
                  ),
                  button(
                    0,
                    pokemonCal.pokemonlist(player.AllMonster[5]),
                    "6",
                    session.userId,
                    "6"
                  ),
                ],
              },
              { buttons: [button(0, "放生", "/放生", session.userId, "7")] },
            ],
          },
        },
      };
      const md2 = `<@${session.userId}>的宝可梦背包已经满了
---
![img#512px #381px](${await toUrl(ctx, session, src)})

---
请你选择需要替换的宝可梦`;
      if (platform == "qq") {
        await sendMarkdown(ctx, md2, session, kb);
      } else {
        await session.send(`\n
你的背包中已经有6只原生宝可梦啦
请选择一只替换
【1】${pokemonCal.pokemonlist(player.AllMonster[0])}
【2】${pokemonCal.pokemonlist(player.AllMonster[1])}
【3】${pokemonCal.pokemonlist(player.AllMonster[2])}
【4】${pokemonCal.pokemonlist(player.AllMonster[3])}
【5】${pokemonCal.pokemonlist(player.AllMonster[4])}
【6】${pokemonCal.pokemonlist(player.AllMonster[5])}
${h("at", { id: session.userId })}
      `);
      }
      const BagNum = await session.prompt(25000);

      if (!BagNum) {
        return "你犹豫太久啦！宝可梦从你手中逃走咯~";
      }
      let reply = "";
      if (BagNum >= "1" && BagNum <= "6") {
        const index = parseInt(BagNum) - 1;
        player.AllMonster[index] = poke;

        await session.execute(`放生 ${index + 1}`);
        await ctx.database.set(
          "pokebattle",
          { id: session.userId },
          {
            gold: player.gold - 1200,
            AllMonster: player.AllMonster,
            pokedex: player.pokedex,
          }
        );
        reply = `你小心翼翼的把 ${pokemonCal.pokemonlist(poke)} 放在进背包`;
      } else {
        reply = `你好像对新的宝可梦不太满意，把 ${pokemonCal.pokemonlist(
          poke
        )} 放生了`;
      }
      await session.send(reply);
    });

  ctx
    .command("宝可梦")
    .subcommand("图鉴检查", "检查你的图鉴还缺少哪些宝可梦")
    .action(async ({ session }) => {
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.execute("签到");
        return;
      }
      const pokedex = new Pokedex(player);
      const miss = pokedex.find(player.lap);
      if (miss[0] === "") {
        return `你当前图鉴已经收集完整`;
      }
      const md = `查询中...
${"```"}
${miss[0]}
${"```"}

---
你还有${miss[1]}只宝可梦没有收集`;
      await sendMarkdown(ctx, md, session);
    });
}
