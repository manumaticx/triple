var constants = require('constants'),
	util = require('util');

function ReplClient(handler) {
	var self = this;

	// create Titanium socket for client
	self.socket = Ti.Network.Socket.createTCP({
		host: constants.HOST,
		port: constants.PORT,

		// handle socket errors
		error: function(err) {

			// print error back to console
			self.write(util.error('socket error: ' + err.toString()));

			// close connection if still open
			if (self.state === Ti.Network.Socket.CONNECTED) {
				self.close();
			}
		},

		// handle initial connection
		connected: function() {

			// pump all readable data from socket
			Ti.Stream.pump(self.socket, function(e) {
				if (e.bytesProcessed === -1 || !e.buffer) {
					self.write(util.error('socket error: empty buffer, try again'));
				} else {
					handler.call(self, e.buffer.toString());
				}
			}, 1024, true);

			// tell server we're ready by sending back the resources directory
			self.write(JSON.stringify({
				resourcesDir: Ti.Filesystem.resourcesDirectory
			}), { eom: false });
		}
	});
}

ReplClient.prototype.write = function write(data, opts) {
	opts = opts || {};
	var eom = opts.eom === false ? '' : constants.EOM;
	Ti.Stream.write(this.socket, Ti.createBuffer({ value: data + eom }), function(){});
};

ReplClient.prototype.connect = function connect() {
	this.socket.connect();
}

module.exports = ReplClient;

