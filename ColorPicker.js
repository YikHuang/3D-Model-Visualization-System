class ColorPicker extends Widget
{
    constructor(parent, type, intialRgb){
        super("ColorPicker", parent, 0,0, 200, 15)

        this.setHasBorder(false);
        this.colorPickerSelector = document.querySelector(this.getSelector());

        this.createLabel(type);
        this.createPalette(intialRgb);

    }

    createLabel(type){
        var label = document.createElement('label');
        label.style.width = '100px';
        label.style.height = '20px';
        label.style.bottom = '0px';
        label.style.top = '0px';
        label.style.left = '40px';
        label.style.position = 'absolute';
        label.innerHTML = type + '&nbsp;Color';

        this.colorPickerSelector.append(label);
    }

    createPalette(intialRgb){
        this.rgb = intialRgb;
        var InitialColorHex = this.rgbToHex(intialRgb);

        var colorPalette = document.createElement("input");
        colorPalette.type = "color";
        colorPalette.value = InitialColorHex;
        colorPalette.style.height = '25px';
        colorPalette.style.position = 'absolute';
        colorPalette.style.top = '0px';
        colorPalette.style.bottom = '0px';
        colorPalette.style.left = '160px';
        colorPalette.style.right = '0px';
        colorPalette.style.margin = 'auto';

        this.colorPickerSelector.append(colorPalette);
        this.createPaletteListener(colorPalette);
    }

    createPaletteListener(colorPalette){
        // Difference between () => and function() : behavior of this, function() has to define "var self = this" first
        colorPalette.addEventListener('input', () => {
            let hex = colorPalette.value;

            var red = parseInt(hex[1] + hex[2], 16);
            var green = parseInt(hex[3] + hex[4], 16);
            var blue = parseInt(hex[5] + hex[6], 16);

            this.rgb = {
                'r' : red,
                'g' : green,
                'b' : blue
            };

            this.colorPickerSelector.dispatchEvent(new Event("lightColorModified"));

        }, false);
    }

    rgbToHex(rgb) {
        return "#" + this.colorToHex(rgb.r) + this.colorToHex(rgb.g) + this.colorToHex(rgb.b);
      }

    colorToHex(color){
        var hex = color.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    getNormalizedRgb(){
        var normalizedRgb = {
            'r': this.rgb.r / 255.0,
            'g': this.rgb.g / 255.0,
            'b': this.rgb.b / 255.0
        }
        return normalizedRgb;
    }


}