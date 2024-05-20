import { Session } from "koishi"

export interface CardPlayer {
    id: string
    channel_id: string
    target_id: string
    is_put: boolean
    battle_state:BattleState
    msg_id: string
} 

export interface BattleState{

}