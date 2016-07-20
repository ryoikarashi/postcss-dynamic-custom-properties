'use strict'

const postcss = require('postcss')
const _ = require('underscore')

function initRootClassInfo(rootClassNames) {
	let rootClassInfo = {}

	rootClassNames.map(className => {
		rootClassInfo[className] = { vars: {} }
	})

	return rootClassInfo;
}

module.exports = postcss.plugin('postcss-dynamic-custom-properties', function (opts) {

	return function (css) {

		opts = opts || {}

		const rootClassNames = _.uniq(opts.rootClasses) || []
		let rootClassInfo = initRootClassInfo(rootClassNames)

		css.walkRules(rule => {
			Object.keys(rootClassInfo).map((className, i) => {
				if(className === rule.selector.substr(1)) {
					rule.walkDecls(decl => {
						if (decl.prop.match(/^--/)) {
							rootClassInfo[className].vars[decl.prop] = decl.value
							decl.remove()
						}
					})
				}
			})
		})

		css.walkRules(rule => {
			rule.walkDecls(decl => {
				Object.keys(rootClassInfo).map(className => {
					Object.keys(rootClassInfo[className].vars).map((variableName, index) => {

						if (decl.value.indexOf(`var(${variableName}`) !== -1) {
							const variableValue = rootClassInfo[className].vars[variableName]
							const declValue = decl.value.replace(`var(${variableName})`, variableValue)
							const newRuleWithoutDecl = rule.clone({selector: `.${className} ${rule.selector}`}).removeAll()
							const newDecl = decl.clone({prop: decl.prop, value: declValue})
							rule.parent.root().insertBefore(rule, newRuleWithoutDecl.insertBefore(decl, newDecl))
						}
					})
				})
			})
		})

	}

})
