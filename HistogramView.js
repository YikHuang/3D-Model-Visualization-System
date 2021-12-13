
class HistogramView extends WebGLView {
    // --- A1
    constructor( idPrefix, parent ) {

        super( idPrefix, parent );

        var self = this;
        this.histogramColor = [0.7, 0.89, 0.98, 1.0];
        this.isVolumnData = false;

        // hover interaction
        var canvas = document.querySelector( this.getSelector() );
        
        canvas.addEventListener('mousemove', function(e){
            if(self.isVolumnData){
                var mouseX = e.clientX - self.getPosition().x;
                var mouseY = e.clientY - self.getPosition().y;

                self.hoverInteractionIfMouseInPlot(mouseX, mouseY);
            }
        }, false);

        return this;
    }

    hover( x, y )
    {

    }

    hoverInteractionIfMouseInPlot(mouseX, mouseY){
        if(mouseX > this.histogramPlot.left && mouseX < this.histogramPlot.right && mouseY < this.histogramPlot.bottom){
            var rangeOnCanvasPerRectangle = this.calculateRangeOnCanvasPerRectangle(mouseX);
            var index = Math.floor((mouseX - this.histogramPlot.left) / rangeOnCanvasPerRectangle);
            
            this.printInfoAndColorHoveredBin(index, mouseX, rangeOnCanvasPerRectangle);
        }
    }

    calculateRangeOnCanvasPerRectangle(){
        var plotWidth = this.histogramPlot.width;
        var rangeOnCanvasPerRectangle = plotWidth / this.histogramModel.nBins;

        return rangeOnCanvasPerRectangle;
    }

    printInfoAndColorHoveredBin(index, mouseX, rangeOnCanvasPerRectangle){
        var frequencyInfo = this.generateHoveredFrequencyAnnotation(index);
        var probabilityInfo = this.generateHoveredProbabilityAnnotation(index);

        this.printHoverInteractionAnnotation(frequencyInfo, probabilityInfo);
        this.colorHoveredRectangle(mouseX, index, rangeOnCanvasPerRectangle);
        
        this.drawHistogramAxis(this.canvas2d.width, this.canvas2d.height);
    }

    generateHoveredFrequencyAnnotation(index){
        var normalizedIndexLeft = (index / this.histogramModel.nBins).toFixed(3).toString();
        var normalizedIndexRight = ((index+1) / this.histogramModel.nBins).toFixed(3).toString();

        var frequency = this.histogramModel.histogramBinCountArray[index].toExponential(2).toString();
        var frequencyAnnotation = "f[" + normalizedIndexLeft + "," + normalizedIndexRight + ") = " + frequency;

        var frequencyInfo = {
            text : frequencyAnnotation,
            x : this.hoveredFrequencyPosition.x,
            y : this.hoveredFrequencyPosition.y
        };

        return frequencyInfo;
    }

    generateHoveredProbabilityAnnotation(index){
        const reducer = (previousValue, currentValue) => previousValue + currentValue;
        var totalBins = this.histogramModel.histogramBinCountArray.reduce(reducer);

        var probability = (this.histogramModel.histogramBinCountArray[index] / totalBins).toFixed(4).toString();
        var probabilityAnnotation = ", P = " + probability;

        var probabilityInfo = {
            text : probabilityAnnotation,
            x : this.hoveredProbabilityPosition.x,
            y : this.hoveredProbabilityPosition.y
        };

        return probabilityInfo;
    }

    colorHoveredRectangle(mouseX, index, rangeOnCanvasPerRectangle){
        var plotHeight = this.histogramPlot.height;
        var plotHeightPerBin = plotHeight / this.binsNumForHeightInPlot;

        var paddingBins = this.binsNumForHeightInPlot - this.histogramModel.maxBinCount;

        var hoveredRectangle = {
            startX : mouseX,
            startY : plotHeightPerBin * (paddingBins + this.histogramModel.maxBinCount - this.histogramModel.histogramBinCountArray[index]),
            width : rangeOnCanvasPerRectangle,
            height : plotHeightPerBin * this.histogramModel.histogramBinCountArray[index]
        };

        this.drawHoverInteractionRectangle(hoveredRectangle);
    }

