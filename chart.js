'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var d3 = require('d3');

const xyDrawMethods = {

    drawData(type,points,color){

        switch(type) {
            case "line":    return this.drawLine(points,color)
            case "bar":     return this.drawBar(points,color)
            case "scatter": return this.drawScatter(points,color)
            case "area":    return this.drawArea(points,color)   
        }
    },

    drawLine(points,color) {

        // notation
        let xScale = this.xScale;
        let yScale = this.yScale;
        let xMin = this.xRange.min, xMax = this.xRange.max;

        // define a group for the chart area
        let chart = this.chartArea.svg.append("g");

        // create a line generator - returns a path string  - check if the data fits on the graph first     
        
        let line = d3.line()
            .defined( d => {if ((d.x > xMax)||(d.x < xMin)) return false; else return true})
            .x ( d => xScale(d.x))
            .y ( d => yScale(d.y))
            .curve(d3.curveLinear);

        // add the line to the chart
        chart.append("path")
            .datum(points)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);
    },
 
    drawArea(points,color) {

        // notation
        const margin = this.css.margin;
        let xScale = this.xScale;
        let yScale = this.yScale;
        let xMin = this.xRange.min, xMax = this.xRange.max;

        // define a group for the chart area
        let chart = this.svg.append("g").attr("transform", `translate( ${margin.left}, ${margin.top})`);

        // create an area generator
        let area = d3.area()
            .defined( d => {if ((d.x > xMax)||(d.x < xMin)) return false; else return true})
            .x(  d => xScale(d.x) )
            .y0( d => yScale(0))
            .y1( d => yScale(d.y))
            .curve(d3.curveLinear);

        // add the line to the chart
        chart.append("path")
            .datum(points)
            .attr("fill", color)
            .attr("stroke", "none")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", area);           
    },

    // in low x-resolution discrete functions are drawn with little circles
    drawScatter(points,color) {

        // notation
        let xScale = this.xScale;
        let yScale = this.yScale;
        let xMin = this.xRange.min, xMax = this.xRange.max;
        let yMin = this.yRange.min, yMax = this.yRange.max;

        // define a group for the chart data 
        let chart = this.chartArea.svg.append("g");

        // the radius of the symbols used
        let radius = this.scatter.symbolSize;

        chart.selectAll("circle")
        .data(points)
        .join(
            enter =>    
                // only draw a circle for data that is on the graph area
                enter.filter( d => {if ((d.x > xMax)||(d.x < xMin)||(d.y > yMax)||(d.y < yMin)) return false; else return true})
                    .append("circle")
                    .attr("cx",  d => xScale(d.x))
                    .attr("cy",  d => yScale(d.y))
                    .attr("r", radius)
                    .attr("fill",color),

            // actually - there is no update section !
            update => update.attr("fill","red")
        );
    },

    drawBar(points,color) {

        if (points.length < 2) return
        
        // notation
        //const margin = this.css.margin
        let xScale = this.xScale;
        let yScale = this.yScale;
        let xMin = this.xRange.min, xMax = this.xRange.max;
        //let yMin = this.yRange.min, yMax = this.yRange.max

        // define a group for the chart area
        let chart = this.chartArea.svg.append("g");
        let barWidth = xScale(points[1].x) - xScale(points[0].x);
        let zeroY = yScale(0);
        let opacity = 1 - (this.dataSeries.length - 1)*0.1;

        chart.selectAll("rect")
            .data(points)
            .join(
                enter => enter
                    .filter( d => {if ((d.x > xMax)||(d.x < xMin)) return false; else return true })                    
                    .append("rect")
                    .attr("x", d=>xScale(d.x)-barWidth/2)
                    .attr("y", d=>yScale(d.y))
                    .attr("width",barWidth)
                    .attr("height",d => Math.abs(yScale(d.y) - zeroY) )
                    .attr("fill", color)
                    .attr("opacity",opacity),

                // actually - there is no update section !
                update => update.attr("fill","red")
            );
    },
};

