import test from 'ava';
import Neutrino from '../src/neutrino';

test('initializes with no arguments', t => {
  t.notThrows(() => new Neutrino());
});

test('initializes with options', t => {
  t.notThrows(() => new Neutrino({ testing: true }));
});

test('initialization stores options', t => {
  const options = { alpha: 'a', beta: 'b', gamma: 'c' };
  const api = new Neutrino(options);

  t.is(api.options.alpha, options.alpha);
  t.is(api.options.beta, options.beta);
  t.is(api.options.gamma, options.gamma);
});

test('creates an instance of webpack-chain', t => {
  const api = new Neutrino();

  t.is(typeof api.config.toConfig, 'function');
});

test('middleware receives API instance', t => {
  const api = new Neutrino();

  api.use(n => t.is(n, api));
});

test('middleware receives default options', t => {
  const api = new Neutrino();

  api.use((api, options) => {
    t.deepEqual(options, {});
  });
});

test('middleware receives options parameter', t => {
  const api = new Neutrino();
  const defaults = { alpha: 'a', beta: 'b', gamma: 'c' };

  api.use((api, options) => {
    t.deepEqual(options, defaults);
  }, defaults);
});

test('triggers promisified event handlers', t => {
  const api = new Neutrino();

  api.on('test', () => t.pass('test event triggered'));
  api.emitForAll('test');
});

test('events handle promise resolution', async t => {
  const api = new Neutrino();

  api.on('test', () => Promise.resolve('alpha'));

  const [value] = await api.emitForAll('test');

  t.is(value, 'alpha');
});

test('events handle promise rejection', async t => {
  const api = new Neutrino();

  api.on('test', () => Promise.reject(new Error('beta')));

  const err = await t.throws(api.emitForAll('test'));

  t.is(err.message, 'beta');
});

test('events handle multiple promise resolutions', async t => {
  const api = new Neutrino();

  api.on('test', () => Promise.resolve('alpha'));
  api.on('test', () => Promise.resolve('beta'));
  api.on('test', () => Promise.resolve('gamma'));

  const values = await api.emitForAll('test');

  t.deepEqual(values, ['alpha', 'beta', 'gamma']);
});

test('creates a Webpack config', t => {
  const api = new Neutrino();

  api.use(api => {
    api.config.module
      .rule('compile')
      .test(/\.js$/)
      .include
        .add('src')
        .end()
      .use('babel')
        .loader('babel-loader')
        .options({ alpha: 'a', beta: 'b' });
  });

  t.deepEqual(api.getWebpackOptions(), {
    module: {
      rules: [
        {
          test: /\.js$/,
          include: ['src'],
          use: [
            {
              loader: 'babel-loader',
              options: { alpha: 'a', beta: 'b' }
            }
          ]
        }
      ]
    }
  });
});
