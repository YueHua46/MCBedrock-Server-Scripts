import { RawMessage } from '@minecraft/server'
import { color } from './color'
import { prefix } from './config'
import commandClass from './CommandClass'

export const welcome: RawMessage = {
  rawtext: [
    {
      text: color.green('欢迎加入我们得服务器！服务器已经预装了插件。\n'),
    },
    {
      text:
        color.green(`请输入： `) +
        color.yellow(`${prefix}${commandClass.getFunction('help')?.name}`) +
        color.green(' 获得详细信息！'),
    },
  ],
}
