'use strict';
require('../static/sass/main.scss');

var React = require('react');
var ReactDom = require('react-dom');

var App = React.createClass({
	render: function() {
		return <div><div className="tech electron">Electron</div> + <div className="tech react">React</div> + <div className="tech sass">Sass</div></div>;
	}
});

ReactDom.render(<App/>, document.getElementById('react-root'));