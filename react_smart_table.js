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

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val))
    }

    var Grid = exports.Grid = React.createClass({displayName: "Grid",
        getDefaultProps: function() {
            return {
                width:200,  // fixed width
                height:200, // fixed height
                overflowX:"hidden", // 'hidden', 'auto', 'overflow'
                overflowY:"hidden", // 'hidden', 'auto', 'overflow'
                // optional dataset, to use with default getters below
                data:[],
                // return the number of rows
                rowsCountGetter: function(){ return this.data.length; },
                // return the data associated with the row[index]
                rowDataGetter: function(index) { return this.data[index]; },
                // return the class that must be used of the row[index]
                rowClassGetter: function(index){ return "row"; },
                rowHeight:30, // should be a getter ?
                columns:[{
                    width:60,
                    dataKey:'id', //could be a number
                    cellDataGetter:function(key, rowData) {
                        return  rowData[key];
                    },
                    cellRenderer:function(cellData, rowData, rowIndex, column, columnIndex) {
                        //column.dataKey
                        return columnIndex+':'+rowIndex+'='+cellData;
                    }
                }],
                onScroll:null,
            };
        },
        getInitialState: function() {
            return {
                scrollTop:0,
                scrollLeft:0
            };
        },
        componentWillMount: function() {
            this.SB = detectScrollbarWidthHeight();
            this.computeExtents();
        },
        computeExtents: function() {
            var colsExtents = [0];
            var val = 0;
            for(var i=0, len = this.props.columns.length ; i<len; i++) {
                val+=this.props.columns[i].width;
                colsExtents.push(val);
            }
            this.colsExtents = colsExtents;
        },
        getVisibleSlice: function (extents, minVal, maxVal)
        {
            var i=1, len = extents.length;
            if(len<2)
                return {begin:0, end:0};

            while( i<len && extents[i] < minVal) { i++;}
            var begin = i-1;

            len--;
            while( i<len && extents[i] < maxVal) { i++; }
            var end = i;// Math.min(i,len-1);
            return {begin:begin, end:end};
        },
        handleScroll: function(e) {
            this.setState({
                scrollTop :e.target.scrollTop,
                scrollLeft:e.target.scrollLeft
            });
            if(this.props.onScroll)
                this.props.onScroll(e);
        },
        render: function() {
            // viewport size
            var width = this.props.width;
            var height = this.props.height;

            var rowCount = this.props.rowsCountGetter();

            // inner frame size
            var innerWidth = this.colsExtents[this.colsExtents.length-1];
            var innerHeight = rowCount * this.props.rowHeight;

            // inner frame decal
            var scrollLeft = this.state.scrollLeft;
            var scrollTop = this.state.scrollTop;

            var rowSlice = {};
            rowSlice.begin = clamp(Math.floor(scrollTop / this.props.rowHeight), 0, rowCount-1);
            rowSlice.end = clamp(Math.ceil((scrollTop+height) / this.props.rowHeight), 0, rowCount-1);

            //var rowSlice = this.getVisibleSlice(this.rowsExtents, scrollTop, scrollTop + height);
            var colSlice = this.getVisibleSlice(this.colsExtents, scrollLeft, scrollLeft + width);

            var cells = [];

            // compute central cells
            for(var rowIndex = rowSlice.begin; rowIndex < rowSlice.end; rowIndex++) {
                var rowData = this.props.rowDataGetter(rowIndex);

                var reactKeyBase = (rowIndex-rowSlice.begin) * this.props.columns.length;
                for(var colIndex = colSlice.begin; colIndex < colSlice.end; colIndex++) {
                    var column = this.props.columns[colIndex];
                    var cellData = (column.cellDataGetter) ?
                        column.cellDataGetter(column.dataKey, rowData):
                        rowData[column.dataKey];

                    var cellElem = (column.cellRenderer) ?
                        column.cellRenderer(cellData, rowData, rowIndex, column, colIndex):
                        cellData;

                    var style = {
                        //position:"absolute",
                        //overflowX: 'hidden',
                        //overflowY: 'hidden',
                        left: this.colsExtents[colIndex],
                        top: rowIndex*this.props.rowHeight,
                        width:column.width,
                        height:this.props.rowHeight
                    };
                    cells.push( React.DOM.div( {style:style, key:reactKeyBase+colIndex, className:"rst_cell"}, cellElem) );
                }
            }

            return React.DOM.div(
                {   scrollTop:scrollTop,
                    scrollLeft:scrollLeft,
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
                width:200,  // fixed width
                height:200, // fixed height
                overflowX:"hidden", // 'hidden', 'auto', 'overflow'
                overflowY:"hidden", // 'hidden', 'auto', 'overflow'
                rowsCount: 0, // number of rows
                data:[],
                // return the number of rows
                rowsCountGetter: function(){ return this.data.length; },
                // return the data associated with the row[index]
                rowDataGetter: function(index) { return this.data[index]; },
                // return the class that must be used of the row[index]
                rowClassGetter: function(index){ return "row"; },
                rowHeight:30, // should be a getter ?
                headerHeight:30,
                fixedColumns:[{
                    // required
                    width:60,
                    dataKey:'id', //could be a number
                    // optional
                    label:"Id",
                    cellDataGetter:function(key, rowData) {
                        return  rowData[key];
                    },
                    cellRenderer:function(cellData, rowData, rowIndex, column, columnIndex) {
                        //column.dataKey
                        return columnIndex+':'+rowIndex+'='+cellData;
                    },
                    headerRenderer:function(column, columnIndex) {
                        return column.label;
                    }
                }],
                columns:[{
                    width:60,
                    dataKey:'id', //could be a number
                    cellDataGetter:function(key, rowData) {
                        return  rowData[key];
                    },
                    cellRenderer:function(cellData, rowData, rowIndex, column, columnIndex) {
                        //column.dataKey
                        return columnIndex+':'+rowIndex+'='+cellData;
                    }
                }],

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
            var left_header;
            var right_header;
            var left_body;
            var right_body;


            var rows_count = 5000;
            var cols_count = 200;
            var data = [];
            var columns = [];

            for (var i =0; i< rows_count; i++) {
                data.push( {id:i} );
            }

            for (var i =0; i< cols_count; i++) {
                columns.push({
                    width:100,
                    dataKey:i,
                    cellDataGetter:function(key, rowData) {
                        return  rowData[key];
                    },
                    cellRenderer:function(cellData, rowData, rowIndex, column, columnIndex) {
                        return columnIndex + ':' + rowIndex;
                    }
                });
            }

            var prop = {
                width:1500,
                height:750,
                overflowX:"scroll",
                overflowY:"scroll",
                rowsHeight:30,
                columns:columns,
                data:data,
                cellRenderer : function(row, col, width, height) {
                    return  row+":"+col;
                },
                onScroll:function(e) {
                    //console.log('scroll');
                }
            };

            var G = React.createFactory(Grid);
            return G( prop );
        }

    });

    return exports;
}));
