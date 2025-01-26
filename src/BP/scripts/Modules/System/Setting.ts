import { SystemLog } from '../../Utils/utils'
import { Database } from '../Database'
import './Events'

export type IModules =
  | 'player'
  | 'land'
  | 'wayPoint'
  | 'other'
  | 'help'
  | 'sm'
  | 'setting'
  | 'killItem'
  | 'killItemAmount'
  | 'randomTpRange'

class ServerSetting {
  MAX_ITEMS = '1500'
  RANDOM_TP_RANGE = '50000'
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
    this.db.set('killItem', true)
    this.db.set('killItemAmount', this.MAX_ITEMS)
    this.db.set('randomTpRange', this.RANDOM_TP_RANGE)
  }
  getState(module: IModules) {
    if (this.db.get(module) === undefined) this.init()
    return this.db.get(module)
  }
  setState(module: IModules, state: boolean | string) {
    SystemLog('setState enter')
    SystemLog('module -->' + module)
    SystemLog('state -->' + state)
    this.db.set(module, state)
  }
}

export default new ServerSetting()