const xyZoomMethods = {

    // the zoom callback
    zoomXAxis( ) {

        // the source event
        let e = d3.event.sourceEvent;

        // check the event type
        if (e.type == "wheel") this.scaleXAxis(e, this.xRange );
        else if (e.type == "mousemove") this.moveXAxis(e, this.xRange);
        else return

        // we can display the new range as a line or seperate points - set the corresponding draw function
        // this.drawData = (this.xRange.max - this.xRange.min < this.scatter.limit) ? this.drawScatter : this.drawLine

        // redraw
        this.drawAll();
    },

    scaleXAxis(e, range) {

        // select a scale factor
        let k = +e.wheelDelta > 0 ? 0.9 : 1.1;

        // get the range equivalent of the pixel position of the cursor
        let cursor = this.xScale.invert(+e.offsetX - this.css.margin.left);

        // adapt the range
        range.min = k*(range.min - cursor) + cursor;
        range.max = k*(range.max - cursor) + cursor;
    },

    moveXAxis( e, range) {

        let move = this.xScale.invert(e.movementX) - this.xScale.invert(0);
        range.min -= move;
        range.max -= move;
    },

    // the zoom callback
    zoomYAxis( ) {

        // the source event
        let e = d3.event.sourceEvent;

        // check the event type
        if (e.type == "wheel") this.scaleYAxis(e, this.yRange );
        else if (e.type == "mousemove") this.moveYAxis(e, this.yRange);
        else return

        // and draw the chart
        this.drawAll();
    },

    // the zoom callback for zooming when the cursor is in the axis
    zoomYAxisInAxis( ) {

        // the source event
        let e = d3.event.sourceEvent;

        // check the event type
        if (e.type == "wheel") this.scaleYAxisAroundCursor(e, this.yRange );
        else if (e.type == "mousemove") this.moveYAxis(e, this.yRange);
        else return

        // and draw the chart
        this.drawAll();
    },

    scaleYAxis(e, range) {

        // select a scale factor
        let k = +e.wheelDelta > 0 ? 0.9 : 1.1;

        // get the range equivalent of the pixel position of the cursor
        let cursor = this.yScale.invert(e.offsetY - this.css.margin.top); 
    
        // adjust the range
        //range.min = k*(range.min - cursor) + cursor
        //range.max = k*(range.max - cursor) + cursor
        range.max = k*range.max;
    },

    // the value under the cursor is kept central
    scaleYAxisAroundCursor(e, range) {

        // select a scale factor
        let k = +e.wheelDelta > 0 ? 0.9 : 1.1;

        // get the range equivalent of the pixel position of the cursor
        let cursor = this.yScale.invert(e.offsetY - this.css.margin.top); 
    
        // adjust the range
        range.min = k*(range.min - cursor) + cursor;
        range.max = k*(range.max - cursor) + cursor;
    },

    moveYAxis(e, range) {

        let move = this.yScale.invert(e.movementY) - this.yScale.invert(0);
        range.min -= move;
        range.max -= move;
    },

    zoomXY() {
        // the source event
        let e = d3.event.sourceEvent;

        // check the event type
        if (e.type == "wheel") this.scaleYAxis(e, this.yRange );
        else if (e.type == "mousemove") this.moveXY(e, this.xRange, this.yRange);
        else return

        // and draw the chart
        this.drawAll();
    },

    moveXY(e,xRange, yRange) {

        let move = this.xScale.invert(e.movementX) - this.xScale.invert(0);
        xRange.min -= move;
        xRange.max -= move;

        move = this.yScale.invert(e.movementY) - this.yScale.invert(0);
        yRange.min -= move;
        yRange.max -= move;
    }
};

const xySelectMethods = {

    makeSelectBox() {

        this.chartArea.svg
        .attr("style","cursor:crosshair")
        .call(d3.drag()
            .on("start", (d)=>this.startSelectBox(d))
            .on("drag",  (d)=>this.growSelectBox(d))
            .on("end",   (d)=>this.stopSelectBox(d)))
        .call(d3.zoom().on("zoom", () => this.zoomYAxis()));

        // prepare the slection rectangle - size 0
        this.chartArea.selectBox = this.chartArea.svg.append("rect")           
            .attr("x", 0).attr("y", 0).attr("width",0).attr("height",0)
            .attr("visibility","hidden")    
            .attr("fill",this.css.selectBoxColor)
            .attr("style","cursor:grab");
    },

    // Drag functions to make a select box
    startSelectBox(d) {
        // postition the select box under the cursor
        this.chartArea.selectBox
            .attr("x", d3.event.x)
            .attr("y", d3.event.y)
            .attr("width",0)
            .attr("height",0)
            .attr("visibility","visible")   
            .attr("transform", "translate( 0 0 )"); 
    },
    
    growSelectBox(d) {
        let x = +d3.event.subject.x; 
        let y = +d3.event.subject.y; 
        let w = +d3.event.x - x; 
        let h = +d3.event.y - y;

        // The box can grow in four directions - but svg bx is defined by left upper corner !
        if (w > 0) {
            if ( h > 0)
                this.chartArea.selectBox.attr("width",w).attr("height",h);
            else 
                this.chartArea.selectBox.attr("y", y + h).attr("width",w).attr("height",-h);
        }
        else {
            if (h > 0) 
                this.chartArea.selectBox.attr("x", x + w).attr("width",-w).attr("height",h);
            else 
                this.chartArea.selectBox.attr("x", x + w).attr("y", y + h).attr("width",-w).attr("height",-h);               
        }
    },
    
    stopSelectBox(d) {

        // set the drag callbacks for the selectbox
        this.chartArea.selectBox
            .call(d3.drag()
            .on("start", (d)=>this.grabSelectBox(d))
            .on("drag", (d)=>this.moveSelectBox(d))
            .on("end", (d)=>this.releaseSelectBox(d)));       
    },

    // we replace some of the drag reactors
    grabSelectBox(d) {

        // change the cursor
        this.chartArea.selectBox.attr("style","cursor:grabbing");

        // notation
        let selectBox = this.chartArea.selectBox;

        // get the x-dimensions of the box and chart
        let boxWidth = +selectBox.attr("width");
        let boxX = +selectBox.attr("x");

        // calculate the x selection
        this.xSelect.min = Math.floor(this.xScale.invert( boxX )) + 1;
        this.xSelect.max = Math.floor(this.xScale.invert( boxX + boxWidth));

        // get the y-dimensions and the 
        let boxHeight = +selectBox.attr("height");
        let boxY = +selectBox.attr("y");

        // calculate the y selection
        this.ySelect.min = this.yScale.invert(boxY + boxHeight); 
        this.ySelect.max = this.yScale.invert(boxY);

        // create the selected ranges for the function
        this.searchIntervals();

        // set the saved yMove to zero !
        this.yMoveSave = 0;
    },

    moveSelectBox(d) {

        // we only move in the y-direction
        let pixelMove = d3.event.y - d3.event.subject.y;

        // set the new y position of the rectangle
        this.chartArea.selectBox.attr("transform", "translate( 0 " + pixelMove + ")");

        // now move the data in the ranges over the required distance
        let yMove = this.yScale.invert(d3.event.y) - this.yScale.invert(d3.event.subject.y);

        // difference between current move and previous move 
        let deltaY = yMove - this.yMoveSave;

        // notation
        let points = this.data[0].points;
        let nI, Interval, i;

        // adjust y in all intervals
        for (nI=0; nI < this.xIntervals.length; nI++) {          
            Interval = this.xIntervals[nI];
            for (i= Interval.from; i <= Interval.to; i++) {               
                points[i].y += deltaY;
            }
        }

        // save the move that was applied for the next time
        this.yMoveSave = yMove;

        // redraw the data
        this.redrawData();
    },

    releaseSelectBox(d) {

        //set the transform to zero
        this.chartArea.selectBox.attr("transform", "translate ( 0 0 )");

        // get the original position before the grab started
        let y = +this.chartArea.selectBox.attr("y");

        // get the move in pixels
        let pixelMove = d3.event.y - d3.event.subject.y;

        // and set the rectangle at its new position
        this.chartArea.selectBox.attr("y", y + pixelMove);

        // change the cursor
        this.chartArea.selectBox.attr("style","cursor:grab");
    },

    searchIntervals() {
        
        // reset the current array of intervals
        this.xIntervals.length = 0;

        // check
        if ( ! this.haveData() ) return

        // notation
        let d = this.data[0].points;
        let xr = this.xSelect;
        let yr = this.ySelect;
        let i,j;

        i = xr.min;
        while(true) {
            // search the start of an interval
            for ( ; i <= xr.max; i++ ) if (( d[i].y > yr.min ) && ( d[i].y < yr.max )) break
            
            // check if at the end of the range
            if (i > xr.max) break

            // search the end of an interval
            for ( j = i; j <= xr.max; j++ ) if (( d[j].y < yr.min ) || ( d[j].y > yr.max )) break
            
            // we have an interval
            this.xIntervals.push({from:i,to:j-1});        
            
            // check if at the end of the range
            if (j > xr.max) break; else i = j;                    
        }
    }   
};

