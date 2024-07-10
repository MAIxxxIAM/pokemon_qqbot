import { Context } from "koishi";
import { Cry_Wav } from "./type";

export async function apply(ctx: Context) {
  ctx.command("guess_cry", "猜拟声").action(async ({ session }) => {
    const id = Math.floor(Math.random() * 420) + 1;
    const cry_song = new Cry_Wav(id, ctx, session);
  });
}
