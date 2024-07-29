import { Database } from '../Database'

export type IModules = 'player' | 'land' | 'wayPoint' | 'other' | 'help' | 'sm' | 'setting'

class ServerSetting {
  constructor(private readonly db: Database = new Database<boolean>('setting')) {}
  turnOn(module: IModules) {
    console.log(`Turn on ${module}`)
    this.db.set(module, true)
  }
  turnOff(module: IModules) {
    console.log(`Turn off ${module}`)
    this.db.set(module, false)
  }
  init() {
    this.db.set('player', true)
    this.db.set('land', true)
    this.db.set('wayPoint', true)
    this.db.set('other', true)
    this.db.set('help', true)
    this.db.set('sm', true)
    this.db.set('setting', true)
  }
  getState(module: IModules) {
    if (this.db.get(module) === undefined) this.init()
    return this.db.get(module)
  }
}

export default new ServerSetting()
