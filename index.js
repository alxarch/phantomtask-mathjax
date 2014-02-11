var fs = require("fs");
var _ = require("lodash");
require.resolve = function (request) {
	return module.getFilename(request);
};

var __dirname = module.filename.replace(/\/[^\/]*$/, '');

module.exports = function (options) {
	options = _.assign({}, options, {
		cleanup: true,
		config: {},
		css: false,
		selector: "body",
		dest: fs.absolute("")
	});

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
				/* global MathJaxTask */
				var task = new EasyMathJax(options);
				
				var onFont = function (font, url) {
					// Synchronous XMLHttpRequest for easy flow.
					var xhr = new XMLHttpRequest("GET", url, false);
					if (xhr.status === 200) {
						window.callPhantom(["mathjax:font", font, xhr.responseText]);
					}
					else {
						console.error ("Failed to load font: " + url);
					}
				};

				var onRender = function () {
					if (options.css) {
						var css = task.css()
						for (var font in css.fonts) {
							if (css.fonts.hasOwnProperty(font)) {
								onFont(font, css.fonts[font]);
							}
						}
						window.callPhantom(["mathjax:css", css.contents]);
					}
					if (options.clean) {
						task.clean();
					}
					window.callPhantom(["mathjax:end"]);						
				};

				task.inject(function () {
					task.render(options.selector, onRender);
				});
			})();
		}, options);
	};
};
