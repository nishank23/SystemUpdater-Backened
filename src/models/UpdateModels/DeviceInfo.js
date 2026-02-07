const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeviceInfoSchema = new Schema({
    appVersion: String,
    osVersion: String,
    imei: String,
    serialNumber: String,
    model: String,
    currentDateTimeGMT: String,
    updateGroup: String,
    newWonderOSVersion: String
});

module.exports = mongoose.model('DeviceInfo', DeviceInfoSchema);
