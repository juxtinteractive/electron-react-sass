# Building apps with Electron, React and Sass

Creating desktop applications with web technologies has always been a little dream of mine. With GitHub's Electron project, it's now easier than ever. Even so, there are a few gotchas along the way. In this write-up I go through some of the lessons I learned in a recent project.

## What you'll learn:

1. Create a basic Electron app with React.
2. Set up a live-reloading dev server with Webpack.
3. Add in Sass and have Webpack process it.
4. Package, code sign and distribute your app.


## Getting Started

We'll be starting off with the example app provided in the [Electron Quick Start guide](http://electron.atom.io/docs/latest/tutorial/quick-start/). For the sake of brevity the code below is stripped of comments.

```js
var app = require('app');
var BrowserWindow = require('browser-window');

require('crash-reporter').start();

var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({width: 800, height: 600});

  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  mainWindow.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
```

Save it as `main.js` in your project directory. This bootstraps an Electron application that loads an `index.html` file in the same directory as `main.js`. Let's create that `index.html`.


```js
<!DOCTYPE html>
<html>
<head>
	<title>Electron App</title>
</head>
<body>
	<h1>Hello!</h1>
</body>
</html>
```

Now we have the two files we need to run our minimal app; `main.js` creates the Electron app that serves `index.html` as its view. To test run the application we need to install the pre-built Electron binaries. It resides in `npm`, and since all future external dependencies also do, now is a good time to create our `package.json` file.

```
{
  "name": "electron-react-sass",
  "version": "0.1.0",
  "main": "main.js",
  "devDependencies": {
    "electron-prebuilt": "^0.34.1"
  }
}
```

Running `npm install`, which might take a little while since it's downloading the Electron binaries. When installation is done, run the app with the command `./node_modules/.bin/electron .` in your project directory. Electron will look at the `package.json` in the directory you specified (which was `.`) and run the script in the `main` property, which in our case is `main.js`.

PICTURE OF ELECTRON APP UP AND RUNNING

I like convenience, and in the above there's a tiny bit of inconvenience. Every time I want to run the app I have to remember to type in `./node_modules/.bin/electron .`, and at times my memory is just plain terrible. To remedy this tiny pain point I like to save the commmand as an `npm` script in `package.json`.

```
{
  "name": "electron-react-sass",
  "version": "0.1.0",
  "main": "main.js",
  "devDependencies": {
    "electron-prebuilt": "^0.34.1"
  },
  "scripts": {
    "start": "./node_modules/.bin/electron ."
  }
}
```

Now, chuck your memory to the side, and start the app with `npm run start`.


## Adding React

Let's begin by installing React and Babel as dev dependencies. Babel does tons of cool stuff, like allowing your to use ES6 features now, but we're using it simply because it transpiles React's JSX syntax to plain JavaScript.

```
npm install --save-dev babel-core react react-dom
```

In the continued name of simplicity, let's create The Most Basic React App. Create a file, `src/entry.js`, that will serve as the entry point to our front-end app, and put the following code in it.

```
var React = require('react');
var ReactDom = require('react-dom');

var App = React.createClass({
	render: function() {
		return <h1>Hello from React!</h1>;
	}
});

ReactDom.render(<App/>, document.getElementById('react-root'));
```

