/* global document, window */

module.exports = function (options) {
	return function (done) {
		this.evaluate (function (options) {
			(function () {

				var remove = function (node) {
					if (typeof node === "string") {
						node = document.querySelectorAll(node);
					}
					[].concat(node).forEach(function (n) {
						if (n && n.parentNode) {
							n.parentNode.removeChild(n);
						}
					});
				};

				[].slice.apply(document.querySelectorAll("head > script[type='mathjax/begin']")).forEach(function (begin) {
					var next;
					while (begin && begin.type !== "mathjax/end") {
						next = begin.nextElementSibling();
						remove(begin);
						begin = next;
					}
					remove(begin);
				});

				remove("#MathJax_Message");
				remove("#MathJax_Font_Test");
				remove(".MathJax_Preview");
				var hidden = document.querySelector("#MathJax_Hidden");
				if (hidden) {
					remove(hidden.parentNode);
				}

				if (!options.debug) {
					remove("script[id^=MathJax]");
					[].slice.apply(document.querySelectorAll("[id^='MathJax']")).forEach(function (s) {
						s.removeAttribute('id');
					});
				}
			})();

		}, options);
	};
};
