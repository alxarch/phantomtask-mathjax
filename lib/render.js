/* global document, window */
module.exports = function (options) {
	return function (done) {
		this.on("mathjax:end", function () {
			done();
		});
		this.evaluate(function (options) {
			(function() {
				var target = document.getElementById(options.id) || document.body;
				window.MathJax.Hub.Register.MessageHook("End Process", function() {
					window.callPhantom(["mathjax:end"]);
				});
				console.log("Rendering math...");
				window.MathJax.Hub.Typeset(target);
			})();
		}, options);
	};
};
