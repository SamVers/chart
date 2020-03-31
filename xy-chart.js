import * as d3 from 'd3'
import {xyDrawMethods } from './xy-chart-draw'
import {xyZoomMethods } from './xy-chart-zoom'
import {xySelectMethods } from './xy-chart-select'

// A class to display a function
export class chartClass {                

    constructor(svgId){

        // get the svg
        let svg = d3.select("#" + svgId)

        // check
        if (svg == null) return

        this.svg = svg                  // the container for the chart
        this.position = {x: 0,y: 0}     // position in the container
        this.legend = null              // the legend class
        this.xLabel = ""
        this.xRange = {min:0,max:1}     // x range
        this.xScale = null              // x-axis scale function
        this.yLabel = ""
        this.yRange = {min:0,max:1}     // y-range
        this.yScale = null              // y-axis scale function
        this.dataSeries = []            // data objects - each object has a name + type + color + data points 
        this.chartArea = {              // the svg for the chart area (change cursor etc)
            width : 0,
            height : 0,
            svg:null,                   // the svg of the chartArea
            allowSelection:false,       // allows or denies selections in the chart area
            selectBox:null,             // a rectangle to select in the chart
        }

        // the x-and y-range that correspond with the selection
        this.xSelect = {min:0, max:0}
        this.ySelect = {min:0, max:0}

        // the limit to draw individual points
        this.scatter = {limit:25, symbolSize:2}

        // only the y values that are in the box are selected
        // so it could be that the selected range is cut up in several intervals
        this.xIntervals = []

        // while moving the selection box we keep track of the previous move
        this.yMove = 0

        // The css settings that this chart uses
        this.css = {
            margin:{ top:0,right:0,bottom:0,left:0},        // the margin for the axes and labels
            labelFontSize: null,
            labelColor: null,
            defaultDataColor: null,
            chartBackground: null,
            selectBoxColor: null,
        }

        // get the CSS settings 
        this.getCSS(svg)
    }

    getCSS(svg) {

        // get the computed style
        let style = getComputedStyle( svg.node() )

        // check
        if (style == null) return;

        // notations
        let css = this.css

        // get the margin setting
        let marginString = style.getPropertyValue("--chart-margin")

        // check
        if (marginString ) {
            // regular expression for a floating point number
            let regex = /[+-]?[0-9]*\.?[0-9]+/g

            // parse the margin settings
            let marginArray = marginString.match(regex)

            // set the margin
            css.margin.top = +marginArray[0]
            css.margin.right = +marginArray[1]
            css.margin.bottom = +marginArray[2]
            css.margin.left = +marginArray[3]
        }

        // getPropertyValue returns a string with quotes around it (stringify) !!!!!
        let prop = (p) => { return JSON.parse( style.getPropertyValue( p ) ) }

        // get the other values
        css.labelFontSize = prop("--chart-lblsz")
        css.labelColor = prop("--chart-lblclr")
        css.defaultDataColor = prop("--chart-dataclr")
        css.chartBackground = prop("--chart-bckgrnd")
        css.selectBoxColor = prop("--chart-selectclr")
    }

    // a simple function to check if we have data
    haveData() {
        if ((this.data.length < 1)||(this.data[0].points == null)||(this.data[0].points.length < 1)) return false
        else return true
    }

    // redraws the entire chart - most often because of a scale change
    drawAll(){

        // clean up the current chart
        this.svg.selectAll("g").remove()

        // create an svg for the chart area
        this.addChartArea()

        // set the scale for the x axis
        this.createxScale()

        // set the scale for the y-axis
        this.createyScale()

        // if there is data to display draw the chart using the y and x scale 
        this.drawDataSeries()

        // now we draw the x-axis
        this.drawxAxis()

        // draw the y-axis
        this.drawyAxis()

        // check if the chart needs a legend
        if (this.legend) this.legend.draw()
    }

    // only draws the data
    drawDataSeries() {

        // clean up the current graph - ACTUALLY because the g has no id, it gets overwritten anyhow !
        this.chartArea.svg.selectAll("g").remove()

        // if there is data to display draw the chart using the y and x scale 
        if (this.dataSeries.length > 0) this.dataSeries.forEach( (item)=>this.drawData(item.type,item.points,item.color) )
    }

    // the range can be changed
    setXRange(min, max) {
        this.xRange.min = min
        this.xRange.max = max
        return this
    }

    setYRange(min, max) {
        this.yRange.min = min
        this.yRange.max = max
        return this
    }

    xRangeAdapt() {
        // check first
        if (!this.dataSeries[0] || this.dataSeries[0].points.length == 0) return this

        let min = this.dataSeries[0].points[0].x
        let max = min
        for (let i = 0; i < this.dataSeries.length; i++) {
            let n = this.dataSeries[i].points.length
            if (!n) continue
            if (min > this.dataSeries[i].points[0].x) min = this.dataSeries[i].points[0].x
            if (max < this.dataSeries[i].points[n-1].x) max = this.dataSeries[i].points[n-1].x
        }
        this.xRange.min = min
        this.xRange.max = max
        return this
    }

