
class HistogramModel
{
    constructor( data, nBins=256 )
    {
        this.nBins = nBins;
        this.histogramVertices = [];
        this.histogramBinCountArray = new Array(nBins).fill(0);

        this.findMaxAndMinValueOfVolumeData( data );
        this.histogramBinCountArray = this.normalizeAndCountBins(data, this.dMax, nBins);
        this.maxBinCount = Math.max(...this.histogramBinCountArray);

        this.histogramVertices = this.generateVertices();
        return this;
    }


    findMaxAndMinValueOfVolumeData( data ){
        this.dMax = data[0];
        this.dMin = data[0];

        for(let i = 0; i < data.length; i++){
            if(data[i] > this.dMax){
                this.dMax = data[i];
            }

            if(data[i] < this.dMin){
                this.dMin = data[i];
            }
        }
    }


    normalizeAndCountBins( data, dMax, nBins ){
        for(let i = 0; i < data.length; i++){
            var pos = data[i] / dMax;
            var binIndex = Math.min(Math.floor(pos * nBins), nBins - 1);

            this.histogramBinCountArray[binIndex] += 1;
        }

        return this.histogramBinCountArray;
    }

    
    generateVertices(){

        for(let i = 0; i < this.histogramBinCountArray.length; i++){
            // Left Triangle
            this.histogramVertices.push(i);
            this.histogramVertices.push(0);

            this.histogramVertices.push(i);
            this.histogramVertices.push(this.histogramBinCountArray[i]);
            
            this.histogramVertices.push(i+1);
            this.histogramVertices.push(this.histogramBinCountArray[i]);

            // Right Triangle
            this.histogramVertices.push(i);
            this.histogramVertices.push(0);

            this.histogramVertices.push(i+1);
            this.histogramVertices.push(this.histogramBinCountArray[i]);

            this.histogramVertices.push(i+1);
            this.histogramVertices.push(0);
        }

        return this.histogramVertices;
    }    

}