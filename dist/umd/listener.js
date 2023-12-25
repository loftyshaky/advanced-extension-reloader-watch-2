(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Listener = factory());
})(this, (function () { 'use strict';

    class Listener {
        constructor() {
            this.gl = self;
            this.we = typeof this.gl.chrome !== 'undefined' && this.gl.chrome.runtime
                ? this.gl.chrome
                : this.gl.browser;
            this.advanced_extension_reloader_id = 'u6Pgzb39sN0';
            this.listen = () => {
                this.we.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
                    const msg_str = msg.msg;
                    if (msg_str === `reload_extension_${this.advanced_extension_reloader_id}`) {
                        sendResponse(`reload_triggered_${this.advanced_extension_reloader_id}`);
                        this.we.runtime.reload();
                    }
                });
            };
        }
    }

    return Listener;

}));
