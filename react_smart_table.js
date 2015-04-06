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
                data : this.props.data // TODO: fix antipattern
            };
        },
        getColumns: function() {
             return Object.keys(this.state.data[0]); 
        },
        render: function() {
            var columns = this.getColumns();
            
            var tr_headers = columns.map(function (col, i) {
                return React.DOM.th({key:i}, col);
            });

            var tr_filters = columns.map(function (col, i) {
                return React.DOM.th({key:i}, col);
            });

            var thead = React.DOM.thead( {key: "thead"}, [
                React.DOM.tr( {key: "tr_headers"}, tr_headers ),                    
                (this.props.filterByColumn)?React.DOM.tr( {key: "tr_filters"}, tr_filters ):null
            ]);

            var tr_body = this.state.data.map(function (row, i) {
                return React.DOM.tr( {key:i}, 
                    columns.map(function (col, j) {
                        return React.DOM.td({key:j}, row[col]);
                    })
                )
            });

            var tbody = React.DOM.tbody( {key: "tbody"}, tr_body );
            return React.DOM.table( {}, [thead, tbody] );
        }
    });
        
    return exports;
}));
