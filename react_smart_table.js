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
                filterByColumn: false,
                tableClass: "table",
                sortNeutralClass: "sort-neutral",
                sortAscendingClass: "sort-ascending",
                sortDescendingClass: "sort-descending"                
            };
        },
        getInitialState: function() {
            return {   
                data : this.props.data, // TODO: fix antipattern
                sortOrderAscending: true,
                sortColumn: "id"
            };
        },
        getColumns: function() {
            return Object.keys(this.state.data[0]); 
        },
        sortColumn: function(column) {
            return function(event) {
                console.log("column:"+column)
                var newSortOrder = (this.state.sortColumn != column)?true:(!this.state.sortOrderAscending);
                this.setState({sortColumn: column, sortOrderAscending:newSortOrder});                
            }.bind(this);
        },
        sortClass: function(column) {
            var ascOrDesc = (this.state.sortOrderAscending) ? "glyphicon glyphicon-triangle-bottom" : "glyphicon glyphicon-triangle-top";
            return (this.state.sortColumn == column) ? ascOrDesc : "";
        },
        render: function() {
            var columns = this.getColumns();

            var tr_headers = columns.map(function (col, i) {
                return React.DOM.th({key:i, onClick:this.sortColumn(col), className:this.sortClass(col)}, col);
            }, this);


            var tr_filters = columns.map(function (col, i) {
                return React.DOM.th({key:i}, col);
            });

            var thead = React.DOM.thead( {key: "thead"}, [
                React.DOM.tr( {key: "tr_headers"}, tr_headers ),                    
                (this.props.filterByColumn)?React.DOM.tr( {key: "tr_filters"}, tr_filters ):null
            ]);

            // sort
            var dataCopy = this.state.data;
            var key = this.state.sortColumn;
            var order = this.state.sortOrderAscending?1:-1;
            dataCopy.sort( function(x,y){
                return (x[key] === y[key])? 0: (x[key] > y[key] ? order : -order);
            });

            var tr_body = dataCopy.map(function (row, i) {
                return React.DOM.tr( {key:i}, 
                    columns.map(function (col, j) {
                        return React.DOM.td({key:j}, row[col]);
                    })
                )
            });

            var tbody = React.DOM.tbody( {key: "tbody"}, tr_body );
            return React.DOM.table( {className:this.props.tableClass}, [thead, tbody] );
        }
    });
        
    return exports;
}));
