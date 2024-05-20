import { $, Context, Session } from "koishi"
import { CardPlayer } from "./type"

export async function searchTarget(session: Session, ctx: Context, reTryCount = 0) {
    const [target]: CardPlayer[] = await ctx.database.get('card_battle', (row) =>
        $.and(
            $.eq(row.channel_id, ''),
            $.ne(row.id, session.userId)
        )
    )
    if (!target) {
        await ctx.sleep(1000)
        if (reTryCount > 10) {
            return null
        }
        await searchTarget(session, ctx, reTryCount + 1)
    }
    await ctx.database.set('card_battle', target.id, { target_id: session.channelId })
    await ctx.database.set('card_battle', session.userId, { target_id: target.id })
    return target
}

export async function getPlayer(session:Session,ctx:Context){
    let [player]: CardPlayer[] = await ctx.database.get('card_battle', session.userId)
    if(!player){
        player =await ctx.database.create('card_battle',{
            id:session.userId,
            channel_id:session.channelId,
            is_put:false,
            msg_id:session.messageId,
            //玩家状态，通过公式换算，暂时不写
            battle_state:{}
        })
    }
    return player
}