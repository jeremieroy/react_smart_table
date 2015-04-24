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
        var d = {
            width: div.offsetWidth - div.clientWidth,
            height: div.offsetHeight - div.clientHeight
        };
        document.body.removeChild(div);
        return d;
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

                defaultColumn:{
                    width:60,
                    dataKey:"id",
                    cellDataGetter:function(rowData, rowIndex, column, columnIndex) {
                        return rowData[column.dataKey];
                    },
                    cellRenderer:function(cellData, rowData, rowIndex, column, columnIndex) {
                        return cellData;
                    }
                },
                columns:[],
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
                var column = this.props.columns[i];
                val += ("width" in column) ? column.width : this.props.defaultColumn.width;
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
                for(var columnIndex = colSlice.begin; columnIndex < colSlice.end; columnIndex++) {
                    var column = this.props.columns[columnIndex];
                    var cellData = ('cellDataGetter' in column)? 
                            column.cellDataGetter(rowData, rowIndex, column, columnIndex):
                            this.props.defaultColumn.cellDataGetter(rowData, rowIndex, column, columnIndex);

                    var cellElem = ('cellRenderer' in column)?
                            column.cellRenderer(cellData, rowData, rowIndex, column, columnIndex):
                            this.props.defaultColumn.cellRenderer(cellData, rowData, rowIndex, column, columnIndex);

                    var style = {
                        //position:"absolute",
                        //overflowX: 'hidden',
                        //overflowY: 'hidden',
                        left: this.colsExtents[columnIndex],
                        top: this.rowsExtents[rowIndex],
                        width: ("width" in column) ? column.width : this.props.defaultColumn.width,
                        height: this.props.rowHeightGetter(rowIndex)
                    };
                    cells.push( React.DOM.div( {style:style, key:reactKeyBase+columnIndex, className:"rst_cell"}, cellElem) );
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
    
    return exports;
}));