    render(readBinary)
    {
        if (readBinary) {
            var canvasWidth = this.canvas2d.width;
            var canvasHeight = this.canvas2d.height;

            this.initializeHistogramStyle(canvasWidth, canvasHeight);

            this.drawHistogramAxis();
            this.generateAndPrintTickAnnotation();
            
            this.render2d(new Float32Array(this.histogramModel.histogramVertices), 
                            this.boundingBox,
                            this.histogramColor, 
                            this.gl.TRIANGLES);

            this.lastHoveredRectangle = {startX : 0, startY : 0, width : 0, height : 0};
            this.isVolumnData = readBinary;
        }
    }


    initializeHistogramStyle(canvasWidth, canvasHeight){
        this.xAxisLine = {
            startX : canvasWidth*0.1/1.3,
            startY : canvasHeight*1.2/1.4,
            endX : canvasWidth,
            endY : canvasHeight*1.2/1.4
        };

        this.yAxisLine = {
            startX : canvasWidth*0.1/1.3,
            startY : 0,
            endX : canvasWidth*0.1/1.3,
            endY : canvasHeight*1.2/1.4
        };

        this.intensityLabelPosition = {
            x : canvasWidth / 2,
            y : canvasHeight*1.35/1.4
        };

        this.frequencyLabelPosition = {
            x : canvasWidth * 0.05 / 1.3,
            y : canvasHeight / 2
        };

        this.xtickPosition = {
            xLeft : canvasWidth * 0.1 / 1.3,
            yLeft : canvasHeight * 1.32 / 1.4,
            xRight : canvasWidth * 1.27 / 1.3,
            yRight : canvasHeight * 1.32 / 1.4
        };

        this.ytickPosition = {
            xBottom : canvasWidth * 0.07 / 1.3,
            yBottom : canvasHeight * 1.18 / 1.4,
            xTop : canvasWidth * 0.07 / 1.3,
            yTop : canvasHeight * 0.18 / 1.4
        };

        this.boundingBox = {
            xMin : Math.floor(-this.histogramModel.nBins * 0.1),
            yMin : Math.floor(-this.histogramModel.maxBinCount * 0.2),
            xMax : Math.floor(this.histogramModel.nBins * 1.2),
            yMax : Math.floor(this.histogramModel.maxBinCount * 1.2)
        };

        this.histogramPlot = {
            left : this.canvas2d.width*0.1/1.3,
            right : this.canvas2d.width * 1.1 / 1.3,
            bottom : this.canvas2d.height*1.2/1.4,
            width : this.canvas2d.width * 1.0 / 1.3,
            height : this.canvas2d.height * 1.2 / 1.4
        };

        this.hoveredFrequencyPosition = {
            x : this.canvas2d.width*0.8/1.3,
            y : this.canvas2d.height*0.1/1.4
        };

        this.hoveredProbabilityPosition = {
            x : this.canvas2d.width*1.1/1.3,
            y : this.canvas2d.height*0.1/1.4
        };

        this.binsNumForHeightInPlot = this.histogramModel.maxBinCount * 1.2;
    }

    drawHistogramAxis(){
        var xAxisLine = this.xAxisLine;
        var yAxisLine = this.yAxisLine;

        var lines = [[[xAxisLine.startX, xAxisLine.startY], [xAxisLine.endX, xAxisLine.endY]],
                    [[yAxisLine.startX, yAxisLine.startY], [yAxisLine.endX, yAxisLine.endY]]];

        this.drawLines(lines, [0.8,0.8,0.8], 1);
    }

    generateAndPrintTickAnnotation(){
        var intensityAnnotation = {
            label : "Intensity",
            x : this.intensityLabelPosition.x,
            y : this.intensityLabelPosition.y,
        };

        var frequencyAnnotation = {
            label : "Frequency",
            x : this.frequencyLabelPosition.x,
            y : this.frequencyLabelPosition.y,
        };

        var xtick = {
            labelLeft : "0.0",
            xLeft : this.xtickPosition.xLeft,
            yLeft : this.xtickPosition.yLeft,
            labelRight : "1.0",
            xRight : this.xtickPosition.xRight,
            yRight : this.xtickPosition.yRight
        };

        var ytick = {
            labelBottom : "0",
            xBottom : this.ytickPosition.xBottom,
            yBottom : this.ytickPosition.yBottom,
            labelTop : this.histogramModel.maxBinCount.toExponential(2).toString(),
            xTop : this.ytickPosition.xTop,
            yTop : this.ytickPosition.yTop
        };

        this.printTickAnnotation(intensityAnnotation, frequencyAnnotation, xtick, ytick);
    }

    setStyle( s ) {

        return this;
    }

    set( model ) {
        this.histogramModel = model;
    }
    // --- A1
}
