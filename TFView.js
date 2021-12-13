
class TFView extends Widget 
{
	static cpWidth  = 10;
	static tfOffset = 10;

	constructor( idPrefix, parent, fields, title, x = 0.0, y = 0.0, width = 400.0, height = 400.0) 
    {
        super( idPrefix, parent, x, y, width, height );

		this.tfName = "Default";

	    this.opacityTransferFunctionCanvas = document.createElement( 'canvas' );
	    this.opacityTransferFunctionCanvas.setAttribute( 'id', this.id + "_opacityTFCanvas" );
	    this.opacityTransferFunctionCanvas.style.position = 'absolute';	    	    
	    this.opacityTransferFunctionCanvas.style[ 'border-radius' ] = '0.2rem';	    
        this.opacityTransferFunctionCanvas.style[ 'box-shadow' ] = "1px 1px 4px 0px rgba(0,0,0,0.3)";
	    this.opacityTransferFunctionContext = this.opacityTransferFunctionCanvas.getContext( "2d" );
	    this.colorGradientCanvas = document.createElement( 'canvas' );
	    this.colorGradientCanvas.setAttribute( 'id', this.id + "_colorTFCanvas" );
	    this.colorGradientCanvas.style.position = 'absolute';	    	    
	    this.colorGradientCanvas.style[ 'border-radius' ] = '0.2rem';	    
        this.colorGradientCanvas.style[ 'box-shadow' ] = "1px 1px 4px 0px rgba(0,0,0,0.3)";
	    this.colorGradientContext = this.colorGradientCanvas.getContext( "2d" );
		
	    this.opacityCanvasContainer       = new Widget( "OpacityTFContainer", this.getSelector() ).setZ( 99 );
	    this.colorGradientCanvasContainer = new Widget( "ColorTFContainer",   this.getSelector() ).setZ( 99 );

	    var self = this;
	    document.querySelector( this.opacityCanvasContainer.getSelector() ).addEventListener( "dblclick", e => {
	    	e.preventDefault();
	    	var x = e.pageX - self.getPosition().x;
	    	var y = e.pageY - ( self.getPosition().y + self.opacityCanvasContainer.getPosition().y );
    		self.opacityTFClicked( "double", { "x" : x , "y" : y } );
    	} );	

		document.querySelector( this.opacityCanvasContainer.getSelector() ).addEventListener( 'contextmenu', function( e ) {
		    e.preventDefault();
	    	var count = e.detail;
	    	var x = e.pageX - self.getPosition().x;
	    	var y = e.pageY - ( self.getPosition().y + self.opacityCanvasContainer.getPosition().y );
    		self.opacityTFClicked( "right", { "x" : x , "y" : y } );
		}, false);

	    document.querySelector( this.colorGradientCanvasContainer.getSelector() ).addEventListener( "dblclick", e => {
	    	e.preventDefault();
	    	var x = e.pageX - self.getPosition().x;
    		self.colorTFClicked( "double" , x  );
    	} );	

		document.querySelector( this.colorGradientCanvasContainer.getSelector() ).addEventListener( 'contextmenu', function( e ) {
		    e.preventDefault();
	    	var x = e.pageX - self.getPosition().x;
    		self.colorTFClicked( "right", x  );
		    return false;
		}, false);

        this.fileInput = new FileInput( this.id + "_fileIn", this.getSelector(), "Load Color TF" );
		
		document.querySelector( this.colorGradientCanvasContainer.getSelector() ).append( this.colorGradientCanvas );
		document.querySelector( this.opacityCanvasContainer.getSelector() ).append( this.opacityTransferFunctionCanvas );		
		
		this.setHasBorder( false );
        
        this.colorBuffer   = new Float32Array();
        this.opacityBuffer = new Float32Array();        

        this.bkgColor = 'rgb( 40, 40, 40 )';

        this.colorControlPointElements   = {};
        this.opacityControlPointElements = {};

		// --- A3
		this.colorPointsMaxNumber = 16;
		this.colorControlPointSegments = {};

        return this;
    }

	// --- A3
    opacityTFClicked( clickType, clickPos )
    {
    	if( clickType == "double" )
    	{
	    	var rPos = this.getOpacityControlPointRelativePosition( clickPos, this.opacityCanvasContainer.getSize() );
			if (rPos[0] < 1 && rPos[0] > 0 && rPos[1] > 0 && rPos[1] < 1) {
				var controlPoint = this.addOpacityControlPoint( rPos[ 0 ], rPos[ 1 ], [ 0.9, 0.9, 0.9 ] );
				var nearestLeftPoint = this.drawLeftOpacityLineForNewControlPoint(controlPoint);
				var nearestRightPoint = this.drawRightOpacityLineForNewControlPoint(controlPoint);
			
				this.updateOpacityBufferByNewControlPointLeftSide(nearestLeftPoint, controlPoint);
				this.updateOpacityBufferByNewControlPointRightSide(nearestRightPoint, controlPoint);
				document.querySelector( this.getSelector() ).dispatchEvent( new Event( "opacityTFModified" ) );
			}
		}
    }

