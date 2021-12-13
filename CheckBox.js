

class CheckBox extends Widget 
{
	constructor( parent, labelText ) {
		
		super( "CheckBox", parent, 0, 0, labelText.length * 7 + 35, 30 );

		this.setHasBorder( false );
		this.checked = true;

		var c = document.querySelector( this.getSelector() );

		var label = document.createElement( 'label' );
		label.innerHTML = labelText;
		label.style.position = 'absolute';
		label.style.top  = '6px';
		label.style.right = '35px';
		label.style.color = 'rgba( 0,0,0,0.5 )';
		label.style[ 'white-space' ] = 'nowrap';

		c.append( label );

		this.box       = new Widget( "cBox", this.getSelector(), this.getSize().x - 25, 5, 20, 20 );//.setBkgColor( 255, 255, 255 );
		this.boxE = document.querySelector( this.box.getSelector() );

		var boxE = this.boxE;
	
		boxE.style[ 'box-shadow' ] = "inset 1px 1px 6px -6px, inset 1px 1px 6px -6px";
		boxE.style[ 'background' ] = "rgb(255, 255, 255)";		
		boxE.style[ 'border-radius' ] = '4px 4px';
		boxE.style[ 'padding-left' ] = '2px';
        boxE.innerHTML = '\u2714';
        boxE.style.cursor = 'pointer';
        boxE.style.color = "rgb( 120, 120, 120 )";

		var self = this;
		boxE.addEventListener( 'mouseup', function( e ) {
			e.preventDefault();
			self.checked = ! self.checked;
			if( self.checked )
			{
                boxE.innerHTML = '\u2714';
			}
			else
			{					
                boxE.innerHTML = '';
			}
			c.dispatchEvent( new Event( "changed" ) );

		}, false );	

		return this;
	}

	isChecked()
	{ 
		return this.checked;
	}

    setTransparency( a )
    {
        this.boxE.style[ "background-color" ] = "rgba(255,255,255," + a + ")";
        return this;
    }

    setColor( cssColor )
    {
        this.boxE.style.color = cssColor;
        return this;
    }

	unCheck()
	{
		this.checked = false;
		this.boxE.innerHTML = '';
	}

	// --- Final
	check(){
		this.checked = true;
		this.boxE.innerHTML = '\u2714';
	}
}