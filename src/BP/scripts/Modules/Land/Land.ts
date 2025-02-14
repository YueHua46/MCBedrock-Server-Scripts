import { Block, BlockVolume, BlockVolumeBase, Entity, Player, system, Vector3, world } from '@minecraft/server'
import { Database } from '../Database'
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data'
import Setting from '../System/Setting'
import { SystemLog } from '../../Utils/utils'

export interface ILand {
  name: string
  owner: string
  members: string[]
  dimension: MinecraftDimensionTypes
  public_auth: {
    break: boolean
    place: boolean
    useBlock: boolean
    isChestOpen: boolean
    useEntity: boolean
    useButton: boolean
    explode: boolean
    burn: boolean
  }
  // 领地公开权限的配置权限
  config_public_auth: {
    break: boolean
    place: boolean
    useBlock: boolean
    isChestOpen: boolean
    useEntity: boolean
    useButton: boolean
    explode: boolean
    burn: boolean
  }
  vectors: {
    start: Vector3
    end: Vector3
  }
}
/**
 * Land module
 */
class Land {
  db: Database<ILand>
  constructor() {
    this.db = new Database<ILand>('LandDB')
  }
  createVector3(str: string): string | Vector3 {
    const [x, y, z] = str.split(' ').map(Number)
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      return '坐标格式错误'
    }
    return {
      x,
      y,
      z,
    }
  }
  addLand(land: ILand) {
    if (this.db.has(land.name)) return '领地名冲突，已存在，请尝试其他领地名称'
    if (this.checkOverlap(land)) return '领地重叠，请重新设置领地范围'
    return this.createLand(land)
  }
  getLand(name: string) {
    if (!this.db.has(name)) return '领地不存在'
    return this.db.get(name)
  }
  removeLand(name: string) {
    if (!this.db.has(name)) return '领地不存在'
    return this.db.delete(name)
  }
  getLandList() {
    return this.db.getAll()
  }
  setLand(name: string, land: ILand) {
    if (!this.db.has(name)) return '领地不存在'
    return this.db.set(name, land)
  }
  addMember(name: string, member: string) {
    if (!this.db.has(name)) return '领地不存在'
    const land = this.db.get(name) as ILand
    if (land.members.includes(member)) return '成员已存在'
    land.members.push(member)
    return this.db.set(name, land)
  }
  removeMember(name: string, member: string) {
    if (!this.db.has(name)) return '领地不存在'
    const land = this.db.get(name) as ILand
    if (!land.members.includes(member)) return '成员不存在'
    land.members = land.members.filter(m => m !== member)
    return this.db.set(name, land)
  }
  setPublicAuth(name: string, auth: ILand['public_auth']) {
    if (!this.db.has(name)) return '领地不存在'
    const land = this.db.get(name) as ILand
    land.public_auth = auth
    return this.db.set(name, land)
  }
  // 检查领地是否重叠
  checkOverlap(land: ILand) {
    const lands = this.db.getAll()
    let isOverlap = false
    const landArea = new BlockVolume(land.vectors.start, land.vectors.end)
    for (const key in lands) {
      if (land.dimension !== lands[key].dimension) continue
      const area = new BlockVolume(lands[key].vectors.start, lands[key].vectors.end)
      if (landArea.doesVolumeTouchFaces(area)) {
        isOverlap = true
      }
    }
    return isOverlap
  }
  isInsideLand(location: Vector3, land: ILand) {
    const isInside =
      Math.round(location.x) >= Math.min(land.vectors.start.x, land.vectors.end.x) &&
      Math.round(location.x) <= Math.max(land.vectors.start.x, land.vectors.end.x) &&
      Math.round(location.y) >= Math.min(land.vectors.start.y, land.vectors.end.y) - 1 &&
      Math.round(location.y) <= Math.max(land.vectors.start.y, land.vectors.end.y) &&
      Math.round(location.z) >= Math.min(land.vectors.start.z, land.vectors.end.z) &&
      Math.round(location.z) <= Math.max(land.vectors.start.z, land.vectors.end.z)

    return { isInside, insideLand: land }
  }
  // 检查某个坐标是否在某个领地内
  testLand(location: Vector3, dimension: MinecraftDimensionTypes | string) {
    const lands = this.db.values()
    const land = lands.find(land => {
      if (land.dimension != dimension) return false
      return this.isInsideLand(location, land).isInside
    })

    return land
      ? {
          isInside: true,
          insideLand: land,
        }
      : {
          isInside: false,
          insideLand: null,
        }
  }
  // 获取所有有领地的玩家
  getLandPlayers() {
    return Array.from(new Set(Object.values(this.db.getAll()).map(land => land.owner)))
  }

  // 获取指定玩家的所有领地
  getPlayerLands(playerName: string) {
    return Object.values(this.db.getAll()).filter(land => land.owner === playerName)
  }
  // 领地转让
  transferLand(name: string, playerName: string) {
    if (!this.db.has(name)) return '领地不存在'
    const land = this.db.get(name) as ILand
    land.owner = playerName
    return this.db.set(name, land)
  }
  // 计算两个坐标点之间的方块数量
  private calculateBlockCount(start: Vector3, end: Vector3): number {
    const bv = new BlockVolume(start, end)
    return bv.getCapacity()
  }

  // 创建领地时添加方块数量验证
  createLand(landData: ILand): string | boolean {
    // 获取领地方块上限
    const maxLandBlocks = Number(Setting.getState('maxLandBlocks') || '30000')
    // 计算领地方块数量
    const blockCount = this.calculateBlockCount(landData.vectors.start, landData.vectors.end)
    // 验证方块数量是否超过上限
    if (blockCount > maxLandBlocks) {
      return `领地方块数量(${blockCount})超过上限(${maxLandBlocks})，请重新设置领地。确保其不超过系统设置方块上限\n管理员可通过 【服务器设置】 -> 【通用系统设置】 -> 【设置领地方块上限】 来更改上限`
    }

    // 其他验证逻辑...

    // 保存领地数据
    this.db.set(landData.name, landData)
    return true
  }
}

export default new Land()
