const webpack = require('webpack')
module.exports={
  chainWebpack: config => {
    config.plugin('provide').use(webpack.ProvidePlugin,[{
      $:"jquery",
      jQuery:"jquery",
      "windows.jQuery":"jquery"
    }])
  }
}
