import { $, Context, Element } from "koishi";
import { Enemy } from "./type";
import { initType } from "./method";
import { Robot } from "../utils/robot";

export async function apply(ctx: Context) {
  ctx.command("card-battle", "卡牌对战").action(async ({ session }) => {
    const a = new Robot(100);
    const a1: Enemy = new Enemy(a);
    a1.drawHand(5);
    let playerHand: [string, Element, number][] = [];
    for (let i = 0; i < 5; i++) {
      const name = a1.currentHand[i].name;
      const image = await a1.currentHand[i].drawCard(ctx);
      const cost = a1.currentHand[i].cost;
      playerHand.push([name, image, cost]);
    }
    const hands = await drawHand(playerHand);
    return hands;
  });

  async function drawHand(Images: [string, Element, number][]) {
    const handImages = Images.map((image) => {
      return image[1].attrs.src;
    });
    const width = 500; // 适应高清画布
    const height = 500;
    // 清空画布
    return ctx.canvas.render(width, height, async (c) => {
      // 绘制背景
      c.fillStyle = "rgb(128, 152, 199)";
      c.fillRect(0, 0, width, height);

      // 添加背景纹理或效果
      c.globalAlpha = 0.1;
      for (let i = 0; i < 20; i++) {
        c.fillStyle = i % 2 === 0 ? "rgb(86, 105, 143)" : "rgb(194, 122, 164)";
        c.fillRect(0, i * 60, width, 30);
      }
      c.globalAlpha = 1.0;

      const numCards = handImages.length;

      // 动态布局参数
      const cx = width / 2; // 圆心X
      const cy = height - 50; // 圆心Y（向下偏移）
      const cardAspect = 445 / 670; // 原始宽高比
      const cardHeight = 180; // 显示高度
      const cardWidth = cardHeight * cardAspect;

      // 自动计算布局参数
      const baseRadius = cardHeight * 0.8;
      const radiusIncrement = cardHeight * 0.05;
      const maxAngle = 120; // 最大展开角度

      // 动态布局计算
      const radius = baseRadius + Math.min(5, numCards) * radiusIncrement;
      const totalAngle = Math.min(maxAngle, numCards * 15);
      const angleStep = numCards > 1 ? totalAngle / (numCards - 1) : 0;
      const startAngle = 270 - totalAngle / 2 + 5; // 从正下方开始

      // 添加表格区域
      c.fillStyle = "rgba(20, 40, 80, 0.6)";
      c.fillRect(cx - 150, 30, 300, 100);
      c.strokeStyle = "#4a5b6c";
      c.lineWidth = 2;
      c.strokeRect(cx - 150, 30, 300, 100);

      // 添加标题文字
      c.font = "bold 20px";
      c.fillStyle = "#ffffff";
      c.textAlign = "center";
      c.fillText("当前手牌", cx, 20);

      // 预加载所有图片
      const images = await Promise.all(
        handImages.map((path) => ctx.canvas.loadImage(path))
      );

      // 先画后面的卡，再画前面的卡
      for (let i = 0; i < numCards; i++) {
        const angle = startAngle + angleStep * i;
        const radian = (angle * Math.PI) / 180;

        // 动态高度偏移创建层叠效果
        const yOffset = Math.sin((i / numCards) * Math.PI) * 20;
        const x = cx + radius * Math.cos(radian) - 15;
        const y = cy + radius * Math.sin(radian) - yOffset;

        // 保存当前状态
        c.save();

        // 移动到卡牌位置
        c.translate(x, y);

        // 稍微旋转卡牌，让它们朝向圆心
        c.rotate(radian + Math.PI / 2);

        // 添加投影
        c.shadowColor = "rgba(0, 0, 0, 0.7)";
        c.shadowOffsetX = 10;
        c.shadowOffsetY = 10;
        c.shadowBlur = 15;

        // 绘制卡牌（从中心点开始）
        c.drawImage(
          images[i],
          -cardWidth / 2, // 水平居中
          -cardHeight / 2, // 垂直居中
          cardWidth,
          cardHeight
        );

        // 还原画布状态
        c.restore();
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillStyle = "white";
        c.font = "15px";
        for (let i = 0; i < 5; i++) {
          c.fillText(`${Images[i][0]}`, width / 2, 40 + i * 20);
        }
      }

      // 添加提示文字
      c.font = "24px";
      c.fillStyle = "#ccddee";
      c.textAlign = "center";
      c.fillText("使用 1-5 数字键选择卡牌", cx, height - 40);
    });
  }
}
