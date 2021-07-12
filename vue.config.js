const webpack = require('webpack')
module.exports={
  publicPath: './',
  chainWebpack: config => {
    config.plugin('provide').use(webpack.ProvidePlugin,[{
      $:"jquery",
      jQuery:"jquery",
      "windows.jQuery":"jquery"
    }])
  }
}
