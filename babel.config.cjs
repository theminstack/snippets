// NOT used for building, only for testing (ts-jest).
/** @type {import('@babel/core').TransformOptions} */
module.exports = {
  compact: false,
  env: {
    test: {
      presets: [['@babel/preset-env', { modules: 'commonjs' }]],
      targets: { node: 'current' },
    },
  },
};
