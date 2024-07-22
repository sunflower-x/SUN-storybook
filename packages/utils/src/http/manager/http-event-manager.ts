import { EventEmitter } from 'events';
// todo EventEmitter什么作用
/**
 * 事件监听处理函数接口
 */
export interface HttpEventHandler {
  /**
   * @param data - 消息体
   */
  (data: any): void;
}

export interface HttpEventManager {
  /**
   * 登录超时
   */
  LOGIN_TIMEOUT: string;
  /**
   * 版本不一致，强制刷新
   */
  ERROR_VERSION: string;
  /**
   * 版本不一致，可以用于用户控制逻辑
   */
  CUSTOM_ERROR_VERSION: string;
  /**
   * 用于监听特定事件
   * @param eventName -LOGIN_TIMEOUT | ERROR_VERSION | CUSTOM_ERROR_VERSION
   * @param handler - 事件监听处理函数
   */
  on(eventName: string, handler: HttpEventHandler): void;

  /**
   * 事件发送
   * @param eventName -LOGIN_TIMEOUT | ERROR_VERSION | CUSTOM_ERROR_VERSION
   * @param data - 消息体
   */
  emit(eventName: string, data: any): void;
  /**
   * 移除特定事件的所有监听器
   * @param eventName LOGIN_TIMEOUT | ERROR_VERSION | CUSTOM_ERROR_VERSION
   */
  removeAllListeners(eventName: string): void;
    /**
   * 移除特定事件的监听器
   * @param eventName LOGIN_TIMEOUT | ERROR_VERSION | CUSTOM_ERROR_VERSION
   * @param handler 需要移除的监听器
   */
    removeListener(eventName: string, handler: HttpEventHandler): void;
}

class HttpEventManagerImpl implements HttpEventManager {
    LOGIN_TIMEOUT = 'timeout';
    ERROR_VERSION = 'error_version';
    CUSTOM_ERROR_VERSION = 'custom_error_version';
  
    emitter = new EventEmitter();
  
    constructor() {
      this.emitter.setMaxListeners(5);
    }
  
    /**
     * 监听事件
     * @param eventName
     * @param handler
     */
    on(eventName: string, handler: HttpEventHandler) {
      this.emitter.on(eventName, handler);
    }
  
    /**
     * 分发事件
     * @param eventName
     * @param data
     */
    emit(eventName: string, data: any) {
      this.emitter.emit(eventName, data);
    }
  
    /**
     * 移除所有事件
     * @param eventName
     */
    removeAllListeners(eventName: string) {
      this.emitter.removeAllListeners(eventName);
    }
  
    /**
     * 移除特定事件
     * @param eventName
     * @param handler
     */
    removeListener(eventName: string, handler: HttpEventHandler) {
      this.emitter.removeListener(eventName, handler);
    }
  }

  export default new HttpEventManagerImpl() as HttpEventManager;
