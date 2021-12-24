
function parseMetadata( text )
{
	var lines = text.split( '\r\n' );
	return {
		"format" : lines[ 0 ],
		"dims"   : lines[ 1 ].split( ' ' ).map( Number ),		
		"name"   : lines[ 2 ]
	}
}

class App extends Widget {

	applyLayout()
	{
		var windowWidth  = window.innerWidth;
		var windowHeight = window.innerHeight;

		const yStart = 50;
		const minPanelWidth = 174;
		const maxPanelWidth = windowWidth - 400;

		this.axisCheckBox.setPosition( 
			windowWidth - this.axisCheckBox.getSize().x - this.margin*2,
			this.margin );

		this.bbCheckBox.setPosition( 
			this.axisCheckBox.getPosition().x - this.bbCheckBox.getSize().x - this.margin*2,
			this.margin );

		this.annoCheckBox.setPosition( 
			this.bbCheckBox.getPosition().x - this.annoCheckBox.getSize().x - this.margin*2,
			this.margin );

		this.lightingCheckBox.setPosition( 
			this.annoCheckBox.getPosition().x - this.lightingCheckBox.getSize().x - this.margin*2,
			this.margin );

		this.volumeCheckBox.setPosition( 
			this.lightingCheckBox.getPosition().x - this.volumeCheckBox.getSize().x - this.margin*2,
			this.margin );
		
		this.rayCastingCheckBox.setPosition(
			this.volumeCheckBox.getPosition().x - this.rayCastingCheckBox.getSize().x - this.margin*2,
			this.margin
		);

		this.preIntegrationCheckbox.setPosition(
			this.rayCastingCheckBox.getPosition().x - this.preIntegrationCheckbox.getSize().x - this.margin*2,
			this.margin
		);

		this.isoSurfaceSlider.setPosition(
			this.preIntegrationCheckbox.getPosition().x - this.isoSurfaceSlider.getSize().x - this.margin*5,
			this.margin*1.7
		);

		this.panelWidth = Math.min( Math.max( 
			this.resizeHandle.getPosition().x - this.margin*2,
			minPanelWidth ), maxPanelWidth );

	    this.resizeHandle
			.setPosition( this.panelWidth + this.margin * 2, yStart )
			.setSize( 10, windowHeight - yStart )
			.setZ( 10 );

		this.setSize( windowWidth, windowHeight );
		this.setPosition( 0, 0 );

	    this.metaInput
	    	.setPosition( this.margin, this.margin );

	    this.volumeInput
	    	.setPosition( this.margin, this.margin );

		// --- A1
	    this.metaDataView
	    	.setPosition( this.margin, yStart )
	    	.setSize( this.panelWidth, 80 );

	    this.histogramView
	        .setPosition( this.margin, this.metaDataView.getPosition().y + this.metaDataView.getSize().y + this.margin*2 )
	        .setSize( this.panelWidth, 230 );
		// --- A1

	    this.TFView.setSize( this.panelWidth, 300 );
	    this.TFView.setPosition( 
	    	this.margin, 
	    	this.histogramView.getPosition().y + this.histogramView.getSize().y + this.margin*2 );	    

		this.TFView.drawDefaultOpacityLine();

		// --- Final
		this.hatchingInput.setPosition( 
			this.margin,
			this.TFView.getPosition().y + this.TFView.getSize().y + this.margin
		);

		this.paperInput.setPosition( 
			this.hatchingInput.getPosition().x + this.hatchingInput.getSize().x + this.margin,
			this.TFView.getPosition().y + this.TFView.getSize().y + this.margin
		);

		this.cartoonShadingCheckBox.setPosition(
			this.margin*4, 
			this.hatchingInput.getPosition().y + this.margin * 4
		);

		this.pencilSketchShadingCheckBox.setPosition(
			this.cartoonShadingCheckBox.getPosition().x + this.cartoonShadingCheckBox.getSize().x + this.margin * 2, 
			this.hatchingInput.getPosition().y + this.margin * 4
		);

		this.lightPosLabel.setPosition(
			this.margin, 
			this.cartoonShadingCheckBox.getPosition().y + this.margin * 4
		);

		this.lightPosXSlider.setPosition(
			this.margin*2, 
			this.lightPosLabel.getPosition().y + this.margin * 4
		);

		this.lightPosYSlider.setPosition(
			this.margin*2, 
			this.lightPosXSlider.getPosition().y + this.margin * 3
		);

		this.lightPosZSlider.setPosition(
			this.margin*2, 
			this.lightPosYSlider.getPosition().y + this.margin * 3
		);

		this.lightColorLabel.setPosition(
			this.lightPosXSlider.getPosition().x + this.lightPosXSlider.getSize().x + this.margin,
			this.cartoonShadingCheckBox.getPosition().y + this.margin * 4
		);

		this.ambientColorPicker.setPosition(
			this.lightPosXSlider.getPosition().x + this.lightPosXSlider.getSize().x + this.margin,
			this.lightColorLabel.getPosition().y + this.margin * 4
		);

		this.diffuseColorPicker.setPosition(
			this.lightPosYSlider.getPosition().x + this.lightPosYSlider.getSize().x + this.margin,
			this.ambientColorPicker.getPosition().y + this.margin * 3
		);

		this.specularColorPicker.setPosition(
			this.lightPosZSlider.getPosition().x + this.lightPosZSlider.getSize().x + this.margin,
			this.diffuseColorPicker.getPosition().y + this.margin * 3
		);

		
	    let viewSpacing = 1;

	    let xOffset = this.panelWidth + this.margin*2 + 11;
	    let yOffset = this.metaDataView.getPosition().y;

	    let volSpaceX = windowWidth - ( this.panelWidth + this.margin*3 + 11 );
	    let volSpaceY = windowHeight - this.metaDataView.getPosition().y - this.margin;

		var sliceHeight = ( volSpaceY - viewSpacing * 2 ) / 3.0;
		var sliceWidth = sliceHeight;

	    this.sliceViewX
	    	.setPosition( xOffset + volSpaceX - sliceWidth, yOffset + viewSpacing + sliceHeight )
	    	.setSize( sliceWidth, sliceHeight );

	    this.sliceViewY
	    	.setPosition(  xOffset + volSpaceX - sliceWidth, yOffset + viewSpacing * 2 + sliceHeight * 2 )
	    	.setSize( sliceWidth, sliceHeight );

	    this.sliceViewZ
	    	.setPosition(  xOffset + volSpaceX - sliceWidth, yOffset )
	    	.setSize( sliceWidth, sliceHeight );

	    this.volView3d
	    	.setPosition(  xOffset, yOffset )
	    	.setSize( volSpaceX - sliceWidth - viewSpacing, volSpaceY );

		return this;
	}

