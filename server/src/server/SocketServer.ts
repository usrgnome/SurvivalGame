import { App, TemplatedApp } from "uWebSockets.js";
import GameServer from "./GameServer";
import { clientDebugLogger, logger, loggerLevel } from "./Logger";

export class SocketServer {
    server: TemplatedApp;
    constructor(port: number, gameServer: GameServer) {
        this.server = App().ws("/*", {
            open(ws) {
                // if socket is added to the game, ws.client will become valid
                gameServer.addClient(ws);
            },
            close(ws, code, message) {
                if (ws.client)
                    ws.client.onSocketClose(code, message);
            },
            message(ws, message, isBinary) {
                if (ws.client)
                    ws.client.onSocketMessage(message, isBinary);
            },
            upgrade(res, req, context) {
                // log some connection info to help debug
                const headerObject: any = {};
                req.forEach((header, value) => headerObject[header] = value);
                headerObject['url'] = req.getUrl();
                clientDebugLogger.log(loggerLevel.info, JSON.stringify(headerObject));

                res.upgrade({
                    url: req.getUrl()
                },
                    /* Spell these correctly */
                    req.getHeader('sec-websocket-key'),
                    req.getHeader('sec-websocket-protocol'),
                    req.getHeader('sec-websocket-extensions'),
                    context);
            },
        }).listen(port, (listenSocket) => {
            if (listenSocket)
                logger.log(loggerLevel.info, `GameServer: listening on port: ${port}`);
            else
                logger.log(loggerLevel.error, `GameServer: error on port: ${port}`);
        });
    }
}