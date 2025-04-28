import canvas from "koishi-plugin-canvas";
import { PokemonInfo } from "./type";
import { Context } from "koishi";
import { LabelData, PokemonJson } from "../utils/data";
export const colors = {
  yes: "#67c34a",
  no: "#adafb4",
  like: "#e7a753",
};

enum Gen {
  "第一世代" = 1,
  "第二世代" = 2,
  "第三世代" = 3,
  "第四世代" = 4,
  "第五世代" = 5,
  "第六世代" = 6,
  "第七世代" = 7,
  "第八世代" = 8,
  "第九世代" = 9,
}

function drawCard(
  ctx: any,
  offsetX: number,
  offsetY: number,
  data: PokemonInfo
) {
  const W = 1200,
    H = 120;
  const colCount = data.sections.length;
  const padding = 20,
    gap = 10;
  const colW = Math.floor((W - padding * 2 - gap * (colCount - 1)) / colCount);

  // 背景
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(offsetX, offsetY, W, H);

  ctx.textBaseline = "middle";
  data.sections.forEach((sec, i) => {
    const x = offsetX + padding + i * (colW + gap);
    // 标题
    ctx.fillStyle = "#888";
    ctx.font = "16px sans-serif";
    ctx.fillText(sec.title, x, offsetY + 24);

    // 值或标签
    let y = offsetY + 60;
    ctx.font = "18px sans-serif";
    const vals = Array.isArray(sec.value) ? sec.value : [sec.value];
    vals.forEach((val, i) => {
      const m = ctx.measureText(val);
      const w = m.width + 12,
        h = 28,
        r = 4;

      if (sec.bgColor) {
        ctx.fillStyle = sec.bgColor[i];
        // 画圆角 pill
        ctx.beginPath();
        ctx.globalAlpha = 0.5;
        ctx.moveTo(x, y - h / 2 + r);
        ctx.arcTo(x, y + h / 2, x + r, y + h / 2, r);
        ctx.lineTo(x + w - r, y + h / 2);
        ctx.arcTo(x + w, y + h / 2, x + w, y + h / 2 - r, r);
        ctx.lineTo(x + w, y - h / 2 + r);
        ctx.arcTo(x + w, y - h / 2, x + w - r, y - h / 2, r);
        ctx.lineTo(x + r, y - h / 2);
        ctx.arcTo(x, y - h / 2, x, y - h / 2 + r, r);
        ctx.closePath();
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.fillStyle = "#FFF";
      } else {
        ctx.fillStyle = "#333";
      }

      ctx.fillText(val, x + 6, y);
      ctx.fillStyle = "#000";
      ctx.fillText(sec.hasArrow, x + 6 + m.width + 6, y);
      y += h + 6;
    });
  });
}

export async function drawAll(ctx: Context, dataList: PokemonInfo[]) {
  const cardW = 1200,
    cardH = 120,
    gap = 20,
    padding = 20;
  const n = dataList.length;
  const totalW = padding * 2 + cardW;
  const totalH = padding * 2 + n * cardH + (n - 1) * gap;

  return await ctx.canvas.render(totalW, totalH, async (c) => {
    c.fillStyle = "#FFFFFF";
    //   console.log(totalW, totalH);
    c.fillRect(0, 0, totalW, totalH);

    dataList.forEach((data, i) => {
      const x = padding;
      const y = padding + i * (cardH + gap);
      drawCard(c, x, y, data);
    });
  });
}

