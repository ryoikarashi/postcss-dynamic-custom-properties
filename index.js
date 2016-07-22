'use strict'

var postcss = require('postcss');
var _ = require('underscore');

function initRootClassInfo(rootClassNames) {
	var rootClassInfo = {};

	rootClassNames.map(function(className) {
		rootClassInfo[className] = { vars: {} };
	});

	return rootClassInfo;
}

module.exports = postcss.plugin('postcss-dynamic-custom-properties', function (opts) {

	return function (css) {

		opts = opts || {};

		var rootClassNames = _.uniq(opts.rootClasses) || [];
		var rootClassInfo = initRootClassInfo(rootClassNames);

		css.walkRules(function(rule) {
			Object.keys(rootClassInfo).map(function(className, i) {
				if(className === rule.selector.substr(1)) {
					rule.walkDecls(function(decl) {
						if (decl.prop.match(/^--/)) {
							rootClassInfo[className].vars[decl.prop] = decl.value;
							decl.remove();
						}
					});
				}
			});
		});

		css.walkRules(function(rule) {
			rule.walkDecls(function(decl) {
				Object.keys(rootClassInfo).map(function(className) {
					Object.keys(rootClassInfo[className].vars).map(function(variableName, index) {

						if (decl.value.indexOf('var(' + variableName) !== -1) {
							var variableValue = rootClassInfo[className].vars[variableName];
							var declValue = decl.value.replace('var(' + variableName + ')', variableValue);
							if(rule.selector !== ":root") {
								var newRuleWithoutDecl = rule.clone({selector: '.' + className + ' ' + rule.selector}).removeAll();
								var newDecl = decl.clone({prop: decl.prop, value: declValue});
								rule.parent.root().insertBefore(rule, newRuleWithoutDecl.insertBefore(decl, newDecl));
							}
						}
					});
				});
			});
		});

	};

});
