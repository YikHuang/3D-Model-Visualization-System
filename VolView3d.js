
class VolView3d extends Canvas2dView
{
    constructor( parent ) 
    {
        super( "volView3d", parent );
    
        THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);
        this.camera = new THREE.PerspectiveCamera( 30, this.canvas.width  / this.canvas.height , 0.01, 100 );
        // --- A2
        this.camera.position.set( -2.0, -2.75, 2.0 );
        this.cameraControls = new THREE.TrackballControls( this.camera, this.canvas );  
        this.cameraControls.target.set( 0, 0, 0 );
        this.cameraControls.enablePan = true;
        this.cameraControls.staticMoving = true;

        this.mouseDown = false;
        var self = this;

        var c = document.querySelector( this.getSelector() );

        this.canvas.addEventListener('mousedown', function (event) {
            self.mouseDown = true;    
        }, false);

        this.canvas.addEventListener('mouseup', function (event) {
            self.mouseDown = false;    
        }, false);

        this.canvas.addEventListener('mousemove', function (event) {
            if( self.mouseDown )
            {
                self.cameraControls.update();     
                c.dispatchEvent( new Event( "changed" ) );
            }
        }, false);

        this.canvas.addEventListener('wheel', function (event) {
            c.dispatchEvent( new Event( "changed" ) );
        }, false);

        return this;
    }

    setSize( width, height )
    {
        super.setSize( width, height );
        this.camera.aspect = this.canvas.width / this.canvas.height;
        this.camera.updateProjectionMatrix();
        this.cameraControls.update();
        return this;
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

    dataSpaceToWorldSpace( dims )
    {
        var M = glMatrix.mat4.create();
        var maxDim = Math.max( Math.max( dims[ 0 ], dims[ 1 ] ), dims[ 2 ] );

        glMatrix.mat4.scale(     
            M, 
            M,
            [ 
                1.0 / maxDim, 
                1.0 / maxDim, 
                1.0 / maxDim 
            ] );

        glMatrix.mat4.translate( 
            M, 
            M,
            [ 
                -dims[ 0 ] / 2.0, 
                -dims[ 1 ] / 2.0, 
                -dims[ 2 ] / 2.0 
            ] );    

        return M;
    }

    worldSpaceToDataSpace( dims )
    {
        var D = glMatrix.mat4.clone( this.dataSpaceToWorldSpace( dims ) );
        glMatrix.mat4.invert( D, D );
        return D;
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

    dataSpaceToClipSpace( dataDims )
    {
        var M = this.dataSpaceToWorldSpace( dataDims );
        var W = this.worldSpaceToClipSpace();

        var toClipSpace = glMatrix.mat4.create();

        glMatrix.mat4.mul( toClipSpace, toClipSpace, W );
        glMatrix.mat4.mul( toClipSpace, toClipSpace, M );

        return toClipSpace;
    }

    dataSpacePositionToWorldSpaceVector( dims, pos )
    {
        let toWorldSpace = this.dataSpaceToWorldSpace( dims );
        var posVector = glMatrix.vec4.fromValues( pos[ 0 ], pos[ 1 ], pos[ 2 ], 1.0 );
        glMatrix.vec4.transformMat4( posVector, posVector, toWorldSpace  );  
        return [ posVector[ 0 ], posVector[ 1 ], posVector[ 2 ] ];
    }

    dataSpacePositionToScreenSpacePos( dims, pos )
    {
        let toClipSpace = this.dataSpaceToClipSpace(dims);
        var posVector = glMatrix.vec4.fromValues(pos[0], pos[1], pos[2], 1.0);
        glMatrix.vec4.transformMat4(posVector, posVector, toClipSpace);
        return [
            this.getSize().x * ( (      posVector[0] / posVector[3]) + 1) / 2.0,
            this.getSize().y * ( ( -1 * posVector[1] / posVector[3]) + 1) / 2.0
        ];
    }

    getBBoxCorners( dims )
    {
        const A = [         0,         0,         0 ];
        const B = [ dims[ 0 ],         0,         0 ];
        const C = [ dims[ 0 ], dims[ 1 ],         0 ];
        const D = [         0, dims[ 1 ],         0 ];

        const E = [         0,         0, dims[ 2 ] ];
        const F = [ dims[ 0 ],         0, dims[ 2 ] ];
        const G = [ dims[ 0 ], dims[ 1 ], dims[ 2 ] ];
        const H = [         0, dims[ 1 ], dims[ 2 ] ];

       return [ A, B, C, D, E, F, G, H ];
    }

    getBoundingBoxGeometry( dims )
    {
        const corners = this.getBBoxCorners( dims );

        const A = corners[ 0 ]
        const B = corners[ 1 ]
        const C = corners[ 2 ]
        const D = corners[ 3 ]

        const E = corners[ 4 ]
        const F = corners[ 5 ]
        const G = corners[ 6 ]
        const H = corners[ 7 ]

        var lines = new Float32Array( [
                    A, B,
                    B, C,
                    C, D,
                    D, A,

                    E, F,
                    F, G,   
                    G, H,
                    H, E,

                    A, E,
                    B, F,
                    G, C,
                    D, H                                                                    
                ].flat( 1 ) );

        return lines;
    }

    bboxCornersWorldSpace( dims )
    {
        var corners = this.getBBoxCorners( dims );
        for( var i = 0; i < corners.length; ++i )
        {
            corners[ i ] = this.dataSpacePositionToWorldSpaceVector( dims, corners[ i ] );
        }
        return corners;
    }

    getBoundingBoxGeometry( dims )
    {
        const corners = this.getBBoxCorners( dims );

        const A = corners[ 0 ]
        const B = corners[ 1 ]
        const C = corners[ 2 ]
        const D = corners[ 3 ]

        const E = corners[ 4 ]
        const F = corners[ 5 ]
        const G = corners[ 6 ]
        const H = corners[ 7 ]

        var lines = new Float32Array( [
                    A, B,
                    B, C,
                    C, D,
                    D, A,

                    E, F,
                    F, G,   
                    G, H,
                    H, E,

                    A, E,
                    B, F,
                    G, C,
                    D, H                                                                    
                ].flat( 1 ) );

        return lines;
    }

    getAxisGeometry( dims, slicePositions )
    {
        var xAxis = new Float32Array( [
           -1,                               -1, -1, 
            dims[ 0 ] * slicePositions[ 0 ], -1, -1
        ] );

        var yAxis = new Float32Array( [
            -1,        -1,                       -1, 
            -1, dims[ 1] * slicePositions[ 1 ], -1
        ] );

        var zAxis = new Float32Array( [
            -1, -1,         -1, 
            -1, -1, dims[ 2 ] * slicePositions[ 2 ]
        ] );

        return {
            'x' : xAxis,
            'y' : yAxis,
            'z' : zAxis
        };
    }

    viewDirection()
    {
        var v = new THREE.Vector3();
        this.camera.getWorldDirection( v );
        return glMatrix.vec3.fromValues( 
            v.x,
            v.y,            
            v.z        
        );
    }

    up()
    {
        var up = this.camera.up;
        return glMatrix.vec3.fromValues( 
            up.x,
            up.y,            
            up.z        
        );
    }

    getCameraPosition()
    {
        var p = this.camera.position;
        return glMatrix.vec3.fromValues( 
            p.x,
            p.y,            
            p.z        
        );
    }
}