	renderBoundingBox3d( view, MVP )
	{
		var dims = this.metadata.dims; 
		var lines = view.getBoundingBoxGeometry( dims );

		this.VolRenderer.render( 
			view.getSize().x, 
			view.getSize().y, 
			lines, 
			MVP,
			[ 0.7, 0.7, 0.7, 1.0 ],
			this.VolRenderer.gl.LINES,
			2.0 ); 
	}

	renderAxis3d( view, toClipSpace, dx, dy, dz )
	{
	    var dims = this.metadata.dims; 
	    var axisGeometries = view.getAxisGeometry( dims,  [dx, dy, dz] );

		this.VolRenderer.render( 
			view.getSize().x, 
			view.getSize().y, 
			axisGeometries.x, 
			toClipSpace,
			this.xAxisColor,
			this.VolRenderer.gl.LINES,
			2.0 ); 

		this.VolRenderer.render( 
			view.getSize().x, 
			view.getSize().y, 
			axisGeometries.y, 
			toClipSpace,
			this.yAxisColor,
			this.VolRenderer.gl.LINES,
			2.0 ); 

		this.VolRenderer.render( 
			view.getSize().x, 
			view.getSize().y, 
			axisGeometries.z, 
			toClipSpace,
			this.zAxisColor,
			this.VolRenderer.gl.LINES,
			2.0 ); 
	}

