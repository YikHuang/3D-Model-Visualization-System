
class CuttingPlaneView extends Canvas2dView
{
	constructor( parent, orthogonalAxis ) 
	{
		super( "cuttingPlaneView", parent );

		// --- A2
		this.setCameraInCuttingPlane(orthogonalAxis);

        this.sliceValue = 0.5;
		this.orthogonalAxis = orthogonalAxis;

        var c = document.querySelector( this.getSelector() );

        var self = this;
        this.canvas.addEventListener('wheel', function (event) {
			event.preventDefault();
			var scale = -0.0001;
			if ( event.shiftKey ) {
			    scale = -0.00001;
			}
			self.sliceValue += event.deltaY * scale;
			self.sliceValue = Math.max( Math.min( self.sliceValue, 1.0 ), 0.0 );
			c.dispatchEvent( new Event( "changed" ) );

        }, false);

        this.checkBox = new CheckBox( 
        	this.getSelector(), 
        	"" ).setTransparency( 0.25 ).setColor( 'rgba( 255, 255, 255, 0.5)' );

        document.querySelector( this.checkBox.getSelector() ).addEventListener( 'changed', function( e ) {
			c.dispatchEvent( new Event( "changed" ) );
	    }, false );

		return this;
	}


	setCameraInCuttingPlane(orthogonalAxis){
		THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);
        this.camera = new THREE.PerspectiveCamera( 30, this.canvas.width  / this.canvas.height , 0.01, 100 );
        
		if(orthogonalAxis == "x"){
			this.camera.position.set( -2.2, 0, 0 );
		} else if(orthogonalAxis == "y"){
			this.camera.position.set( 0, -2.2, 0 );
		} else if(orthogonalAxis == "z"){
			this.camera.position.set( 0, 0, -2.2 );
		}
		
		this.cameraControls = new THREE.TrackballControls( this.camera, this.canvas );  
        this.cameraControls.target.set( 0, 0, 0 );
        this.cameraControls.enablePan = true;
        this.cameraControls.staticMoving = true;
	}


	getAxisGeometry( dims )
	{
		return this.createAxisGeometry( dims );
	}

	getPlaneGeometry( dims )
	{
		return this.createPlaneGeometry( dims );
	}

	// TODO --- INTEGRATE A2 
	createPlaneGeometry( dims )
	{
		// make a quad to use for rendering cut planes
		var geom = new Float32Array( 6*3 );
    
        var slicePosition = this.sliceValue;

        if( this.orthogonalAxis == "x" )
		{
			geom = this.createYZPlaneGeometry(slicePosition, dims);

        } else if ( this.orthogonalAxis == "y" ) 
		{
			geom = this.createXZPlaneGeometry(slicePosition, dims);

        } else // this.orthogonalAxis == "z"
		{
			geom = this.createXYPlaneGeometry(slicePosition, dims);

        } 

		return geom;
	}


	createYZPlaneGeometry(slicePosition, dims){
		this.camera.position.x = slicePosition - 2.7;

		var geom = new Float32Array([
			slicePosition * dims[0], 0, 0,
			slicePosition * dims[0], dims[1], 0,
			slicePosition * dims[0], 0, dims[2],
			slicePosition * dims[0], dims[1], 0,
			slicePosition * dims[0], 0, dims[2],
			slicePosition * dims[0], dims[1], dims[2]
		]);

		return geom;
	}

	createXZPlaneGeometry(slicePosition, dims){
		this.camera.position.y = slicePosition - 2.7;

		var geom = new Float32Array([
			0, slicePosition * dims[1], 0,
			dims[0], slicePosition * dims[1], 0,
			0, slicePosition * dims[1], dims[2],
			dims[0], slicePosition * dims[1], 0,
			0, slicePosition * dims[1], dims[2],
			dims[0], slicePosition * dims[1], dims[2]
		]);

		return geom;
	}
	
	createXYPlaneGeometry(slicePosition, dims){
		this.camera.position.z = slicePosition - 2.7;

		var geom = new Float32Array([
			0, 0, slicePosition * dims[2],
			dims[0], 0, slicePosition * dims[2],
			0, dims[1],slicePosition * dims[2],
			dims[0], 0, slicePosition * dims[2],
			0, dims[1],slicePosition * dims[2],
			dims[0], dims[1], slicePosition * dims[2]
		]);

		return geom;
	}	
	// --- A2


	createAxisGeometry( dims )
	{
		let g = this.createPlaneGeometry( dims );
		return { 
			"u" : new Float32Array( [  
				g[ 0 ], g[ 1 ],  g[ 2 ],
				g[ 3 ], g[ 4 ],  g[ 5 ] ] ),

			"v" : new Float32Array( [
				g[ 0 ], g[ 1 ],  g[ 2 ],
				g[ 6 ], g[ 7 ],  g[ 8 ] ] ) };
	}

	// TODO --- --- INTEGRATE A2 
	getClipSpaceTransform( dataDims, margin )
	{
		const w = this.orthogonalAxis;

        var M = this.dataSpaceToWorldSpace( dataDims );
        var W = this.worldSpaceToClipSpace();

        var toClipSpace = glMatrix.mat4.create();
        
        glMatrix.mat4.mul( toClipSpace, toClipSpace, W );
        glMatrix.mat4.mul( toClipSpace, toClipSpace, M );

        return toClipSpace;
	}


	dataSpaceToWorldSpace( dims )
    {
        var M = glMatrix.mat4.create();
        var maxDim = Math.max( Math.max( dims[ 0 ], dims[ 1 ] ), dims[ 2 ] );

        glMatrix.mat4.scale( M, M,[ 1.0 / maxDim, 1.0 / maxDim, 1.0 / maxDim ] );
        glMatrix.mat4.translate( M, M,[ -dims[ 0 ] / 2.0, -dims[ 1 ] / 2.0, -dims[ 2 ] / 2.0 ] );    

        return M;
    }

    worldSpaceToClipSpace()
    {
        var V = this.view(); 
        var P = this.projection(); 

        var toClipSpace = glMatrix.mat4.create();

        glMatrix.mat4.mul( toClipSpace, toClipSpace, P );
        glMatrix.mat4.mul( toClipSpace, toClipSpace, V );

        return toClipSpace;
    }

	view()
    {
        this.cameraControls.update()
        return this.camera.matrixWorldInverse.toArray();
    }

    projection()
    {
        this.camera.updateProjectionMatrix();
        return this.camera.projectionMatrix.toArray();
    }
	// --- A2

	setDataDims( dims )
	{
		this.dataDims = dims;
	}

	getIsLinked()
	{
		return this.checkBox.isChecked();
	}

	setSize( width, height )
	{
		super.setSize( width, height );
		this.checkBox.setPosition( this.width - this.checkBox.getSize().x - 2 );
	}

}