import ReconnectingWebSocket from "reconnecting-websocket";

export function createWS(url: string) {
    const ws = new ReconnectingWebSocket(url, [], { maxReconnectionDelay: 8000, minReconnectionDelay: 500, reconnectionDelayGrowFactor: 1.5 });
    let handler: ((data: any) => void) | null = null;
    ws.addEventListener("message", ev => {
        try {
            const data = JSON.parse(ev.data as string);
            handler && handler(data);
        } catch { }
    });
    return {
        onMessage(fn: (data: any) => void) {
            handler = fn;
        },
        close() {
            ws.close();
        }
    };
}
