const WebSocket = require("ws");

class WebSocketNotifier {
  constructor() {
    this.clients = [];
    this.wss = null;
  }

  startServer(port) {
    this.wss = new WebSocket.Server({ port });
    console.log(`WebSocket server started on port ${port}`);

    this.wss.on("connection", (ws) => {
      console.log("Client connected");
      this.clients.push(ws);

      ws.on("close", () => {
        console.log("Client disconnected");
        this.clients = this.clients.filter((client) => client !== ws);
      });
    });
  }

  notifyClients(message) {
    const notification = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("something");
        // client.send(notification);
      }
    });
  }
}

module.exports = WebSocketNotifier;
