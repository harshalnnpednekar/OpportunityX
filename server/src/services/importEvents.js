const EventEmitter = require('events');

class ImportEventEmitter extends EventEmitter {}

// Singleton event emitter for data ingestion lifecycle events
const importEvents = new ImportEventEmitter();

// Set sensible max listeners
importEvents.setMaxListeners(25);

module.exports = importEvents;
