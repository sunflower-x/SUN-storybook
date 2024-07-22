import { Promise } from 'es6-promise';

export default class FjsPromise<T> extends Promise<T> {
  /**
   * map :: Functor f => f a ~> (a -> b) -> f b
   * @param func
   */
  map(func: (response: T) => any) {
    return new FjsPromise<T>((resolve, reject) => {
      this.then((response) => {
        resolve(func(response));
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * ap :: Apply f => f a ~> f (a -> b) -> f b
   * @param promise
   */
  ap(promise: FjsPromise<any>) {
    return this.map((func) => {
      return promise.map(func as any);
    });
  }
}