

class Slider extends Widget
{
    constructor(parent){
        super( "Slider", parent, 0, 0, 200, 15 );

        this.setHasBorder( false );
        

        this.slider = document.querySelector(this.getSelector());

        this.rangeLabel = this.createRangeLabel();
        this.slider.append(this.rangeLabel);

        this.bar = this.createBar();
        this.slider.append(this.bar);

        this.progress = this.createProgress();
        this.slider.append(this.progress);

        this.dot = this.createDot();
        this.slider.append(this.dot);

        this.addMouseDownAndUpEvent(this.dot);

    }

    createRangeLabel(){
        var rangeLabel = document.createElement('label');
        rangeLabel.style.width = '50px';
        rangeLabel.style.height = '20px';
        rangeLabel.style.bottom = '0px';
        rangeLabel.style.top = '0px';
        rangeLabel.style.left = '0px';
        rangeLabel.style.position = 'absolute';
        rangeLabel.innerHTML = 'Range';

        return rangeLabel;
    }

    createBar(){
        var bar = document.createElement('div');
        bar.style.width = '150px';
        bar.style.height = '15px';
        bar.style['border-radius'] = '10px';
        bar.style.background = 'rgb(255,255,255)';
        bar.style.position = 'absolute';
        bar.style.top = '0px';
        bar.style.bottom = '0px';
        bar.style.left = '80px';
        bar.style.right = '0px';
        bar.style.margin = 'auto';
        bar.style.cursor = 'pointer';

        return bar;
    }

    createProgress(){
        var progress = document.createElement('div');
        progress.style.width = '0px';
        progress.style.height = '15px';
        progress.style.left = '80px';
        progress.style['border-radius'] = '10px';
        progress.style.background = 'rgb(100,100,250)';

        return progress;
    }

    createDot(){
        var dot = document.createElement('div');
        dot.style.width = '20px';
        dot.style.height = '20px';
        dot.style.background = 'rgb(255,255,255)';
        dot.style.border = '2px solid rgb(100,100,250)';
        dot.style.position = 'absolute';
        dot.style.bottom = '0px';
        dot.style.top = '0px';
        dot.style.left = '80px';
        dot.style.margin = 'auto 0';
        dot.style['border-radius'] = '50%';
        dot.style.cursor = 'pointer';

        return dot;
    }

    addMouseDownAndUpEvent(dot){
        var self = this;

        dot.addEventListener('mousedown', function(e){
            self.moveDot = true;
            self.dotX = e.clientX;
            
        }, false);

        dot.addEventListener('mouseup', function(e){
            self.moveDot = false;
        }, false);

        window.addEventListener('mouseup', function(e){
            self.moveDot = false;
        }, false);
    }

    changeDotPositionWhenMouseMove(newLeft, barLeftMargin, barLimit, dot, e){
        var moveDistance = e.clientX - this.dotX;
        var newLeft = dot.offsetLeft + moveDistance;

        if (newLeft < barLeftMargin) {
            newLeft = barLeftMargin;
        }
        else if (newLeft > barLimit) {
            newLeft = barLimit;
        }
        dot.style.left = newLeft + 'px';
        this.dotX = e.clientX;

        return newLeft;
    }

}