export function getPokemonInfo(pokemon: PokemonJson): PokemonInfo {
  const stats =
    parseInt(pokemon.stats[0].data.attack) +
    parseInt(pokemon.stats[0].data.defense) +
    parseInt(pokemon.stats[0].data.hp) +
    parseInt(pokemon.stats[0].data.sp_attack) +
    parseInt(pokemon.stats[0].data.sp_defense) +
    parseInt(pokemon.stats[0].data.speed);
  const flavorIndex = pokemon.flavor_texts.findIndex(
    (i) => i.versions.length > 0
  );
  const ability = pokemon.forms[0].ability.map((i) => i.name);
  const flavor = pokemon.flavor_texts[flavorIndex].name;
  const [evolu] = pokemon.evolution_chains[0].filter(
    (p) => p.name == pokemon.name
  );
  const evoluText = ["未进化", "不进化"].includes(evolu?.stage)
    ? ["未进化/不进化"]
    : [evolu?.stage, evolu?.text ? cutText(evolu?.text) : ""];
  const other = LabelData.filter((i) => {
    return i.pokemon.includes(pokemon.name);
  });
  const otherText = other.map((i) => i.class);
  return {
    sections: [
      {
        title: "名称",
        value: [pokemon.name],
        hasArrow: "",
        bgColor: [colors.no],
      },
      {
        title: "属性",
        value: pokemon.forms[0].types,
        hasArrow: "",
        bgColor: Array(pokemon.forms[0].types.length).fill(colors.no),
      },
      {
        title: "种族值",
        value: [stats.toString()],
        hasArrow: "",
        bgColor: [colors.no],
      },
      {
        title: "世代",
        value: [flavor],
        hasArrow: "",
        bgColor: [colors.no],
      },
      {
        title: "特性",
        value: ability,
        hasArrow: "",
        bgColor: Array(ability.length).fill(colors.no),
      },
      {
        title: "进化",
        value: evoluText,
        hasArrow: "",
        bgColor: Array(evoluText.length).fill(colors.no),
      },
      {
        title: "其他",
        value: otherText,
        hasArrow: "",
        bgColor: Array(otherText.length).fill(colors.no),
      },
    ],
  };
}

function cutText(text: string, maxLen: number = 7): string {
  // 只统计汉字长度，英文和符号按1算
  let len = 0;
  let result = "";
  for (const ch of text) {
    len += /[\u4e00-\u9fa5]/.test(ch) ? 1 : 0.5;
    if (len > maxLen) {
      result += "...";
      break;
    }
    result += ch;
  }
  return result;
}

export function markSameValues(
  答案: PokemonInfo,
  猜测: PokemonInfo
): PokemonInfo {
  // 深拷贝，避免修改原对象
  const copyA = JSON.parse(JSON.stringify(答案)) as PokemonInfo;
  const copyB = JSON.parse(JSON.stringify(猜测)) as PokemonInfo;

  for (let i = 0; i < copyA.sections.length; i++) {
    const secA = copyA.sections[i];
    const secB = copyB.sections[i];
    // 只比较 value 都为数组的情况
    if (Array.isArray(secA.value) && Array.isArray(secB.value)) {
      // 标记 infoB
      secB.bgColor = secB.value.map((val, idx) => {
        if (secA.title == `进化`) {
          const diff = jaccard(val, secA?.value[idx]);
          if (diff > 0.5) {
            secB.bgColor[idx] = colors.like;
          }
        }
        return secA.value.includes(val)
          ? colors.yes
          : secB.bgColor[idx] || colors.no;
      });
      [secB.hasArrow] = secB.value.map((val, j) => {
        if ("种族值" == secA.title) {
          const diff = Math.abs(Number(val) - Number(secA.value[0]));
          if (diff < 50) {
            secB.bgColor[0] = colors.like;
          }
          if (Number(val) > Number(secA.value[0])) {
            return "↓";
          }
          if (Number(val) < Number(secA.value[0])) {
            return "↑";
          }
        } else if ("世代" == secA.title) {
          const genA = Gen[secA.value[0] as keyof typeof Gen];
          const genB = Gen[val as keyof typeof Gen];
          const diff = Math.abs(genB - genA);
          if (diff < 2 && diff !== 0) {
            secB.bgColor[0] = colors.like;
          }
          if (genB > genA) {
            return "↓";
          }
          if (genB < genA) {
            return "↑";
          }
        }
        return "";
      });
    }
  }
  return copyB;
}
function jaccard(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split(""));
  const setB = new Set(b.split(""));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
