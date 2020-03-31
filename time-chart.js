import * as d3 from 'd3'
import {chartClass} from './xy-chart.js'
import {timeDrawMethods } from './time-chart-draw'
import {timeZoomMethods } from './time-chart-zoom'

// A class for a timechart
// The x-value for the time chart are the nr of ms in a date object
// Note that we do not store javascript Date objects for each data point
//
// Time format is as described in d3.js "%Y-%m-%dT%H:%M:%S.%LZ"
// relative time starts at 0, absolute time starts at the current date = Date.now()

export class timeChartClass extends chartClass{                

    constructor(svgId){

        // call the super constructor
        super(svgId)

        // a date object used in calculations
        this.date = new Date()

        // the function to draw a time axis
        this.timeAxis = {
            ticks: null,
            format: "",
            label: ""
        }

        // a default time format
        this.timeFormat = "%H:%M:%S"

        // default time type - can be relative or absolute
        this.timeType = "relative"

        // the default range
        this.xRange = { min: Date.now(), max: Date.now() + 60000 }
    }

    setTimeFormat(type, format) {

        // check
        if ((type == "relative")||(type == "absolute")) this.timeType = type
        else console.log("INVALID TIME TYPE:", type)

        // check
        if ( (d3.timeParse(format)) == null)  console.log("INVALID TIME FORMAT:", format)
        else this.timeFormat = format

        return this
    }

    setTimeRange(minStr, maxStr)
    {
        let parse = d3.timeParse(this.timeFormat)
        let delta = parse( maxStr ).getTime() - parse( minStr ).getTime()

        if (this.timeType == "relative")   
            this.xRange.min = 0
        else if (this.timeType == "absolute") 
            this.xRange.min = Date.now() 

        this.xRange.max = this.xRange.min + delta

        return this
    }

    yRangeAdapt(factor) {
        // check first
        if (!this.dataSeries[0] || this.dataSeries[0].points.length == 0) return this

        let min = this.dataSeries[0].points[0].y
        let max = min, x0=0,x1=0
        let xr = this.xRange

        x0 = this.timeType == "relative" ? this.dataSeries[0].points[0].x + xr.min : xr.min
        x1 = this.timeType == "relative" ? this.dataSeries[0].points[0].x + xr.max : xr.max

        for (let i = 0; i < this.dataSeries.length; i++) {
            let n = this.dataSeries[i].points.length
            for (let j = 0; j < n; j++) {
                let p = this.dataSeries[i].points[j]

                // only check the y values for which the x is in the range !
                if ((p.x >= x0) && (p.x <= x1))  {
                    if (p.y < min ) min = p.y
                    if (p.y > max ) max = p.y
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

    createxScale(){

        let min = new Date(this.xRange.min)
        let max = new Date(this.xRange.max)

        let format = ""
        let ticks = 0
        let label = ""

        // I count the hours since you went away - I count the minutes and the seconds too
        // determine the type of scale we will show - day week month year
        let nrOfDays = d3.timeDay.count(min, max)
        if (nrOfDays > 1) {
            if (nrOfDays > 3650) format = "%y", ticks = d3.timeYear.every(5), label = "year"
            else if (nrOfDays > 730) format = "%Y", ticks = d3.timeYear.every(1), label = "year"
            else if (nrOfDays > 365) format = "%b'%y", ticks = d3.timeMonth.every(3), label = "month"
            else if (nrOfDays > 60) format = "%b", ticks = d3.timeMonth.every(1), label = "month"
            else if (nrOfDays > 10) format = "%a", ticks = d3.timeDay.every(7), label = "day"
            else if (nrOfDays >  1) format = "%a", ticks = d3.timeDay.every(1), label = "day"
        }
        else {
            // count the nr of hours
            let nrOfHours = d3.timeHour.count(min, max)
            if (nrOfHours > 12) format = "%H", ticks = d3.timeHour.every(3), label = "hr"
            else if (nrOfHours > 2) format = "%H", ticks = d3.timeHour.every(1), label = "hr"
            // count the minutes
            else {
                let nrOfMinutes = d3.timeMinute.count(min, max)
                if (nrOfMinutes > 30) format = "%M", ticks = d3.timeMinute.every(15), label = "min"
                else if (nrOfMinutes > 15) format = "%M", ticks = d3.timeMinute.every(5), label = "min"
                else if (nrOfMinutes > 2) format = "%M", ticks = d3.timeMinute.every(1), label = "min"
                else {
                    // count the seconds
                    let nrOfSeconds = d3.timeSecond.count(min, max)
                    if (nrOfSeconds > 60) format = "%S", ticks = d3.timeSecond.every(15), label = "sec"
                    else if (nrOfSeconds > 30) format = "%S", ticks = d3.timeSecond.every(10), label = "sec"
                    else if (nrOfSeconds > 15) format = "%S", ticks = d3.timeSecond.every(5), label = "sec"
                    else if (nrOfSeconds > 1) format = "%S", ticks = d3.timeSecond.every(1), label = "sec"
                    else {
                        // count the ms
                        let nrOfms = d3.timeMillisecond.count(min, max)
                        if (nrOfms > 150) format = "%L", ticks = d3.timeMillisecond.every(100), label = "msec"
                        else if (nrOfms > 15) format = "%L", ticks = d3.timeMillisecond.every(10), label = "msec"
                        else format = "%L", ticks = d3.timeMillisecond.every(1), label = "msec"
                    }
                }
            }
        }
        // save the results
        this.timeAxis.ticks = ticks
        this.timeAxis.format = format
        this.timeAxis.label = label

        // set the scale for the x-axis
        this.xScale = d3.scaleTime()
            .range([0,this.chartArea.width])
            .domain([min, max])

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

        let drawTimeAxis = d3.axisBottom(this.xScale).ticks( this.timeAxis.ticks ).tickFormat(d3.timeFormat( this.timeAxis.format )).tickSize(-height)

        // draw the x-axis ticks - no selection or any other action on the ticks !
        xAxis.append("g")
            .attr("class", "x-ticks")
            .attr("cursor", "none")
            .attr("pointer-events", "none")
            .call(drawTimeAxis)

        // put a label on the axis
        xAxis.append("text")
            .attr("fill", this.css.labelColor)
            .attr("font-size",this.css.labelFontSize)
            .attr("x",width - (this.timeAxis.label.length)*5)
            .attr("y",margin.bottom)
            .attr("text-anchor", "start")
            .text(this.timeAxis.label)

        // make an invisible rectangle over the chart + x-axis for the zooming behaviour
        xAxis.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width",width).attr("height",margin.bottom)
            .attr("opacity",0)
            .attr("style","cursor:e-resize")
            .call(d3.zoom().on("zoom", () => this.zoomTimeAxis()))
    }

    shiftIntoView( points = this.dataSeries[0].points ) {

        let nPoints = points.length
        if (nPoints < 2) return this
        let r = this.xRange
        let x0 = this.timeType == "relative" ? points[0].x : 0

        // only shift into view if we are adding points to the end of the visible chart
        if ( (r.max < points[nPoints-1].x - x0) && (r.max >= points[nPoints-2].x - x0)) {               
            let delta = r.max - r.min
            r.max = points[nPoints-1].x - x0
            r.min = r.max - delta
        }

        return this
    }
}

// mixin the drawing methods
Object.assign(timeChartClass.prototype, timeDrawMethods)

// mixin the zooming methods
Object.assign(timeChartClass.prototype, timeZoomMethods)