/* global document, window, XMLHttpRequest */
var fs = require("fs");

module.exports = function (options) {
	return function (done) {
		var jobs = [];

		this.on("mathjax:font", function (font, data) {
			// TODO: copy fonts.
			fs.write(options.dest + "/fonts/mathjax/" + font, data);
		});

		this.on("mathjax:css", function (css) {
			fs.write(options.dest + "/mathjax.css", css, "w");
			done();
		});

		this.evaluate(function(options) {
			(function() {
				var css = [];
				var parseLine = function (line) {
					if (line.match(/@font\-face/)) {
						line = line.replace(/url\s*\(\s*['"]([^\)]+fonts\/HTML\-CSS\/([^\/]+\/(?:woff|otf|eot)\/[^-]+\-(?:Regular|Italic|Bold|Bolditalic)\.(?:woff|eot|otf)))['"]\s*\)/g, function(ma, url, font) {
							// Synchronous XMLHttpRequest for easy flow.
							var xhr = new XMLHttpRequest("GET", url, false);
							if (xhr.status === 200) {
								window.callPhantom(["mathjax:font", font, xhr.responseText]);
							}
							else {
								console.error ("Failed to load font: " + url);
							}
							return "url('fonts/mathjax/" + font + "')";
						});
					}
					css.push(line);
				};
				var parseStyle = function (el) {
					while (el && el.className !== "MathJax_Injection_End") {
						el = el.nextElementSibling();
						if (el.tagName.toLowerCase() !== "style") {
							continue;
						}
						el.innerHTML.split("\n").forEach(parseLine);
					}
				};
				[].slice
					.apply(document.querySelectorAll("head > .MathJax_Injection_Begin"))
					.forEach(parseStyle);

				window.callPhantom(["mathjax:css", css.join("\n")]);
			})();
		});
	};
};
