export const fx = {
    nValues: (points,stepCount, stepSize) => {

        let stepLength = Math.floor(points.length / stepCount)
        let i,step

        // fill the array with the steps
        for (step = 0; step < stepCount; step++) {
            for (i = step*stepLength; i < (step+1)*stepLength; i++) {

                points[i].x = i
                points[i].y = (step+1)*stepSize
            }
        }

        // fill any remaning entries with the last value (note that step was incremented)
        while (i < points.length) {
            points[i].x = i
            points[i].y = step*stepSize
            i++
        }

        return true
    },

    linear: (points,slope) => {

        for (let i = 0; i < points.length; i++) {
            points[i].x = i
            points[i].y = slope*i
        }
        return true
    },

    squareWave: (points, offset, amplitude, period) => {

        console.log(offset, amplitude, period)
        let up = true
        let count = 0
        for (let i = 0; i < points.length; i++) {
            points[i].x = i
            if (up) points[i].y = offset + amplitude
            else points[i].y = offset - amplitude

            if (count > period/2) {up = !up; count = 0;}
            count++
        }
        return true
        
    },

    sine: (points, xmin, xmax) => {},

    findRange: ( data ) => {
        if (data.length < 1) return {min:0, max:0}
        let min = data[0].y , max = data[0].y
        for (let i=0; i < data.length; i++) {
            if (data[i].y < min) min = data[i].y
            else if (data[i].y > max) max = data[i].y
        }
        return {min, max}
    }
}