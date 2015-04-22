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

    var T = React.createClass({displayName: "Table",
        getDefaultProps: function() {
            return {
                width:200,  // fixed width
                height:200, // fixed height                
                headerHeight:30,       // height of the header
                autoGenerateColumns:false,  // generate columns from the first elem in data

                data:[],
                // return the number of rows
                rowsCountGetter: function(){ return this.data.length; },
                // return the data associated with the row[index]
                rowDataGetter: function(index) { return this.data[index]; },
                // return the class that must be used of the row[index]
                rowClassGetter: function(index){ return "row"; },
                // generate columns from the data
                autoColumnsGetter: function() {
                    var columnsField = Object.keys(this.data[0]);
                    var columns = [];
                    for(var i=0;i<columnsField.length;i++) {
                        columns.push({ dataKey: columnsField[i] });
                    }
                    return columns;
                },
                defaultColumn:{
                    dataKey:"id",
                    label:"Id",
                    width:60,
                    isVisible:true,
                    cellDataGetter:function(rowData, rowIndex, column, columnIndex) {
                        return rowData[column.dataKey];
                    },
                    cellRenderer:function(cellData, rowData, rowIndex, column, columnIndex) {
                        return cellData;
                    },
                    headerRenderer:function(column, columnIndex) {
                        if('label' in column)
                            return column.label;
                        else
                            return column.dataKey;
                    }
                },
                fixedColumns:[],
                columns:[],
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
                scrollTop:0,
                scrollLeft:0,
                sortOrderAscending: true,
                sortColumn: "id",
                visibleColumns:[],
                visibleFixedColumns:[]
            };
        },
        componentWillMount: function() {
            this.SB = detectScrollbarWidthHeight();
            this.initColumnState();
               
        },
        componentWillReceiveProps: function(nextProps) {
            this.initColumnState();
        },
        initColumnState: function() {
            var fixedColumns = [];
            var columns = [];
            var keys = {}; 
            for(var i=0, len = this.props.fixedColumns.length ; i<len; i++) {
                var column = this.props.fixedColumns[i];
                keys[column.dataKey] = true;
                fixedColumns.push(column);
            }

            for(var i=0, len = this.props.columns.length ; i<len; i++) {
                var column = this.props.columns[i];
                keys[column.dataKey] = true;
                columns.push(column);
            }
            
            var generatedColumns = (this.props.autoGenerateColumns) ? this.props.autoColumnsGetter() : [];
            for(var i=0, len = generatedColumns.length; i<len; i++) {
                var column = generatedColumns[i];
                if(!(column.dataKey in keys) ){
                    keys[column.dataKey] = true;
                    columns.push(column);
                }                
            }

            this.fixedColsExtents = this.computeColumnExtents(fixedColumns);
            this.colsExtents = this.computeColumnExtents(columns);
            this.rowsExtents = this.computeRowExtents();

            this.setState( { 
                visibleFixedColumns:fixedColumns,
                visibleColumns:columns
            });
        },
        computeColumnExtents: function(columns) {
            var extents = [0], val = 0;
            for(var i=0, len = columns.length ; i<len; i++) {
                val += ("width" in columns[i]) ? columns[i].width : this.props.defaultColumn.width;
                extents.push(val);
            }
            return extents;
        },
        computeRowExtents: function() {
            var extents = [0], val = 0;
            for(var i=0, len = this.props.rowsCountGetter(); i<len; i++) {
                val+=this.props.rowHeightGetter(i);
                extents.push(val);
            }
            return extents;
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
        getColumns: function() {
            var columns = Object.keys(this.props.data[0]);
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
        handleRightBodyScroll: function(e) {
            this.setState({
                scrollTop :e.target.scrollTop,
                scrollLeft:e.target.scrollLeft
            });
            this.refs.left_body.getDOMNode().scrollTop = e.target.scrollTop;            
            this.refs.right_header.getDOMNode().scrollLeft = e.target.scrollLeft;
        },
        renderHeader: function(colSlice, columns, extents) {
            var cells = [];
            for(var i = colSlice.begin; i<colSlice.end; i++) {
                var column = columns[i];
                var cellElem = ('headerRenderer' in column)?
                        column.headerRenderer(column, i):
                        this.props.defaultColumn.headerRenderer(column, i);

                var style = {
                    //position:"absolute",
                    //overflowX: 'hidden',
                    //overflowY: 'hidden',
                    top: 0,
                    left: extents[i], 
                    width: extents[i+1]-extents[i], 
                    height: this.props.headerHeight
                };                
                cells.push( React.DOM.div( {style:style, key:i, className:"rst_cell"}, cellElem) );
            }
            return cells;
        },
        renderBody: function(colSlice, rowSlice, columns, extents) {
            var cells = [];       
            for(var j = rowSlice.begin; j < rowSlice.end; j++) {
                var rowData = this.props.rowDataGetter(j);
                var reactKeyBase = (j) * columns.length;
                for(var i = colSlice.begin; i < colSlice.end; i++) {
                    var column = columns[i];
                    var cellData = ('cellDataGetter' in column)? 
                            column.cellDataGetter(rowData, j, column, i):
                            this.props.defaultColumn.cellDataGetter(rowData, j, column, i);

                    var cellElem = ('cellRenderer' in column)?
                            column.cellRenderer(cellData, rowData, j, column, i):
                            this.props.defaultColumn.cellRenderer(cellData, rowData, j, column, i);

                    var style = {
                        //position:"absolute",
                        //overflowX: 'hidden',
                        //overflowY: 'hidden',
                        top: this.rowsExtents[j],
                        left: extents[i],                        
                        width:extents[i+1]-extents[i], 
                        height: this.props.rowHeightGetter(j)
                    };
                    cells.push( React.DOM.div( {style:style, key:reactKeyBase+i, className:"rst_cell"}, cellElem) );
                }
            }
            return cells;
        },
        render: function() {
            /*
            this.colsExtents = computeColumnExtents(this.props.columns);
            this.fixedColsExtents = computeColumnExtents(this.props.fixedColumns);
            this.rowsExtents = computeRowExtents();
            */
            // viewport size
            var width = this.props.width;
            var height = this.props.height;

            var headerHeight = this.props.headerHeight;          
            var bodyHeight = height - headerHeight;

            var leftWidth = this.fixedColsExtents[this.fixedColsExtents.length-1];
            var rightWidth = width - leftWidth;

            var innerWidth = this.colsExtents[this.colsExtents.length-1];
            var innerHeight = this.rowsExtents[this.rowsExtents.length-1];

            // right body frame decal
            var scrollLeft = this.state.scrollLeft;
            var scrollTop = this.state.scrollTop;
            
            var rowSlice = this.getVisibleSlice(this.rowsExtents, scrollTop, scrollTop + height);
            var grids = [];            
           
            var columns = this.state.visibleFixedColumns;
            // compute left header cells and left body cells
            if( columns.length > 0 )
            {
                var colSlice = {begin:0, end: columns.length};                
                var headerCells = this.renderHeader(colSlice, columns, this.fixedColsExtents);
                var bodyCells = this.renderBody(colSlice, rowSlice, columns, this.fixedColsExtents);                

                var header = 
                    React.DOM.div({
                        key: "left_header",
                        ref: "left_header",
                        style:{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: leftWidth,
                            height: headerHeight                            
                        }
                        //,onScroll:this.handleScroll
                    }, React.DOM.div( {style:{ position: "relative", width: leftWidth, height: headerHeight}}, headerCells)
                );                    

                var body = 
                    React.DOM.div({
                        key: "left_body",
                        ref: "left_body",
                        style:{
                            position: "absolute",
                            left: 0,
                            top: headerHeight,
                            width: leftWidth,
                            height: bodyHeight,                            
                            overflowY:"hidden"
                        }
                        //,onScroll:this.handleScroll
                    }, React.DOM.div( {style:{ position:"relative", width:leftWidth, height:innerHeight}}, bodyCells)
                );   
                grids.push(header);
                grids.push(body);
            }

            //var rightColumns = this.getAllColumns();

            columns = this.state.visibleColumns;
            // compute right header cells and right body cells
            if( columns.length > 0 )
            {
                var colSlice = this.getVisibleSlice(this.colsExtents, scrollLeft, scrollLeft + rightWidth);                
                var headerCells = this.renderHeader(colSlice, columns, this.colsExtents);
                var bodyCells = this.renderBody(colSlice, rowSlice, columns, this.colsExtents);                

                var header =
                    React.DOM.div({
                        key: "right_header",
                        ref: "right_header",
                        style:{
                            position: "absolute",
                            left: leftWidth,
                            top: 0,
                            width: rightWidth,
                            height: headerHeight,
                            overflowX: "hidden"
                        }
                        //,onScroll:this.handleScroll
                    }, React.DOM.div( {style:{ position: "relative", width: rightWidth, height: headerHeight}}, headerCells)
                );

                var body = 
                    React.DOM.div({
                        key: "right_body",
                        ref: "right_body",
                        style:{
                            position: "absolute",
                            left: leftWidth,
                            top: headerHeight,
                            width: rightWidth,
                            height: bodyHeight,                            
                            overflowX: "scroll",
                            overflowY: "scroll"
                        }
                        ,onScroll:this.handleRightBodyScroll
                    }, React.DOM.div( {style:{ position:"relative", width:innerWidth, height:innerHeight}}, bodyCells)
                );   
                grids.push(header);
                grids.push(body);
            }           

            var table_elem = React.DOM.div({key:"table", style:{position:"relative"}}, grids);
            return table_elem;           
        }

    });

    var Table = exports.Table = React.createFactory(T);

    return exports;
}));
