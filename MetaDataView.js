
class MetaDataView extends Widget {
    // --- A1
    constructor( idPrefix, parent, fields, title, x = 0.0, y = 0.0, width = 400.0, height = 400.0) 
    {
        super( idPrefix, parent, x, y, width, height );

        return this;
    }

    set( metaData )
    {
        this.dims = metaData.dims;
        this.format = metaData.format;
        this.name = metaData.name;
    }


    showDataInfo(){
        document.querySelector(this.getSelector()).innerHTML = "";
        
        this.dataInfoLabel = document.createElement('label');
        this.dataInfoLabel.innerHTML = 'Data Information';

        this.fileNameLabel = document.createElement('label');
        this.fileNameLabel.innerHTML = '<br>file : ' + this.name;

        this.dimsLabel = document.createElement('label');
        this.dimsLabel.innerHTML = '<br>dims : ' + this.dims;

        this.formatLabel = document.createElement('label');
        this.formatLabel.innerHTML = '<br>format : ' + this.format;
        
        this.infoDiv = document.createElement('div');
        this.infoDiv.append(this.dataInfoLabel);
        this.infoDiv.append(this.fileNameLabel);
        this.infoDiv.append(this.dimsLabel);
        this.infoDiv.append(this.formatLabel);

        document.querySelector(this.getSelector()).append(this.infoDiv);
    }
    // --- A1
}
