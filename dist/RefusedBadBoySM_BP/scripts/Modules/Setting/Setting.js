import { Database } from '../Database';
class ServerSetting {
  constructor(db = new Database('setting')) {
    this.db = db;
  }
  turnOn(module) {
    console.log(`Turn on ${module}`);
    this.db.set(module, true);
  }
  turnOff(module) {
    console.log(`Turn off ${module}`);
    this.db.set(module, false);
  }
  init() {
    this.db.set('player', true);
    this.db.set('land', true);
    this.db.set('wayPoint', true);
    this.db.set('other', true);
    this.db.set('help', true);
    this.db.set('sm', true);
    this.db.set('setting', true);
  }
  getState(module) {
    if (this.db.get(module) === undefined) this.init();
    return this.db.get(module);
  }
}
export default new ServerSetting();