	renderSliceView( view )
	{
		this.VolRenderer.clear( this.volBackgroundColor[ 0 ], this.volBackgroundColor[ 1 ], this.volBackgroundColor[ 2 ] ,  view.getSize().x,  view.getSize().y );		
		
		var dims = this.metadata.dims;

		let toClipSpace   = view.getClipSpaceTransform( dims, 4.0 );
		let planeGeometry = view.getPlaneGeometry( dims );

		this.VolRenderer.renderCuttingSurface( 
			view.getSize().x, 
			view.getSize().y, 
			planeGeometry, 
			toClipSpace,
			dims );

		if( this.axisCheckBox.isChecked() )
		{
			var axisGeometry = view.getAxisGeometry( dims );
		    let uc, vc;

	        // uv = yz plane
		    if( view.orthogonalAxis == "x" )
		    {
	            uc = this.yAxisColor;
	            vc = this.zAxisColor;
		    }  
	        // uv = xz plane		    
		    else if( view.orthogonalAxis == "y" )
		    {
	            uc = this.xAxisColor;
	            vc = this.zAxisColor;
		    }
	        // uv = xy plane			    
		    else // orth axis is z
		    {
		    	uc = this.xAxisColor;
	            vc = this.yAxisColor;
		    }

		    this.VolRenderer.disableDepthTest();

		    this.VolRenderer.render( 
				view.getSize().x, 
				view.getSize().y, 
				axisGeometry.u, 
				toClipSpace,
				uc,
				this.VolRenderer.gl.LINES, 
				2.0 ); 

		    this.VolRenderer.render( 
				view.getSize().x, 
				view.getSize().y, 
				axisGeometry.v, 
				toClipSpace,
				vc,
				this.VolRenderer.gl.LINES, 
				2.0 ); 
		
		    this.VolRenderer.enableDepthTest();
		}

	    view.render( this.VolRenderer.getCanvas() );

	    if( this.annoCheckBox.isChecked() )
	    {
		    var dim = view.orthogonalAxis == "x" ? 0 : view.orthogonalAxis == "y" ? 1 : 2;
		    view.renderText( 
		    	view.orthogonalAxis + "=" + ( view.sliceValue * this.metadata.dims[ dim ] ).toFixed(2), 
		    	'rgba(255, 255, 255, 0.5 )',
		    	[ 40, 20 ] );
	    }
	}

	renderVolView( view )
	{
		if(this.readBinary === false){
			return;
		}

		this.VolRenderer.clear(  
			this.volBackgroundColor[ 0 ], 
			this.volBackgroundColor[ 1 ], 
			this.volBackgroundColor[ 2 ] ,  
			view.getSize().x,  
			view.getSize().y );

		var dims = this.metadata.dims;
		var toClipSpace = view.dataSpaceToClipSpace( dims );
		
		var dx = this.sliceViewX.sliceValue;
		var dy = this.sliceViewY.sliceValue;
		var dz = this.sliceViewZ.sliceValue;

		if( this.bbCheckBox.isChecked() )
		{
			this.renderBoundingBox3d( view, toClipSpace );
		    this.VolRenderer.disableDepthTest();
		}

		if( this.axisCheckBox.isChecked() )
		{
			this.renderAxis3d( view, toClipSpace, dx, dy, dz );
		}
		
		this.VolRenderer.enableDepthTest();
		let MVP = view.dataSpaceToClipSpace( dims );
		this.VolRenderer.setOpaque3DRenderState();

		for( var i = 0; i < this.sliceViews.length; ++i )
		{
			let sv = this.sliceViews[ i ];
			if( sv.getIsLinked() )
			{
				this.VolRenderer.renderCuttingSurface( 
					view.getSize().x, 
					view.getSize().y, 
					sv.getPlaneGeometry( dims ), 
					MVP,
					this.metadata.dims );
			}
		}
		
		// --- Final
		var lightPos = {
			"x" : this.lightPosXSlider.getLightPos(),
			"y" : this.lightPosYSlider.getLightPos(),
			"z" : this.lightPosZSlider.getLightPos()
		};

		var lightColor = {
			"ambient" : this.ambientColorPicker.getNormalizedRgb(),
			"diffuse" : this.diffuseColorPicker.getNormalizedRgb(),
			"specular" : this.specularColorPicker.getNormalizedRgb()
		};

		if ( this.volumeCheckBox.isChecked() )
		{
			this.VolRenderer.setTransparent3DRenderState();
			this.VolRenderer.renderTextureBasedVolume( 
				view.getSize().x, 
				view.getSize().y, 
 			    view.getCameraPosition(),
 				view.up(),
 				view.bboxCornersWorldSpace( dims ),
 				view.worldSpaceToClipSpace( dims ),
 				view.worldSpaceToDataSpace( dims ),
 				dims,
				this.lightingCheckBox.isChecked(), 
				this.cartoonShadingCheckBox.isChecked(),
				this.pencilSketchShadingCheckBox.isChecked(), 
				2.5 ,
				lightPos,
				lightColor);
		}
		
		if ( this.rayCastingCheckBox.isChecked()) 
		{
			this.VolRenderer.setTransparent3DRenderState();
			this.VolRenderer.renderRayCastingVolume(
				view.getSize().x,
				view.getSize().y,
				MVP,
				view.dataSpaceToWorldSpace(dims),
				dims,
				this.lightingCheckBox.isChecked(),
				this.preIntegrationCheckbox.isChecked(),
				this.isoSurfaceSlider.isoSurfaceMinimum,
				this.isoSurfaceSlider.isoSurfaceMaximum,
				this.cartoonShadingCheckBox.isChecked(),
				this.pencilSketchShadingCheckBox.isChecked(),
				view.getCameraPosition(),
				lightPos,
				lightColor
			);		
		}


		view.clear();
	    view.render( this.VolRenderer.getCanvas() );	

		if( this.annoCheckBox.isChecked()  )
		{
            var ds = [ dx,   dy,  dz ];
            var lb = [ "X=", "Y=", "Z=" ];            
            for( var i = 0; i < 3; ++i )
            {
            	var pos = [ -10, -10, -10 ];
             	pos[ i ] = dims[ i ] * ds[ i ];
	            view.renderText( 
	            	lb[ i ] + ( dims[ i ] * ds[ i ] ).toFixed( 2 ), 
	            	'rgb( 255, 255, 255 )', 
	            	view.dataSpacePositionToScreenSpacePos( dims, pos ) );
           
	            if( this.bbCheckBox.isChecked() )
	            {
             	    pos[ i ] = dims[ i ];	            	
		            view.renderText( 
		            	"" + ( dims[ i ] ).toFixed( 2 ), 
		            	'rgb( 255, 255, 255 )', 
		            	view.dataSpacePositionToScreenSpacePos( dims, pos ) );
	        	}
            }
			view.renderText( 
				"(0,0,0)", 
				'rgb( 255, 255, 255 )', 
				view.dataSpacePositionToScreenSpacePos( dims, [ -10, -10, -10 ] ) );                         
		}
	}

