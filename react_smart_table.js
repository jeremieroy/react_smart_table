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

    function detectScrollbarWidthHeight() {
        var div = document.createElement("div");
        div.style.overflow = "scroll";
        div.style.visibility = "hidden";
        div.style.position = 'absolute';
        div.style.width = '100px';
        div.style.height = '100px';
        document.body.appendChild(div);

        return {
            width: div.offsetWidth - div.clientWidth,
            height: div.offsetHeight - div.clientHeight
        };
    }

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
            this.SB = detectScrollbarWidthHeight();
            return {   
                data : this.props.data, // TODO: fix antipattern
                sortOrderAscending: true,
                sortColumn: "id"
            };
        },
        getColumns: function() {
            var columns = Object.keys(this.state.data[0]);
            /*for(var i=0;i<columns.length;i++)
            {
                columns[i].width = 80;
            } */
            return columns;           
        },
        sortColumn: function(column) {
            return function(event) {
                console.log("column:"+column)
                var newSortOrder = (this.state.sortColumn != column)?true:(!this.state.sortOrderAscending);
                this.setState({sortColumn: column, sortOrderAscending:newSortOrder});                
            }.bind(this);
        },
        sortClass: function(column) {
            return '';
            var ascOrDesc = (this.state.sortOrderAscending) ? "glyphicon glyphicon-triangle-bottom" : "glyphicon glyphicon-triangle-top";
            return (this.state.sortColumn == column) ? ascOrDesc : "";
        },       
        getHiddenStyle: function() {
            return {              
              overflowX: 'hidden',
              overflowY: 'hidden'
            };
        },
        handleScroll: function(e) {
            var right_header = this.refs.right_header.getDOMNode();
            var left_body = this.refs.left_body.getDOMNode();
            var right_body = this.refs.right_body.getDOMNode();            
            right_header.scrollLeft = right_body.scrollLeft;
            left_body.scrollTop = right_body.scrollTop;
            
            /*console.log(top.scrollLeft);
            console.log("total width:"+e.target.scrollWidth);
            console.log("total height:"+e.target.scrollHeight);
            console.log("client width:"+e.target.clientWidth);
            console.log("client height:"+e.target.clientHeight);
            console.log("max scroll Left:"+ (e.target.scrollWidth - e.target.clientWidth));
            console.log("max scroll Top:"+(e.target.scrollHeight - e.target.clientHeight));
            console.log("top:"+e.target.scrollTop);
            console.log("left:"+e.target.scrollLeft);
            console.log("top:"+e.target.scrollTop);
            console.log("------------");
            */
            
        }, 

        render: function() {
            var columns = this.getColumns();
            var fixed_col_count = 1;


            // sort
            var dataCopy = this.state.data;
            var key = this.state.sortColumn;
            var order = this.state.sortOrderAscending?1:-1;
            dataCopy.sort( function(x,y){
                return (x[key] === y[key])? 0: (x[key] > y[key] ? order : -order);
            });


            var left_th_list = [];
            for (var i = 0; i<fixed_col_count; i++) {
                var col = columns[i];
                var style = {width:'80px'};
                var cell = React.DOM.th({key:i, onClick:this.sortColumn(col), className:this.sortClass(col), style:style}, col);
                left_th_list.push(cell);
            }

            var right_th_list = [];
            for (var i = fixed_col_count, len = columns.length; i<len; i++) {
                var col = columns[i];
                var style = {width:'80px'};
                var cell = React.DOM.th({key:i, onClick:this.sortColumn(col), className:this.sortClass(col), style:style}, col);
                right_th_list.push(cell);
            }

            var left_tr_list = [];
            for (var j = 0, len = dataCopy.length; j<len; j++) {
                var item  = dataCopy[j];
                var td_list = [];

                for (var i = 0; i<fixed_col_count; i++) {
                    var col = columns[i];
                    var style = {width:'80px'};
                    var cell = React.DOM.td({key:i, style:style}, item[col]);
                    td_list.push(cell);
                }

                var style = {};
                var cell = React.DOM.tr({key:j, style:style}, td_list);
                left_tr_list.push(cell);
            }            

            var right_tr_list = [];
            for (var j = 0, len = dataCopy.length; j<len; j++) {            
                var item  = dataCopy[j];
                var td_list = [];

                for (var i = fixed_col_count, col_length = columns.length; i<col_length; i++) {                    
                    var col = columns[i];
                    var style = {width:'80px'};
                    var cell = React.DOM.td({key:i, style:style}, item[col]);
                    td_list.push(cell);                    
                }

                var style = {};
                var cell = React.DOM.tr({key:j, style:style}, td_list);
                right_tr_list.push(cell);
            }            
            

            var w = 1000;
            var h = 500;
            var lw = fixed_col_count*80;
            var rw = w-lw;
            var th = 25;
            var bh = h-th;
            

            var left_header = 
                React.DOM.table({ style:{tableLayout:'fixed', width:"100%", height:"100%"} }, 
                        React.DOM.tr( {}, left_th_list )
                    );

            var right_header = 
                React.DOM.table({ style:{tableLayout:'fixed', width:"100%", height:"100%"}},                         
                    React.DOM.tr( {}, right_th_list )
                );

            var left_body = 
                React.DOM.table({ style:{tableLayout:'fixed', width:"100%", height:"100%"} }, left_tr_list
                );

            var right_body = /*React.DOM.div({style:right_body_tyle, onScroll:this.handleScroll, ref:"right_body"}, */
                React.DOM.table({ style:{tableLayout:'fixed', width:"100%", height:"100%"} }, right_tr_list
                );

            var container = 
                React.DOM.table( { style:{tableLayout:'fixed', width:w+'px', height:h+'px'} }, 
                    React.DOM.tr({},
                        React.DOM.td( {style:{width:lw+'px', height:th+'px'}} , left_header),
                        React.DOM.td( {style:{width: rw+'px', height:th+'px'}} , 
                            React.DOM.div( {style:{width: rw+'px',height:th+'px', overflowX: 'hidden', overflowY: 'hidden'} , ref:"right_header", onScroll:this.handleScroll} , right_header)
                        )
                    ),
                    React.DOM.tr({},
                        React.DOM.td({} , 
                            React.DOM.div( {style:{width:lw+'px',height:bh+'px', overflowX: 'hidden', overflowY: 'hidden'} , ref:"left_body"} , left_body)
                        ),
                        React.DOM.td({} , 
                            React.DOM.div( {style:{width: rw+'px',height:bh+'px', overflowX: 'scroll', overflowY: 'scroll'} , ref:"right_body", onScroll:this.handleScroll} , right_body)
                        )
                    )
                
                );

            return React.DOM.div( { style:{ width:w+'px', height:h+'px',overflowX: 'hidden', overflowY: 'hidden'} }, container);
        }
    });
        
    return exports;
}));
