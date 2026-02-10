import withAndroidPlugin from './withAndroidPlugin';
import withIosPlugin from './withIosPlugin';

// const { ConfigPlugin } = ConfigPlugins;

const withPlugin = config => {
  // Apply Android modifications first
  config = withAndroidPlugin(config);
  // Then apply iOS modifications and return
  return withIosPlugin(config);
};

export default withPlugin;
