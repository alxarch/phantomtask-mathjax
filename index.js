var fs = require("fs");
var _ = require("lodash");
require.resolve = function (request) {
	return module._getFilename(request);
};

module.exports = function (options) {
	options = _.assign({}, {
		clean:     true,
		config:    {},
		css:       false,
		selector:  "body",
		dest:      fs.absolute("")
	}, options);

	return function (done) {
		var page = this;

		var easy = require.resolve("easy-mathjax");
		page.injectJs(easy);

		page.on("mathjax:css", function (css) {
			fs.write(options.dest + "mathjax.css", css, "w");
		});

		page.on("mathjax:font", function (font, data) {
			fs.write(options.dest + "/fonts/mathjax/" + font, data);
		});

		page.on("mathjax:end", function () {
			done();
		});

		page.evaluate(function (options) {

			(function () {
				/* global window, EasyMathJax, XMLHttpRequest */
				var task = new EasyMathJax(options);
				
				var onFont = function (font, url) {
					// Synchronous XMLHttpRequest for easy flow.
					var xhr = new XMLHttpRequest();
					xhr.open("GET", url, false);
					xhr.responseType = "blob";
					xhr.send();
					window.callPhantom(["mathjax:font", font, xhr.response]);
				};

				var onRender = function () {
					console.log("Cleaning up...");
					if (options.css) {
						var css = task.css();
						for (var font in css.fonts) {
							if (css.fonts.hasOwnProperty(font)) {
								onFont(font, css.fonts[font]);
							}
						}
						window.callPhantom(["mathjax:css", css.contents]);
					}
					if (options.clean) {
						// task.clean();
					}
					window.callPhantom(["mathjax:end"]);						
				};
				console.log("Loading MathJax...");
				task.inject(function () {
					console.log("Rendering Math...");
					task.render(options.selector, onRender);
				});
			})();
		}, options);
	};
};