// A class to display a function
class chartClass {                

    constructor(svgId){

        // get the svg
        let svg = d3.select("#" + svgId);

        // check
        if (svg == null) return

        this.svg = svg;                  // the container for the chart
        this.position = {x: 0,y: 0};     // position in the container
        this.legend = null;              // the legend class
        this.xLabel = "";
        this.xRange = {min:0,max:1};     // x range
        this.xScale = null;              // x-axis scale function
        this.yLabel = "";
        this.yRange = {min:0,max:1};     // y-range
        this.yScale = null;              // y-axis scale function
        this.dataSeries = [];            // data objects - each object has a name + color + data points 
        this.chartArea = {              // the svg for the chart area (change cursor etc)
            width : 0,
            height : 0,
            svg:null,                   // the svg of the chartArea
            allowSelection:false,       // allows or denies selections in the chart area
            selectBox:null,             // a rectangle to select in the chart
        };

        // the x-and y-range that correspond with the selection
        this.xSelect = {min:0, max:0};
        this.ySelect = {min:0, max:0};

        // the limit to draw individual points
        this.scatter = {limit:25, symbolSize:2};

        // only the y values that are in the box are selected
        // so it could be that the selected range is cut up in several intervals
        this.xIntervals = [];

        // while moving the selection box we keep track of the previous move
        this.yMove = 0;

        // The css settings that this chart uses
        this.css = {
            margin:{ top:0,right:0,bottom:0,left:0},        // the margin for the axes and labels
            labelFontSize: null,
            labelColor: null,
            defaultDataColor: null,
            chartBackground: null,
            selectBoxColor: null,
        };

        // get the CSS settings 
        this.getCSS(svg);
    }

    getCSS(svg) {

        // get the computed style
        let style = getComputedStyle( svg.node() );

        // check
        if (style == null) return;

        // notations
        let css = this.css;

        // get the margin setting
        let marginString = style.getPropertyValue("--chart-margin");

        // check
        if (marginString ) {
            // regular expression for a floating point number
            let regex = /[+-]?[0-9]*\.?[0-9]+/g;

            // parse the margin settings
            let marginArray = marginString.match(regex);

            // set the margin
            css.margin.top = +marginArray[0];
            css.margin.right = +marginArray[1];
            css.margin.bottom = +marginArray[2];
            css.margin.left = +marginArray[3];
        }

        // getPropertyValue returns a string with quotes around it (stringify) !!!!!
        let prop = (p) => { return JSON.parse( style.getPropertyValue( p ) ) };

        // get the other values
        css.labelFontSize = prop("--chart-lblsz");
        css.labelColor = prop("--chart-lblclr");
        css.defaultDataColor = prop("--chart-dataclr");
        css.chartBackground = prop("--chart-bckgrnd");
        css.selectBoxColor = prop("--chart-selectclr");
    }

    // a simple function to check if we have data
    haveData() {
        if ((this.data.length < 1)||(this.data[0].points == null)||(this.data[0].points.length < 1)) return false
        else return true
    }