	drawLeftOpacityLineForNewControlPoint(controlPoint){
		var nearestLeftPoint = this.findOpacityNearestLeftPoint(controlPoint);
		var nearestLeftPointX = nearestLeftPoint.x;
		var nearestLeftPointY = nearestLeftPoint.y;


		var line = [[[nearestLeftPointX, nearestLeftPointY], [controlPoint.x, controlPoint.y]]];
		this.clearRect(nearestLeftPointX, controlPoint.x-nearestLeftPointX);
		this.drawLine(line, [0.8,0.8,0.8], 1);

		return [nearestLeftPointX, nearestLeftPointY];
	}

	findOpacityNearestLeftPoint(controlPoint){
		var nearestLeftPointX = 0;
		var nearestLeftPointY = ( this.opacityCanvasContainer.getSize().y ) * ( 1.0 - this.opacityBuffer[0] ) - TFView.cpWidth;
		var minDistanceX = this.opacityTransferFunctionCanvas.width;

		for (var [key, point] of Object.entries(this.opacityControlPointElements)) {
			if(point == controlPoint){
				continue;
			}
			
			// if new control point has the same index(x-position) as old control point in opacity buffer, 
			// delete old one
			var leftIndex = Math.floor(point.x /  (this.getSize().x - 2* TFView.tfOffset) * this.opacityBuffer.length);
			var rightIndex = Math.floor(controlPoint.x / (this.getSize().x - 2* TFView.tfOffset) * this.opacityBuffer.length);	
			if (rightIndex == leftIndex) {
				var element = document.getElementById(point.id);
				element.remove();
				delete this.opacityControlPointElements[key];
			}
			else if(controlPoint.x - point.x < minDistanceX && controlPoint.x - point.x > 0){
				minDistanceX = controlPoint.x - point.x;
				nearestLeftPointX = point.x;
				nearestLeftPointY = point.y;
			}
		}

		return {
			x : nearestLeftPointX,
			y : nearestLeftPointY
		};
	}

	drawRightOpacityLineForNewControlPoint(controlPoint){
		var nearestRightPoint = this.findOpacityNearestRightPoint(controlPoint);
		var nearestRightPointX = nearestRightPoint.x;
		var nearestRightPointY = nearestRightPoint.y;

		var line = [[[controlPoint.x, controlPoint.y], [nearestRightPointX, nearestRightPointY]]];
		this.clearRect(controlPoint.x, nearestRightPointX - controlPoint.x);
		this.drawLine(line, [0.8,0.8,0.8], 1);

		return [nearestRightPointX, nearestRightPointY];
	}

	findOpacityNearestRightPoint(controlPoint){
		var nearestRightPointX = this.opacityTransferFunctionCanvas.width;
		var nearestRightPointY = ( this.opacityCanvasContainer.getSize().y ) * ( 1.0 - this.opacityBuffer[this.opacityBuffer.length-1] ) - TFView.cpWidth;
		var minDistanceX = this.opacityTransferFunctionCanvas.width;

		for (var [key, point] of Object.entries(this.opacityControlPointElements)) {
			if(point == controlPoint){
				continue;
			}
			
			if( point.x - controlPoint.x < minDistanceX && point.x - controlPoint.x > 0){
				minDistanceX = point.x - controlPoint.x;
				nearestRightPointX = point.x;
				nearestRightPointY = point.y;
			}
		}

		return {
			x : nearestRightPointX,
			y : nearestRightPointY
		};
	}

	updateOpacityBufferByNewControlPointLeftSide(nearestLeftPoint, controlPoint){
		var leftIndex = Math.floor(nearestLeftPoint[0] /  (this.getSize().x - 2* TFView.tfOffset) * this.opacityBuffer.length);
		var rightIndex = Math.min(Math.floor(controlPoint.x / (this.getSize().x - 2* TFView.tfOffset) * this.opacityBuffer.length), this.opacityBuffer.length-1);
		var leftOpacity = Math.max(1 - (nearestLeftPoint[1] + TFView.cpWidth) / this.opacityCanvasContainer.getSize().y, 0);
		var rightOpacity = Math.max(1 - (controlPoint.y + TFView.cpWidth) / this.opacityCanvasContainer.getSize().y, 0);

		var opacityInterval = (rightOpacity - leftOpacity) / (rightIndex - leftIndex);
		for (let i = leftIndex + 1; i <= rightIndex; i++) {
			this.opacityBuffer[i] = this.opacityBuffer[leftIndex] + opacityInterval * (i - leftIndex);
		}
	}

