import { RawMessage, RawText } from '@minecraft/server'
import { color } from './color'
import CommandClass from './CommandClass'

// 命令前缀（特殊符号要多加一个\转义符号在前）
export const prefix = '\\'
// 传送请求冷却时间
export const tpaCoolingTime = 30
// 欢迎语（可使用rawtext或string格式）
export const welcome: RawMessage | string = {
  rawtext: [
    {
      text: color.green('欢迎加入我们得服务器！服务器已经预装了插件。\n'),
    },
    {
      text:
        color.green(`请输入： `) +
        color.yellow(`${prefix}${CommandClass.getFunction('help')?.name}`) +
        color.green(' 获得详细信息！'),
    },
  ],
}