    // redraws the entire chart - most often because of a scale change
    drawAll(){

        // clean up the current chart
        this.svg.selectAll("g").remove();

        // create an svg for the chart area
        this.addChartArea();

        // set the scale for the x axis
        this.createxScale();

        // set the scale for the y-axis
        this.createyScale();

        // if there is data to display draw the chart using the y and x scale 
        this.drawDataSeries();

        // now we draw the x-axis
        this.drawxAxis();

        // draw the y-axis
        this.drawyAxis();

        // check if the chart needs a legend
        if (this.legend) this.legend.draw();
    }

    // only draws the data
    drawDataSeries() {

        // clean up the current graph - ACTUALLY because the g has no id, it gets overwritten anyhow !
        this.chartArea.svg.selectAll("g").remove();

        // if there is data to display draw the chart using the y and x scale 
        if (this.dataSeries.length > 0) this.dataSeries.forEach( (item)=>this.drawData(item.type,item.points,item.color) );
    }

    // the range can be changed
    setXRange(min, max) {
        this.xRange.min = min;
        this.xRange.max = max;
    }

    setYRange(min, max) {
        this.yRange.min = min;
        this.yRange.max = max;
    }

    setXLabel(label) { this.xLabel = label;}
    setYLabel(label) { this.yLabel = label;}

    addData(name, type, points, color) {

        // check if it exists
        for (let i = 0; i < this.dataSeries.length; i++) {
            if (this.dataSeries[i].name == name) {
                this.dataSeries[i].points = points;
                this.dataSeries[i].color = color;
                return
            }
        }

        // not found - add the new series
        this.dataSeries.push({name, type, points, color});
    }

    addChartArea() {

        // clean up the current chart
        if (this.chartArea.svg)  this.chartArea.svg.remove();

        // notation
        let margin = this.css.margin;

        // set the width and height of the chart area based on the containing svg
        let width = +this.svg.property("clientWidth") - margin.left - margin.right;
        let height = +this.svg.property("clientHeight") - margin.top - margin.bottom;

        // set the size of the chart area
        this.chartArea.width = width; 
        this.chartArea.height = height; 

        // create an svg for the chart area
        this.chartArea.svg = this.svg.append("svg")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width",width)
            .attr("height",height)
            .attr("style","clip-path: view-box");

        // a background rectangle
        this.chartArea.svg.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width",this.chartArea.width)
            .attr("height",this.chartArea.height)
            .attr("fill",this.css.chartBackground)           
            .attr("opacity",1);
 
        //if selection is allowed..
        if ( this.chartArea.allowSelection) 

            // we add a selection box
            this.makeSelectBox();
        else 
            this.chartArea.svg
                .attr("style","cursor:move")
                .call(d3.zoom().on("zoom", () => this.zoomXY()));
    }

    createxScale(){
        // set the scale for the x-axis
        this.xScale = d3.scaleLinear()
            .range([0,this.chartArea.width])
            .domain([this.xRange.min, this.xRange.max]);

        return true
    }

    drawxAxis() {
        // shorter notation
        const width = this.chartArea.width;
        const height = this.chartArea.height;
        const margin = this.css.margin;      

        // append a group for the axis
        const xAxis = this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate( ${margin.left}, ${height + margin.top})`);       

        // make the x-axis draw function
        let draw = d3.axisBottom(this.xScale).tickSize(-height);

        // draw the x-axis ticks - no selection or any other action on the ticks !
        xAxis.append("g")
            .attr("class", "x-ticks")
            .attr("cursor", "none")
            .attr("pointer-events", "none")
            .call(draw);

        // put a label on the axis
        xAxis.append("text")
            .attr("fill", this.css.labelColor)
            .attr("font-size",this.css.labelFontSize)
            .attr("x",width - (this.xLabel.length)*5)
            .attr("y",margin.bottom - 3)
            .attr("text-anchor", "start")
            .text(this.xLabel);
    
        // make an invisible rectangle over the chart + x-axis for the zooming behaviour
        xAxis.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width",width)
            .attr("height",margin.bottom)
            .attr("opacity",0)
            .attr("style","cursor:e-resize")
            .call(d3.zoom().on("zoom", () => this.zoomXAxis()));
    }

    createyScale(){

        // set the scale for the y-axis
        this.yScale = d3.scaleLinear()
            .range([this.chartArea.height, 0])
            .domain([this.yRange.min, this.yRange.max]);
    }

    drawyAxis(){

        // notation
        const margin = this.css.margin;    
        const width = this.chartArea.width;
        const height = this.chartArea.height;

        // create the y-axis group
        const yAxis = this.svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate( ${margin.left}, ${margin.top} )`);
        
        // make the y-axis draw function
        let draw = d3.axisLeft(this.yScale).tickSize(-width);

        // draw the y-axis
        yAxis.append("g")
            .attr("class", "y-ticks")
            .attr("cursor", "none")
            .attr("pointer-events", "none")
            .call(draw);

        // put a label on the axis
        yAxis.append("text")
            .attr("fill", this.css.labelColor)
            .attr("font-size",this.css.labelFontSize)
            .attr("y",-margin.top/3)
            .attr("x",0)
            .attr("text-anchor", "start")
            .text(this.yLabel);

