/* global document, window */

module.exports = function (options) {
	return function (done) {

		this.on("mathjax:ready", function() {
			done();
		});

		this.evaluate(function (options) {
			(function() {
				console.log("Loading MathJax...");

				window.MathJax = options.config || {};
				window.MathJax.delayStartupUntil = "configured";
				window.MathJax.skipStartupTypeset = true;
				
				// Inject script tags to head.
				// Pad it with identifiable script tags.
				var begin = document.createElement('script');
				begin.type = "mathjax/begin";
				document.head.appendChild(begin);

				var script = document.createElement('script');
				script.src = options.url ? options.url : "http://cdn.mathjax.org/mathjax/latest/MathJax.js";
				document.head.appendChild(script);

				var end = document.createElement('script');
				end.type = "mathjax/end";
				document.head.appendChild(end);

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
		}, options || {});
	};
};
