import * as d3 from 'd3'

export const timeDrawMethods = {

    drawData(type,points,color){

        switch(type) {
            case "line":    return this.drawLine(points,color)
            case "bar":     return this.drawBar(points,color)
            case "scatter": return this.drawScatter(points,color)
            case "area":    return this.drawArea(points,color)   
        }
    },

    drawLine(points,color) {

        // we need at least two points for the bar chart
        if (!points.length) return

        // notation
        let xScale = this.xScale
        let yScale = this.yScale
        let date = this.date

        // define a group for the chart area
        let chart = this.chartArea.svg.append("g")

        let zeroY = yScale(0)
        let zeroX = this.timeType == "relative" ? points[0].x : 0
        let xMin = this.xRange.min, xMax = this.xRange.max

        // create a line generator - returns a path string  - check if the data fits on the graph first     
        let line = d3.line()
            .defined( d => {if ((d.x - zeroX > xMax)||(d.x - zeroX < xMin)) return false; else return true})
            .x ( d => xScale( date.setTime(d.x - zeroX)) )
            .y ( d => yScale(d.y))
            .curve(d3.curveLinear)

        // add the line to the chart
        chart.append("path")
            .datum(points)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line)
    },

    drawArea(points,color) {

        // notation
        const margin = this.css.margin
        let xScale = this.xScale
        let yScale = this.yScale
        let xMin = this.xRange.min, xMax = this.xRange.max

        // define a group for the chart area
        let chart = this.svg.append("g").attr("transform", `translate( ${margin.left}, ${margin.top})`)

        // create an area generator
        let area = d3.area()
            .defined( d => {if ((d.x > xMax)||(d.x < xMin)) return false; else return true})
            .x ( d => xScale( date.setTime(d.x)) )
            .y0( d => yScale(0))
            .y1( d => yScale(d.y))
            .curve(d3.curveLinear)

        // add the line to the chart
        chart.append("path")
            .datum(points)
            .attr("fill", color)
            .attr("stroke", "none")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", area)           
    },

    drawScatter(points,color) {

        // notation
        let xScale = this.xScale
        let yScale = this.yScale
        let xMin = this.xRange.min, xMax = this.xRange.max
        let yMin = this.yRange.min, yMax = this.yRange.max
        let date = this.date

        // define a group for the chart data 
        let chart = this.chartArea.svg.append("g")

        // the radius of the symbols used
        let radius = this.scatter.symbolSize

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
        )
    },

    drawBar(points,color) {
        // we need at least two points for the bar chart
        if (points.length < 2) return

        // notation
        let xScale = this.xScale
        let yScale = this.yScale
        
        //let yMin = this.yRange.min, yMax = this.yRange.max
        let date = this.date

        // define a group for the chart area
        let chart = this.chartArea.svg.append("g")
        let barWidth = xScale(date.setTime(points[1].x)) - xScale(date.setTime(points[0].x))
        let zeroY = yScale(0)
        let zeroX = this.timeType == "relative" ? points[0].x : 0
        let xMin = this.xRange.min, xMax = this.xRange.max

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
            )
    },
}