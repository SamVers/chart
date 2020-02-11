import * as d3 from 'd3'

export const timeZoomMethods = {

    // the zoom callback
    zoomTimeAxis( ) {
        // the source event
        let e = d3.event.sourceEvent

        // check the event type
        if (e.type == "wheel") this.scaleTimeAxis(e, this.xRange )
        else if (e.type == "mousemove") this.moveTimeAxis(e, this.xRange)
        else return

        // redraw
        this.drawAll()
    },

    scaleTimeAxis(e, range) {
        // select a scale factor
        let k = +e.wheelDelta > 0 ? 0.9 : 1.1

        // get the range equivalent of the pixel position of the cursor
        let cursor = this.xScale.invert(+e.offsetX - this.css.margin.left)

        let c = cursor.getTime()
        let a = range.min 
        let b = range.max

        // check - a scale of 10 ms is the smallest
        if ((b-a < 10)&&(k<1)) return

        // c stays where it was
        range.min =  k*(a-c) + c 
        range.max =  k*(b-c) + c 
    },

    moveTimeAxis( e, range) {
        // get the move
        let move = this.xScale.invert(e.movementX).getTime() - this.xScale.invert(0).getTime()
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
        // get the time move
        let move = this.xScale.invert(e.movementX).getTime() - this.xScale.invert(0).getTime()
        xRange.min -= move
        xRange.max -= move

        // get the y-move
        move = this.yScale.invert(e.movementY) - this.yScale.invert(0)
        yRange.min -= move
        yRange.max -= move
    }
}