	updateOpacityBufferByNewControlPointRightSide(nearestRightPoint, controlPoint){
		var leftIndex = Math.floor(controlPoint.x /  (this.getSize().x - 2* TFView.tfOffset) * this.opacityBuffer.length);
		var rightIndex = Math.min(Math.floor(nearestRightPoint[0] / (this.getSize().x - 2* TFView.tfOffset) * this.opacityBuffer.length), this.opacityBuffer.length-1);
		var leftOpacity = 1 - (controlPoint.y + TFView.cpWidth) / this.opacityCanvasContainer.getSize().y;
		var rightOpacity = 1 - (nearestRightPoint[1] + TFView.cpWidth) / this.opacityCanvasContainer.getSize().y;

		var opacityInterval = (rightOpacity - leftOpacity) / (rightIndex - leftIndex);

		for (let i = rightIndex - 1; i >= leftIndex; i--) {
			this.opacityBuffer[i] = this.opacityBuffer[rightIndex] - opacityInterval * (rightIndex - i);
		}
	}
	// --- A3


	// --- A3
    colorTFClicked( clickType, clickPos )
    {
    	if( clickType == "double" && clickPos > TFView.tfOffset && clickPos < this.getSize().x - TFView.tfOffset 
			&& Object.keys(this.colorControlPointElements).length <=  this.colorPointsMaxNumber)
    	{
	    	var rX = this.getColorControlPointRelativePosition( clickPos, this.colorGradientCanvasContainer.getSize().x );
	    	var controlPoint = this.addColorControlPoint( rX, [ 0.5, 0.5, 0.5 ] )
			this.alignColorControlPointSegment(controlPoint);
    	}
    }

	alignColorControlPointSegment(controlPoint){
		var normalizedControlPointX = controlPoint.x / (this.getSize().x - 2*TFView.cpWidth);
		var colorSegment = Math.min(Math.floor(normalizedControlPointX * this.colorPointsMaxNumber), this.colorPointsMaxNumber-1);

		for (var [key, segment] of Object.entries(this.colorControlPointSegments)) {
			if (segment == colorSegment){
				var element = document.getElementById(key);
				element.remove();

				delete this.colorControlPointElements[key];
				delete this.colorControlPointSegments[key];
			}
		}

		this.colorControlPointSegments[controlPoint.id] = colorSegment;
	}
	// --- A3

    /******************************************************************************************/
    /******************************************************************************************/
    /******************************************************************************************/

	// --- A3
    // TODO - when the control point moves, update the color buffer through interpolation of the control points
    colorControlPointMoved( id )
    {
    	var controlPoint = this.colorControlPointElements[ id ];
		var normalizedControlPointX = controlPoint.x / (this.getSize().x - 2*TFView.cpWidth);
		var nowColorSegment = Math.min(Math.floor(normalizedControlPointX * this.colorPointsMaxNumber), this.colorPointsMaxNumber-1);

		this.ifColorControlPointMoveToDifferentSegment(nowColorSegment, id);

    	document.querySelector( this.getSelector() ).dispatchEvent( new Event( "colorTFModified" ) );
    }

	ifColorControlPointMoveToDifferentSegment(nowColorSegment, id){
		if (nowColorSegment != this.colorControlPointSegments[id]) {
			var colorNumberOfEachSegment = this.colorBuffer.length / this.colorPointsMaxNumber;
			var toBeChangedColorSeg = this.colorBuffer.slice(colorNumberOfEachSegment * nowColorSegment, colorNumberOfEachSegment * (nowColorSegment + 1));
			var controlledColorSeg = this.colorBuffer.slice(colorNumberOfEachSegment * this.colorControlPointSegments[id], colorNumberOfEachSegment * (this.colorControlPointSegments[id] + 1));
			
			var colorBufferInArrayType = Array.from(this.colorBuffer);
			colorBufferInArrayType.splice(colorNumberOfEachSegment * nowColorSegment, colorNumberOfEachSegment, ...controlledColorSeg);
			colorBufferInArrayType.splice(colorNumberOfEachSegment * this.colorControlPointSegments[id], colorNumberOfEachSegment, ...toBeChangedColorSeg);
			this.colorBuffer = new Float32Array(colorBufferInArrayType);

			this.ifCrossAnotherColorControlPointThenChangePosition(id, nowColorSegment);

			this.colorControlPointSegments[id] = nowColorSegment;
			this.renderGradientFromBuffer( 
				this.colorGradientCanvas, 
				this.colorGradientContext,
				3,
				this.colorBuffer );			
		}
	}

