// 经济系统
/**
 * 金币获取方式
 *  1. 击杀怪物，按照对应怪物获得不同区间的击杀金币奖励
 *  2. 玩家交易，玩家之间可以进行交易，作为卖方，将会按照交易金额来获得金币
 *  3. 出售物品，玩家可以出售物品，按照物品的价格获得对应金币奖励
 * 金币消耗方式
 *  1. 申请领地时，按照每个领地格子10金币来收取（每格多少金币可配置）'
 *  2. 玩家交易，玩家之间可以进行交易，作为买方，将会按照交易金额来消耗金币
 *  3. 商店，玩家可以在商店购买管理员上架的物品，按照购买物品的价格消耗金币
 */

import { Entity, Player } from '@minecraft/server'
import { Database } from '../Database'

export interface IUserWallet {
  name: string
  gold: number
}

export interface IMonster {
  name: string
  gold: number
}

export interface ISellItem {
  name: string
  gold: number
}

class Economic {
  private static instance: Economic
  private walletDB: Database<IUserWallet>
  private monsterDB: Database<IMonster>
  private sellItemDB: Database<ISellItem>
  private constructor() {
    this.walletDB = new Database<IUserWallet>('WalletDB')
    this.monsterDB = new Database<IMonster>('MonsterDB')
    this.sellItemDB = new Database<ISellItem>('SellItemDB')
  }
  public static getInstance(): Economic {
    if (!Economic.instance) {
      Economic.instance = new Economic()
    }
    return Economic.instance
  }
  public getGoldByKillMonster(player: Player, monster: Entity) {
    const gold = 0
    return gold
  }
}
