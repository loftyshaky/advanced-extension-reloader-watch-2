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

export { Listener as default };