	ifCrossAnotherColorControlPointThenChangePosition(id, nowColorSegment){
		for (var [key, segment] of Object.entries(this.colorControlPointSegments)) {
			if (key == id){
				continue;
			}
		
			if(nowColorSegment == segment){
				this.colorControlPointElements[key].setPosition( this.colorControlPointSegments[id] / this.colorPointsMaxNumber * (this.getSize().x - 2*TFView.cpWidth), 0);
				this.colorControlPointSegments[key] = this.colorControlPointSegments[id];
			}
		}
	}
	// --- A3
	
	// --- A3
    // TODO - when the control point moves, update the opacity buffer through interplation of the contol points
    opacityControlPointMoved( id )
    {
    	var controlPoint = this.opacityControlPointElements[ id ];

    	/// the normalized position of the control point
    	var pos = this.getOpacityControlPointRelativePosition( {
    		"x" : controlPoint.getPosition().x + TFView.cpWidth,
    		"y" : controlPoint.getPosition().y + TFView.cpWidth
    	}, this.opacityCanvasContainer.getSize() );


		var nearestLeftPoint = this.drawLeftOpacityLineForNewControlPoint(controlPoint);
		var nearestRightPoint = this.drawRightOpacityLineForNewControlPoint(controlPoint);
		this.updateOpacityBufferByNewControlPointLeftSide(nearestLeftPoint, controlPoint);
		this.updateOpacityBufferByNewControlPointRightSide(nearestRightPoint, controlPoint);


    	document.querySelector( this.getSelector() ).dispatchEvent( new Event( "opacityTFModified" ) );
    }

    // TODO 
    renderOpacityTF()
    {
    	var ctx = this.opacityTransferFunctionContext;
    	var W   = this.opacityTransferFunctionCanvas.width;
    	var H   = this.opacityTransferFunctionCanvas.height;

    	ctx.save();
		ctx.fillStyle = this.bkgColor;
    	ctx.fillRect( 0, 0, W, H );
    	ctx.restore();

    	// ...
    }

    // TODO
    renderColorTF()
    {
		this.renderGradientFromBuffer( 
			this.colorGradientCanvas, 
			this.colorGradientContext,
			3,
			this.colorBuffer );
    }

    // TODO
    setColorTFControlsFromColorBuffer( colorBuffer ) 
    {

    }

    // TODO
    updateColorBufferFromTFControls() 
    {
    	let buffer = this.colorBuffer;

    }

    // --- A2 TODO INTEGRATE FROM 
    renderGradientFromBuffer( canvas, context, channels, data )
	{
		var widthPerRectangle = canvas.width / (data.length / 3);
		var rectangleX = 0;

		for (let i = 0; i < data.length; i += 3) {
			var rgb = Math.floor(data[i]*255).toString()+ "," + 
					  Math.floor(data[i+1]*255).toString() +"," + 
					  Math.floor(data[i+2]*255).toString();

			context.save();
			context.beginPath();

			context.clearRect(rectangleX, 0, widthPerRectangle, canvas.height);

			context.fillStyle = "rgb(" + rgb + ")";
			context.fillRect(rectangleX, 0, widthPerRectangle, canvas.height);

        	context.stroke();
        	context.restore();

			rectangleX += widthPerRectangle;
		}
	}

    /******************************************************************************************/
    /******************************************************************************************/
    /******************************************************************************************/


	// --- A3
    // Optional helper code depending on your design
    // position is between 0 and 1
    // color is [ r, g, b ], each 0 to 1
    addColorControlPoint( position, color )
    {	
    	var cssColor = 'rgb( ' + color[ 0 ] * 255.0 + ', ' 
    						   + color[ 1 ] * 255.0 + ' ,' 
    						   + color[ 2 ] * 255.0 + ')';

    	// create a widget to use as the control point
    	var controlPoint = new Widget( 
    		"ColorControlPoint", 
    		this.colorGradientCanvasContainer.getSelector(), 
    		position * ( this.getSize().x - 2*TFView.cpWidth ), 
    		0, 
    		0, 
    		20 ).setZ( 999999 )
    			.setCSSProperty( 'border-bottom', TFView.cpWidth * 2 + 'px solid ' + cssColor )
    			.setCSSProperty( 'border-left',   TFView.cpWidth + 'px solid transparent' )
    			.setCSSProperty( 'border-right',  TFView.cpWidth + 'px solid transparent' )
 				.setCSSProperty( '-webkit-filter', 'drop-shadow(1px 1px 1px rgba(0,0,0,.5)' )
 				.setCSSProperty( ' filter', 'drop-shadow(1px 1px 1px rgba(0,0,0,.5)' )
    			.setHasBorder( false );
		
    	// make the widget dragable only horizontally
    	controlPoint.setDragable( true, false, 0, 2*TFView.cpWidth, 0, 0 );

    	// add the element handle to an array
    	this.colorControlPointElements[ controlPoint.id ] = controlPoint;

    	var self = this;
    	document.querySelector( controlPoint.getSelector() ).addEventListener( "dragged", function( e ) {
    		var id = e.detail;
    		self.colorControlPointMoved( id );
    	} );	

		document.querySelector( controlPoint.getSelector() ).addEventListener( "contextmenu", function( e ) {
			var target = e.target;
			var id = target.id;
    		var element = document.getElementById(id);

			element.remove();

			delete self.colorControlPointElements[id];
			delete self.colorControlPointSegments[id];
    	} );

		return controlPoint;
    }
	// --- A3

