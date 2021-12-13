class Label extends Widget
{
    constructor(parent, text){
        super( "Label", parent, 0, 0, 200, 15 );

        
        this.labelContainer = document.querySelector(this.getSelector());
        this.setHasBorder( false );
        var label = document.createElement('label');
        label.style = 
          `background-color: rgba( 255, 255, 255, 0 );
          color: rgb( 90, 90, 90 );    
          text-shadow: 1px 1px rgb(0,0,0,0.2);            
          font-weight : bold;            
          width: 160px;
          padding: 0.4rem;
          text-align: center;
          display: block;`
        label.innerHTML = text;

        this.labelContainer.append(label);
    }



}