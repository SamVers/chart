import * as d3 from 'd3'

export const xySelectMethods = {

    makeSelectBox() {

        this.chartArea.svg
        .attr("style","cursor:crosshair")
        .call(d3.drag()
            .on("start", (d)=>this.startSelectBox(d))
            .on("drag",  (d)=>this.growSelectBox(d))
            .on("end",   (d)=>this.stopSelectBox(d)))
        .call(d3.zoom().on("zoom", () => this.zoomYAxis()))

        // prepare the slection rectangle - size 0
        this.chartArea.selectBox = this.chartArea.svg.append("rect")           
            .attr("x", 0).attr("y", 0).attr("width",0).attr("height",0)
            .attr("visibility","hidden")    
            .attr("fill",this.css.selectBoxColor)
            .attr("style","cursor:grab")
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
            .attr("transform", "translate( 0 0 )") 
    },
    
    growSelectBox(d) {
        let x = +d3.event.subject.x 
        let y = +d3.event.subject.y 
        let w = +d3.event.x - x 
        let h = +d3.event.y - y

        // The box can grow in four directions - but svg bx is defined by left upper corner !
        if (w > 0) {
            if ( h > 0)
                this.chartArea.selectBox.attr("width",w).attr("height",h)
            else 
                this.chartArea.selectBox.attr("y", y + h).attr("width",w).attr("height",-h)
        }
        else {
            if (h > 0) 
                this.chartArea.selectBox.attr("x", x + w).attr("width",-w).attr("height",h)
            else 
                this.chartArea.selectBox.attr("x", x + w).attr("y", y + h).attr("width",-w).attr("height",-h)               
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
        this.chartArea.selectBox.attr("style","cursor:grabbing")

        // notation
        let selectBox = this.chartArea.selectBox

        // get the x-dimensions of the box and chart
        let boxWidth = +selectBox.attr("width")
        let boxX = +selectBox.attr("x")

        // calculate the x selection
        this.xSelect.min = Math.floor(this.xScale.invert( boxX )) + 1
        this.xSelect.max = Math.floor(this.xScale.invert( boxX + boxWidth))

        // get the y-dimensions and the 
        let boxHeight = +selectBox.attr("height")
        let boxY = +selectBox.attr("y")

        // calculate the y selection
        this.ySelect.min = this.yScale.invert(boxY + boxHeight) 
        this.ySelect.max = this.yScale.invert(boxY)

        // create the selected ranges for the function
        this.searchIntervals()

        // set the saved yMove to zero !
        this.yMoveSave = 0
    },

    moveSelectBox(d) {

        // we only move in the y-direction
        let pixelMove = d3.event.y - d3.event.subject.y

        // set the new y position of the rectangle
        this.chartArea.selectBox.attr("transform", "translate( 0 " + pixelMove + ")")

        // now move the data in the ranges over the required distance
        let yMove = this.yScale.invert(d3.event.y) - this.yScale.invert(d3.event.subject.y)

        // difference between current move and previous move 
        let deltaY = yMove - this.yMoveSave

        // notation
        let points = this.data[0].points
        let nI, Interval, i

        // adjust y in all intervals
        for (nI=0; nI < this.xIntervals.length; nI++) {          
            Interval = this.xIntervals[nI]
            for (i= Interval.from; i <= Interval.to; i++) {               
                points[i].y += deltaY
            }
        }

        // save the move that was applied for the next time
        this.yMoveSave = yMove

        // redraw the data
        this.redrawData()
    },

    releaseSelectBox(d) {

        //set the transform to zero
        this.chartArea.selectBox.attr("transform", "translate ( 0 0 )")

        // get the original position before the grab started
        let y = +this.chartArea.selectBox.attr("y")

        // get the move in pixels
        let pixelMove = d3.event.y - d3.event.subject.y

        // and set the rectangle at its new position
        this.chartArea.selectBox.attr("y", y + pixelMove)

        // change the cursor
        this.chartArea.selectBox.attr("style","cursor:grab")
    },

    searchIntervals() {
        
        // reset the current array of intervals
        this.xIntervals.length = 0

        // check
        if ( ! this.haveData() ) return

        // notation
        let d = this.data[0].points
        let xr = this.xSelect
        let yr = this.ySelect
        let i,j

        i = xr.min
        while(true) {
            // search the start of an interval
            for ( ; i <= xr.max; i++ ) if (( d[i].y > yr.min ) && ( d[i].y < yr.max )) break
            
            // check if at the end of the range
            if (i > xr.max) break

            // search the end of an interval
            for ( j = i; j <= xr.max; j++ ) if (( d[j].y < yr.min ) || ( d[j].y > yr.max )) break
            
            // we have an interval
            this.xIntervals.push({from:i,to:j-1})        
            
            // check if at the end of the range
            if (j > xr.max) break; else i = j                    
        }
    }   
}