        // make an invisible rectangle over the axis for zooming behaviour
        yAxis.append("rect")
            .attr("x", `${-margin.left}`).attr("y",0 )
            .attr("width",margin.left).attr("height",height)
            .attr("opacity",0)    
            .attr("style","cursor:n-resize")
            .call(d3.zoom().on("zoom", () => this.zoomYAxisInAxis()));
    }
}
// mixin the drawing methods
Object.assign(chartClass.prototype, xyDrawMethods);

// mixin the zooming methods
Object.assign(chartClass.prototype, xyZoomMethods);

// mixin the selection methods
Object.assign(chartClass.prototype, xySelectMethods);

const timeDrawMethods = {

    drawData(type,points,color){

        switch(type) {
            case "line":    return this.drawLine(points,color)
            case "bar":     return this.drawBar(points,color)
            case "scatter": return this.drawScatter(points,color)
            case "area":    return this.drawArea(points,color)   
        }
    },

    drawLine(points,color) {

        // notation
        let xScale = this.xScale;
        let yScale = this.yScale;
        let xMin = this.xRange.min, xMax = this.xRange.max;
        let date = this.date;

        // define a group for the chart area
        let chart = this.chartArea.svg.append("g");

        // create a line generator - returns a path string  - check if the data fits on the graph first     
        let line = d3.line()
            .defined( d => {if ((d.x > xMax)||(d.x < xMin)) return false; else return true})
            .x ( d => xScale( date.setTime(d.x)) )
            .y ( d => yScale(d.y))
            .curve(d3.curveLinear);

        // add the line to the chart
        chart.append("path")
            .datum(points)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);
    },

    drawArea(points,color) {

        // notation
        const margin = this.css.margin;
        let xScale = this.xScale;
        let yScale = this.yScale;
        let xMin = this.xRange.min, xMax = this.xRange.max;

        // define a group for the chart area
        let chart = this.svg.append("g").attr("transform", `translate( ${margin.left}, ${margin.top})`);

        // create an area generator
        let area = d3.area()
            .defined( d => {if ((d.x > xMax)||(d.x < xMin)) return false; else return true})
            .x ( d => xScale( date.setTime(d.x)) )
            .y0( d => yScale(0))
            .y1( d => yScale(d.y))
            .curve(d3.curveLinear);

        // add the line to the chart
        chart.append("path")
            .datum(points)
            .attr("fill", color)
            .attr("stroke", "none")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", area);           
    },

    drawScatter(points,color) {

        // notation
        let xScale = this.xScale;
        let yScale = this.yScale;
        let xMin = this.xRange.min, xMax = this.xRange.max;
        let yMin = this.yRange.min, yMax = this.yRange.max;
        let date = this.date;

        // define a group for the chart data 
        let chart = this.chartArea.svg.append("g");

        // the radius of the symbols used
        let radius = this.scatter.symbolSize;

        chart.selectAll("circle")
        .data(points)
        .join(
            enter =>    
                // only draw a circle for data that is on the graph area
                enter.filter( d => {if ((d.x > xMax)||(d.x < xMin)||(d.y > yMax)||(d.y < yMin)) return false; else return true})
                    .append("circle")
                    .attr("cx",  d => xScale(date.setTime(d.x)))
                    .attr("cy",  d => yScale(d.y))
                    .attr("r", radius)
                    .attr("fill",color),

            // actually - there is no update section !
            update => update.attr("fill","red")
        );
    },

    drawBar(points,color) {
        // we need at least two points for the bar chart
        if (points.length < 2) return

        // notation
        let xScale = this.xScale;
        let yScale = this.yScale;
        
        //let yMin = this.yRange.min, yMax = this.yRange.max
        let date = this.date;

        // define a group for the chart area
        let chart = this.chartArea.svg.append("g");
        let barWidth = xScale(date.setTime(points[1].x)) - xScale(date.setTime(points[0].x));
        let zeroY = yScale(0);
        let zeroX = this.timeType == "relative" ? points[0].x : 0;
        let xMin = this.xRange.min, xMax = this.xRange.max;

        chart.selectAll("rect")
            .data(points)
            .join(
                enter => enter
                    .filter( d => {if ((d.x - zeroX > xMax)||(d.x - zeroX < xMin)) return false; else return true })                    
                    .append("rect")
                    .attr("x", d=>xScale(date.setTime(d.x - zeroX))-barWidth/2)
                    .attr("y", d=>yScale(d.y))
                    .attr("width",barWidth)
                    .attr("height",d => Math.abs(yScale(d.y) - zeroY) )
                    .attr("fill", color),

                // actually - there is no update section !
                update => update
                    .attr("fill","red")
            );
    },
};

