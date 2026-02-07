const mongoose = require("mongoose");
const WebSocketNotifier = require("./webSocketNotifier");

// Initialize the WebSocketNotifier
const notifier = new WebSocketNotifier();
notifier.startServer(8080); // Start WebSocket server on port 8080

// Monitor changes in the Update and Channel collections
async function monitorUpdates() {
  try {
    // Watch the Update collection
    const updateCollection = mongoose.connection.collection("updates");
    const updateChangeStream = updateCollection.watch();

    updateChangeStream.on("change", (change) => {
      if (
        change.operationType === "insert" ||
        change.operationType === "update" ||
        change.operationType === "delete"
      ) {
        console.log(`Update Change detected: ${change.operationType}`);

        // Notify clients to re-fetch the latest updates
        notifier.notifyClients({
          message: "updateChanged",
          details: {
            updateId: change.documentKey._id,
          },
        });
      }
    });

    // Watch the Channel collection
    const channelCollection = mongoose.connection.collection("channels");
    const channelChangeStream = channelCollection.watch();

    channelChangeStream.on("change", (change) => {
      if (
        change.operationType === "insert" ||
        change.operationType === "update" ||
        change.operationType === "delete"
      ) {
        console.log(`Channel Change detected: ${change.operationType}`);

        // If serialNumbers field is modified, notify clients
        if (
          change.operationType === "update" &&
          change.updateDescription.updatedFields.serialNumbers
        ) {
          console.log(
            `SerialNumbers field updated for Channel: ${change.documentKey._id}`
          );

          notifier.notifyClients({
            message: "serialNumbersChanged",
            details: {
              channelId: change.documentKey._id,
              modifiedSerialNumbers:
                change.updateDescription.updatedFields.serialNumbers,
            },
          });
        } else {
          // For other changes in the channel (like creation or deletion), notify clients to re-fetch the latest channel information
          notifier.notifyClients({
            message: "channelChanged",
            details: {
              channelId: change.documentKey._id,
            },
          });
        }
      }
    });
  } catch (error) {
    console.error("Error monitoring updates and channels:", error);
  }
}

module.exports = monitorUpdates;
