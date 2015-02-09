/**
 * Store
 *
 * Stores hold application state. They respond to actions sent by the dispatcher
 * and broadcast change events to listeners, so they can grab the latest data.
 * The key thing to remember is that the only way stores receive information
 * from the outside world is via the dispatcher.
 */

'use strict';

import EventEmitter from 'eventemitter3';
import assign from 'object-assign';

export default class Store extends EventEmitter {

  /**
   * Stores are initialized with a reference
   * @type {Object}
   */
  constructor() {
    this.state = undefined;

    this._handlers = {};
  }

  /**
   * Return a (shallow) copy of the store's internal state, so that it is
   * protected from mutation by the consumer.
   * @returns {object}
   */
  getState() {
    return assign({}, this.state);
  }

  setState(newState) {
    if (typeof this.state === 'undefined') this.state = {};

    if (this._isHandlingDispatch) {
      this._pendingState = assign(this._pendingState, newState);
      this._emitChangeAfterHandlingDispatch = true;
    } else {
      console.warn(
        'Store#setState() called from outside an action handler. This is likely '
      + 'a mistake. Flux stores should manage their own state.'
      );

      this.state = assign({}, this.state, newState);
      this.emit('change');
    }
  }

  replaceState(newState) {
    if (typeof this.state === 'undefined') this.state = {};

    if (this._isHandlingDispatch) {
      this._pendingState = assign({}, newState);
      this._emitChangeAfterHandlingDispatch = true;
    } else {
      this.state = assign({}, newState);
      this.emit('change');
    }
  }

  register(actionId, handler) {

    if (typeof actionId === 'function') actionId = actionId._id;

    this._handlers[actionId] = handler.bind(this);
  }

  waitFor(tokensOrStores) {
    this._waitFor(tokensOrStores);
  }

  handler(payload) {
    this._isHandlingDispatch = true;
    this._pendingState = assign({}, this.state);
    this._emitChangeAfterHandlingDispatch = false;

    try {
      let { body, actionId } = payload;

      let _handler = this._handlers[actionId];

      if (typeof _handler !== 'function') return;

      _handler(body, actionId);
    } finally {

      if (this._emitChangeAfterHandlingDispatch) {
        this.state = this._pendingState;
        this.emit('change');
      }

      this._isHandlingDispatch = false;
      this._pendingState = {};
      this._emitChangeAfterHandlingDispatch = false;
    }
  }
}
