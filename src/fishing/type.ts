export enum Rarity {
    Common = 60,
    Uncommon = 30,
    Rare = 8,
    Exotic = 1,
    legendaryPokemon = 0.99
}

export enum Lucky {
    '普通鱼饵' = 0,
    '高级鱼饵' = 0.5
}

export interface FishItem {
    name: string[]
    legendaryPokemon: boolean
    rarity: Rarity
    points: number
    reelInTime: number
}

export class FishingGame {
    items: FishItem[]

    constructor(items: FishItem[]) {
        this.items = items
    }

    fish(lucky:Lucky,Merits:number): FishItem{
        const roll = Math.random() * 100
        let cumulativeProbability = - (Merits*0.04+lucky)

        for (const item of this.items) {
            let add=item.rarity==60?item.rarity-2*(Merits * 0.04 + lucky):item.rarity+0.5*(Merits * 0.04 + lucky)
            add=item.rarity==0.99?add+0.5*(Merits * 0.04 + lucky):add
            cumulativeProbability +=add
            if (roll < cumulativeProbability) {
                const reelInTime = Math.floor(Math.random() * 5000)+5000
                item.reelInTime = reelInTime
                return item
            }
        }

        return null
    }
}