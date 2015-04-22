/*
Extrapolate columns from data
Colums are sortables (js or SQL)
Header stay visible (stick on screen limited by area)
Table is filtrable per column.
standard search widgets for columns header :
daterange
numericrange
multiselect sur categorical
text seach
Rows can use custom component
Cell can use custom component (blank cells are grayed by default)
Visibles Columns are selectables via dropdown select
Data is paginable for sql paginated data,
Record count is always visible
Pagination is shown

*/


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

    // render a row * col Grid with optional scrolling
    // only render what is in viewport
    var G = React.createClass({displayName: "Grid",
        getDefaultProps: function() {
            return {
                width:200,  // fixed width
                height:200, // fixed height
                x: 0,
                y: 0,
                overflowX:"hidden", // 'hidden', 'auto', 'overflow'
                overflowY:"hidden", // 'hidden', 'auto', 'overflow'
                // return the number of rows
                rowsCountGetter: function(){ return 0; },
                // return the data associated with the row[index]
                rowDataGetter: function(index) { return {}; },
                // return the height of the row[index]
                rowHeightGetter: function(index) { return 30; },

                columns:[{
                    width:60,
                    cellRenderer:function(rowData, rowIndex, column, columnIndex) {
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

            var rowsExtents = [0];
            val = 0;
            for(var i=0, len = this.props.rowsCountGetter(); i<len; i++) {
                val+=this.props.rowHeightGetter(i);
                rowsExtents.push(val);
            }
            this.rowsExtents = rowsExtents;
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

            // inner frame size
            var innerWidth = this.colsExtents[this.colsExtents.length-1];
            var innerHeight = this.rowsExtents[this.rowsExtents.length-1];

            // inner frame decal
            var scrollLeft = this.state.scrollLeft;
            var scrollTop = this.state.scrollTop;

            var rowSlice = this.getVisibleSlice(this.rowsExtents, scrollTop, scrollTop + height);
            var colSlice = this.getVisibleSlice(this.colsExtents, scrollLeft, scrollLeft + width);

            var cells = [];

            // compute central cells
            for(var rowIndex = rowSlice.begin; rowIndex < rowSlice.end; rowIndex++) {
                var rowData = this.props.rowDataGetter(rowIndex);

                var reactKeyBase = (rowIndex-rowSlice.begin) * this.props.columns.length;
                for(var colIndex = colSlice.begin; colIndex < colSlice.end; colIndex++) {
                    var column = this.props.columns[colIndex];
                    var cellElem = column.cellRenderer(rowData, rowIndex, column, colIndex);

                    var style = {
                        //position:"absolute",
                        //overflowX: 'hidden',
                        //overflowY: 'hidden',
                        left: this.colsExtents[colIndex],
                        top: this.rowsExtents[rowIndex],
                        width: column.width,
                        height: this.props.rowHeightGetter(rowIndex)
                    };
                    cells.push( React.DOM.div( {style:style, key:reactKeyBase+colIndex, className:"rst_cell"}, cellElem) );
                }
            }

            return React.DOM.div(
                {   scrollTop:scrollTop,
                    scrollLeft:scrollLeft,
                    style:{
                        position:"absolute",
                        left:this.props.x,
                        top:this.props.y,
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

    var Grid = exports.Grid = React.createFactory(G);

    var T = React.createClass({displayName: "Table",
        getDefaultProps: function() {
            return {
                width:200,  // fixed width
                height:200, // fixed height
                defaultColumnWidth:80, // default width when no width is given
                headerHeight:30,       // height of the header
                generateColumns:true,  // generate columns from the first elem in data

                data:[],
                // return the number of rows
                rowsCountGetter: function(){ return this.data.length; },
                // return the data associated with the row[index]
                rowDataGetter: function(index) { return this.data[index]; },
                // return the class that must be used of the row[index]
                rowClassGetter: function(index){ return "row"; },

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
        handleLeftBodyScroll: function(e) {
            this.refs.right_body.getDOMNode().scrollTop = e.target.scrollTop;
            this.refs.right_body.setState({ scrollTop: e.target.scrollTop});
        },
        handleRightBodyScroll: function(e) {
            this.refs.left_body.setState({scrollTop: e.target.scrollTop});
            this.refs.left_body.getDOMNode().scrollTop = e.target.scrollTop;

            this.refs.right_header.setState({scrollLeft: e.target.scrollLeft});
            this.refs.right_header.getDOMNode().scrollLeft = e.target.scrollLeft;
        },
        headerRenderer:function(rowData, rowIndex, column, columnIndex) {
            if('label' in rowData)
                return rowData.label;
            else
                return rowData.dataKey;
        },
        render:function() {
            var grids = [];
            var fixedWidth = 0;

            /*
            var cellData = (column.cellDataGetter) ?
                column.cellDataGetter(column.dataKey, rowData):
                rowData[column.dataKey];
            var cellElem = (column.cellRenderer) ?
                column.cellRenderer(cellData, rowData, rowIndex, column, colIndex):
                cellData;
            */

            //compute left header and left body
            if( this.props.fixedColumns.length > 0 )
            {
                var headerColumns = [];
                var bodyColumns = [];
                for(var i=0; i< this.props.fixedColumns.length;++i) {
                    var column = this.props.fixedColumns[i];
                    if(!("width" in column))
                        column.width = this.props.defaultColumnWidth;

                    fixedWidth += column.width;

                    headerColumns.push({
                        width: column.width,
                        cellRenderer:this.headerRenderer
                    });

                    bodyColumns.push({
                        width: column.width,
                        cellRenderer:function(rowData, rowIndex, column, columnIndex) {
                            return columnIndex + ':' + rowIndex;
                        }
                    });
                }

                var left_header_prop = {
                    key: "left_header",
                    ref: "left_header",
                    width: fixedWidth,
                    height: this.props.headerHeight,
                    x:0,
                    y:0,
                    overflowX: "hidden",
                    overflowY: "hidden",
                    rowsCountGetter: function(){ return this.data.length; },
                    rowDataGetter: function(index) { return this.data[index]; },
                    rowHeightGetter: function(index) { return this.height; },
                    columns: headerColumns,
                    data: this.props.fixedColumns
                };
                grids.push(Grid( left_header_prop ));
        // --------------------------------------------------------
                var left_body_prop = {
                    key: "left_body",
                    ref: "left_body",
                    width: fixedWidth,
                    height: this.props.height - this.props.headerHeight,
                    x:0,
                    y:this.props.headerHeight,
                    overflowX: "hidden",
                    overflowY: "hidden",
                    rowsCountGetter: function(){ return this.data.length; },
                    rowDataGetter: function(index) { return this.data[index]; },
                    rowHeightGetter: this.props.rowHeightGetter,
                    columns: bodyColumns,
                    data: this.props.data
                    //onScroll: this.handleLeftBodyScroll
                };
                grids.push(Grid( left_body_prop ));
        // --------------------------------------------------------
            }

            //compute left header and left body
            if( this.props.columns.length > 0 )
            {
                var headerColumns = [];
                var bodyColumns = [];
                for(var i=0; i< this.props.columns.length;++i) {
                    var column = this.props.columns[i];
                    if(!("width" in column))
                        column.width = this.props.defaultColumnWidth;


                    headerColumns.push({
                        width: column.width,
                        cellRenderer:this.headerRenderer
                    });

                    bodyColumns.push({
                        width: column.width,
                        cellRenderer:function(rowData, rowIndex, column, columnIndex) {
                            return columnIndex + ':' + rowIndex;
                        }
                    });
                }

                var right_header_prop = {
                    key: "right_header",
                    ref: "right_header",
                    width: this.props.width-fixedWidth,
                    height: this.props.headerHeight,
                    x:fixedWidth,
                    y:0,
                    overflowX: "hidden",
                    overflowY: "hidden",
                    rowsCountGetter: function(){ return this.data.length; },
                    rowDataGetter: function(index) { return this.data[index]; },
                    rowHeightGetter: function(index) { return this.height; },
                    columns: headerColumns,
                    data: this.props.columns
                };
                grids.push(Grid( right_header_prop ));

                var right_body_prop = {
                    key: "right_body",
                    ref: "right_body",
                    width: this.props.width-fixedWidth,
                    height: this.props.height - this.props.headerHeight,
                    x:fixedWidth,
                    y:this.props.headerHeight,
                    overflowX: "scroll",
                    overflowY: "scroll",
                    rowsCountGetter: function(){ return this.data.length; },
                    rowDataGetter: function(index) { return this.data[index]; },
                    rowHeightGetter: this.props.rowHeightGetter,
                    columns: bodyColumns,
                    data: this.props.data,
                    onScroll: this.handleRightBodyScroll
                };
                grids.push(Grid( right_body_prop ));
            }

            var table_elem = React.DOM.div({key:"table", style:{position:"relative"}}, grids);
            return table_elem;
        }

    });

    var Table = exports.Table = React.createFactory(T);

    return exports;
}));
