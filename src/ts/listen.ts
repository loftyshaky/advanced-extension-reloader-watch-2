export default () => {
    const we =
        typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime
            ? (window as any).chrome
            : (window as any).browser;
    const advanced_extension_reloader_id = 'u6Pgzb39sN0';

    we.runtime.onMessageExternal.addListener((msg: any, sender: any, sendResponse: any): any => {
        const msg_str: string = msg.msg;

        if (msg_str === `reload_extension_${advanced_extension_reloader_id}`) {
            sendResponse(`reload_triggered_${advanced_extension_reloader_id}`);

            we.runtime.reload();
        }
    });
};
