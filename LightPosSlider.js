class LightPosSlider extends Slider
{
    constructor(parent, dimension){
        super(parent);

        this.lightPos = -10.0;

        this.initializeSlider(dimension);
        this.addMouseMoveEvent(this.bar, this.dot, this.slider, this.rangeLabel, dimension);
    }

    initializeSlider(dimension){
        this.rangeLabel.innerHTML = dimension + "&nbsp;:&nbsp;" + this.lightPos.toFixed(1);
        this.bar.style.left = '70px';
        this.progress.style.left = '70px';
        this.dot.style.left = '70px';
    }

    addMouseMoveEvent(bar, dot, slider, rangeLabel, dimension){
        var self = this;
        var barLimit = bar.offsetWidth + bar.offsetLeft - dot.offsetWidth;
        var barLeftMargin = bar.offsetLeft;

        window.addEventListener('mousemove', function(e){
            if(self.moveDot)
            {
                var newLeft = self.changeDotPositionWhenMouseMove(newLeft, barLeftMargin, barLimit, dot, e);
                self.changeLightPos(newLeft, barLimit, barLeftMargin, rangeLabel, dimension);

                slider.dispatchEvent(new Event("lightPosModified"));
            }
        }, false);
    }

    changeLightPos(newLeft, barLimit, barLeftMargin, rangeLabel, dimension){
        this.lightPos = (Math.floor((newLeft - barLeftMargin) / (barLimit - barLeftMargin) * 20) - 10).toFixed(1);
        rangeLabel.innerHTML = dimension + "&nbsp;:&nbsp;" + this.lightPos;
    }

    getLightPos(){
        return this.lightPos;
    }
}