import { Player, RawMessage } from '@minecraft/server'

// import { tpaCommand,helpCommand } from './commands'

import { tpaCommand } from './commands/tpa'
import { helpCommand } from './commands/help'

export interface IFunction {
  name: string
  desc: string | RawMessage
  usage?: string | RawMessage
  handler: (sender: Player, ...args: any) => any
}

class CommandClass {
  functions = [] as IFunction[]

  constructor() {
    this.addFunction(tpaCommand)
    this.addFunction(helpCommand)
  }

  run(action: string, sender: Player, args: any[]) {
    const command = this.getFunctions().find(f => f.name === action)
    if (!command) return sender.sendMessage('未知命令')
    command.handler(sender, args.join(' '))
  }

  addFunction({ name, desc, usage, handler }: IFunction) {
    this.functions.push({ name, desc, usage, handler })
  }

  removeFunction(name: string) {
    this.functions = this.functions.filter(f => f.name !== name)
  }

  getFunction(name: string) {
    return this.functions.find(f => f.name === name)
  }

  getFunctions() {
    return this.functions
  }
}

export default new CommandClass()
