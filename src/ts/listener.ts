export default class Listener {
    private gl = typeof window === 'undefined' ? global : window;
    private we =
        typeof (this.gl as any).chrome !== 'undefined' && (this.gl as any).chrome.runtime
            ? (this.gl as any).chrome
            : (this.gl as any).browser;
    private advanced_extension_reloader_id: string = 'u6Pgzb39sN0';

    public listen = () => {
        this.we.runtime.onMessageExternal.addListener(
            (msg: any, sender: any, sendResponse: any): any => {
                const msg_str: string = msg.msg;

                if (msg_str === `reload_extension_${this.advanced_extension_reloader_id}`) {
                    sendResponse(`reload_triggered_${this.advanced_extension_reloader_id}`);

                    this.we.runtime.reload();
                }
            },
        );
    };
}
