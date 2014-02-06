/* global document, window */
var _ = require("lodash");

module.exports = function (options) {
	return function (done) {
		var opt = _.extend({}, options || {});

		this.on("mathjax:ready", function() {
			done();
		});

		this.evaluate(function (options) {
			(function() {
				console.log("Loading MathJax...");

				window.MathJax = options.config || {};
				window.MathJax.delayStartupUntil = "configured";
				window.MathJax.skipStartupTypeset = true;
				
				var script = document.createElement('script');
				script.src = "" + options.path + "/MathJax.js";
				script.id = "MATHJAX_INJECT";
				document.head.appendChild(script);

				var ready = null;
				var checkReady = function () {
					if (window.MathJax.isReady) {
						clearInterval(ready);
						window.callPhantom(["mathjax:ready"]);
					}
				};

				var hub = null;
				var checkHub = function () {
					if (window.MathJax.Hub != null) {
						clearInterval(hub);
						if (options.debug) {
							window.MathJax.Hub.Startup.signal.Interest(function(message) {
								return console.log("Startup: " + message);
							});
							window.MathJax.Hub.signal.Interest(function(message) {
								return console.log("Hub: " + message);
							});
						}
						window.MathJax.Hub.Configured();
						return ready = setInterval(checkReady, 50);
					}
				};

				hub = setInterval(checkHub, 50);

			})();
		}, opt);
	};
};