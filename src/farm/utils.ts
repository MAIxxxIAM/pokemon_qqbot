import { resolve } from "path";
import { testcanvas } from "..";
import { BerryTree, Farm } from "./berryTreeFarm";
import { PEvent } from "./berryTreeFarm";
import { dirname } from "../dirname";

export async function drawFarm(ctx: any, farm: Farm) {
  // const backImage=await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/`)}`)
  const treesImages = [];
  let treeGroup = [];
  const stages = (berry: BerryTree) => {
    return ["种子", "长高", "开花", berry.berry][berry.stage];
  };
  for (let i = 0; i < farm.trees.length; i++) {
    const tree = farm.trees[i];
    let treeImage: any;
    if (tree.berry_id == 68) {
      treeImage = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          dirname,
          `./assets/img/berrytree/overtrees.png`
        )}`
      );
      tree.stage = 3;
    } else {
      treeImage = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          dirname,
          `./assets/img/berrytree/${stages(tree)}.png`
        )}`
      );
    }
    const inPEvent = new Date().getTime() > new Date(tree.eventTime).getTime();
    const treeInfo = {
      id: tree.id,
      berry: tree.berry,
      event: inPEvent ? PEvent[tree.event] : "无事件",
      stage: stages(tree),
      needWater: tree.water,
      growth: tree.growth,
      yield: tree.yield,
      image: treeImage,
    };
    treeGroup.push(treeInfo);
    if (treeGroup.length == 4) {
      treesImages.push(treeGroup);
      treeGroup = [];
    }
  }
  if (treeGroup.length) {
    treesImages.push(treeGroup);
  }
  const farmImage = await ctx.canvas.render(
    128 * 4,
    128 * Math.max(1, treesImages.length),
    (ctx: any) => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 128 * 4, 128 * Math.max(1, treesImages.length));
      for (let i = 0; i < treesImages.length; i++) {
        const treeGroup = treesImages[i];
        for (let j = 0; j < treeGroup.length; j++) {
          const tree = treeGroup[j];
          ctx.drawImage(tree.image, j * 128 + 64, i * 128 + 32, 64, 64);
          ctx.fillStyle = "black";
          ctx.font = "10px zpix";
          ctx.fillText(tree.berry, j * 128 + 5, i * 128 + 15);
          ctx.fillText(`编号:${tree.id}`, j * 128 + 5, i * 128 + 30);
          ctx.fillText(`阶段:${tree.stage}`, j * 128 + 5, i * 128 + 45);
          ctx.fillText(`事件:${tree.event}`, j * 128 + 5, i * 128 + 60);
          ctx.fillText(`水量:${tree.needWater}`, j * 128 + 5, i * 128 + 75);
          ctx.fillText(`成长:${tree.growth}`, j * 128 + 5, i * 128 + 90);
          ctx.fillText(`产量:${tree.yield}`, j * 128 + 5, i * 128 + 105);
        }
      }
    }
  );
  return farmImage;
}
