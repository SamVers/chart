export const stats = {

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
        for (let i=0; i < points.length; i++) distri[i].x = points[i].y

        // sort the array
        distri.sort( (a, b) => a.x - b.x )

        // change the y values
        for (let i=0; i< distri.length; i++) distri[i].y = i

        return distri
    },

    histogram: (points, bins) => {

        // the nr of buckets
        let nB = bins.length

        // th nr of points
        let nP = points.length

        // check
        if (!nP || !nB) return [0,0]

        // find the min and max
        let xMin=points[0].y, xMax = points[0].y
        for (let i=0; i<nP; i++) {
            if (points[i].y < xMin) xMin = points[i].y
            else if (points[i].y > xMax) xMax = points[i].y
        }

        // the bin size
        let bSize = (1.1*xMax - 0.9*xMin)/nB

        // check
        if (bSize == 0) bSize = 1.0

        // initialize the buckets
        for (let i=0; i<nB;i++) {
            bins[i].x = 0.9*xMin + i*bSize
            bins[i].y = 0
        }

        // count the objects per bin
        for (let i=0;i<nP;i++) bins[ Math.floor( (points[i].y - 0.9*xMin) / bSize) ].y++

        // normalize the bins and find the max value
        let yMin = bins[0].y/nP
        let yMax = yMin
        for (let i=0; i<nB; i++) {
            bins[i].y /= nP
            if (bins[i].y < yMin) yMin = bins[i].y
            else if (bins[i].y > yMax) yMax = bins[i].y
        }

        // return the min and max value
        return [xMin, xMax, yMin, yMax]
    },

    constValue: (points,xmin, xmax, value) => {

        // check and swap if necessary
        if (xmin > xmax) { let tmp = xmin; xmin = xmax; xmax = tmp}

        // fill the array with the constant value
        for (let i = 0; i <= xmax-xmin; i++) {
            points[i].x = xmin + i
            points[i].y = value
        }
    },

    rndNormal: (points, xmin, xmax, mu, sigma) => {
        // check and swap if necessary
        if (xmin > xmax) { let tmp = xmin; xmin = xmax; xmax = tmp}
        
        // calculate
        for (let i = 0; i <= xmax-xmin; i++) {
            points[i].x = xmin + i
            points[i].y = normalRandom()*sigma + mu
        }
    },

    rndUniform: ( points, xmin, xmax, a, b ) => {
        // check and swap if necessary
        if (xmin > xmax) { let tmp = xmin; xmin = xmax; xmax = tmp}

        // generate the random numbers
        for (let i = 0; i <= xmax-xmin; i++) {
            points[i].x = xmin + i
            points[i].y = (Math.random() * (b-a)) + a
        }
    },
}

