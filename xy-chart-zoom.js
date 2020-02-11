import * as d3 from 'd3'

export const xyZoomMethods = {

    // the zoom callback
    zoomXAxis( ) {

        // the source event
        let e = d3.event.sourceEvent

        // check the event type
        if (e.type == "wheel") this.scaleXAxis(e, this.xRange )
        else if (e.type == "mousemove") this.moveXAxis(e, this.xRange)
        else return

        // we can display the new range as a line or seperate points - set the corresponding draw function
        // this.drawData = (this.xRange.max - this.xRange.min < this.scatter.limit) ? this.drawScatter : this.drawLine

        // redraw
        this.drawAll()
    },

    scaleXAxis(e, range) {

        // select a scale factor
        let k = +e.wheelDelta > 0 ? 0.9 : 1.1

        // get the range equivalent of the pixel position of the cursor
        let cursor = this.xScale.invert(+e.offsetX - this.css.margin.left)

        // adapt the range
        range.min = k*(range.min - cursor) + cursor
        range.max = k*(range.max - cursor) + cursor
    },

    moveXAxis( e, range) {

        let move = this.xScale.invert(e.movementX) - this.xScale.invert(0)
        range.min -= move
        range.max -= move
    },

    // the zoom callback
    zoomYAxis( ) {

        // the source event
        let e = d3.event.sourceEvent

        // check the event type
        if (e.type == "wheel") this.scaleYAxis(e, this.yRange )
        else if (e.type == "mousemove") this.moveYAxis(e, this.yRange)
        else return

        // and draw the chart
        this.drawAll()
    },

    // the zoom callback for zooming when the cursor is in the axis
    zoomYAxisInAxis( ) {

        // the source event
        let e = d3.event.sourceEvent

        // check the event type
        if (e.type == "wheel") this.scaleYAxisAroundCursor(e, this.yRange )
        else if (e.type == "mousemove") this.moveYAxis(e, this.yRange)
        else return

        // and draw the chart
        this.drawAll()
    },

    scaleYAxis(e, range) {

        // select a scale factor
        let k = +e.wheelDelta > 0 ? 0.9 : 1.1

        // get the range equivalent of the pixel position of the cursor
        let cursor = this.yScale.invert(e.offsetY - this.css.margin.top) 
    
        // adjust the range
        //range.min = k*(range.min - cursor) + cursor
        //range.max = k*(range.max - cursor) + cursor
        range.max = k*range.max
    },

    // the value under the cursor is kept central
    scaleYAxisAroundCursor(e, range) {

        // select a scale factor
        let k = +e.wheelDelta > 0 ? 0.9 : 1.1

        // get the range equivalent of the pixel position of the cursor
        let cursor = this.yScale.invert(e.offsetY - this.css.margin.top) 
    
        // adjust the range
        range.min = k*(range.min - cursor) + cursor
        range.max = k*(range.max - cursor) + cursor
    },

    moveYAxis(e, range) {

        let move = this.yScale.invert(e.movementY) - this.yScale.invert(0)
        range.min -= move
        range.max -= move
    },

    zoomXY() {
        // the source event
        let e = d3.event.sourceEvent

        // check the event type
        if (e.type == "wheel") this.scaleYAxis(e, this.yRange )
        else if (e.type == "mousemove") this.moveXY(e, this.xRange, this.yRange)
        else return

        // and draw the chart
        this.drawAll()
    },

    moveXY(e,xRange, yRange) {

        let move = this.xScale.invert(e.movementX) - this.xScale.invert(0)
        xRange.min -= move
        xRange.max -= move

        move = this.yScale.invert(e.movementY) - this.yScale.invert(0)
        yRange.min -= move
        yRange.max -= move
    }
}