    getColorControlPointRelativePosition( px, width )
    {
    	var x = ( px - TFView.tfOffset )
    		  / ( width - TFView.tfOffset*2 );
      
        return x;
    }

    getOpacityControlPointRelativePosition( pos, sz )
    {
    	var x = ( pos.x - TFView.tfOffset ) 
    		  / ( sz.x - TFView.tfOffset*2 );

    	var y = 1.0 - ( pos.y ) 
    		  / ( sz.y  );

        // console.log(  x + " " + y )

		return [ x, y ];
    }

	// --- A3
    // Optional helper code depending on your design
    // position is between 0 and 1
    // color is [ r, g, b ], each 0 to 1
    addOpacityControlPoint( px, py, color )
    {	
    	// console.log( px + " " + py )

    	if( ! ( px > 0 && px < 1.0 && py > 0 && py < 1.0 ) )
    	{
    		return;
    	}

    	var cssColor = 'rgb( ' + color[ 0 ] * 255.0 + ', ' 
    						   + color[ 1 ] * 255.0 + ' ,' 
    						   + color[ 2 ] * 255.0 + ')';

    	// create a widget to use as the control point
    	var controlPoint = new Widget( 
    		"OpacityControlPoint", 
    		this.opacityCanvasContainer.getSelector(), 
    		TFView.tfOffset + ( this.getSize().x - 2* TFView.tfOffset ) * px - TFView.cpWidth, 
    		( this.opacityCanvasContainer.getSize().y ) * ( 1.0 - py ) - TFView.cpWidth, 
    		2*TFView.cpWidth, 
    		2*TFView.cpWidth ).setZ( 999999 )
    			.setBkgColor( 255*color[0], 255*color[1], 255*color[2] )
 				.setCSSProperty( '-webkit-filter', 'drop-shadow(1px 1px 1px rgba(0,0,0,.5)' )
 				.setCSSProperty( 'filter', 'drop-shadow(1px 1px 1px rgba(0,0,0,.5)' )
 				.setCSSProperty( 'border-radius', TFView.cpWidth + 'px' )
    			.setHasBorder( false );

		

    	// make the widget dragable only horizontally
    	controlPoint.setDragable( true, true, 0, 0, TFView.cpWidth, -TFView.cpWidth );

    	// add the element handle to an array
    	this.opacityControlPointElements[ controlPoint.id ] = controlPoint;	

    	var self = this;
    	document.querySelector( controlPoint.getSelector() ).addEventListener( "dragged", function( e ) {
    		var id = e.detail;
    		self.opacityControlPointMoved( id );
    	} );
		
		document.querySelector( controlPoint.getSelector() ).addEventListener( "contextmenu", function( e ) {
			var target = e.target;
			var id = target.id;
    		var element = document.getElementById(id);

			var nearestPoints = self.drawOpacityLineWhenDeletingControlPoint(self.opacityControlPointElements[id]);
			self.updateOpacityBufferWhenDeletingControlPoint(nearestPoints);
			document.querySelector( self.getSelector() ).dispatchEvent( new Event( "opacityTFModified" ) );

			element.remove();
			delete self.opacityControlPointElements[id];
		});

		return controlPoint;
    }

	drawOpacityLineWhenDeletingControlPoint(controlPoint){
		// Find nearest left point
		var nearestLeftPoint = this.findOpacityNearestLeftPointWhenDeletingContolPoint(controlPoint);
		var nearestLeftPointX = nearestLeftPoint.x;
		var nearestLeftPointY = nearestLeftPoint.y;
	
		
		// Find nearest right point
		var nearestRightPoint = this.findOpacityNearestRightPointWhenDeletingContolPoint(controlPoint);
		var nearestRightPointX = nearestRightPoint.x;
		var nearestRightPointY = nearestRightPoint.y;

		var line = [[[nearestLeftPointX, nearestLeftPointY], [nearestRightPointX, nearestRightPointY]]];
		this.clearRect(nearestLeftPointX, nearestRightPointX - nearestLeftPointX);
		this.drawLine(line, [0.8,0.8,0.8], 1);

		return {
			leftX : nearestLeftPointX,
			leftY : nearestLeftPointY,
			rightX : nearestRightPointX,
			rightY : nearestRightPointY
		}
	}

