// Karma setup for `ng test`. Runs specs once in headless Chrome so `npm test` works in a terminal or CI.
// Set CHROME_BIN if Chrome/Chromium is not on its default path.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: { clearContext: false },
    jasmineHtmlReporter: { suppressAll: true },
    coverageReporter: { dir: require('path').join(__dirname, './coverage/movie-dashboard'), subdir: '.', reporters: [{ type: 'html' }, { type: 'text-summary' }] },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: { base: 'ChromeHeadless', flags: ['--no-sandbox'] }
    },
    restartOnFileChange: true
  });
};
