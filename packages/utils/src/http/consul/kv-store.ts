const ExpiredTime = 30 * 1000;

export class KVStore {
  _store: any = {};

  get(key: string) {
    const value = this._store[key];
    if (value) {
      if (value.expire > new Date().getTime()) {
        return value.value;
      }
    }
    this.set(key);
    return null;
  }

  set(key: string, value?: any) {
    if (typeof value !== 'undefined') {
      value = {
        expire: new Date().getTime() + ExpiredTime,
        value,
      };
      this._store[key] = value;
    }
  }
}

export default new KVStore();