	updateAll()
	{
	    if( !( this.readMetadata && this.readBinary ) )
	    {
	    	return;
		}

		// --- A1
		this.histogramView.render(this.readBinary);
		this.renderSliceView( this.sliceViewZ );		
		this.renderSliceView( this.sliceViewX );
		this.renderSliceView( this.sliceViewY );
		this.renderVolView(   this.volView3d  );
	}

	begin()
	{
		// --- A1
		var histModel = new HistogramModel( this.data );
		this.histogramView.set( histModel );

        // TODO, get min and max of data, maybe from histogram model
		var dataMin = histModel.dMin;
		var dataMax = histModel.dMax;
		// --- A1

	    this.VolRenderer.setData( 
	    	this.data, 
	    	this.metadata.dims, 
	    	this.convertToFloat == true ? "FLOAT" : this.metadata.format, 
	    	dataMin,  
	        dataMax );

		this.updateAll();
	}

	constructor()
	{
		super( 'Assignment1', 'body' );

		// data structures /////////////////////////////////////

	    this.data = null; 

	    this.convertToFloat = true;

	    this.metadata = {
	    	"dims"   : null,
	    	"format" : null,
	    	"name"   : null
	    };

	    this.viewAlignedPolygone = new Float32Array( 18 );

	    this.colTfData = {}
	    this.colTfName = "Default";

	    // state ////////////////////////////////////////////////

	    this.readBinary   = false;
	    this.readMetadata = false;

	    // properties //////////////////////////////////////////

		this.margin = 10;
		this.panelWidth = 470;

		// Views/Widgets /////////////////////////////////////////

        this.axisCheckBox = new CheckBox( 
        	'body', 
        	"axis" );

        this.bbCheckBox = new CheckBox( 
        	'body', 
        	"b-box" );

        this.annoCheckBox = new CheckBox( 
        	'body', 
        	"annotation" );

        this.lightingCheckBox = new CheckBox( 
        	'body', 
        	"Lighting" );

        this.volumeCheckBox = new CheckBox( 
        	'body', 
        	"volume" );
		this.volumeCheckBox.unCheck();

		this.rayCastingCheckBox = new CheckBox(
			'body',
			"Ray Casting"
		);

		this.preIntegrationCheckbox = new CheckBox(
			'body',
			"Pre Integration"
		);
		this.preIntegrationCheckbox.unCheck();

		this.isoSurfaceSlider = new IsoSurfaceSlider(
			'body'
		);
		this.isoSurfaceSlider.setVisibility(false);

        this.metaInput = new FileInput( 
        	this.id + "_fileIn", 
        	'body', 
        	"Load HDR File" );

        this.volumeInput = new FileInput( 
        	this.id + "_fileIn", 
        	'body', 
        	"Load Data File" ).setHidden( true );

	    this.metaDataView = new MetaDataView( 
	    	'MetaDataView', 
	    	this.getSelector(), 
	    	[ "name", "dims", "format" ], 
	    	"none" );

	    this.histogramView = new HistogramView( 
	    	'HistogramView', 
	    	this.getSelector() )
	    	.setBkgColor( 250, 250, 250 )
	        .setStyle( HistogramStyles.custom );

	    this.resizeHandle = new Widget( 
	    	'pannelDragger', 
	    	this.getSelector() )
			.setDragable( true, false )
			.setPosition( this.panelWidth, 0 )
			.setZ( 20 );

	    this.TFView = new TFView( "TFView", "body", 0, 0, this.panelWidth, 300 );

		// --- Final
		this.hatchingInput = new FileInput( 
			this.id + "_fileIn", 
			'body', 
			"Load Hatching"
		);

		this.paperInput = new FileInput( 
			this.id + "_fileIn", 
			'body', 
			"Load Background"
		);
		this.paperInput.setVisibility(false);

		this.cartoonShadingCheckBox = new CheckBox(
			'body',
			"Cartoon Shading"
		);
		this.cartoonShadingCheckBox.unCheck();

		this.pencilSketchShadingCheckBox = new CheckBox(
			'body',
			"Pencil Sketch"
		);
		this.pencilSketchShadingCheckBox.unCheck();
		this.pencilSketchShadingCheckBox.setVisibility(false);


		this.lightPosLabel = new Label(
			'body',
			'Light Position'
		);

		this.lightPosXSlider = new LightPosSlider(
			'body',
			'X'
		);

		this.lightPosYSlider = new LightPosSlider(
			'body',
			'Y'
		);

		this.lightPosZSlider = new LightPosSlider(
			'body',
			'Z'
		);

		this.lightColorLabel = new Label(
			'body',
			'Light Color'
		);

		this.ambientColorPicker = new ColorPicker(
			'body',
			'Ambient',
			{'r' : 102, 'g' : 102, 'b' : 102}
		);

		this.diffuseColorPicker = new ColorPicker(
			'body',
			'Diffuse',
			{'r' : 230, 'g' : 230, 'b' : 230}
		);

		this.specularColorPicker = new ColorPicker(
			'body',
			'Specular',
			{'r' : 153, 'g' : 153, 'b' : 153}
		);


	    // Volume Views 

		this.volBackgroundColor = [ 0.1, 0.1, 0.1 ];

		this.xAxisColor = [ 238 / 255.0, 136 / 255.0, 102 / 255.0, 1.0 ];
		this.yAxisColor = [  68 / 255.0, 187 / 255.0, 150 / 255.0, 1.0 ];
		this.zAxisColor = [ 119 / 255.0, 170 / 255.0, 221 / 255.0, 1.0 ];

	    this.sliceViewZ = new CuttingPlaneView( "body", "z" );
	    this.sliceViewX = new CuttingPlaneView( "body", "x" );
	    this.sliceViewY = new CuttingPlaneView( "body", "y" );

	    this.sliceViews = [ 
	    	this.sliceViewX,
	    	this.sliceViewZ,	    	 
	    	this.sliceViewY ];	

	    this.volView3d = new VolView3d( "body" );

		// volume renderer

		this.VolRenderer = new VolRenderer();

	    // default tf

	    const N_VALS = 64;
	    var defaultColorTF   = new Float32Array( N_VALS * 3 );
	    var defaultOpacityTF = new Float32Array( N_VALS );	    
	    
	    for( var i = 0; i < N_VALS; ++i )
	    {
	    	defaultOpacityTF[ i ] = ( i /  ( N_VALS * 2.0 ) );// * ( i / N_VALS );

	    	const s = i / N_VALS;

	    	defaultColorTF[ i*3 + 0 ] = 1.0 - 1 / ( Math.exp( s * 4 ) );
	    	defaultColorTF[ i*3 + 1 ] = 1.0 - 1 / ( Math.exp( s * 4 ) );
	    	defaultColorTF[ i*3 + 2 ] = 1.0 - 1 / ( Math.exp( s * 4 ) );	
	    }

	    this.colTfData = defaultColorTF;
	    this.VolRenderer.setTF( defaultColorTF, defaultOpacityTF );
		this.TFView.set( "default", defaultColorTF, defaultOpacityTF );


	    // listeners //////////////////////////////////////////////////////////////////////////////

	    var self = this;

		window.addEventListener(
			'resize', 
			function() { 
				self.applyLayout();
				if( self.data === null )
				{
					return;
				}
				self.updateAll(); 
			},
			false );

	    this.metaInput.getInputElement().addEventListener( 'change', function( e ) {
	        var reader = new FileReader();
	        reader.readAsText( e.target.files[ 0 ] );
	        reader.onload = function() {
	            
	            self.metadata = parseMetadata( reader.result );
	            
	            self.readMetadata = true;
	            self.readBinary = false;        
	            
	            self.metaInput.setHidden( true );
	            self.volumeInput.setHidden( false );

			    self.metaDataView.set( self.metadata );
				self.metaDataView.showDataInfo();
	        }
	    }, false );

	    this.volumeInput.getInputElement().addEventListener( 'change', function( e ) {

	    	if( ! self.readMetadata )
	    	{
	    		return;
	    	}

	        var file = e.target.files[ 0 ];
	        var reader = new FileReader();
	        reader.readAsArrayBuffer( file );

	        reader.onload = function() {
				console.log(self.metadata.format);
	        	if( self.metadata.format == "FLOAT" )
	        	{
	            	self.data = new Float32Array( reader.result );
	        	}
	        	else if( self.metadata.format == "SHORT" )
	        	{
	        	    self.data = new Uint16Array( reader.result );
		            self.metadata.format = "SHORT";
	        	}
	        	else if( self.metadata.format == "BYTE" )
	        	{
	            	self.data = new Uint8Array( reader.result );
		            self.metadata.format = "BYTE";
	        	}	        	
	        	else
	        	{
	        		throw "Data format (" + self.metadata.format + ") not supported yet."
	        	}

	            self.readBinary = true;

	            self.metaInput.setHidden( false );
	            self.volumeInput.setHidden( true );

	            self.metadata[ 'file' ] = file.name;

				// --- A4
	            if( self.readMetadata ) {
					self.isoSurfaceSlider.initializeRangeLabel();
	                self.begin();
	            }
	        }
	    }, false );

	    this.TFView.getInputElement().addEventListener( 'change', function( e ) {
	        var file = e.target.files[ 0 ];
	        var reader = new FileReader();
	        reader.readAsArrayBuffer( file );
	        reader.onload = function() {

	            self.colTfData = new Float32Array( reader.result );

				// --- A3
				var numberOfOneChannel = Math.floor(self.colTfData.length / 3);
				var defaultOpacityTF = new Float32Array(numberOfOneChannel);
				for (let i = 0; i < numberOfOneChannel; i++) {
					defaultOpacityTF[i] = i / (numberOfOneChannel * 2.0);
				}

				self.TFView.set( file.name, self.colTfData, defaultOpacityTF );
				self.TFView.drawDefaultOpacityLine();
				self.TFView.clearColorControlPoint();
				self.VolRenderer.setTF( self.colTfData, defaultOpacityTF );				

				// --- A4
				if(self.preIntegrationCheckbox.isChecked()){
					self.TFView.generatePreIntegrationTable(false, 0.0, 0.0);
					self.VolRenderer.setPreIntegrationTF(self.TFView.preIntegrationTable, self.TFView.opacityBuffer);
					self.isoSurfaceSlider.initializeRangeLabel();
				}

	        	self.updateAll();
	        }
	    }, false ); 


		// --- Final
		this.hatchingInput.getInputElement().addEventListener( 'change', function( e ) {

	        var file = e.target.files[ 0 ];
			var src = URL.createObjectURL(file);

			var resolutionLastIndex = file.name.indexOf('.jpg');
			var resolution = file.name.substring(6, resolutionLastIndex);
			var imgWidth = parseFloat(resolution);
			var imgHeight = parseFloat(resolution);
			var textureNumber = 6.0;

			var canvas = document.createElement('canvas');
			canvas.width = imgWidth * textureNumber;
			canvas.height = imgHeight;
			var ctxt = canvas.getContext('2d');
			var img = new Image;

			img.onload = function(){
				ctxt.drawImage(img, 0, 0);
				var hatchingData = ctxt.getImageData(0, 0, img.width, img.height).data;
				var hatchingFloatData = new Float32Array(hatchingData);

				for (var i = 0; i < hatchingData.length; i++) {
					hatchingFloatData[i] = hatchingFloatData[i] / 255.0;
				}
				self.VolRenderer.setHatching(hatchingFloatData, imgWidth, imgHeight, textureNumber);


				self.paperInput.setVisibility(true);
				if(self.pencilSketchShadingCheckBox.isChecked()){
					self.renderVolView( self.volView3d );
				}

			}
			img.src = src;

		});

		this.paperInput.getInputElement().addEventListener( 'change', function( e ) {
	        var file = e.target.files[ 0 ];
			var src = URL.createObjectURL(file);

			var canvas = document.createElement('canvas');
			canvas.width = 1024;
			canvas.height = 1024;
			var ctxt = canvas.getContext('2d');
			var img = new Image;

			img.onload = function(){
				ctxt.drawImage(img, 0, 0);
				var paperData = ctxt.getImageData(0, 0, img.width, img.height).data;
				var paperFloatData = new Float32Array(paperData);

				for (var i = 0; i < paperData.length; i++) {
					paperFloatData[i] = paperFloatData[i] / 255.0;
				}
				self.VolRenderer.setPaperBackground(paperFloatData);


				self.pencilSketchShadingCheckBox.setVisibility(true);
				if(self.pencilSketchShadingCheckBox.isChecked()){
					self.renderVolView( self.volView3d );
				}

			}
			img.src = src;

		});



	    document.querySelector( this.resizeHandle.getSelector() ).addEventListener( 'dragged', function( e ) {
			self.applyLayout(); 
			self.updateAll();
	    }, false );

	    document.querySelector( this.axisCheckBox.getSelector() ).addEventListener( 'changed', function( e ) {
			self.renderVolView( self.volView3d );
	    }, false );

	    document.querySelector( this.annoCheckBox.getSelector() ).addEventListener( 'changed', function( e ) {
			self.renderVolView( self.volView3d );
	    }, false );

	    document.querySelector( this.bbCheckBox.getSelector() ).addEventListener( 'changed', function( e ) {
			self.renderVolView( self.volView3d );
	    }, false );

		// --- A3
		document.querySelector( this.lightingCheckBox.getSelector() ).addEventListener( 'changed', function(e){
			if(!self.lightingCheckBox.isChecked()){
				self.cartoonShadingCheckBox.unCheck();
				self.pencilSketchShadingCheckBox.unCheck();
			}
			
			self.renderVolView( self.volView3d );
		}, false);

		document.querySelector( this.volumeCheckBox.getSelector() ).addEventListener( 'changed', function(e){
			if(self.volumeCheckBox.isChecked()){
				self.rayCastingCheckBox.unCheck();

				// --- A4
				self.preIntegrationCheckbox.setVisibility(false);
				self.preIntegrationCheckbox.unCheck();
				self.isoSurfaceSlider.setVisibility(false);
				self.isoSurfaceSlider.initializeRangeLabel();
			}

			self.renderVolView( self.volView3d );
		}, false);

		document.querySelector( this.rayCastingCheckBox.getSelector()).addEventListener('changed', function(e){
			// --- A4
			if(self.rayCastingCheckBox.isChecked()){
				self.volumeCheckBox.unCheck();
				self.preIntegrationCheckbox.setVisibility(true);
				
			}
			else{
				self.preIntegrationCheckbox.setVisibility(false);
				self.preIntegrationCheckbox.unCheck();
				self.isoSurfaceSlider.setVisibility(false);
				self.isoSurfaceSlider.initializeRangeLabel();
			}
			
			self.renderVolView( self.volView3d );
		}, false);

		// --- A4
		document.querySelector( this.preIntegrationCheckbox.getSelector() ).addEventListener('changed', function(e){
			if(self.preIntegrationCheckbox.isChecked()){
				self.TFView.generatePreIntegrationTable(false, 0.0, 0.0);
				self.VolRenderer.setPreIntegrationTF(self.TFView.preIntegrationTable, self.TFView.opacityBuffer);				
				self.isoSurfaceSlider.setVisibility(true);
				self.isoSurfaceSlider.initializeRangeLabel();
			}
			else{
				self.isoSurfaceSlider.setVisibility(false);
				self.isoSurfaceSlider.initializeRangeLabel();
			}

			self.renderVolView( self.volView3d );
		}, false);


		for( var i = 0; i < this.sliceViews.length; ++i )
		{
			( function() {
				var v = self.sliceViews[ i ];
				document.querySelector( self.sliceViews[ i ].getSelector() ).addEventListener( 'changed', function( e ) 
				{
					if( self.readMetadata && self.readBinary )
					{			
						self.renderSliceView( v );
						self.renderVolView( self.volView3d );
					}
				}, false );
			}() )
		}

	    document.querySelector( self.volView3d.getSelector()  ).addEventListener( 'changed', function( e ) {
			if( self.readMetadata && self.readBinary )
			{		
				self.renderVolView( self.volView3d );
			}
	    }, false );
	

		// --- A3
	    document.querySelector( self.TFView.getSelector()  ).addEventListener( 'colorTFModified', function( e ) {
	    	self.VolRenderer.setColorTF( self.TFView.getColorBuffer() );

			if(self.preIntegrationCheckbox.isChecked()){
				self.TFView.generatePreIntegrationTable(false, 0.0, 0.0);
				self.VolRenderer.setPreIntegrationTF(self.TFView.preIntegrationTable, self.TFView.opacityBuffer);
				self.isoSurfaceSlider.initializeRangeLabel();
			}

			if( self.readMetadata && self.readBinary )
			{		
				self.renderSliceView( self.sliceViewZ );		
				self.renderSliceView( self.sliceViewX );
				self.renderSliceView( self.sliceViewY );
				self.renderVolView( self.volView3d );
			}
			
	    }, false );
	

		// --- A3
		document.querySelector( self.TFView.getSelector()  ).addEventListener( 'opacityTFModified', function( e ) {
			self.VolRenderer.setOpacityTF( self.TFView.getOpacityBuffer() );
			
			if(self.preIntegrationCheckbox.isChecked()){
				self.TFView.generatePreIntegrationTable(false, 0.0, 0.0);
				self.VolRenderer.setPreIntegrationTF(self.TFView.preIntegrationTable, self.TFView.opacityBuffer);
				self.isoSurfaceSlider.initializeRangeLabel();
			}

			if( self.readMetadata && self.readBinary )
			{		
				self.renderVolView( self.volView3d );
			}
	    }, false );

		// --- A4
		document.querySelector(self.isoSurfaceSlider.getSelector()).addEventListener( 'isoSurfaceScaleModified', function( e ){
			if( self.readMetadata && self.readBinary ){	
				self.TFView.generatePreIntegrationTable(true, self.isoSurfaceSlider.isoSurfaceMinimum, self.isoSurfaceSlider.isoSurfaceMaximum);	
				self.VolRenderer.setPreIntegrationTF(self.TFView.preIntegrationTable, self.TFView.opacityBuffer);
				self.renderVolView( self.volView3d );
			}
		}, false);

		// --- Final
		document.querySelector( this.cartoonShadingCheckBox.getSelector() ).addEventListener( 'changed', function(e){
			if(self.cartoonShadingCheckBox.isChecked()){
				self.lightingCheckBox.check();
				self.pencilSketchShadingCheckBox.unCheck();
			}

			self.renderVolView( self.volView3d );
		}, false);

		document.querySelector( this.pencilSketchShadingCheckBox.getSelector() ).addEventListener( 'changed', function(e){
			if(self.pencilSketchShadingCheckBox.isChecked()){
				self.lightingCheckBox.check();
				self.cartoonShadingCheckBox.unCheck();
			}

			self.renderVolView( self.volView3d );
		}, false);

		document.querySelector(self.lightPosXSlider.getSelector()).addEventListener( 'lightPosModified', function( e ){
			if( self.readMetadata && self.readBinary ){	
				self.renderVolView( self.volView3d );
			}
		}, false);

		document.querySelector(self.lightPosXSlider.getSelector()).addEventListener( 'lightPosModified', function( e ){
			if( self.readMetadata && self.readBinary ){	
				self.renderVolView( self.volView3d );
			}
		}, false);

		document.querySelector(self.lightPosYSlider.getSelector()).addEventListener( 'lightPosModified', function( e ){
			if( self.readMetadata && self.readBinary ){	
				self.renderVolView( self.volView3d );
			}
		}, false);

		document.querySelector(self.lightPosZSlider.getSelector()).addEventListener( 'lightPosModified', function( e ){
			if( self.readMetadata && self.readBinary ){	
				self.renderVolView( self.volView3d );
			}
		}, false);

		document.querySelector(self.ambientColorPicker.getSelector()).addEventListener( 'lightColorModified', function( e ){
			if( self.readMetadata && self.readBinary ){	
				self.renderVolView( self.volView3d );
			}
		}, false);

		document.querySelector(self.diffuseColorPicker.getSelector()).addEventListener( 'lightColorModified', function( e ){
			if( self.readMetadata && self.readBinary ){	
				self.renderVolView( self.volView3d );
			}
		}, false);

		document.querySelector(self.specularColorPicker.getSelector()).addEventListener( 'lightColorModified', function( e ){
			if( self.readMetadata && self.readBinary ){	
				self.renderVolView( self.volView3d );
			}
		}, false);
		

	    ///////////////////////////////////////////////////////////////////////////////////////////////////////

	    this.applyLayout();
	    this.updateAll();
    
	    return this;
    }
}