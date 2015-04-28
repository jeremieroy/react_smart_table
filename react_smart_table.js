/*
Datatable - Extrapolate columns from data
Datatable - Colums are sortables (js or SQL)
Datatable - Header stay visible (stick on screen limited by area)


Datatable - Rows can use custom component
Datatable - Cell can use custom component (blank cells are grayed by default)
Datatable - Visibles Columns are selectables via dropdown select
Datatable - Data is paginable for sql paginated data,
Datatable - Record count is always visible
Datatable - Pagination is shown

*/

// css
/*
table   [fixed size]
- thead
- - tr  [fixed height]
- - - td [fixed width]
- tbody
- - tr
- - - td
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

    function geAbsolutePos(el) {
        // yay readability
        for (var lx=0, ly=0;
             el != null;
             lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
        return {x: lx,y: ly};
    }

/*
    var Header = React.createClass({displayName: "Header",
        getDefaultProps: function() {
            column:null,
        },
        render: function() {

        }
    });

    var Row = React.createClass({displayName: "Header",
        getDefaultProps: function() {
            column:null,
        },
        render: function() {

        }
    });

    var Cell = React.createClass({displayName: "Header",
        getDefaultProps: function() {
            column:null,
        },
        render: function() {

        }
    });
*/


    var T = React.createClass({displayName: "Table",
        getDefaultProps: function() {
            return {
                               // when active, the table expand vertically up to the page bottom
                                 // otherwise, the table expand to the enclosing diff

                width: 'auto',  // width will expand horizontally to the parent border
                height: 'auto', // height will expand vertically to the window border
                headerHeight:30,  // height of the header
                rowHeight:30,     // height of a row
                items:[],
                offsetBottom:5,  // pixel offset to the page bottom when fill is active
                autoGenerateColumns:false,  // generate columns from the first item
                defaultColumnWidth:80,
                // generate columns from the data
                autoColumnsGetter: function() {
                    if(this.items.length == 0) return [];

                    var columnsField = Object.keys(this.items[0]);
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
                sortIconGetter: function(column, isAscending) {
                    //console.log(isAscending);
                    var ascOrDesc = (isAscending) ? "glyphicon glyphicon-triangle-top" : "glyphicon glyphicon-triangle-bottom";
                    return React.DOM.span({style:{position:"absolute", right:5, verticalAlign: "center"}, className:ascOrDesc});
                },
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
                sortOrderAscending: false,
                sortColumn: null,
                visibleColumns:[],
                visibleFixedColumns:[]
            };
        },
        componentWillMount: function() {
            this.SB = detectScrollbarWidthHeight();
            this.initColumnState(this.props);
        },
        componentWillReceiveProps: function(nextProps) {
            this.initColumnState(nextProps);
        },
        componentDidMount: function() {
            console.log("componentDidMount");
            this.updateSize();
            // TODO: handle sizing logic change
            // TODO should this be moved out, it is quite a common need...
            var win = window;
            if (win.addEventListener) {
                win.addEventListener('resize', this.onWindowResize, false);
            } else if (win.attachEvent) {
                win.attachEvent('onresize', this.onWindowResize);
            } else {
                win.onresize = this.onWindowResize;
            }
        },
        onWindowResize:function() {
            clearTimeout(this._updateTimer);
            this._updateTimer = setTimeout(this.updateSize, 16);
        },
        updateSize:function() {
            var container = React.findDOMNode(this);
            var verticalPadding = 0;
            var horizontalPadding = 0;
            // rect is a DOMRect object with four properties: left, top, right, bottom
            var rect = container.getBoundingClientRect();
            console.log(rect);

            var w = this.props.width;
            var h = this.props.height;

            w = container.clientWidth;
            h = container.clientHeight;

/*
            console.log("padding H: "+horizontalPadding+" V: "+verticalPadding);
            // auto size = get size from parent
            if(w == "auto") {
                console.log("W:" + container.offsetWidth+" vs "+container.clientWidth+" vs "+rect.width);
                w = container.clientWidth;
                console.log("set width from parent: "+w);
            }

            if(h == "auto") {
                console.log("H:" + container.offsetHeight+" vs "+container.clientHeight+" vs "+rect.height);
                h = container.clientHeight;
                console.log("set height from parent: "+h);
            }

            if(h == "fill") {
                //compute available space from the window and the table upper position
                var win = window;
                var pos = geAbsolutePos(container);
                console.log(pos.y+" vs "+rect.top);
                h = win.innerHeight - rect.top - this.props.offsetBottom;
                verticalPadding = container.offsetHeight - container.clientHeight;
            }*/

/*
            var fullHeight = this.props.items.length * this.props.rowHeight
                             + this.props.headerHeight;
            console.log("updateSize w: "+w+" h: "+h);
            */

            //w = Math.max(w, this.props.minWidth);
           // h = Math.max(h, this.props.minHeight);

            console.log("updateSize w: "+w+" h: "+h);

            this.setState({
                width: w,
                height: h,
                verticalPadding:verticalPadding,
                horizontalPadding:horizontalPadding
            });
        },
        initColumnState: function(props) {
            var fixedColumns = [];
            var columns = [];
            var keys = {};
            for(var i=0, len = props.fixedColumns.length ; i<len; i++) {
                var column = props.fixedColumns[i];
                keys[column.dataKey] = true;
                fixedColumns.push(column);
            }

            for(var i=0, len = props.columns.length ; i<len; i++) {
                var column = props.columns[i];
                keys[column.dataKey] = true;
                columns.push(column);
            }

            var generatedColumns = (props.autoGenerateColumns) ? props.autoColumnsGetter() : [];
            for(var i=0, len = generatedColumns.length; i<len; i++) {
                var column = generatedColumns[i];
                if(!(column.dataKey in keys) ){
                    keys[column.dataKey] = true;
                    columns.push(column);
                }
            }

            this.setState( {
                visibleFixedColumns:fixedColumns,
                visibleColumns:columns
            });
        },
        computeColumnExtents: function(columns) {
            var extents = [0], val = 0;
            for(var i=0, len = columns.length ; i<len; i++) {
                val += ("width" in columns[i]) ? columns[i].width : this.props.defaultColumnWidth;
                extents.push(val);
            }
            return extents;
        },
        computeRowExtents: function(items) {
            var extents = [0], val = 0;
            for(var i=0, len = items.length; i<len; i++) {
                val+=this.props.rowHeight;
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
        sortColumn: function(column) {
            return function(event) {
                var newSortOrder = (this.state.sortColumn != column)?true:(!this.state.sortOrderAscending);
                this.setState({sortColumn: column, sortOrderAscending:newSortOrder});
            }.bind(this);
        },
        handleRightBodyScroll: function(e) {
            this.setState({
                scrollTop :e.target.scrollTop,
                scrollLeft:e.target.scrollLeft
            }, function(){
                if("left_body" in this.refs){
                    this.refs.left_body.getDOMNode().scrollTop = this.state.scrollTop;
                }
                if("right_header" in this.refs){
                    this.refs.right_header.getDOMNode().scrollLeft = this.state.scrollLeft;
                }
                //force focus on body
                this.refs.right_body.getDOMNode().focus();
            }.bind(this));
        },
        renderHeader: function(colSlice, columns, extents) {
            var rows = [];
            var cells = [];
            var j = 0;
            for(var i = colSlice.begin; i<colSlice.end; i++) {
                var column = columns[i];
                var cellElem = ('headerRenderer' in column)?
                        column.headerRenderer(column, i):
                        this.props.defaultColumn.headerRenderer(column, i);

                var style = {
                    left: extents[i],
                    width: extents[i+1]-extents[i],
                    height: this.props.headerHeight
                };

                var icon = null;
                if(this.state.sortColumn!=null && this.state.sortColumn == column.dataKey){
                    icon = this.props.sortIconGetter(column, this.state.sortOrderAscending);
                }

                cellElem = React.DOM.div({className:"rst_th_wrapper"}, cellElem, icon);


                cells.push( React.DOM.div( {style:style, key:i, className:"rst_th", onClick:this.sortColumn(column.dataKey) }, cellElem) );
            }

            var style = {
                top: 0, height: this.props.headerHeight
            };
            rows.push( React.DOM.div( {style:style, key:j, className:"rst_tr"}, cells) );
            return rows;
        },
        renderBody: function(colSlice, rowSlice, columns, columnsExtents, items, rowsExtents) {
            var rows = [];
            for(var j = rowSlice.begin; j < rowSlice.end; j++) {
                var rowData = items[j];
                var cells = [];
                for(var i = colSlice.begin; i < colSlice.end; i++) {

                    var column = columns[i];
                    var style = {
                        left: columnsExtents[i],
                        width:columnsExtents[i+1]-columnsExtents[i],
                        height: this.props.rowHeight
                    };
                    var className = "rst_td";
                    var cellElem = null;
                    if(column.dataKey in rowData)
                    {
                        var cellData = rowData[column.dataKey];
                        //var cellData = ('cellDataGetter' in column)?
                        //        column.cellDataGetter(rowData, column):
                        //        this.props.defaultColumn.cellDataGetter(rowData, column);
                        cellElem = ('cellRenderer' in column)?
                            column.cellRenderer(cellData, rowData, j, column, i):
                            this.props.defaultColumn.cellRenderer(cellData, rowData, j, column, i);
                    }else{
                       className+=" "+"rst_empty";
                    }


                    cells.push( React.DOM.div( {style:style, key:i, className:className}, cellElem) );
                }
                var style = {
                    top: rowsExtents[j],
                    height: this.props.rowHeight
                };
                rows.push( React.DOM.div( {style:style, key:j, className:"rst_tr"}, cells) );
            }
            return rows;
        },

        render: function() {
            console.log("render");

            if( !("horizontalPadding" in this.state ))
                return React.DOM.div({
                    className:"rst_table",
                    style : {
                        width: this.props.width, height: this.props.height
                    }
            });

            // filter the items
            var filterFunc = function (value) {
              return true;
            }
            var items = this.props.items.filter(filterFunc);
            // sort the items
            var sortedColumn = this.state.sortColumn;
            var order = this.state.sortOrderAscending?1:-1;
            var key = sortedColumn;//this.state.sortColumn.dataKey;

            items.sort( function(x,y){
                return (x[key] === y[key])? 0: (x[key] > y[key] ? order : -order);
            });

            //recompute extents
            var rowsExtents = this.computeRowExtents(items);
            var fixedColumnsExtents = this.computeColumnExtents(this.state.visibleFixedColumns);
            var columnsExtents = this.computeColumnExtents(this.state.visibleColumns);

            // outer size == viewport size
            var width = this.state.width - this.state.horizontalPadding;
            var height = this.state.height - this.state.verticalPadding;
            var headerHeight = this.props.headerHeight;

            var leftWidth = fixedColumnsExtents[fixedColumnsExtents.length-1];
            var innerWidth = columnsExtents[columnsExtents.length-1];

            if(width > innerWidth + leftWidth +this.SB.width)
                width = innerWidth+leftWidth + this.SB.width;


            var rightWidth = width - leftWidth;

            var innerHeight = rowsExtents[rowsExtents.length-1];

            if(this.props.height == "auto")
                height = innerHeight+headerHeight + this.SB.height;

            var rightHeaderWidth = rightWidth;

            var bodyHeight = height - headerHeight;



            // account for scrollbar
            if(innerWidth>rightWidth)
                rightHeaderWidth-= this.SB.width;

            var leftBodyHeight = bodyHeight;
            // account for scrollbar
            if(innerHeight>bodyHeight)
                leftBodyHeight -= this.SB.height;

            // right body decal
            var scrollLeft = this.state.scrollLeft;
            var scrollTop = this.state.scrollTop;
            var rowSlice = this.getVisibleSlice(rowsExtents, scrollTop, scrollTop + height);
            var grids = [];

            var columns = this.state.visibleFixedColumns;
            // compute left header cells and left body cells
            if( columns.length > 0 )
            {
                var colSlice = {begin:0, end: columns.length};
                var headerCells = this.renderHeader(colSlice, columns, fixedColumnsExtents);
                var bodyCells = this.renderBody(colSlice, rowSlice, columns, fixedColumnsExtents, items, rowsExtents);

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
                        },
                        className:"rst_left"
                        //,onScroll:this.handleScroll
                    }, React.DOM.div( {style:{ position: "relative", width: leftWidth, height: headerHeight}, className:"rst_thead"}, headerCells)
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
                            height: leftBodyHeight,
                            overflowY:"hidden"
                        },
                        className:"rst_left"
                        //,onScroll:this.handleScroll
                    }, React.DOM.div( {style:{ position:"relative", width:leftWidth, height:innerHeight}, className:"rst_tbody"}, bodyCells)
                );
                grids.push(header);
                grids.push(body);
            }

            //var rightColumns = this.getAllColumns();

            columns = this.state.visibleColumns;
            // compute right header cells and right body cells
            if( columns.length > 0 )
            {
                var colSlice = this.getVisibleSlice(columnsExtents, scrollLeft, scrollLeft + rightHeaderWidth);
                var headerCells = this.renderHeader(colSlice, columns, columnsExtents);
                var bodyCells = this.renderBody(colSlice, rowSlice, columns, columnsExtents, items, rowsExtents);

                var header =
                    React.DOM.div({
                        key: "right_header",
                        ref: "right_header",
                        style:{
                            position: "absolute",
                            left: leftWidth,
                            top: 0,
                            width: rightHeaderWidth,
                            height: headerHeight,
                            overflowX: "hidden"
                        }
                        //,onScroll:this.handleScroll
                    }, React.DOM.div( {style:{ position: "relative", width: rightHeaderWidth, height: headerHeight}, className:"rst_thead"}, headerCells)
                );

                var body =
                    React.DOM.div({
                        key: "right_body",
                        ref: "right_body",
                        tabIndex:0, // in order to force focus :s
                        style:{
                            position: "absolute",
                            left: leftWidth,
                            top: headerHeight,
                            width: rightWidth,
                            height: bodyHeight,
                            overflowX: "auto",
                            overflowY: "auto"
                        },
                        className:"rst_tbody_container"
                        ,onScroll:this.handleRightBodyScroll
                    }, React.DOM.div( {style:{ position:"relative", width:innerWidth, height:innerHeight},className:"rst_tbody"}, bodyCells)
                );
                grids.push(header);
                grids.push(body);
            }

            var containizer = React.DOM.div({
                style:{ position:'relative',
                        width:width,
                        height:height
                    }
                }, grids);

             var table_elem = React.DOM.div({
                key:"table",
                className:"rst_table",
                style:{ position:'relative',
                        //width:this.props.width == "auto")?"100%":this.state.width,
                        //height:(this.props.height == "auto")?"100%":"auto"//this.state.height
                        width:this.props.width,
                        height:this.props.height
                    }
                }, containizer);

            return table_elem;
        }

    });

    var Table = exports.Table = React.createFactory(T);

    return exports;
}));
