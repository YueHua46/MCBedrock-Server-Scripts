import { Player } from '@minecraft/server'
import commandClass, { IFunction } from '../CommandClass'
import { color } from '../color'
import { prefix } from '../config'

export const helpCommand = {
  name: 'help',
  desc: '获得帮助菜单',
  usage: 'help',
  handler: help,
} as IFunction

function help(sender: Player) {
  const functions = commandClass.getFunctions()
  const helpMessage = functions
    .map(f => `${color.yellow(f.name)} - ${color.green(`${prefix}${f.usage}`)} - ${color.yellow(f.desc)}`)
    .join('\n')
  sender.sendMessage(helpMessage)
}
