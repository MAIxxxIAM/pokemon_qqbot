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

    fish(lucky:Lucky): FishItem{
        const roll = Math.random() * (100-lucky)+lucky
        let cumulativeProbability = 0

        for (const item of this.items) {
            cumulativeProbability += item.rarity
            if (roll < cumulativeProbability) {
                const reelInTime = Math.floor(Math.random() * 5000)+5000
                item.reelInTime = reelInTime
                return item
            }
        }

        return null
    }
}