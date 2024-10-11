import { allowed_advanced_extension_reloader_ids } from './allowed_advanced_extension_reloader_ids';

export default class Listener {
    private gl = self as any;
    private we =
        typeof this.gl.chrome !== 'undefined' && (this.gl as any).chrome.runtime
            ? this.gl.chrome
            : this.gl.browser;

    public listen = () => {
        this.we.runtime.onMessageExternal.addListener(
            (msg: any, sender: any, sendResponse: any): any => {
                const msg_str: string = msg.msg;
                const sender_is_advanced_extension_reloader_extension: boolean =
                    allowed_advanced_extension_reloader_ids.includes(sender.id);

                if (sender_is_advanced_extension_reloader_extension) {
                    if (msg_str === 'reload_extension') {
                        sendResponse(true);

                        this.we.runtime.reload();
                    } else if (msg_str === 'open_popup') {
                        sendResponse(true);

                        this.we.action.openPopup(undefined, () => {
                            // eslint-disable-next-line no-empty, prettier/prettier
                            if (this.we.runtime.lastError) {}
                        });
                    } else if (msg_str === 'check_if_popup_is_open') {
                        this.we.runtime.getContexts(
                            { contextTypes: ['POPUP'] },
                            (contexts: any) => {
                                sendResponse(contexts.length !== 0);
                            },
                        );
                    }
                }
            },
        );
    };
}
