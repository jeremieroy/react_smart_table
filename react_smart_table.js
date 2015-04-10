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

    var Grid = exports.Grid = React.createClass({displayName: "Grid",
        getDefaultProps: function() {
            return {
                rows:[ 100,100,100,100,100,100 ],
                columns:[ 50,50,50,50, 50, 50, 50, 50, 50],
                cellRenderer : function(col, row, width, height) {
                    var style = {
                        width:width+"px",
                        height:height+"px"
                    };
                    return React.DOM.td( {style:style} , "col: "+col+"  row:"+row);
                }
            };
        },
        getInitialState: function() {
            this.SB = detectScrollbarWidthHeight();
            this.computeExtents();
            return {
                scrollTop:125,
                scrollLeft:125,
                width:200,
                height:200
            };
        },
        componentDidMount: function() {
            this.computeExtents();
        },
        computeExtents: function() {
            var rowsExtents = [0];
            var colsExtents = [0];
            var val = 0;
            for(var i=0, len = this.props.rows.length ; i<len; i++) {
                val+=this.props.rows[i];
                rowsExtents.push(val);
            }

            val = 0;
            for(var i=0, len = this.props.columns.length ; i<len; i++) {
                val+=this.props.columns[i];
                colsExtents.push(val);
            }

            this.rowsExtents = rowsExtents;
            this.colsExtents = colsExtents;
        },
        getVisibleSlice: function (extents, x_start, x_end)
        {
            console.log('getIndex'+ extents+"  --> "+x_start+" "+x_end);

            //assert extents.length > 0
            var i=0, len = extents.length;
            while( i<len && extents[i] < x_start) { i++; }
            var beginID = Math.max(0, i-1);
            var beginSpacer = extents[beginID];
            while( i<len && extents[i] < x_end) { i++; }
            var endID = Math.max(0, i-1);
            var endSpacer = extents[len-1] - extents[i];

            return {
                from:beginID,
                to:endID,
                beforeSize:beginSpacer,
                afterSize:endSpacer
            }
        },
        handleScroll: function(e) {
            var right_header = this.refs.right_header.getDOMNode();
            var left_body = this.refs.left_body.getDOMNode();
            var right_body = this.refs.right_body.getDOMNode();
            right_header.scrollLeft = right_body.scrollLeft;
            left_body.scrollTop = right_body.scrollTop;
            this.setState({
                scrollTop :right_body.scrollTop,
                scrollLeft:right_body.scrollLeft
            });

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
            // viewport size
            var width = this.state.width;
            var height = this.state.height;
            // inner frame
            var innerWidth = this.colsExtents[this.colsExtents.length-1];
            var innerHeight = this.rowsExtents[this.rowsExtents.length-1];
            // inner frame  decal
            var scrollLeft = this.state.scrollLeft;
            var scrollTop = this.state.scrollTop;

            var rowSlice = this.getVisibleSlice(this.rowsExtents, scrollTop, scrollTop + height);
            var colSlice = this.getVisibleSlice(this.colsExtents, scrollLeft, scrollLeft + width);

            var topHeight = rowSlice.beforeSize;
            var botHeight = rowSlice.afterSize;
            var midHeight = innerHeight - topHeight - botHeight;
            var leftWidth = colSlice.beforeSize;
            var rightWidth = colSlice.afterSize;
            var midWidth = innerWidth - leftWidth - rightWidth;

            var top_spacer =  React.DOM.div( {style:{width:innerWidth+'px', height:topHeight+'px'}});

            var left_spacer =  React.DOM.div( { style:{ background:"blue", display:"inline-block", width:leftWidth+'px', height:midHeight +'px'}});
            var center_block =  React.DOM.div( {style:{background:"red", display:"inline-block", width:midWidth+'px', height:midHeight +'px'}});
            var right_spacer = React.DOM.div( {style:{background:"green", display:"inline-block", width:rightWidth+'px', height:midHeight +'px'}});

            var mid_block = React.DOM.div({style:{width:innerWidth+'px'}},
                (leftWidth>0) ? left_spacer: null,
                (midWidth>0) ? center_block: null,
                (rightWidth>0) ? right_spacer: null
            );

            var bottom_spacer =  React.DOM.div( {style:{width:innerWidth+'px', height:botHeight+'px'}});

             var container =
                React.DOM.div( { style:{display: 'inline-block'} },
                    (topHeight>0) ? top_spacer: null,
                    (midHeight>0) ? mid_block: null,
                    (botHeight>0) ? bottom_spacer: null

                );
            return React.DOM.div( { scrollTop:this.state.scrollTop,scrollLeft:this.state.scrollLeft, style:{ width:width+'px', height:height+'px',overflowX: 'hidden', overflowY: 'hidden'} }, container);
        }
    });

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
                sortColumn: "id",
                scrollTop:0,
                scrollLeft:0,
                innerWidth:1850,
                innerHeight:900
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
            this.setState({
                scrollTop :right_body.scrollTop,
                scrollLeft:right_body.scrollLeft
            });

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
        getVP: function(w, h){
            var view_width = this.state.innerWidth;
            var view_height = this.state.innerHeight;
            var in_width = this.state.innerWidth;
            var in_height = this.state.data

            var h = this.state.innerHeight;

            var top = this.state.scrollTop;
            var left = this.state.scrollLeft;

            var lw = fixed_col_count*80;
            var rw = w-lw;
            var th = 25;
            var bh = h-th;

            var h_min_idx = Math.ceil(w/80);
            var h_max_idx = Math.ceil(w/80);


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

            var w = this.state.innerWidth;
            var h = this.state.innerHeight;

            var top = this.state.scrollTop;
            var left = this.state.scrollLeft;

            var lw = fixed_col_count*80;
            var rw = w-lw;
            var th = 25;
            var bh = h-th;

            var h_min_idx = Math.ceil(w/80);
            var h_max_idx = Math.ceil(w/80);

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
            var style = {
                width: ((columns.length - fixed_col_count) * 80) +'px',
                height: (dataCopy.length * 20)+'px'
            };
            var cell = React.DOM.tr({key:0},
                React.DOM.td({key:0, style:style}));
            right_tr_list.push(cell);
            /*
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
            }*/


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

            var right_body =
                React.DOM.table({ style:{tableLayout:'fixed', width:"100%", height:"100%"} }, right_tr_list
                );

            var container =
                React.DOM.table( { style:{tableLayout:'fixed', width:w+'px', height:h+'px'} },
                    React.DOM.tr({},
                        React.DOM.td( {style:{width:lw+'px'}} , left_header),
                        React.DOM.td({} ,
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

            var G = React.createFactory(Grid);
            //return React.DOM.div( { style:{ width:w+'px', height:h+'px',overflowX: 'hidden', overflowY: 'hidden'} }, container);
            return G( {} );
        }
    });

    return exports;
}));
