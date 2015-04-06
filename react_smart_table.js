(function (root, factory) {
    if (typeof define === 'function' && define.amd) { // AMD
        define(['react'], factory);
    } else if (typeof exports === 'object') { // Node, CommonJS-like
        module.exports = factory(require('react'));
    } else { // Browser globals (root is window)
        root.ReactSmartTable = factory(root.React);
    }
}(this, function (React) {
    "use strict";
    var exports = {};

    var Table = exports.Table = React.createClass({displayName: "Table",
        getDefaultProps: function() {
            var defaultProps = {                
            };
            return defaultProps;
        },
        getInitialState: function() {
            var initialState = {                
            };            
            return initialState;
        },
        render: function() {
            return React.createElement("table", {}, [
                React.createElement("thead", {key: "thead"}, 
                    null
                ),
                React.createElement("tbody", {key: "tbody"}, 
                    null
                )
            ]);
        }
    });
        
    return exports;
}));