	findOpacityNearestLeftPointWhenDeletingContolPoint(controlPoint){
		var nearestLeftPointX = 0;
		var nearestLeftPointY = ( this.opacityCanvasContainer.getSize().y ) * ( 1.0 - this.opacityBuffer[0] ) - TFView.cpWidth;
		var minDistanceX = this.opacityTransferFunctionCanvas.width;

		for (var [key, point] of Object.entries(this.opacityControlPointElements)) {
			if(point == controlPoint){
				continue;
			}
			
			if(controlPoint.x - point.x < minDistanceX && controlPoint.x - point.x > 0){
				minDistanceX = controlPoint.x - point.x;
				nearestLeftPointX = point.x;
				nearestLeftPointY = point.y;
			}
		}

		return {
			x : nearestLeftPointX,
			y : nearestLeftPointY
		};
	}

	findOpacityNearestRightPointWhenDeletingContolPoint(controlPoint){
		var nearestRightPointX = this.opacityTransferFunctionCanvas.width;
		var nearestRightPointY = ( this.opacityCanvasContainer.getSize().y ) * ( 1.0 - this.opacityBuffer[this.opacityBuffer.length-1] ) - TFView.cpWidth;
		var minDistanceX = this.opacityTransferFunctionCanvas.width;

		for (var [key, point] of Object.entries(this.opacityControlPointElements)) {
			if(point == controlPoint){
				continue;
			}
			
			if( point.x - controlPoint.x < minDistanceX && point.x - controlPoint.x > 0){
				minDistanceX = point.x - controlPoint.x;
				nearestRightPointX = point.x;
				nearestRightPointY = point.y;
			}
		}

		return {
			x : nearestRightPointX,
			y : nearestRightPointY
		};
	}

	updateOpacityBufferWhenDeletingControlPoint(nearestPoint){
		var leftIndex = Math.floor(nearestPoint.leftX /  (this.getSize().x - 2* TFView.tfOffset) * this.opacityBuffer.length);
		var rightIndex = Math.min(Math.floor(nearestPoint.rightX / (this.getSize().x - 2* TFView.tfOffset) * this.opacityBuffer.length), this.opacityBuffer.length-1);
		var leftOpacity = Math.max(1 - (nearestPoint.leftY + TFView.cpWidth) / this.opacityCanvasContainer.getSize().y, 0);
		var rightOpacity = Math.max(1 - (nearestPoint.rightY + TFView.cpWidth) / this.opacityCanvasContainer.getSize().y, 0);

		var opacityInterval = (rightOpacity - leftOpacity) / (rightIndex - leftIndex);
		for (let i = leftIndex + 1; i < rightIndex; i++) {
			this.opacityBuffer[i] = this.opacityBuffer[leftIndex] + opacityInterval * (i - leftIndex);
		}
	}
	// --- A3


    applyLayout()
    {
    	this.fileInput.setPosition( 0, 0 );

    	this.opacityTransferFunctionCanvas.style.top  = "0px"; 
    	this.opacityTransferFunctionCanvas.style.left = "0px";   

    	this.opacityTransferFunctionCanvas.style.height = 200; 
    	this.opacityTransferFunctionCanvas.style.height = 200 + "px"; 
    	this.opacityTransferFunctionCanvas.style.width  = this.getSize().x - TFView.tfOffset * 2  + "px";
		this.opacityTransferFunctionCanvas.height = 200;
		this.opacityTransferFunctionCanvas.width = this.getSize().x;

    	this.colorGradientCanvasContainer.setSize( this.getSize().x, 40 );
    	this.colorGradientCanvasContainer.setPosition( 0, 254 );

    	this.opacityCanvasContainer.setSize( this.getSize().x, 200 );
    	this.opacityCanvasContainer.setPosition( 0, 44 );

    	this.colorGradientCanvas.style.left = TFView.tfOffset + 'px';
    	this.opacityTransferFunctionCanvas.style.left = TFView.tfOffset + 'px';

    	if( this.getSize().x != this.colorGradientCanvas.width 
    	 || this.getSize().y != this.colorGradientCanvas.height || true )
    	{
		    this.colorGradientCanvas.width = this.getSize().x - 2 * TFView.tfOffset;
		    this.colorGradientCanvas.height  = 40;
		    this.colorGradientCanvas.style.height = 40 + 'px';
		    this.colorGradientCanvas.style.width  = this.getSize().x - 2 * TFView.tfOffset + "px";

		    this.opacityTransferFunctionCanvas.width        = this.getSize().x - 2 * TFView.tfOffset;
		    this.opacityTransferFunctionCanvas.style.width  = this.getSize().x - 2 * TFView.tfOffset + "px";

		    if( this.colorBuffer.length > 0 )
		    {
				this.render();
		    }
    	}
    }

