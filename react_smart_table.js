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
        div.style.position = 'relative';
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
                width:200,
                height:200,                
                overflowX:"hidden",
                overflowY:"hidden",
                rows:[ 80,80,80,80,80,80 ],
                columns:[ 60,60,60,60, 60, 60, 60, 60, 60],
                cellRenderer : function(row, col, width, height) {
                    return  row+":"+col;
                },
                onScroll:null,
            };
        },
        getInitialState: function() {
            return {
                scrollTop:0,
                scrollLeft:0,
                width:this.props.width,
                height:this.props.height
            };
        },
        componentWillMount: function() {
            this.SB = detectScrollbarWidthHeight();
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
        getVisibleSlice2: function (extents, x_start, x_end)
        {
            //assert extents.length > 0
            var i=0, len = extents.length;
            while( i<len && extents[i] < x_start) { i++; }
            var beginID = Math.max(0, i-1);
            var beginSpacer = extents[beginID];
            while( i<len && extents[i] < x_end) { i++; }
            var endID = Math.min(i, len-1);            
            var endSpacer = extents[len-1]-extents[endID];            

            var ret= {
                from:beginID,
                to:endID,
                beforeSize:beginSpacer,
                afterSize:endSpacer
            };
            return ret;
        },
        getVisibleSlice: function (extents, minVal, maxVal)
        {
            var i=1, len = extents.length;
            if(extents<2) 
                return {begin:0, end:0};
            
            while( i<len && extents[i] < minVal) { i++;}
            var begin = i-1;            
            while( i<len && extents[i] < maxVal) { i++; }                   
            var end = i;                   
            return {begin:begin, end:end};
        },
        cellRenderer : function(key, row, col, width, height) {
            var style = {
                display:"inline-block",
                width:width,
                height:height
            };
            return React.DOM.div( {style:style, key:key} , this.props.cellRenderer(row, col, width, height));
        },
        cellRenderer2 : function(key, row, col, x, y, width, height) {
            var style = {                
                //position:"absolute",
                left: x,
                top: y,
                width:width,
                height:height
                //overflowX: 'hidden',
                //overflowY: 'hidden'
            };
            return React.DOM.div( {style:style, key:key, className:"rst_cell"} , this.props.cellRenderer(row, col, width, height));
        },
        handleScroll: function(e) {           
            this.setState({
                scrollTop :e.target.scrollTop,
                scrollLeft:e.target.scrollLeft
            });
            if(this.props.onScroll)
                this.props.onScroll(e);
        },
        render2: function() {
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

            var inner_rows = [];
            var keyID=0;
            // compute central cells
            for(var row = rowSlice.from; row <= rowSlice.to; ++row) {
                var inner_cols = [];
                for(var col = colSlice.from; col <= colSlice.to; ++col) {
                    inner_cols.push(this.cellRenderer(keyID, row, col, this.props.rows[row], this.props.columns[col]  ));
                    keyID++;
                }
                inner_rows.push( React.DOM.div( {style:{width:midWidth}, key:row }, inner_cols ));
            }

              
           


            var top_spacer =  React.DOM.div( {style:{width:innerWidth, height:topHeight}});

            var left_spacer =  React.DOM.div( { style:{ background:"blue", display:"inline-block", width:leftWidth, height:midHeight }});
            var center_block =  React.DOM.div( {style:{background:"red", display:"inline-block", width:midWidth, height:midHeight }}, inner_rows);
            var right_spacer = React.DOM.div( {style:{background:"green", display:"inline-block", width:rightWidth, height:midHeight }});

            var mid_block = React.DOM.div({style:{width:innerWidth}},
                (leftWidth>0) ? left_spacer: null,
                (midWidth>0) ? center_block: null,
                (rightWidth>0) ? right_spacer: null
            );

            var bottom_spacer =  React.DOM.div( {style:{width:innerWidth, height:botHeight}});

             var container =
                React.DOM.div( { style:{display: 'inline-block'} },
                    (topHeight>0) ? top_spacer: null,
                    (midHeight>0) ? mid_block: null,
                    (botHeight>0) ? bottom_spacer: null

                );                
            return React.DOM.div( 
                {   scrollTop:this.state.scrollTop,
                    scrollLeft:this.state.scrollLeft, 
                    style:{ 
                        width:width, 
                        height:height,
                        overflowX:this.props.overflowX, 
                        overflowY:this.props.overflowY
                    },
                    onScroll:this.handleScroll
                }, container);
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
           
            var cells = [];            
            // compute central cells            
            for(var row = rowSlice.begin; row < rowSlice.end; ++row) {       
                var keyID = (row -rowSlice.begin) * this.props.columns.length;         
                for(var col = colSlice.begin; col < colSlice.end; ++col) {
                    cells.push(this.cellRenderer2(keyID + col, row, col, this.colsExtents[col], this.rowsExtents[row], this.props.columns[col] , this.props.rows[row] ));                    
                }
            }
                        
            return React.DOM.div( 
                {   scrollTop:this.state.scrollTop,
                    scrollLeft:this.state.scrollLeft, 
                    style:{ 
                        width:width, 
                        height:height,
                        overflowX:this.props.overflowX, 
                        overflowY:this.props.overflowY
                    },
                    onScroll:this.handleScroll
                }, React.DOM.div( {style:{ position:"relative", width:innerWidth, height:innerHeight}}, cells)
            );
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
        render2: function() {
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
                var style = {width:80};
                var cell = React.DOM.th({key:i, onClick:this.sortColumn(col), className:this.sortClass(col), style:style}, col);
                left_th_list.push(cell);
            }

            var right_th_list = [];
            for (var i = fixed_col_count, len = columns.length; i<len; i++) {
                var col = columns[i];
                var style = {width:80};
                var cell = React.DOM.th({key:i, onClick:this.sortColumn(col), className:this.sortClass(col), style:style}, col);
                right_th_list.push(cell);
            }

            var left_tr_list = [];
            for (var j = 0, len = dataCopy.length; j<len; j++) {
                var item  = dataCopy[j];
                var td_list = [];

                for (var i = 0; i<fixed_col_count; i++) {
                    var col = columns[i];
                    var style = {width:80};
                    var cell = React.DOM.td({key:i, style:style}, item[col]);
                    td_list.push(cell);
                }

                var style = {};
                var cell = React.DOM.tr({key:j, style:style}, td_list);
                left_tr_list.push(cell);
            }

            var right_tr_list = [];
            var style = {
                width: ((columns.length - fixed_col_count) * 80) ,
                height: (dataCopy.length * 20)
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
                React.DOM.table( { style:{tableLayout:'fixed', width:w, height:h} },
                    React.DOM.tr({},
                        React.DOM.td( {style:{width:lw}} , left_header),
                        React.DOM.td({} ,
                            React.DOM.div( {style:{width: rw,height:th, overflowX: 'hidden', overflowY: 'hidden'} , ref:"right_header", onScroll:this.handleScroll} , right_header)
                        )
                    ),
                    React.DOM.tr({},
                        React.DOM.td({} ,
                            React.DOM.div( {style:{width:lw,height:bh, overflowX: 'hidden', overflowY: 'hidden'} , ref:"left_body"} , left_body)
                        ),
                        React.DOM.td({} ,
                            React.DOM.div( {style:{width: rw,height:bh, overflowX: 'scroll', overflowY: 'scroll'} , ref:"right_body", onScroll:this.handleScroll} , right_body)
                        )
                    )

                );
        },
        render:function() {                
            var prop = {      
                width:1500,
                height:800,
                overflowX:"scroll",
                overflowY:"scroll",
                rows:[],
                columns:[],
                cellRenderer : function(row, col, width, height) {
                    return  row+":"+col;
                },
                onScroll:function(e) { 
                    //console.log('scroll'); 
                }
            };

            var rows = 500;
            var cols = 50;

            for (var i =0; i< rows; i++)
                prop.rows.push( 25 );                    
        
            for (var i =0; i< cols; i++)
                prop.columns.push( 40 );

            var G = React.createFactory(Grid);
            return G( prop );
        }
        
    });

    return exports;
}));
