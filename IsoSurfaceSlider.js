class IsoSurfaceSlider extends Slider
{
    constructor(parent){
        super(parent);

        this.isoSurfaceMinimum = 0.0;
        this.isoSurfaceMaximum = 0.1;

        this.addMouseMoveEvent(this.bar, this.dot, this.slider, this.rangeLabel);
    }

    addMouseMoveEvent(bar, dot, slider, rangeLabel){
        var self = this;
        var barLimit = bar.offsetWidth + bar.offsetLeft - dot.offsetWidth;
        var barLeftMargin = bar.offsetLeft;

        window.addEventListener('mousemove', function(e){
            if(self.moveDot)
            {
                var newLeft = self.changeDotPositionWhenMouseMove(newLeft, barLeftMargin, barLimit, dot, e);
                self.changeRangeOfIsoSurface(newLeft, barLimit, barLeftMargin, rangeLabel);

                slider.dispatchEvent(new Event("isoSurfaceScaleModified"));
            }
        }, false);
    }

    changeRangeOfIsoSurface(newLeft, barLimit, barLeftMargin, rangeLabel){
        if(newLeft == barLimit){
            newLeft--;
        }
        var percentage = (newLeft - barLeftMargin) / (barLimit - barLeftMargin) * 10;

        this.isoSurfaceMinimum = (Math.floor(percentage) / 10).toFixed(1);
        this.isoSurfaceMaximum = ((Math.floor(percentage) + 1) / 10).toFixed(1);

        rangeLabel.innerHTML = this.isoSurfaceMinimum + '&nbsp;-&nbsp;' + this.isoSurfaceMaximum;
    }

    initializeRangeLabel(){
        this.rangeLabel.innerHTML = 'Range';
    }
}