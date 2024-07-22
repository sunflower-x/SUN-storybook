import { HttpRequestOptions } from './request';
import FjsPromise from '../../commons/promise';

export interface Queue {
  enqueue<T>(options: HttpRequestOptions): FjsPromise<T>;
}