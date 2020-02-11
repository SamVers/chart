import * as d3 from 'd3'
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
export class legendClass {

    constructor(svg,layout) {
        this.svg = svg                  // the container for the legend
        this.layout = layout            // the legend descriptor
        this.position = {
            x:layout.position.x,
            y:layout.position.y}        // the initial position of the legend in the svg
        this.svgLegend = null           // the resulting svg legend 
    }   

    getColor(index) {
        if ((this.layout.entries) && (index < this.layout.entries.length)) return this.layout.entries[index].color
    }

    draw() {

        // if there are no entries, just return
        if (this.layout.entries.length < 1) return

        // some constants to position the text and boxes in the legend
        const colorBoxSize = 10
        const leftMargin = 5
        const topMargin = 3
        const textWidth = 40

        // the box for the legend - we make one row of 6 columns
        this.layout.rect.width = (leftMargin + colorBoxSize + leftMargin + textWidth)*6
        this.layout.rect.height = colorBoxSize + 2*topMargin

        // add a legend to the chart
        this.svgLegend = this.svg.append("g")
           .attr("transform",`translate(${this.position.x},${this.position.y})`)
           .attr("class","legend")

        // add the empty legend entries
        let entries = this.svgLegend.selectAll("g")
            .data(this.layout.entries)
            .enter()

       // The rectangle for the legend
       this.svgLegend.append("rect")
           .attr("width", this.layout.rect.width)
           .attr("height", this.layout.rect.height)
           .attr("x",0)
           .attr("y",0)
           .style("fill", this.layout.background)

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
            .attr("font-size",this.layout.fontSize)
 
        // set zooming and translation behaviour of the legend
        this.svgLegend.call(d3.zoom()
            .scaleExtent([1 / 4, 16])
            .on("zoom", this.zoom.bind(this)))
        }

    // The scale and move  function for the legend
    zoom() {   
       // Get the calculated transform scale
       let scale = d3.event.transform.k

       // get the dx and dy and make new x and y
       this.position.x = this.position.x + d3.event.sourceEvent.movementX
       this.position.y = this.position.y + d3.event.sourceEvent.movementY

       // build the transform
       let transform = `translate(${this.position.x} ${this.position.y}) scale( ${scale})`
 
       // set the transform attribute
       this.svgLegend.attr("transform",transform)
    }
}