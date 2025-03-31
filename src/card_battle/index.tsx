import { $, Context, Element } from "koishi";
import { CardPlayer, Enemy, HealItemType } from "./type";
import { initType } from "./method";
import { Robot } from "../utils/robot";

export async function apply(ctx: Context) {
  ctx.command("card-battle", "卡牌对战").action(async ({ session }) => {
    const a = new Robot(100);
    a.itemBag = [
      {
        name: "毒药",
        type: "poison",
        level: 2,
      },
    ];
    const a1: CardPlayer = new CardPlayer(a);

    a1.drawHand(5);
    let playerHand: [string, Element, number][] = [];
    for (let i = 0; i < a1.currentHand.length; i++) {
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
    const width = 1000; // 适应高清画布
    const height = 500 * 2 + (Math.ceil(Images.length / 3) - 2) * 422;
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

      // 网格布局参数
      const cardsPerRow = 3; // 每行显示3张卡片
      const horizontalGap = 40; // 卡片之间的水平间距
      const verticalGap = 20; // 卡片之间的垂直间距

      // 计算卡片尺寸
      const totalCardWidth = width * 0.85; // 卡片区域占画布90%宽度
      const cardWidth =
        (totalCardWidth - horizontalGap * (cardsPerRow - 1)) / cardsPerRow;
      const cardAspect = 670 / 445;
      const cardHeight = cardWidth * cardAspect;

      // 计算左边距，使卡片水平居中
      const leftMargin = (width - totalCardWidth) / 2;

      const cx = width / 2;

      // // 添加表格区域
      // c.fillStyle = "rgba(20, 40, 80, 0.6)";
      // c.fillRect(cx - 150, 30, 300, 100);
      // c.strokeStyle = "#4a5b6c";
      // c.lineWidth = 2;
      // c.strokeRect(cx - 150, 30, 300, 100);

      // 添加标题文字
      c.font = "bold 50px";
      c.fillStyle = "#ffffff";
      c.textAlign = "center";
      c.fillText("当前手牌", cx, 80);

      // 预加载所有图片
      const images = await Promise.all(
        handImages.map((path) => ctx.canvas.loadImage(path))
      );

      // 绘制卡片
      for (let i = 0; i < numCards; i++) {
        // 计算行和列索引
        const row = Math.floor(i / cardsPerRow);
        const col = i % cardsPerRow;

        // 计算卡片位置
        const x = leftMargin + col * (cardWidth + horizontalGap);
        const y = 120 + row * (cardHeight + verticalGap);

        // 保存当前状态
        c.save();

        // 添加投影
        c.shadowColor = "rgba(0, 0, 0, 0.7)";
        c.shadowOffsetX = 5;
        c.shadowOffsetY = 5;
        c.shadowBlur = 10;

        // 绘制卡牌
        c.drawImage(images[i], x, y, cardWidth, cardHeight);

        // 还原画布状态
        c.restore();
      }

      // 绘制卡片信息
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "white";
      c.font = "15px";
      // for (let i = 0; i < 5; i++) {
      //   c.fillText(`${Images[i][0]} 🌟${Images[i][2]}`, width / 2, 40 + i * 20);
      // }

      // 添加提示文字
      c.font = "24px";
      c.fillStyle = "#ccddee";
      c.textAlign = "center";
      c.fillText("使用 1-5 数字键选择卡牌", cx, height - 40);
    });
  }
}
