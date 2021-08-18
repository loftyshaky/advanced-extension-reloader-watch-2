'use strict';

const chrome = {runtime: {id: 1}};

var listen = () => {
    const we = typeof global.chrome !== 'undefined' && global.chrome.runtime
        ? global.chrome
        : global.browser;
    const advanced_extension_reloader_id = 'u6Pgzb39sN0';
    we.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
        const msg_str = msg.msg;
        if (msg_str === `reload_extension_${advanced_extension_reloader_id}`) {
            sendResponse(`reload_triggered_${advanced_extension_reloader_id}`);
            we.runtime.reload();
        }
    });
};

module.exports = listen;
