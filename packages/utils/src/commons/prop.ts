import { curry } from 'ramda';

export interface Prop1 {
  /**
   * 获取对象指定属性的值
   * @param defaultValue 默认值
   * @return (matchValues:any[], key:string | number, object:any | null | undefined) => any | null | undefined
   * matchValues 当结果为matchValues制定的值时，结果返回defaultValue
   * key 对象属性，支持.运算符，例如'resultObject.itemList'
   * object 查询对象
   */
  (defaultValue: any): (
    matchValues: any[],
    key: string | number,
    object: any | null | undefined
  ) => any | null | undefined;
}

export interface Prop2 {
  /**
   * 获取对象指定属性的值
   * @param defaultValue 默认值
   * @param matchValues 当结果为matchValues制定的值时，结果返回defaultValue
   * @return (key:string | number, object:any | null | undefined) => any | null | undefined
   * key 对象属性，支持.运算符，例如'resultObject.itemList'
   * object 查询对象
   */
  (defaultValue: any, matchValues: any[]): (
    key: string | number,
    object: any | null | undefined
  ) => any | null | undefined;
}

export interface Prop3 {
  /**
   * 获取对象指定属性的值
   * @param defaultValue 默认值
   * @param matchValues 当结果为matchValues制定的值时，结果返回defaultValue
   * @param key 对象属性，支持.运算符，例如'resultObject.itemList'
   * @return (object:any | null | undefined) => any | null | undefined
   * object 查询对象
   */
  (defaultValue: any, matchValues: any[], key: string | number): (
    object: any | null | undefined
  ) => any | null | undefined;
}

export interface Prop4 {
  /**
   * 获取对象指定属性的值
   * @param defaultValue 默认值
   * @param matchValues 当结果为matchValues制定的值时，结果返回defaultValue
   * @param key 对象属性，支持.运算符，例如'resultObject.itemList'
   * @param object 查询对象
   */
  (defaultValue: any, matchValues: any[], key: string | number, object: any | null | undefined):
    | any
    | null
    | undefined;
}

export type Prop = Prop1 & Prop2 & Prop3 & Prop4;

/**
 * 获取对象指定属性的值
 * @param defaultValue 默认值
 * @param matchValues 当结果为matchValues制定的值时，结果返回defaultValue
 * @param key 对象属性，支持.运算符，例如'resultObject.itemList'
 * @param object 查询对象
 */
export default curry(function prop(
  defaultValue: any,
  matchValues: any[],
  key: string | number,
  object: any | null | undefined
): any | null | undefined {
  if (object == null || object == undefined) {
    return defaultValue;
  }

  //获取属性值("a", "a.b.c")
  const keys: string[] = key.toString().split('.');
  let targetValue: any = object;
  for (let k of keys) {
    targetValue = targetValue[k];
    if (!targetValue || typeof targetValue == 'undefined') {
      break;
    }
  }

  //匹配默认值
  for (let matchValue of matchValues) {
    if (matchValue == targetValue) {
      return defaultValue;
    }
  }

  return targetValue;
});
