import { Context, Session } from "koishi";
import { DigMine, StoneType } from "./type";
import { DigChannel } from "../model";
import { testcanvas } from "..";
import { resolve } from 'path'
import { getMinePosition, mudPath } from "../utils/mothed";

export async function apply(ctx: any) {
    ctx.command('testdig [position:text]').action(async ({ session },position:string) => {
        const [digGames]: DigChannel[] = await ctx.database.get('pokemon.digChannel', session.channelId)
        if ((digGames?.channelCD.getTime() + 2 * 1000) > new Date().getTime()) {
            return '发掘冷却中'
        }
        const digGame = new DigMine(digGames?.digGames)
        console.log(digGame)
        const mineBack=await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/digGame/miningbg.png`)}`)
        const fissureMud=await ctx.canvas.loadImage(mudPath('fissureMud'))
        const mud=await ctx.canvas.loadImage(mudPath('mud'))
        const fissureStone=await ctx.canvas.loadImage(mudPath('fissureStone'))
        const stone=await ctx.canvas.loadImage(mudPath('stone'))
        const hardStone=await ctx.canvas.loadImage(mudPath('hardStone'))
        const largeStone=await ctx.canvas.loadImage(mudPath('largeStone'))
        const empty=await ctx.canvas.loadImage(mudPath('empty'))
        const stoneList={fissureMud,mud,fissureStone,stone,hardStone,largeStone,empty}
        if (!digGames) {
            await ctx.database.create('pokemon.digChannel', {
                id: session.channelId,
                digGames: digGame,
                channelCD: new Date(0),
            })
        }
        if(!position||!digGames){
            const dataUrl=await ctx.canvas.render(550,384,async (ctx)=>{
                ctx.drawImage(mineBack,0,0,550,384)
                for (let i = 0; i < 13; i++) {
                    for (let j = 0; j < 10; j++) {
                        ctx.drawImage(stoneList[StoneType[digGame.grid[i][j]]],i*32+39,j*32+64,32,32)
                    }
                }
            })
            const { src } = dataUrl.attrs
            return dataUrl
        }
        const P=getMinePosition(position)
        console.log(P)
        digGame.dig(P[0],P[1],2)
        console.log(digGame)
        const dataUrl=await ctx.canvas.render(550,384,async (ctx)=>{
            ctx.drawImage(mineBack,0,0,550,384)
            for (let i = 0; i < 13; i++) {
                for (let j = 0; j < 10; j++) {
                    ctx.drawImage(stoneList[StoneType[digGame.grid[i][j]]],i*32+39,j*32+64,32,32)
                }
            }
        
        })
        const { src } = dataUrl.attrs
        await ctx.database.set('pokemon.digChannel', session.channelId, row => ({
            digGames: digGame,
            channelCD: new Date(),
        }))
        if(digGame.item.x===P[0]&&digGame.item.y===P[1]&&digGame.grid[P[0]][P[1]]==0){
            return `你挖到了${digGame.item.name}`
        }
        return dataUrl

    })
}