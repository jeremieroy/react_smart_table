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
            return {
                filterByColumn: false
            };
        },
        getInitialState: function() {
            return {                
            };
        },
        render: function() {
            var thead = React.DOM.thead( {key: "thead"}, [
                React.DOM.tr( {key: "tr_headers"}, [/* headers */ ]),
                (this.props.filterByColumn)?React.DOM.tr( {key: "tr_filters"}, [/* filters */ ]):null,
            ]);

            var tbody = React.DOM.tbody( {key: "tbody"}, [
                React.DOM.tr( {key: "1"}, [/* values 1 */ ]),
                React.DOM.tr( {key: "2"}, [/* values 2 */ ])
            ]);
            return React.DOM.table( {}, [thead, tbody] );
        }
    });
        
    return exports;
}));