const timeZoomMethods = {

    // the zoom callback
    zoomTimeAxis( ) {
        // the source event
        let e = d3.event.sourceEvent;

        // check the event type
        if (e.type == "wheel") this.scaleTimeAxis(e, this.xRange );
        else if (e.type == "mousemove") this.moveTimeAxis(e, this.xRange);
        else return

        // redraw
        this.drawAll();
    },

    scaleTimeAxis(e, range) {
        // select a scale factor
        let k = +e.wheelDelta > 0 ? 0.9 : 1.1;

        // get the range equivalent of the pixel position of the cursor
        let cursor = this.xScale.invert(+e.offsetX - this.css.margin.left);

        let c = cursor.getTime();
        let a = range.min; 
        let b = range.max;

        // check - a scale of 10 ms is the smallest
        if ((b-a < 10)&&(k<1)) return

        // c stays where it was
        range.min =  k*(a-c) + c; 
        range.max =  k*(b-c) + c; 
    },

    moveTimeAxis( e, range) {
        // get the move
        let move = this.xScale.invert(e.movementX).getTime() - this.xScale.invert(0).getTime();
        range.min -= move;
        range.max -= move;
    },

    zoomXY() {
        // the source event
        let e = d3.event.sourceEvent;

        // check the event type
        if (e.type == "wheel") this.scaleYAxis(e, this.yRange );
        else if (e.type == "mousemove") this.moveXY(e, this.xRange, this.yRange);
        else return

        // and draw the chart
        this.drawAll();
    },

    moveXY(e,xRange, yRange) {
        // get the time move
        let move = this.xScale.invert(e.movementX).getTime() - this.xScale.invert(0).getTime();
        xRange.min -= move;
        xRange.max -= move;

        // get the y-move
        move = this.yScale.invert(e.movementY) - this.yScale.invert(0);
        yRange.min -= move;
        yRange.max -= move;
    }
};

// A class for a timechart
// The x-value for the time chart are the nr of ms in a date object
// Note that we do not store javascript Date objects for each data point, 
// but only the number of ms since January 1, 1970, UTC
// Time format is as described in d3.js "%Y-%m-%dT%H:%M:%S.%LZ"
// relative time starts at 0, absolute time starts at the current date = Date.now()

class timeChartClass extends chartClass{                

    constructor(svgId){

        // call the super constructor
        super(svgId);

        // a date object used in calculations
        this.date = new Date();

        // the function to draw a time axis
        this.timeAxis = {
            ticks: null,
            format: "",
            label: ""
        };
        // a default time format
        this.timeFormat = "%H:%M:%S";

        // default time type - can be relative or absolute
        this.timeType = "relative";

        // the default range
        this.xRange = { min: Date.now(), max: Date.now() + 60000 };
    }

    setTimeFormat(type, format) {

        // check
        if ((type == "relative")||(type == "absolute")) this.timeType = type;
        else console.log("INVALID TIME TYPE:", type);

        // check
        if ( (d3.timeParse(format)) == null)  console.log("INVALID TIME FORMAT:", format);
        else this.timeFormat = format;
    }

    setTimeRange(minStr, maxStr) {
        // get a parsing function
        let parse = d3.timeParse(this.timeFormat);

        // get the delta of the current format
        let delta = parse( maxStr ).getTime() - parse( minStr ).getTime();

        // the range is different for relative and absolute time
        this.xRange.min = this.timeType == "relative" ? 0 : Date.now();

        // also change the max setting
        this.xRange.max = this.xRange.min + delta;
    }

    createxScale(){
        // convert to date object
        let min = new Date(this.xRange.min);
        let max = new Date(this.xRange.max);

        // the locals
        let format = "";
        let ticks = 0;
        let label = "";

        // I count the hours since you went away - I count the minutes and the seconds too
        // determine the type of scale we will show - day week month year
        let nrOfDays = d3.timeDay.count(min, max);
        if (nrOfDays > 1) {
            if (nrOfDays > 3650) format = "%y", ticks = d3.timeYear.every(5), label = "year";
            else if (nrOfDays > 730) format = "%Y", ticks = d3.timeYear.every(1), label = "year";
            else if (nrOfDays > 365) format = "%b'%y", ticks = d3.timeMonth.every(3), label = "month";
            else if (nrOfDays > 60) format = "%b", ticks = d3.timeMonth.every(1), label = "month";
            else if (nrOfDays > 10) format = "%a", ticks = d3.timeDay.every(7), label = "day";
            else if (nrOfDays >  1) format = "%a", ticks = d3.timeDay.every(1), label = "day";
        }
        else {
            // count the nr of hours
            let nrOfHours = d3.timeHour.count(min, max);
            if (nrOfHours > 12) format = "%H", ticks = d3.timeHour.every(3), label = "hr";
            else if (nrOfHours > 2) format = "%H", ticks = d3.timeHour.every(1), label = "hr";
            // count the minutes
            else {
                let nrOfMinutes = d3.timeMinute.count(min, max);
                if (nrOfMinutes > 30) format = "%M", ticks = d3.timeMinute.every(15), label = "min";
                else if (nrOfMinutes > 15) format = "%M", ticks = d3.timeMinute.every(5), label = "min";
                else if (nrOfMinutes > 2) format = "%M", ticks = d3.timeMinute.every(1), label = "min";
                else {
                    // count the seconds
                    let nrOfSeconds = d3.timeSecond.count(min, max);
                    if (nrOfSeconds > 60) format = "%S", ticks = d3.timeSecond.every(15), label = "sec";
                    else if (nrOfSeconds > 30) format = "%S", ticks = d3.timeSecond.every(10), label = "sec";
                    else if (nrOfSeconds > 15) format = "%S", ticks = d3.timeSecond.every(5), label = "sec";
                    else if (nrOfSeconds > 1) format = "%S", ticks = d3.timeSecond.every(1), label = "sec";
                    else {
                        // count the ms
                        let nrOfms = d3.timeMillisecond.count(min, max);
                        if (nrOfms > 150) format = "%L", ticks = d3.timeMillisecond.every(100), label = "msec";
                        else if (nrOfms > 15) format = "%L", ticks = d3.timeMillisecond.every(10), label = "msec";
                        else format = "%L", ticks = d3.timeMillisecond.every(1), label = "msec";
                    }
                }
            }
        }
        // save the results
        this.timeAxis.ticks = ticks;
        this.timeAxis.format = format;
        this.timeAxis.label = label;

        // set the scale for the x-axis
        this.xScale = d3.scaleTime()
            .range([0,this.chartArea.width])
            .domain([min, max]);

        return true
    }

