export default () => {
    const we =
        typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime
            ? (window as any).chrome
            : (window as any).browser;

    we.runtime.onMessageExternal.addListener((msg: any): void => {
        const msg_str: string = msg.msg;
        if (msg_str === 'reload_extension_u6Pgzb39sN0') {
            we.runtime.reload();
        }
    });
};