    repositionColorControls( oldSize, newSize ) 
    {
    	for ( var key of Object.keys( this.colorControlPointElements ) ) 
    	{
    		var point = this.colorControlPointElements[ key ];	

	    	var x = this.getColorControlPointRelativePosition(
	    		point.getPosition().x,
		    	oldSize.x );

    		point.setPosition( 
    			TFView.cpWidth + ( this.colorGradientCanvasContainer.getSize().x - 2  * TFView.cpWidth ) * x,
    			point.getPosition().y
    		);
		}
    }

    repositionOpacityControls( oldSize, newSize ) 
    {
    	for ( var key of Object.keys( this.opacityControlPointElements ) ) 
    	{
    		var point = this.opacityControlPointElements[ key ];	

	    	var x = this.getOpacityControlPointRelativePosition( {
		    		"x" : point.getPosition().x,
		    		"y" : point.getPosition().y 
	    		},
		    	oldSize )[ 0 ];

    		point.setPosition( 
    			TFView.cpWidth + ( this.opacityCanvasContainer.getSize().x - 2*TFView.cpWidth ) * x,
    			point.getPosition().y
    		);
		}
    }

    render()
    {
		this.renderColorTF();
    	this.renderOpacityTF();
    }

    setSize( x, y )
    {
    	var oldSize = Object.assign( {}, this.getSize() );
    	super.setSize( x, y );
    	this.applyLayout();
    	this.repositionColorControls( oldSize, this.getSize() );
    	this.repositionOpacityControls( oldSize, this.getSize() );

    	return this;
    }

    set( tfName, colorBuffer, opacityBuffer )
    {
    	this.tfName = tfName;

    	this.colorBuffer   = colorBuffer;
    	this.opacityBuffer = opacityBuffer;
		
    	this.renderGradientFromBuffer( 
    		this.colorGradientCanvas, 
    		this.colorGradientContext,
    		3,
    		this.colorBuffer );
		



    	return this;
    }


	clearColorControlPoint(){
		for (var [id, point] of Object.entries(this.colorControlPointElements)) {
			var element = document.getElementById(id);
			element.remove();
		}

		this.colorControlPointElements = {};
		this.colorControlPointSegments = {};
	}

	// --- A3
	drawDefaultOpacityLine(){
		var defaultLine = [[[0, (1-this.opacityBuffer[0])*this.opacityTransferFunctionCanvas.height - TFView.cpWidth], 
						[this.opacityTransferFunctionCanvas.width, (1-this.opacityBuffer[this.opacityBuffer.length-1])*this.opacityTransferFunctionCanvas.height - TFView.cpWidth]]];

		// remove control points
		for (var [id, point] of Object.entries(this.opacityControlPointElements)) {
			var element = document.getElementById(id);
			element.remove();
		}
		this.opacityControlPointElements = {};

		this.clearRect(0, this.opacityTransferFunctionCanvas.width);
		this.drawLine(defaultLine, [0.8,0.8,0.8], 1);
	}

