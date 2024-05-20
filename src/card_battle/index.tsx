import { $, Context } from "koishi";
import { CardPlayer } from "./type";
import { getPlayer, searchTarget } from "./method";

export async function apply(ctx:Context) {
    await ctx.database.remove('card_battle',(row)=>
    $.eq(row.channel_id,'')
    )
    ctx.command('宝可梦').subcommand('地牢对战')
    .action(async ({ session }) => {
        const {userId,channelId} = session
        const player: CardPlayer= await getPlayer(session,ctx)
        const targetPlayer: CardPlayer = await searchTarget(session,ctx)
        if(!targetPlayer){
            ctx.setTimeout( async()=>{
                const targetPlayer: CardPlayer = await getPlayer(session,ctx)
                if(!targetPlayer.target_id){
                    await ctx.database.remove('card_battle',userId)
                    return <message>未找到对手，稍后再试</message>
                }
            },10000)
            return <message>未找到对手，10秒内在尝试为你匹配</message>
        }
    })
}