We import `React` and `ReactDOM`, create the `App` class which simply renders out the header "Hello from React!", and then bootstrap the React app into the DOM at `react-root`. This should all be very familiar ([or see React docs](http://facebook.github.io/react/docs/getting-started.html)).

Before running the app we need to modify our `index.html` so it loads `entry.js` and contains a `<div>` with id `react-root` that React can attach to.

```
<!DOCTYPE html>
<html>
<head>
	<title>Electron App</title>
</head>
<body>
	<div id="react-root"></div>
	<script src="./node_modules/babel-core/browser.js"></script>
	<script type="text/babel" src="./src/entry.js"></script>
</body>
</html>
```

Run `npm run start` to see it all spinning. The script `./node_modules/babel-core/browser.js` transpiles our JSX with Babel on the client.


## Bundling it up

Having the JSX transpile at runtime is fine for testing it out and joshin' around, but it isn't particularly ideal in any real setting. Let's fix it and use Webpack to bundle up our JavaScript.

Edit `index.html` and replace the two script tags with one single tag pointing at `./build/bundle.js`. In a moment we'll configure Webpack to output our JavaScript into this file.

```
<!DOCTYPE html>
<html>
<head>
	<title>Electron App</title>
</head>
<body>
	<div id="react-root"></div>
	<script src="./build/bundle.js"></script>
</body>
</html>
```

Before installing Webpack from `npm`, we're going to create its configuration file. Below is `webpack.config.js` in its entirety.

```
var webpack = require('webpack');

module.exports = {
  context: __dirname + '/src',
  entry: './entry.js',

  output: {
    filename: 'bundle.js',
    path: __dirname + '/build'
  },

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ }
    ]
  }
};
```

Let's go through the file, it's just regular JavaScript (which means you can do all sorts of fancy JavaScripting if you feel like it).

```
// webpack.config.js
module.exports = { /* ... */ };
```

This exports the configuration object.

```
  context: __dirname + '/src',
  entry: './entry.js',
```

The `entry` property is the entry point for Webpack when it starts bundling everything together. Everything that's required directly in this file, or in subsequently required files, will be processed by Webpack. This includes non-JavaScript as well, which we'll get to later when we include Sass styles.

The `context` property is an absolute path. It's used when resolving the location of `entry`, and since our entry file is `./src/entry.js` we'll put `__dirname + '/src'` in the `context` property and `entry.js` in the `entry` property.


```
  output: {
    filename: 'bundle.js',
    path: __dirname + '/build'
  },
```

The above instructs Webpack to output the file `bundle.js` in the path `__dirname + '/build`, which is what we wrote earlier in `index.html`.

```
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ }
    ]
  }
```

Webpack supports a number of loaders for different file types. These are specified as an array of objects in `module.loaders`. The file type is matched by a regular expression, and when there's a match the file is processed by a loader.

We can also ignore files with the `exclude` property. We don't want to bundle anything in the `node_modules` directory, so we exclude all JavaScript files from that folder by matching a regular expression.

With `webpack.config.js` created, install Webpack (`npm install --save-dev webpack`) and run `./node_modules/.bin/webpack` in the project directory. This generates `./build/bundle.js`. To make running Webpack less tedious let's also add the command as an `npm` script.

```
...
  "scripts": {
    "start": "./node_modules/.bin/electron .",
    "build": "./node_modules/.bin/webpack"
  }
...
```

Now run `npm run build && npm run start` and you should see the same `Hello from React!` page as in the previous section. However, now it's transpiled, bundled, and cooked so there's no real-time transpiling going on.


## Hot Reload Development Environment

Webpack has a development server that detects updates to any files that are part of the bundle and automatically reloads those files. In fact, it's so fancy that it can replace only the modules that have been updated. Our example is not that fancy (but hey, feel free to go down that rabbit hole).

First off we need to install the Webpack dev server with `npm install --save-dev webpack-dev-server`. With it installed you can run the live reloading dev server with the following command.

```
./node_modules/.bin/webpack-dev-server --hot --inline
```

The dev server now continually builds the source files and serves them at `http://localhost:8080/`. In the name of consistency, let's change the `webpack.config.js` so that we serve the bundled files from `http://localhost:8080/build/` by adding a `publicPath` property to the `output` object.

```
...
  output: {
    filename: 'bundle.js',
    path: __dirname + '/build',
    publicPath: 'http://localhost:8080/build/'
  },
...
```

We'll have to modify our project a tiny bit for this to work both development and production environments. In `index.html` we're still referring to the build output (`./build/bundle.js`) and not the dev server (`http://localhost:8080/build/bundle.js`). This is exactly what we want when packaging up the Electron app, but for development purposes we want it to look at the dev server. We'll make this happen by setting an environment variable as part of our `start` script in `package.json`.

```
...
    "start": "ENVIRONMENT=DEV ./node_modules/.bin/electron .",
...
```

The environment variable `ENVIRONMENT` is set to `DEV` for the duration of the script command, which in this case is while the app is running. Since this is an Electron app and not a regular website, we can query for this variable in our `index.html`. If `process.env.ENVIRONMENT === 'DEV'` we point to the dev server's `bundle.js`.

```
...
<body>
  <div id="react-root"></div>
  <script>
	var bundlePath = './build/bundle.js';

	if(typeof process !== 'undefined' && process.env.ENVIRONMENT === 'DEV') {
		bundlePath = 'http://localhost:8080/build/bundle.js';
	}

	var bundleScriptEl = document.createElement('script');
	bundleScriptEl.src = bundlePath;
	document.currentScript.parentNode.insertBefore(bundleScriptEl, document.currentScript);


	</script>
</body>
...
```

As in previous sections, let's add an `npm` script for running the dev server.

```
...
  "scripts": {
    "start": "ENVIRONMENT=DEV ./node_modules/.bin/electron .",
    "build": "./node_modules/.bin/webpack",
    "watch": "./node_modules/.bin/webpack-dev-server --hot --inline"
  }
...
```

Now open two terminal windows and run `npm run watch` in one and `npm run start` in the other. As you make edits to `entry.js` or the files referenced from it, you'll see the Electron app update with the changes.

_Note: Any changes to `main.js` or `index.html` will not automatically cause Webpack to live-reload. You will need to restart Webpack and the Electron app to see changes made in those files._


## Adding Sass

Adding Sass styles is pretty simple using Webpack loaders. In `webpack.config.js`'s `module.loaders` we'll add a loader for pre-processing our Sass and then loading and applying it to our page (yes, we're letting Webpack add it to the document). First, install the loaders we need with `npm install --save-dev style-loader css-loader sass-loader`, and then use them in `webpack.config.js`.

```
...
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader' }
    ]
  }
...
```

The syntax `style-loader!css-loader!sass-loader` will apply the `sass-loader`, `css-loader` and `style-loader` in right-to-left order to any `.scss` file that has been included in our JavaScript with `require()`. The `sass-loader` compiles the Sass markup to CSS, `css-loader` interprets and resolves `@import` and `url(...)` paths, and `style-loader` applies the CSS to the document. One nice thing to note is that Webpack will resolve any relative paths it encounters in the Sass markup.

Now that we're prepped to load Sass, create a file `./static/styles/main.scss` in the project directory and `require()` it at the top of `./src/entry.js`.

```
require('../static/sass/main.scss');

var React = require('react');
...
```

Run the project and you will see the styles from `main.scss` applied to the document. There are many other loaders out there, and if you for example prefer Less over Sass you'll easily replace `sass-loader` with `less-loader`.


## Extra: Package your Mac app

Finally, you may wish to distribute your app. There's a command line tool called `electron-packager` that makes this process super simple. Install it (`npm install --save-dev electron-packager`) and add a `osx-package` script to your `package.json` scripts.

```
...
    "osx-package": "./node_modules/.bin/webpack -p && ./node_modules/electron-packager/cli.js ./ ElectronReactSass --out ./bin --platform=darwin --arch=x64 --version=0.34.0 --overwrite --ignore=\"ignore|bin|node_modules\""
...
```

Unfortunately Apple does not allow Electron apps in the App Store, but you can still distribute it elsewhere. However, unless you code sign your app it will cause security warnings. Code signing is pretty simple process, but you will need a [Developer ID](https://developer.apple.com/developer-id/). In this app skeleton I've added the `npm` scripts `osx-sign` and `osx-verify` ([more on signing Electron apps](http://www.pracucci.com/atom-electron-signing-mac-app.html)).

```
...
    "osx-sign": "codesign --deep --force --verbose --sign \"<identity>\" ./bin/ElectronReactSass-darwin-x64/ElectronReactSass.app",

    "osx-verify": "codesign --verify -vvvv ./bin/ElectronReactSass-darwin-x64/ElectronReactSass.app && spctl -a -vvvv ./bin/ElectronReactSass-darwin-x64/ElectronReactSass.app",
...
```

Replace `<identity>` with your Developer ID and you should be ready to go. In other words, with these npm scripts in your `package.json`-file the following command should package your app, code sign it, and finally verify that your code signing went well.

```
npm run osx-package && npm run osx-sign && npm run osx-verify
```

All that's left now is have people download and use your Electron-powered app. Good luck!

_--- Marcus Stenbeck / [@marcusstenbeck](http://twitter.com/marcusstenbeck) / [juxt.com](http://juxt.com/)_

## Links

[This skeleton app on GitHub.](https://github.com/juxtinteractive/electron-react-sass)

[Electron - Signing a Mac Application](http://www.pracucci.com/atom-electron-signing-mac-app.html)

[electron-packager on GitHub](https://github.com/maxogden/electron-packager)
