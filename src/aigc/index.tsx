import {} from "koishi-plugin-canvas";
import Openai from "openai";
import { config, testcanvas } from "..";

import { Context, h, Session } from "koishi";
import { MonsterInfo } from "./type";
import { promptSystem } from "./type";
import { resolve } from "path";
import { dirname } from "../dirname";
import { PokemonData } from "../utils/data";
import * as fullPicPosition from "../assets/json/pokemon_full_list.json";
import { promises as fs } from "fs";

export async function apply(ctx: Context) {
  // console.log(`${testcanvas}${resolve(dirname, `./aigc/normal.webp`)}`);
  // const fullPic = await ctx.canvas.loadImage(
  //   `D:\\koishi1\\MaiGame\\external\\pokemon-for-qqbot\\src\\aigc\\normal.webp`
  // );
  const imgPath = resolve(dirname, "./assets/img/normal.webp");
  const imgBuffer = await fs.readFile(imgPath);
  const fullPic = await ctx.canvas.loadImage(imgBuffer);
  const DS = new Openai({
    baseURL: `https://api.deepseek.com/v1`,
    apiKey: config.ds_key,
  });

  async function getMonsterInfo(
    isfake: boolean,
    numbers?: number
  ): Promise<MonsterInfo> {
    numbers = numbers ? numbers : Math.floor(Math.random() * 1000);
    const completion = await DS.chat.completions.create({
      messages: [
        { role: "system", content: promptSystem },
        {
          role: "assistant",
          content: `{
  '是否末日宝可梦': true,
  '宝可梦名称': '皮卡丘',
  '日期': '2023-05-15',
  '外貌特征': [ '黄色皮毛', '红色电气袋', '闪电形状的尾巴', '黑色条纹背部', '体型异常瘦长' ],
  '末日宝可梦特征': [ '认证信息中宝可梦名称与显示名称不符', '活跃地区包含火山地带' ],
  '活跃地区': [
    '关都地区常磐森林',
    '城都地区桧皮镇',
    '合众地区雷文市',
    '卡洛斯地区密阿雷市',
    '阿罗拉地区美乐美乐岛',
    '伽勒尔地区旷野地带',
    '丰缘地区烟囱山',
    '神奥地区天冠山'
  ],
  '认证信息': { '出生日期': '2023-06-20', '宝可梦名称': '雷丘', '全国编号': '0260' }
}`,
        },
        {
          role: "user",
          content: (isfake ? "末日" : "") + "宝可梦编号" + numbers,
        },
      ],
      model: "deepseek-chat",
    });
    let content = completion.choices[0].message.content.match(
      /```json\n([\s\S]*?)\n```/
    );
    if (!content) {
      return getMonsterInfo(isfake, numbers);
    }
    const info = JSON.parse(content[1]) as MonsterInfo;
    return info;
  }
  ctx.command("真假宝可梦", "获取宝可梦信息").action(async ({ session }) => {
    const isfake = Math.random() < 0.5;
    const pokemonId = Math.floor(Math.random() * 1000);
    const info = await getMonsterInfo(isfake, pokemonId);
    const img = await drawPost(session, info, pokemonId);
    return img;
  });

  async function drawPost(s: Session, info: MonsterInfo, numbers: number) {
    const width = 600;
    const height = 800;
    const name = info.宝可梦名称;
    const date = info.日期;
    const traits = info.外貌特征;
    const areas = info.活跃地区;
    const birth = info.认证信息.出生日期;
    const number = info.认证信息.全国编号;
    const positions = fullPicPosition.find((i) => i.name == name);
    // return h.img(webpBuffer, "image/png");
    // const portalBack = await ctx.canvas.loadImage(webpBuffer);
    const [px, py] = positions?.meta.icon_position
      .split(` `)
      .map((i) => -parseInt(i)) || [0, 0];
    return ctx.canvas.render(width, height, async (c) => {
      c.fillStyle = "#f0e1c2";
      c.fillRect(0, 0, width, height);

      for (let i = 0; i < 500; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 2;
        c.beginPath();
        c.arc(x, y, radius, 0, Math.PI * 2);
        c.fillStyle = "rgba(100, 80, 50, 0.3)";
        c.fill();
      }
      c.font = '16px "zpix"';
      c.fillStyle = "#4B2E2E";
      c.textAlign = "left";
      c.textBaseline = "top";

      //内容
      c.strokeStyle = "#4B2E2E";
      c.lineWidth = 2;
      c.strokeRect(40, 40, 200, 200);

      c.drawImage(fullPic, px, py, 112, 112, 40, 40, 200, 200);
      c.fillText("生物名称: " + name, 300, 40);
      c.fillText("日期: " + date, 300, 80);
      c.fillText("外貌特征:", 300, 160);
      traits.forEach((text, index) => {
        c.fillText(`- ${text}`, 320, 200 + index * 30);
      });
      c.fillText("活跃地区:", 40, 260);
      areas.forEach((text, index) => {
        c.fillText(`- ${text}`, 60, 300 + index * 30);
      });
      c.fillText("认证信息:", 300, 420);
      c.fillText("出生日期: " + birth, 320, 460);
      c.fillText("生物名称: " + name, 320, 500);
      c.fillText("编号: " + number, 320, 540);
    });
  }
}