    drawxAxis() {
        // shorter notation
        const width = this.chartArea.width;
        const height = this.chartArea.height;
        const margin = this.css.margin;        
        
        // append a group for the axis
        const xAxis = this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate( ${margin.left}, ${height + margin.top})`);   

        // the time axis draw function
        let drawTimeAxis = d3.axisBottom(this.xScale).ticks( this.timeAxis.ticks ).tickFormat(d3.timeFormat( this.timeAxis.format )).tickSize(-height);

        // draw the x-axis ticks - no selection or any other action on the ticks !
        xAxis.append("g")
            .attr("class", "x-ticks")
            .attr("cursor", "none")
            .attr("pointer-events", "none")
            .call(drawTimeAxis);

        // put a label on the axis
        xAxis.append("text")
            .attr("fill", this.css.labelColor)
            .attr("font-size",this.css.labelFontSize)
            .attr("x",width - (this.timeAxis.label.length)*5)
            .attr("y",margin.bottom)
            .attr("text-anchor", "start")
            .text(this.timeAxis.label);

        // make an invisible rectangle over the chart + x-axis for the zooming behaviour
        xAxis.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width",width).attr("height",margin.bottom)
            .attr("opacity",0)
            .attr("style","cursor:e-resize")
            .call(d3.zoom().on("zoom", () => this.zoomTimeAxis()));
    }

    shiftIntoView( points ) {

        let nPoints = points.length;

        // we need at least two points
        if (nPoints < 2) return

        // see if we have to use an offset
        let xMax = this.xRange.max;
        let xZero = this.timeType == "relative" ?  points[0].x : 0;

        // if the last point is not visible, but the previous one is - shift time-range by one point
        if ( (xMax < points[nPoints-1].x - xZero) && (xMax >= points[nPoints-2].x - xZero)) {               
            this.xRange.max = points[nPoints-1].x - xZero;
            this.xRange.min += this.xRange.max - xMax; 
        }
    }
}
// mixin the drawing methods
Object.assign(timeChartClass.prototype, timeDrawMethods);

// mixin the zooming methods
Object.assign(timeChartClass.prototype, timeZoomMethods);

/*
    layout
        background
        rect
        fontSize
        entries[]
            color
            text
*/

// a class to draw a simple color coded legend on a chart
class legendClass {

    constructor(svg,layout) {
        this.svg = svg;                  // the container for the legend
        this.layout = layout;            // the legend descriptor
        this.position = {
            x:layout.position.x,
            y:layout.position.y};        // the initial position of the legend in the svg
        this.svgLegend = null;           // the resulting svg legend 
    }   

    getColor(index) {
        if ((this.layout.entries) && (index < this.layout.entries.length)) return this.layout.entries[index].color
    }

    draw() {

        // if there are no entries, just return
        if (this.layout.entries.length < 1) return

        // some constants to position the text and boxes in the legend
        const colorBoxSize = 10;
        const leftMargin = 5;
        const topMargin = 3;
        const textWidth = 40;

        // the box for the legend - we make one row of 6 columns
        this.layout.rect.width = (leftMargin + colorBoxSize + leftMargin + textWidth)*6;
        this.layout.rect.height = colorBoxSize + 2*topMargin;

        // add a legend to the chart
        this.svgLegend = this.svg.append("g")
           .attr("transform",`translate(${this.position.x},${this.position.y})`)
           .attr("class","legend");

        // add the empty legend entries
        let entries = this.svgLegend.selectAll("g")
            .data(this.layout.entries)
            .enter();

       // The rectangle for the legend
       this.svgLegend.append("rect")
           .attr("width", this.layout.rect.width)
           .attr("height", this.layout.rect.height)
           .attr("x",0)
           .attr("y",0)
           .style("fill", this.layout.background);

        // make a color indicator
        entries.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("x",function(d,i) { return `${i*(leftMargin + colorBoxSize + leftMargin + textWidth) + leftMargin}px`      })       
            .attr("y",function(d,i) { return `${topMargin}` })      
            .style("fill", function(d,i){return d.color });
   
        // add the label to the color indicator
        entries.append("text")
            .text(function(d,i) {return d.text })
            .attr("x",function(d,i) { return `${i*(leftMargin + colorBoxSize + leftMargin + textWidth) + leftMargin + colorBoxSize + leftMargin}px` })       
            .attr("y",function(d,i) { return `${topMargin + colorBoxSize}`  })
            .attr("font-size",this.layout.fontSize);
 
        // set zooming and translation behaviour of the legend
        this.svgLegend.call(d3.zoom()
            .scaleExtent([1 / 4, 16])
            .on("zoom", this.zoom.bind(this)));
        }

    // The scale and move  function for the legend
    zoom() {   
       // Get the calculated transform scale
       let scale = d3.event.transform.k;

       // get the dx and dy and make new x and y
       this.position.x = this.position.x + d3.event.sourceEvent.movementX;
       this.position.y = this.position.y + d3.event.sourceEvent.movementY;

       // build the transform
       let transform = `translate(${this.position.x} ${this.position.y}) scale( ${scale})`;
 
       // set the transform attribute
       this.svgLegend.attr("transform",transform);
    }
}

const stats = {

    spareRandom: null,

    // This function generates random numbers along a Normal or Log-normal distribution 
    // using the Marsaglia polar method. the mean is 0 and the deviation is 1
    // the function generates two values at each invocation - that is why we have the spare
    normalRandom: ()=> {

        let val, u, v, s, mul;

        if(stats.spareRandom !== null) {
            val = stats.spareRandom;
            stats.spareRandom = null;
        }
        else {
            do {
                u = Math.random()*2-1;
                v = Math.random()*2-1;
                s = u*u+v*v;
            } while(s === 0 || s >= 1);
            mul = Math.sqrt(-2 * Math.log(s) / s);
            val = u * mul;
            stats.spareRandom = v * mul;
        }
        return val;
    },

    cumulative: (points, distri) => {

        // check
        if (points.length != distri.length) return null

        // copy but swap x and y
        for (let i=0; i < points.length; i++) distri[i].x = points[i].y;

        // sort the array
        distri.sort( (a, b) => a.x - b.x );

        // change the y values
        for (let i=0; i< distri.length; i++) distri[i].y = i;

        return distri
    },

    histogram: (points, bins) => {

        // the nr of buckets
        let nB = bins.length;

        // th nr of points
        let nP = points.length;

        // check
        if (!nP || !nB) return [0,0]

        // find the min and max
        let xMin=points[0].y, xMax = points[0].y;
        for (let i=0; i<nP; i++) {
            if (points[i].y < xMin) xMin = points[i].y;
            else if (points[i].y > xMax) xMax = points[i].y;
        }

        // the bin size
        let bSize = (1.1*xMax - 0.9*xMin)/nB;

        // check
        if (bSize == 0) bSize = 1.0;

        // initialize the buckets
        for (let i=0; i<nB;i++) {
            bins[i].x = 0.9*xMin + i*bSize;
            bins[i].y = 0;
        }

        // count the objects per bin
        for (let i=0;i<nP;i++) bins[ Math.floor( (points[i].y - 0.9*xMin) / bSize) ].y++;

        // normalize the bins and find the max value
        let yMin = bins[0].y/nP;
        let yMax = yMin;
        for (let i=0; i<nB; i++) {
            bins[i].y /= nP;
            if (bins[i].y < yMin) yMin = bins[i].y;
            else if (bins[i].y > yMax) yMax = bins[i].y;
        }

        // return the min and max value
        return [xMin, xMax, yMin, yMax]
    },

    constValue: (points,xmin, xmax, value) => {

        // check and swap if necessary
        if (xmin > xmax) { let tmp = xmin; xmin = xmax; xmax = tmp;}

        // fill the array with the constant value
        for (let i = 0; i <= xmax-xmin; i++) {
            points[i].x = xmin + i;
            points[i].y = value;
        }
    },

    rndNormal: (points, xmin, xmax, mu, sigma) => {
        // check and swap if necessary
        if (xmin > xmax) { let tmp = xmin; xmin = xmax; xmax = tmp;}
        
        // calculate
        for (let i = 0; i <= xmax-xmin; i++) {
            points[i].x = xmin + i;
            points[i].y = normalRandom()*sigma + mu;
        }
    },

    rndUniform: ( points, xmin, xmax, a, b ) => {
        // check and swap if necessary
        if (xmin > xmax) { let tmp = xmin; xmin = xmax; xmax = tmp;}

        // generate the random numbers
        for (let i = 0; i <= xmax-xmin; i++) {
            points[i].x = xmin + i;
            points[i].y = (Math.random() * (b-a)) + a;
        }
    },
};

const fx = {
    nValues: (points,stepCount, stepSize) => {

        let stepLength = Math.floor(points.length / stepCount);
        let i,step;

        // fill the array with the steps
        for (step = 0; step < stepCount; step++) {
            for (i = step*stepLength; i < (step+1)*stepLength; i++) {

                points[i].x = i;
                points[i].y = (step+1)*stepSize;
            }
        }

        // fill any remaning entries with the last value (note that step was incremented)
        while (i < points.length) {
            points[i].x = i;
            points[i].y = step*stepSize;
            i++;
        }

        return true
    },

    linear: (points,slope) => {

        for (let i = 0; i < points.length; i++) {
            points[i].x = i;
            points[i].y = slope*i;
        }
        return true
    },

    squareWave: (points, offset, amplitude, period) => {

        console.log(offset, amplitude, period);
        let up = true;
        let count = 0;
        for (let i = 0; i < points.length; i++) {
            points[i].x = i;
            if (up) points[i].y = offset + amplitude;
            else points[i].y = offset - amplitude;

            if (count > period/2) {up = !up; count = 0;}
            count++;
        }
        return true
        
    },

    sine: (points, xmin, xmax) => {},

    findRange: ( data ) => {
        if (data.length < 1) return {min:0, max:0}
        let min = data[0].y , max = data[0].y;
        for (let i=0; i < data.length; i++) {
            if (data[i].y < min) min = data[i].y;
            else if (data[i].y > max) max = data[i].y;
        }
        return {min, max}
    }
};

exports.chartClass = chartClass;
exports.fx = fx;
exports.legendClass = legendClass;
exports.stats = stats;
exports.timeChartClass = timeChartClass;
//# sourceMappingURL=chart.js.map