	drawLine(lines, color, width){
		var ctx = this.opacityTransferFunctionContext;
        ctx.save();

        ctx.lineWidth = width;
        ctx.strokeStyle = 'rgb(' 
            + color[ 0 ] * 255 + ',' 
            + color[ 1 ] * 255 + ',' 
            + color[ 2 ] * 255 + ')';

        for( var i = 0; i < lines.length; ++i )
        {
            var line = lines[ i ];
            ctx.beginPath();
            for( var j = 0; j < line.length - 1; ++j )
            {
                var pointA = line[ j     ];
                var pointB = line[ j + 1 ];

                ctx.moveTo( pointA[ 0 ], pointA[ 1 ] );
                ctx.lineTo( pointB[ 0 ], pointB[ 1 ] );
            }
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
	}

	clearRect(leftX, width){
		var ctx = this.opacityTransferFunctionContext;

		ctx.save();

		ctx.rect(leftX, 0, width, this.opacityTransferFunctionCanvas.height);
		ctx.fillStyle = 'rgb(40, 40, 40)';
		ctx.fill();

		ctx.restore();
	}
	// --- A3

	// --- A4
	generatePreIntegrationTable(viewIsoSurfaceBySlider, isoSurfaceMinimum, isoSurfaceMaximum){
		this.preIntegrationTable = new Float32Array(Math.pow(this.opacityBuffer.length, 2) * 4);

		for(var back = 0; back < this.opacityBuffer.length; back++){
			for(var front = 0; front < this.opacityBuffer.length; front++){

				var positionInTable = back * (this.opacityBuffer.length * 4) + front * 4;

				if (front == back) {
					this.storeColorIntoPreIntegrationTable(positionInTable, front, viewIsoSurfaceBySlider, isoSurfaceMinimum, isoSurfaceMaximum);	
				}
				else{
					var dstRgba = this.compositeColorAndAlpha(front, back, viewIsoSurfaceBySlider, isoSurfaceMinimum, isoSurfaceMaximum);
					this.storeCompositeColorIntoPreIntegrationTable(positionInTable, dstRgba);
				}
			}
		}
	}

	storeColorIntoPreIntegrationTable(positionInTable, front, viewIsoSurfaceBySlider, isoSurfaceMinimum, isoSurfaceMaximum){
		var opacity = this.opacityBuffer[front];
		if(viewIsoSurfaceBySlider){
			var normalizedFront = front / this.opacityBuffer.length;
			if(normalizedFront < isoSurfaceMinimum || normalizedFront > isoSurfaceMaximum){
				opacity = 0.0;
			}
		}

		this.preIntegrationTable[positionInTable] = this.colorBuffer[front * 3];
		this.preIntegrationTable[positionInTable + 1] = this.colorBuffer[front * 3 + 1];
		this.preIntegrationTable[positionInTable + 2] = this.colorBuffer[front * 3 + 2];
		this.preIntegrationTable[positionInTable + 3] = opacity;
	}

	compositeColorAndAlpha(front, back, viewIsoSurfaceBySlider, isoSurfaceMinimum, isoSurfaceMaximum){
		var dstRgba;

		if (front > back) {
			dstRgba = this.CompositeBackward(front, back, viewIsoSurfaceBySlider, isoSurfaceMinimum, isoSurfaceMaximum);
		}
		else if (back > front) {
			dstRgba = this.CompositeForward(front, back, viewIsoSurfaceBySlider, isoSurfaceMinimum, isoSurfaceMaximum);
		}

		return dstRgba;
	}

	CompositeBackward(front, back, viewIsoSurfaceBySlider, isoSurfaceMinimum, isoSurfaceMaximum){
		var dstColor = [0, 0, 0];
		var dstAlpha = 0;

		if(viewIsoSurfaceBySlider){
			if((front / this.opacityBuffer.length) > isoSurfaceMaximum){
				front = Math.floor(isoSurfaceMaximum * this.opacityBuffer.length);
			}
			if((back / this.opacityBuffer.length) < isoSurfaceMinimum){
				back = Math.floor(isoSurfaceMinimum * this.opacityBuffer.length);
			}
		}

		for(var i = front; i >= back; i--){
			dstColor[0] = dstColor[0] + (1-dstAlpha) * this.opacityBuffer[i] * this.colorBuffer[i * 3];
			dstColor[1] = dstColor[1] + (1-dstAlpha) * this.opacityBuffer[i] * this.colorBuffer[i * 3 + 1];
			dstColor[2] = dstColor[2] + (1-dstAlpha) * this.opacityBuffer[i] * this.colorBuffer[i * 3 + 2];
			dstAlpha = dstAlpha + (1 - dstAlpha) * this.opacityBuffer[i];
		}

		return {
			color : dstColor,
			alpha : dstAlpha
		};
	}

	CompositeForward(front, back, viewIsoSurfaceBySlider, isoSurfaceMinimum, isoSurfaceMaximum){
		var dstColor = [0, 0, 0];
		var dstAlpha = 0;

		if(viewIsoSurfaceBySlider){
			if((back / this.opacityBuffer.length) > isoSurfaceMaximum){
				back = Math.floor(isoSurfaceMaximum * this.opacityBuffer.length);
			}
			if((front / this.opacityBuffer.length) < isoSurfaceMinimum){
				front = Math.floor(isoSurfaceMinimum * this.opacityBuffer.length);
			}
		}

		for(var i = front; i <= back; i++){
			dstColor[0] = dstColor[0] + (1-dstAlpha) * this.opacityBuffer[i] * this.colorBuffer[i * 3];
			dstColor[1] = dstColor[1] + (1-dstAlpha) * this.opacityBuffer[i] * this.colorBuffer[i * 3 + 1];
			dstColor[2] = dstColor[2] + (1-dstAlpha) * this.opacityBuffer[i] * this.colorBuffer[i * 3 + 2];
			dstAlpha = dstAlpha + (1 - dstAlpha) * this.opacityBuffer[i];
		}

		return {
			color : dstColor,
			alpha : dstAlpha
		};
	}

	storeCompositeColorIntoPreIntegrationTable(positionInTable, dstRgba){
		this.preIntegrationTable[positionInTable] = dstRgba.color[0];
		this.preIntegrationTable[positionInTable + 1] = dstRgba.color[1];
		this.preIntegrationTable[positionInTable + 2] = dstRgba.color[2];
		this.preIntegrationTable[positionInTable + 3] = dstRgba.alpha;
	}


    getColorBuffer()
    {
    	return this.colorBuffer;
    }

    getOpacityBuffer()
    {
    	return this.opacityBuffer;
    }

    getInputElement()
    {
    	return this.fileInput.getInputElement();
    }
}