    yRangeAdapt(factor = 1.0) {
        // check first
        if (!this.dataSeries[0] || this.dataSeries[0].points.length == 0) return this

        // initialise min and max
        let min = this.dataSeries[0].points[0].y
        let max = min
        let xr = this.xRange

        // check all dataseries
        for (let i = 0; i < this.dataSeries.length; i++) {
            let n = this.dataSeries[i].points.length

            // check each point in a dataserie
            for (let j = 0; j < n; j++) {
                let p = this.dataSeries[i].points[j]

                // only check the y values for which the x is in the range !
                if ((p.x >= xr.min) && (p.x <= xr.max))  {

                    // check for min/max
                    if (p.y < min ) min = p.y
                    else if (p.y > max ) max = p.y
                }
            }
        }
        // make sure we see 0
        if (min > 0) min = 0
        else if (max < 0) max = 0

        let  yr= this.yRange
        if (min*factor < yr.min) yr.min = min*factor
        if (max*factor > yr.max || max < yr.max*factor) yr.max = max*factor

        return this
    }

    setXLabel(label) { 
        this.xLabel = label
        return this
    }
    setYLabel(label) { 
        this.yLabel = label
        return this
    }

    addData(name, type, points, color) {

        // check if it exists
        for (let i = 0; i < this.dataSeries.length; i++) {
            if (this.dataSeries[i].name == name) {
                this.dataSeries[i].type = type
                this.dataSeries[i].points = points
                this.dataSeries[i].color = color
                return this
            }
        }

        // not found - add the new series
        this.dataSeries.push({name, type, points, color})
        return this
    }

    setData(name, type, points, color) {
        this.dataSeries[0] = {name,type,points,color}
        return this
    }

    addChartArea() {

        // clean up the current chart
        if (this.chartArea.svg)  this.chartArea.svg.remove()

        // notation
        let margin = this.css.margin

        // set the width and height of the chart area based on the containing svg
        let width = +this.svg.property("clientWidth") - margin.left - margin.right
        let height = +this.svg.property("clientHeight") - margin.top - margin.bottom

        // set the size of the chart area
        this.chartArea.width = width 
        this.chartArea.height = height 

        // create an svg for the chart area
        this.chartArea.svg = this.svg.append("svg")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width",width)
            .attr("height",height)
            .attr("style","clip-path: view-box")

        // a background rectangle
        this.chartArea.svg.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width",this.chartArea.width)
            .attr("height",this.chartArea.height)
            .attr("fill",this.css.chartBackground)           
            .attr("opacity",1)
 
        //if selection is allowed..
        if ( this.chartArea.allowSelection) 

            // we add a selection box
            this.makeSelectBox()
        else 
            this.chartArea.svg
                .attr("style","cursor:move")
                .call(d3.zoom().on("zoom", () => this.zoomXY()))
    }

    createxScale(){
        // set the scale for the x-axis
        this.xScale = d3.scaleLinear()
            .range([0,this.chartArea.width])
            .domain([this.xRange.min, this.xRange.max])

        return true
    }

    drawxAxis() {
        // shorter notation
        const width = this.chartArea.width
        const height = this.chartArea.height
        const margin = this.css.margin      

        // append a group for the axis
        const xAxis = this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate( ${margin.left}, ${height + margin.top})`)       

        // make the x-axis draw function
        let draw = d3.axisBottom(this.xScale).tickSize(-height)

        // draw the x-axis ticks - no selection or any other action on the ticks !
        xAxis.append("g")
            .attr("class", "x-ticks")
            .attr("cursor", "none")
            .attr("pointer-events", "none")
            .call(draw)

        // put a label on the axis
        xAxis.append("text")
            .attr("fill", this.css.labelColor)
            .attr("font-size",this.css.labelFontSize)
            .attr("x",width - (this.xLabel.length)*5)
            .attr("y",margin.bottom - 3)
            .attr("text-anchor", "start")
            .text(this.xLabel)
    
        // make an invisible rectangle over the chart + x-axis for the zooming behaviour
        xAxis.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width",width)
            .attr("height",margin.bottom)
            .attr("opacity",0)
            .attr("style","cursor:e-resize")
            .call(d3.zoom().on("zoom", () => this.zoomXAxis()))
    }

    createyScale(){

        // set the scale for the y-axis
        this.yScale = d3.scaleLinear()
            .range([this.chartArea.height, 0])
            .domain([this.yRange.min, this.yRange.max])
    }

    drawyAxis(){

        // notation
        const margin = this.css.margin    
        const width = this.chartArea.width
        const height = this.chartArea.height

        // create the y-axis group
        const yAxis = this.svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate( ${margin.left}, ${margin.top} )`)
        
        // make the y-axis draw function
        let draw = d3.axisLeft(this.yScale).tickSize(-width)

        // draw the y-axis
        yAxis.append("g")
            .attr("class", "y-ticks")
            .attr("cursor", "none")
            .attr("pointer-events", "none")
            .call(draw)

        // put a label on the axis
        yAxis.append("text")
            .attr("fill", this.css.labelColor)
            .attr("font-size",this.css.labelFontSize)
            .attr("y",-margin.top/3)
            .attr("x",0)
            .attr("text-anchor", "start")
            .text(this.yLabel)

        // make an invisible rectangle over the axis for zooming behaviour
        yAxis.append("rect")
            .attr("x", `${-margin.left}`).attr("y",0 )
            .attr("width",margin.left).attr("height",height)
            .attr("opacity",0)    
            .attr("style","cursor:n-resize")
            .call(d3.zoom().on("zoom", () => this.zoomYAxisInAxis()))
    }
}
// mixin the drawing methods
Object.assign(chartClass.prototype, xyDrawMethods)

// mixin the zooming methods
Object.assign(chartClass.prototype, xyZoomMethods)

// mixin the selection methods
Object.assign(chartClass.prototype, xySelectMethods)

