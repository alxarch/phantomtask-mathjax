/* global document, window */
var _ = require("lodash");

module.exports = function (options) {
	return function (done) {
		var opt = _.extend({}, options || {});
		this.on("mathjax:end", function () {
			done();
		});
		this.evaluate(function (options) {
			(function() {
				var target = document.getElementById(options.id) || document.body;
				window.MathJax.Hub.Register.MessageHook("End Process", function() {
					window.callPhantom(["mathjax:end"]);
				});
				console.log("Rendering body...");
				window.MathJax.Hub.Typeset(target);
			})();
		}, opt);
	};
};