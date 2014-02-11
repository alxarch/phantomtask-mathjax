var fs = require("fs");
var _ = require("lodash");

var exportCss = function () {
	/* global XMLHttpRequest, window, document */
	(function () {
		var css = [];
		var rx = /url\s*\(\s*['"]([^\)]+fonts\/HTML\-CSS\/([^\/]+\/(?:woff|otf|eot)\/[^-]+\-(?:Regular|Italic|Bold|Bolditalic)\.(?:woff|eot|otf)))['"]\s*\)/g;

		var parseLine = function (line) {
			if (line.match(/@font\-face/)) {
				line = line.replace(rx, function(ma, url, font) {
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
};

var render = function (options) {
	/* global window, document, MathJax */
	(function() {

		console.log("Rendering math...");

		[].slice.apply(document.querySelectorAll(options.selector)).forEach(function (el) {
			MathJax.Hub.Queue(["Typeset", MathJax.Hub, el]);
			
		});
		MathJax.Hub.Queue(function () {
			window.callPhantom(["mathjax:end"]);
		});

	})();
};

var inject = function (options) {
	/* global document, window */
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
		script.src = options.url;
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
};

var cleanup = function (options) {
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
};

module.exports = function (options) {
	options = _.merge({}, options, {
		mathjax: {
			url: "http://cdn.mathjax.org/mathjax/latest/MathJax.js",
			cleanup: true,
			config: {},
			exportCss: false,
			selector: "body",
			dest: fs.absolute("")
		}
	}).mathjax;

	return function (done) {
		var page = this;

		page.on("mathjax:css", function (css) {
			fs.write(options.dest + "/mathjax.css", css, "w");
		});

		page.on("mathjax:font", function (font, data) {
			// TODO: copy fonts.
			fs.write(options.dest + "/fonts/mathjax/" + font, data);
		});

		page.on("mathjax:end", function () {
			if (options.exportCss) {
				page.evaluate(exportCss);
			}
			if (options.cleanup) {
				page.evaluate(cleanup);
			}
			done();
		});

		page.on("mathjax:ready", function () {
			page.evaluate(render, options);
		});

		page.evaluate(inject, options);
	};
};
