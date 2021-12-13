
// basic shader for 3d rendering ////////////////////////////////////////////////////////////////

const basicVs3dSrc = 
  `#version 300 es
   in vec3 pos;
   uniform mat4 MVP;
   void main(void) {            
        gl_Position = MVP * vec4(      
           pos.x,
           pos.y,                   
           pos.z,                   
           1.0                  
        ); 
    }`;

const basicFs3dSrc = 
   `#version 300 es
	precision highp float;
    out vec4 fragColor;
    uniform vec4 color;
    void main(void) {
        fragColor = color;
    }`;

/// // TODO INTEGRATE FROM A2 Shaders for Cutting Planes //////////////////////

const cutPlaneVsSrc = 
  `#version 300 es
   
   in vec3 pos;
   uniform mat4 MVP;
   uniform float xDim;
   uniform float yDim;
   uniform float zDim;

   out vec3 textureCoordinates;

   void main(void) {           
		textureCoordinates = vec3(pos.x / xDim, pos.y / yDim, pos.z / zDim);   
		gl_Position = MVP * vec4(pos.x, pos.y, pos.z, 1.0);
    }`;

const cutPlaneFsSrc = 
   `#version 300 es
	precision highp float;

    uniform highp sampler3D volumeTextureSampler;
	uniform highp sampler2D colorTextureSampler;

	uniform float dataMin;
	uniform float dataMax;

	in vec3 textureCoordinates;
	out vec4 fragColor;

	void main(void){
		float dataValue = texture(volumeTextureSampler, textureCoordinates).r;
		float normalizedDataValue = (dataValue - dataMin) / (dataMax - dataMin);

		vec3 color = texture(colorTextureSampler, vec2(normalizedDataValue,0.5)).rgb;
		fragColor = vec4(color, 1);
	}`;

/// TODO Shaders for Texture Based Volume Rendering ////////////////////////////

const viewAlignedPlaneInstancedVsSrc = 
	`#version 300 es
	
	in vec3 pos;
	uniform mat4 M_DATA_SPACE;
	uniform mat4 M_CLIP_SPACE;
	uniform vec3 translationDirection;
	uniform float dt;
	uniform int lastIndex;
	uniform float t0;
	uniform float xDim;
	uniform float yDim;
	uniform float zDim;

	out vec3 posInWorldSpace;
	out vec3 textureCoordinates;

	void main(void) {
		float translateAmount = t0 + float( gl_InstanceID ) * dt;
		vec3 translated = translationDirection * translateAmount;
		vec3 tempPos = vec3(pos.x + translated.x, pos.y + translated.y, pos.z + translated.z);

		vec4 posInDataSpace = M_DATA_SPACE * vec4(tempPos.x, tempPos.y, tempPos.z, 1.0);           
		textureCoordinates = vec3(posInDataSpace.x / xDim, posInDataSpace.y / yDim, posInDataSpace.z / zDim); 
		posInWorldSpace = pos;
		gl_Position = M_CLIP_SPACE * vec4(tempPos.x, tempPos.y, tempPos.z, 1.0);
	}`;

const viewAlignedPlaneInstancedFsSrc = 
	`#version 300 es
	precision highp float;

	uniform highp sampler3D volSampler;
	uniform highp sampler2D colSampler;
	uniform highp sampler2D opcSampler;
	uniform highp sampler2D hatchingSampler;
	uniform highp sampler2D paperSampler;

	uniform vec3 cameraPosition;
	uniform vec3 lightPosition;
	uniform vec3 ambientColor;
	uniform vec3 diffuseColor;
	uniform vec3 specularColor;

	uniform float dataMin;
	uniform float dataMax;
	uniform float xDim;
	uniform float yDim;
	uniform float zDim;

	uniform int doLighting;
	uniform int doCartoonShading;
	uniform int doPencilSketchShading;

	uniform float normalLuminance;
	uniform float shadowLuminance;
	uniform float shadowBoundary;
	uniform float softenShadowDegree;

	uniform float specularLuminance;
	uniform float specularRange;
	uniform float softenSpecularDegree;

	uniform float viewWidth;
	uniform float viewHeight;

	uniform float hatchingWidth;
	uniform float hatchingHeight;
	uniform float hatchingNumber;

	in vec3 posInWorldSpace;
	in vec3 textureCoordinates;
	out vec4 fragColor;

	void main(void){
		if (textureCoordinates.x < 0.0 || textureCoordinates.y < 0.0 || textureCoordinates.z < 0.0 || 
			textureCoordinates.x > 1.0 || textureCoordinates.y > 1.0 || textureCoordinates.z > 1.0) {
				discard;
		}

		float dataValue = texture(volSampler, textureCoordinates).r;
		float normalizedDataValue = (dataValue - dataMin) / (dataMax - dataMin);

		vec3 color = texture(colSampler, vec2(normalizedDataValue,0.5)).rgb;
		float alpha = texture(opcSampler, vec2(normalizedDataValue,0.5)).r;

		if (doLighting == 1) {
			float h = 1.0;
			float dx = h / xDim;
			float dy = h / yDim;
			float dz = h / zDim;
			
			float gradientX = texture(volSampler, vec3(textureCoordinates.x + dx, textureCoordinates.y, textureCoordinates.z)).r 
							  - texture(volSampler, vec3(textureCoordinates.x - dx, textureCoordinates.y, textureCoordinates.z)).r;
			
			float gradientY = texture(volSampler, vec3(textureCoordinates.x, textureCoordinates.y + dy, textureCoordinates.z)).r 
							  - texture(volSampler, vec3(textureCoordinates.x, textureCoordinates.y - dy, textureCoordinates.z)).r;			
			
			float gradientZ = texture(volSampler, vec3(textureCoordinates.x, textureCoordinates.y, textureCoordinates.z + dz)).r 
							  - texture(volSampler, vec3(textureCoordinates.x, textureCoordinates.y, textureCoordinates.z - dz)).r;			
			
			vec3 surfaceNormal = normalize(vec3(gradientX, gradientY, gradientZ));

			vec3 vectorToLightSource = normalize(lightPosition - posInWorldSpace);
			float diffuseCosine = max(dot(surfaceNormal, vectorToLightSource), 0.0);
			float diffuseLightWeighting = diffuseCosine;

			vec3 vectorToView = normalize(cameraPosition - posInWorldSpace);
			vec3 reflectionVector = normalize(reflect(-vectorToLightSource, surfaceNormal));

			float specAngle = max(dot(reflectionVector, vectorToView), 0.0);
			float specularLightWeighting = pow(specAngle, 48.0);

			// --- Final
			// Cartoon Shading
			if(doCartoonShading == 1){
				if(diffuseCosine >= shadowBoundary + softenShadowDegree){
					diffuseLightWeighting = normalLuminance;
				}
				else if(diffuseCosine <= shadowBoundary - softenShadowDegree){
					diffuseLightWeighting = shadowLuminance;
				}
				else{
					diffuseLightWeighting = ((diffuseCosine - (shadowBoundary - softenShadowDegree)) * normalLuminance / (2.0 * softenShadowDegree))
											+ (((shadowBoundary + softenShadowDegree) - diffuseCosine) * shadowLuminance / (2.0 * softenShadowDegree));
				}

				if(specAngle <= 1.0 - specularRange - softenSpecularDegree){
					specularLightWeighting = 0.0;
				}
				else if(specAngle >= 1.0 - specularRange + softenSpecularDegree){
					specularLightWeighting = specularLuminance;
				}
				else{
					specularLightWeighting = (specAngle - (1.0 - specularRange - softenSpecularDegree)) * specularLuminance / (2.0 * softenSpecularDegree);
				}
			}

			vec3 outputColor;

			// Pencil Sketch Shading
			if(doPencilSketchShading == 1){
				vec2 fragPos = gl_FragCoord.xy;
				vec2 normalizedFragPos = fragPos / vec2(viewWidth, viewHeight);	

				float allHatchingWidth = hatchingWidth * hatchingNumber;
				float textureLevel = (hatchingNumber - 1.0) - min(floor(diffuseCosine * hatchingNumber), hatchingNumber - 1.0);
				float hatchingPosX = ((allHatchingWidth * (textureLevel / hatchingNumber)) + (normalizedFragPos.x * hatchingWidth)) / allHatchingWidth;
				
				vec3 pencilSketch = texture(hatchingSampler, vec2(hatchingPosX, normalizedFragPos.y)).rgb;
				vec3 paperBackground = texture(paperSampler, vec2(normalizedFragPos.xy)).rgb;
	
				outputColor = mix(pencilSketch, paperBackground, 0.4);
			}
			else{
				vec3 lightWeighting = ambientColor + diffuseLightWeighting * diffuseColor + specularLightWeighting * specularColor;
				outputColor = lightWeighting.rgb * color.rgb;
			}

			fragColor = vec4(outputColor, alpha);
		}
		else if (doLighting == 0) {
			fragColor = vec4(color, alpha);
		}
	}`;


// Shaders for Ray-casting
const rayCastingVsSrc = 
	`#version 300 es
	
	in vec3 pos;
	uniform mat4 dataSpaceToClipSpace;
	uniform float xDim;
	uniform float yDim;
	uniform float zDim;

	out vec3 textureCoordinates;

	void main(void) {           
		textureCoordinates = vec3(pos.x / xDim, pos.y / yDim, pos.z / zDim);   
		gl_Position = dataSpaceToClipSpace * vec4(pos.x, pos.y, pos.z, 1.0);
	}`; 

const rayCastingExitFsSrc = 
	`#version 300 es
	precision highp float;

	in vec3 textureCoordinates;
	out vec4 fragColor;

	void main(void){
		fragColor = vec4(textureCoordinates, 1.0);
	}`;


const rayCastingEntryFsSrc = 
	`#version 300 es
	precision highp float;

	uniform highp sampler3D volSampler;
	uniform highp sampler2D colSampler;
	uniform highp sampler2D opcSampler;
	uniform highp sampler2D preIntegrationSampler;
	uniform highp sampler2D exitTextureCoordinates;
	uniform highp sampler2D hatchingSampler;
	uniform highp sampler2D paperSampler;

	uniform mat4 dataSpaceToWorldSpace;
	uniform vec3 lightPosition;
	uniform vec3 cameraPosition;
	uniform vec3 ambientColor;
	uniform vec3 diffuseColor;
	uniform vec3 specularColor;

	uniform float normalLuminance;
	uniform float shadowLuminance;
	uniform float shadowBoundary;
	uniform float softenShadowDegree;

	uniform float specularLuminance;
	uniform float specularRange;
	uniform float softenSpecularDegree;

	uniform float viewWidth;
	uniform float viewHeight;
	uniform float xDim;
	uniform float yDim;
	uniform float zDim;
	uniform float sampleDist;
	uniform float unitDist;
	uniform float dataMin;
	uniform float dataMax;
	uniform float isoSurfaceMinimum;
	uniform float isoSurfaceMaximum;

	uniform float hatchingWidth;
	uniform float hatchingHeight;
	uniform float hatchingNumber;
	
	uniform int doLighting;
	uniform int doPreIntegration;
	uniform int doCartoonShading;
	uniform int doPencilSketchShading;


	in vec3 textureCoordinates;
	out vec4 fragColor;

	vec4 getSrcColorAndAlphaOfNonIsoSurfaceMode(vec3 textureCoordOfRayPosNow){
		float volDataValue = texture(volSampler, textureCoordOfRayPosNow).r;
		float normalizedVolDataValue = (volDataValue - dataMin) / (dataMax - dataMin);
		
		vec3 srcColor = texture(colSampler, vec2(normalizedVolDataValue, 0.5)).rgb;
		float srcAlpha = texture(opcSampler, vec2(normalizedVolDataValue, 0.5)).r;

		return vec4(srcColor, srcAlpha);
	}

	vec4 getSrcColorAndAlphaOfIsoSurfaceMode(vec3 textureCoordOfRayPosNow, vec3 rayPosNow, vec3 rayDir, vec3 dims){
		vec3 srcColor = vec3(0.0, 0.0, 0.0);
		float srcAlpha = 0.0;
		
		float volDataValue = texture(volSampler, textureCoordOfRayPosNow).r;
		float frontNormalizedVolDataValue = (volDataValue - dataMin) / (dataMax - dataMin);

		vec3 textureCoordOfNextRayPos = (rayPosNow + rayDir * sampleDist) / dims;
		float nextVolDataValue = texture(volSampler, textureCoordOfNextRayPos).r;
		float backNormalizedVolDataValue = (nextVolDataValue - dataMin) / (dataMax - dataMin);

		srcColor = texture(preIntegrationSampler, vec2(frontNormalizedVolDataValue, backNormalizedVolDataValue)).rgb;
		srcAlpha = texture(preIntegrationSampler, vec2(frontNormalizedVolDataValue, backNormalizedVolDataValue)).a;	

		return vec4(srcColor, srcAlpha);
	}

	vec4 getSrcColorAndAlpha(vec3 textureCoordOfRayPosNow, vec3 rayPosNow, vec3 rayDir, vec3 dims){
		vec4 srcRgba;
		
		if (doPreIntegration == 0) {
			srcRgba = getSrcColorAndAlphaOfNonIsoSurfaceMode(textureCoordOfRayPosNow);
		}
		else if (doPreIntegration == 1) {
			srcRgba = getSrcColorAndAlphaOfIsoSurfaceMode(textureCoordOfRayPosNow, rayPosNow, rayDir, dims);
		}

		return srcRgba;
	}

	vec3 processCartoonShading(float diffuseCosine, float specAngle){
		float diffuseLightWeighting;
		float specularLightWeighting;

		if(diffuseCosine >= shadowBoundary + softenShadowDegree){
			diffuseLightWeighting = normalLuminance;
		}
		else if(diffuseCosine <= shadowBoundary - softenShadowDegree){
			diffuseLightWeighting = shadowLuminance;
		}
		else{
			diffuseLightWeighting = ((diffuseCosine - (shadowBoundary - softenShadowDegree)) * normalLuminance / (2.0 * softenShadowDegree))
									+ (((shadowBoundary + softenShadowDegree) - diffuseCosine) * shadowLuminance / (2.0 * softenShadowDegree));
		}

		if(specAngle <= 1.0 - specularRange - softenSpecularDegree){
			specularLightWeighting = 0.0;
		}
		else if(specAngle >= 1.0 - specularRange + softenSpecularDegree){
			specularLightWeighting = specularLuminance;
		}
		else{
			specularLightWeighting = (specAngle - (1.0 - specularRange - softenSpecularDegree)) * specularLuminance / (2.0 * softenSpecularDegree);
		}

		vec3 lightWeighting = ambientColor + diffuseLightWeighting * diffuseColor + specularLightWeighting * specularColor;
		return lightWeighting;
	}

	vec3 processPencilSketchShading(float diffuseCosine){
		vec2 fragPos = gl_FragCoord.xy;
		vec2 normalizedFragPos = fragPos / vec2(viewWidth, viewHeight);

		float allHatchingWidth = hatchingWidth * hatchingNumber;
		float textureLevel = (hatchingNumber - 1.0) - min(floor(diffuseCosine * hatchingNumber), hatchingNumber - 1.0);
		float hatchingPosX = ((allHatchingWidth * (textureLevel / hatchingNumber)) + (normalizedFragPos.x * hatchingWidth)) / allHatchingWidth;
		
		vec3 pencilSketch = texture(hatchingSampler, vec2(hatchingPosX, normalizedFragPos.y)).rgb;
		vec3 paperBackground = texture(paperSampler, vec2(normalizedFragPos.xy)).rgb;

		return mix(pencilSketch, paperBackground, 0.3);
	}

	vec3 processLighting(vec3 textureCoordOfRayPosNow, vec3 srcColor){
		float h = 1.0;
		float dx = h / xDim;
		float dy = h / yDim;
		float dz = h / zDim;
		
		float gradientX = texture(volSampler, vec3(textureCoordOfRayPosNow.x + dx, textureCoordOfRayPosNow.y, textureCoordOfRayPosNow.z)).r 
						  - texture(volSampler, vec3(textureCoordOfRayPosNow.x - dx, textureCoordOfRayPosNow.y, textureCoordOfRayPosNow.z)).r;
		
		float gradientY = texture(volSampler, vec3(textureCoordOfRayPosNow.x, textureCoordOfRayPosNow.y + dy, textureCoordOfRayPosNow.z)).r 
						  - texture(volSampler, vec3(textureCoordOfRayPosNow.x, textureCoordOfRayPosNow.y - dy, textureCoordOfRayPosNow.z)).r;			
		
		float gradientZ = texture(volSampler, vec3(textureCoordOfRayPosNow.x, textureCoordOfRayPosNow.y, textureCoordOfRayPosNow.z + dz)).r 
						  - texture(volSampler, vec3(textureCoordOfRayPosNow.x, textureCoordOfRayPosNow.y, textureCoordOfRayPosNow.z - dz)).r;			
		
		vec3 surfaceNormal = normalize(vec3(gradientX, gradientY, gradientZ));
		vec3 posInWorldSpace = (dataSpaceToWorldSpace * vec4(textureCoordOfRayPosNow, 1.0)).xyz;

		vec3 vectorToLightSource = normalize(lightPosition - posInWorldSpace);
		float diffuseCosine = max(dot(vectorToLightSource, surfaceNormal), 0.0);
		float diffuseLightWeighting = diffuseCosine;

		vec3 vectorToView = normalize(cameraPosition - posInWorldSpace);
		vec3 reflectionVector = normalize(reflect(-vectorToLightSource, surfaceNormal));

		float specAngle = max(dot(reflectionVector, vectorToView), 0.0);
		float specularLightWeighting = pow(specAngle, 48.0);

		// --- Final
		vec3 lightWeighting;
		if(doCartoonShading == 1){
			lightWeighting = processCartoonShading(diffuseCosine, specAngle);
		}
		else{
			lightWeighting = ambientColor + diffuseLightWeighting * diffuseColor + specularLightWeighting * specularColor;
		}

		if(doPencilSketchShading == 1){
			srcColor = processPencilSketchShading(diffuseCosine);
		}
		else{
			srcColor = lightWeighting * srcColor;
		}

		return srcColor;
	}

	vec4 rayCasting(int nSample, vec3 rayPosNow, vec3 dims, vec3 rayDir){
		vec3 dstColor = vec3(0.0, 0.0, 0.0);
		float dstAlpha = 0.0;

		for(int i = 0; i < nSample; i++){
			vec3 textureCoordOfRayPosNow = rayPosNow / dims;
			vec3 srcColor = vec3(0.0, 0.0, 0.0);
			float srcAlpha = 0.0;

			// Get Source Color and Alpha
			vec4 srcRgba = getSrcColorAndAlpha(textureCoordOfRayPosNow, rayPosNow, rayDir, dims);
			srcColor = srcRgba.rgb;
			srcAlpha = srcRgba.a;


			if (doLighting == 1) {
				srcColor = processLighting(textureCoordOfRayPosNow, srcColor);
			}

			// Calculate Corrected Color and Alpha
			vec3 srcColorCorrected = srcColor * srcAlpha * (sampleDist / unitDist);
			float srcAlphaCorrected = 1.0 - pow((1.0 - srcAlpha), (sampleDist / unitDist));

			// Calculate Composite Color and Alpha
			dstColor = dstColor + srcColorCorrected * (1.0 - dstAlpha);
			dstAlpha = dstAlpha + srcAlphaCorrected * (1.0 - dstAlpha);
			
			rayPosNow = rayPosNow + rayDir * sampleDist;
		}

		return vec4(dstColor, dstAlpha);
	}

	void main(void){
		vec2 fragPos = gl_FragCoord.xy;
		vec2 normalizedFragPos = fragPos / vec2(viewWidth, viewHeight);

		vec3 entryPoint = textureCoordinates;
		vec3 exitPoint = texture(exitTextureCoordinates, normalizedFragPos).xyz;
		vec3 dims = vec3(xDim, yDim, zDim);

		vec3 fullRay = (exitPoint - entryPoint) * dims;
		vec3 rayDir = normalize(fullRay);

		float totalDist = length(fullRay);
		int nSample = int(floor(totalDist / sampleDist));

		vec3 rayPosNow = entryPoint * dims;

		if(doPreIntegration == 1){
			nSample = nSample - 1;
		}

		vec4 dstRgba = rayCasting(nSample, rayPosNow, dims, rayDir);
		fragColor = dstRgba;
	}
	


	`;


//////////////////////////////////////////////////////////////////////////////////

class VolRenderer {

	static nextId = 0;

	compileShader( vsSrc, fsSrc )
	{
		var gl = this.gl;

		var vs = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vs, vsSrc );
        gl.compileShader( vs );
        var message = gl.getShaderInfoLog( vs );
        if( message.length > 0) {
            throw message;
        }

        var fs = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fs, fsSrc );
        gl.compileShader( fs );
        message = gl.getShaderInfoLog( fs );
        if (message.length > 0) {
            throw message;
        }

        var program = gl.createProgram();
        gl.attachShader( program, vs  ); 
        gl.attachShader( program, fs );
        gl.linkProgram(  program );
        if ( ! gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
            window.alert( 'Shader program failed: ' 
                + gl.getProgramInfoLog( program ) );
        }

        return program;
	}

	constructor()
	{
        this.glCanvas = document.createElement( 'canvas' );
        this.id = "VolRenderer_" + VolRenderer.nextId++;
        this.glCanvas.setAttribute( 'id', this.id );

        this.gl = this.glCanvas.getContext( "webgl2", { antialias: true } );
        var gl = this.gl;

		const ext = gl.getExtension("EXT_color_buffer_float");
		if (!ext) {
		    console.error( "Extension 'EXT_color_buffer_float' not supported" );
		    return;
		}

		const ext2 = gl.getExtension( 'OES_texture_float_linear' );
		if (!ext2) {
		    console.error( "Extension 'OES_texture_float_linear' not supported" );
		    return;
		}

        // Only continue if WebGL is available and working
        if ( gl === null) {
          window.alert( "Unable to initialize WebGL." );
          return null;
        }    

        // textures

        this.volTex = gl.createTexture();
        this.colTex = gl.createTexture();
        this.opcTex = gl.createTexture();
		this.exitPointTexture = gl.createTexture();   
		this.preIntegrationTex = gl.createTexture();
		this.hatchingTexture = gl.createTexture();
		this.paperTexture = gl.createTexture();
	
        // buffers

        this.vertexBuffer = this.gl.createBuffer();

		// frame buffer

		this.renderTextureFrameBuffer = gl.createFramebuffer();

        // shaders for simple 3d rendering (bounding boxes axis, etc)

        this.basicShaderProgram = this.compileShader( basicVs3dSrc, basicFs3dSrc );

        // TODO compile shaders for rendering the cutting planes

        this.cuttingPlaneShaderProgram = this.compileShader( cutPlaneVsSrc, cutPlaneFsSrc );

        // TODO compile shader for rendering view aligned polygones for texture based volume rendering
        
        this.textureBasedVolumeRenderShader = this.compileShader( viewAlignedPlaneInstancedVsSrc, viewAlignedPlaneInstancedFsSrc );

		// Compile shader for ray-casting
		this.rayCastingExitShader = this.compileShader( rayCastingVsSrc, rayCastingExitFsSrc);
		this.rayCastingEntryShader = this.compileShader( rayCastingVsSrc, rayCastingEntryFsSrc);

        return this;
	}

	render(  
		viewWidth, 
		veiwHeight, 
		vertices,
		MVP,
		color,
		mode,
		lineWidth )
	{
		var gl = this.gl;

		this.glCanvas.width  = viewWidth;
		this.glCanvas.height = veiwHeight;

		gl.viewport( 0, 0, viewWidth, veiwHeight );
		gl.disable( gl.CULL_FACE );

		gl.lineWidth( lineWidth );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW, 0 );

		gl.useProgram( this.basicShaderProgram );

		gl.uniform4fv( 
			gl.getUniformLocation( this.basicShaderProgram, "color" ), 
			color );

		gl.uniformMatrix4fv( 
			gl.getUniformLocation( this.basicShaderProgram, "MVP" ), 
			false, 
			MVP ); 

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );

		var posAttr = gl.getAttribLocation( this.basicShaderProgram, "pos" );
		gl.vertexAttribPointer( posAttr, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( posAttr );
		
		gl.drawArrays( 
			mode, 
			0, 
			vertices.length / 3 );   
		
		gl.disableVertexAttribArray( posAttr );     
    }

    // TODO --- INTEGRATE FROM A2
	renderCuttingSurface( 
		viewWidth, 
		viewHeight, 
		surfaceVertices, 
        dataSpaceToClipSpaceMatrix,
		dataDims )
	{
		//test
		// surfaceVertices = new Float32Array([0,0,0,0,250,0,250,250,0]);
		var gl = this.gl;

		gl.viewport(0, 0, viewWidth, viewHeight);
		gl.disable( gl.CULL_FACE );
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, surfaceVertices, gl.DYNAMIC_DRAW, 0);

		gl.useProgram(  this.cuttingPlaneShaderProgram );

		this.assignUniformValueForCuttingSurface(dataSpaceToClipSpaceMatrix, dataDims);

		var posAttr = gl.getAttribLocation(this.cuttingPlaneShaderProgram, "pos");
		this.bindVertexBufferToShaderProgramForCuttingSurface(posAttr);
		this.bindTextureToShaderProgramForCuttingSurface();

		gl.drawArrays( gl.TRIANGLES, 0, surfaceVertices.length / 3 ); 
		gl.disableVertexAttribArray( posAttr );

	}

	assignUniformValueForCuttingSurface(dataSpaceToClipSpaceMatrix, dataDims){
		var gl = this.gl;

		gl.uniformMatrix4fv(
			gl.getUniformLocation(this.cuttingPlaneShaderProgram, "MVP"),
			false,
			dataSpaceToClipSpaceMatrix
		);

		gl.uniform1f(
			gl.getUniformLocation(this.cuttingPlaneShaderProgram, "xDim"),
			dataDims[0]
		);

		gl.uniform1f(
			gl.getUniformLocation(this.cuttingPlaneShaderProgram, "yDim"),
			dataDims[1]
		);

		gl.uniform1f(
			gl.getUniformLocation(this.cuttingPlaneShaderProgram, "zDim"),
			dataDims[2]
		);

		gl.uniform1f(
			gl.getUniformLocation(this.cuttingPlaneShaderProgram, "dataMax"),
			this.dataMax
		);

		gl.uniform1f(
			gl.getUniformLocation(this.cuttingPlaneShaderProgram, "dataMin"),
			this.dataMin
		);
	}

	bindVertexBufferToShaderProgramForCuttingSurface(posAttr){
		var gl = this.gl;

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
		gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(posAttr);
	}

	bindTextureToShaderProgramForCuttingSurface(){
		var gl = this.gl;

		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_3D, this.volTex );

		gl.activeTexture( gl.TEXTURE1 );
		gl.bindTexture( gl.TEXTURE_2D, this.colTex );

		// 0 means TEXTURE0, and TEXTURE0 is binded with volTex, so data in volTex would flow into volumeTextureSampler
		gl.uniform1i( gl.getUniformLocation( this.cuttingPlaneShaderProgram, "volumeTextureSampler" ), 0 );
		gl.uniform1i( gl.getUniformLocation( this.cuttingPlaneShaderProgram, "colorTextureSampler" ), 1 );
	}
	// --- A2


	// --- A3
    // TODO --- render the instanced view aligned polygons --- fill in the missing part at the end
    // --- modify as/if needed for any cusomizations
	renderInstancedViewAlignedCuttingPlanes(
		viewWidth, 
		viewHeight, 
		basePolygone, 
		translationDirection,
		t0,
		dt,				
		nPlanes,
		worldSpaceToDataSpace,
        worldSpaceToClipSpace,
		dataDims,
		alphaScale,
		doLighting,
		doCartoonShading,
		doPencilSketchShading, 
		cameraPos,
		lightPos,
		lightColor )
	{
		let gl = this.gl;
		let sp = this.textureBasedVolumeRenderShader;

		this.glCanvas.width  = viewWidth;
		this.glCanvas.height = viewHeight;

		this.passPolygonDataToBufferAndIntializeSetting(gl, sp, viewWidth, viewHeight, basePolygone);

		this.assignUniformForVertexShaderOfViewAlignedCuttingPlanes(gl, sp, translationDirection, dt, nPlanes, t0, 
			dataDims, worldSpaceToDataSpace, worldSpaceToClipSpace);


		this.bindTextureForViewAlignedCuttingPlanes(gl);
		this.assignUniformForFragmentShaderOfViewAlignedCuttingPlanes(gl, sp, doLighting, doCartoonShading, 
			doPencilSketchShading, viewWidth, viewHeight, cameraPos, lightPos, lightColor);

		var posAttr = this.enablePosAttrInVertexShaderOfViewAlignedCuttingPlanes(gl, sp);

		gl.drawArraysInstanced(
			gl.TRIANGLES, 
			0, 
			basePolygone.length / 3, 
			nPlanes );
		
		gl.disableVertexAttribArray( posAttr );     
	}

	passPolygonDataToBufferAndIntializeSetting(gl, sp, viewWidth, viewHeight, basePolygone){
		gl.viewport( 0, 0, viewWidth, viewHeight );
		gl.disable( gl.CULL_FACE );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, basePolygone, gl.DYNAMIC_DRAW, 0 );

		gl.useProgram(  sp );
	}

	assignUniformForVertexShaderOfViewAlignedCuttingPlanes(gl, sp, translationDirection, dt, nPlanes, t0, 
		dataDims, worldSpaceToDataSpace, worldSpaceToClipSpace){
		gl.uniform1i( gl.getUniformLocation( sp, "volSampler" ), 0 );
		gl.uniform1i( gl.getUniformLocation( sp, "colSampler" ), 1 );
		gl.uniform1i( gl.getUniformLocation( sp, "opcSampler" ), 2 );
		gl.uniform1i( gl.getUniformLocation( sp, "hatchingSampler" ), 3 );
		gl.uniform1i( gl.getUniformLocation( sp, "paperSampler" ), 4 );

		gl.uniform3fv( gl.getUniformLocation( sp, "translationDirection" ), new Float32Array( translationDirection ) );
		gl.uniform1f( gl.getUniformLocation( sp, "dt" ), dt );
		gl.uniform1i( gl.getUniformLocation( sp, "lastIndex" ), nPlanes-1 );
		gl.uniform1f( gl.getUniformLocation( sp, "t0" ), t0 );

		gl.uniform1f( gl.getUniformLocation( sp, "xDim" ), dataDims[ 0 ] );
		gl.uniform1f( gl.getUniformLocation( sp, "yDim" ), dataDims[ 1 ] );
		gl.uniform1f( gl.getUniformLocation( sp, "zDim" ), dataDims[ 2 ] );

		gl.uniformMatrix4fv( 
			gl.getUniformLocation( sp, "M_DATA_SPACE" ), 
			false, 
			worldSpaceToDataSpace ); 

		gl.uniformMatrix4fv( 
			gl.getUniformLocation( sp, "M_CLIP_SPACE" ), 
			false, 
			worldSpaceToClipSpace ); 
	}

	bindTextureForViewAlignedCuttingPlanes(gl){
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_3D, this.volTex );

		gl.activeTexture( gl.TEXTURE1 );
		gl.bindTexture( gl.TEXTURE_2D, this.colTex );

		gl.activeTexture( gl.TEXTURE2 );
		gl.bindTexture( gl.TEXTURE_2D, this.opcTex );

		gl.activeTexture( gl.TEXTURE3 );
		gl.bindTexture( gl.TEXTURE_2D, this.hatchingTexture );
		
		gl.activeTexture( gl.TEXTURE4 );
		gl.bindTexture( gl.TEXTURE_2D, this.paperTexture );
	}

	assignUniformForFragmentShaderOfViewAlignedCuttingPlanes(gl, sp, doLighting, doCartoonShading, 
		doPencilSketchShading, viewWidth, viewHeight, cameraPos, lightPos, lightColor){

		gl.uniform1f( gl.getUniformLocation( sp, "dataMin" ), this.dataMin );
		gl.uniform1f( gl.getUniformLocation( sp, "dataMax" ), this.dataMax );

		gl.uniform1f( gl.getUniformLocation( sp, "normalLuminance" ), 1.0 );
		gl.uniform1f( gl.getUniformLocation( sp, "shadowLuminance" ), 0.0 );
		gl.uniform1f( gl.getUniformLocation( sp, "shadowBoundary" ), 0.5 );
		gl.uniform1f( gl.getUniformLocation( sp, "softenShadowDegree" ), 0.1 );

		gl.uniform1f( gl.getUniformLocation( sp, "specularLuminance" ), 0.5 );
		gl.uniform1f( gl.getUniformLocation( sp, "specularRange" ), 0.1 );
		gl.uniform1f( gl.getUniformLocation( sp, "softenSpecularDegree" ), 0.05 );

		gl.uniform1f( gl.getUniformLocation( sp, "hatchingWidth" ), this.hatchingWidth );
		gl.uniform1f( gl.getUniformLocation( sp, "hatchingHeight" ), this.hatchingHeight );
		gl.uniform1f( gl.getUniformLocation( sp, "hatchingNumber" ), this.hatchingNumber );

		gl.uniform1f( gl.getUniformLocation( sp, "viewWidth" ), viewWidth );
		gl.uniform1f( gl.getUniformLocation( sp, "viewHeight" ), viewHeight );

		gl.uniform1i( gl.getUniformLocation( sp, "doLighting" ), doLighting ? 1 : 0 );
		gl.uniform1i( gl.getUniformLocation( sp, "doCartoonShading"), doCartoonShading ? 1 : 0);
		gl.uniform1i( gl.getUniformLocation( sp, "doPencilSketchShading"), doPencilSketchShading ? 1 : 0);
		gl.uniform3fv( gl.getUniformLocation( sp, "cameraPosition"), new Float32Array( cameraPos ));
		gl.uniform3fv( gl.getUniformLocation( sp, "lightPosition"), new Float32Array( [-lightPos.x, -lightPos.y, -lightPos.z] ));
		gl.uniform3fv( gl.getUniformLocation( sp, "ambientColor"), new Float32Array( [lightColor.ambient.r, lightColor.ambient.g, lightColor.ambient.b] ));
		gl.uniform3fv( gl.getUniformLocation( sp, "diffuseColor"), new Float32Array( [lightColor.diffuse.r, lightColor.diffuse.g, lightColor.diffuse.b] ));
		gl.uniform3fv( gl.getUniformLocation( sp, "specularColor"), new Float32Array( [lightColor.specular.r, lightColor.specular.g, lightColor.specular.b] ));
	}

	enablePosAttrInVertexShaderOfViewAlignedCuttingPlanes(gl, sp){
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );

		var posAttr = gl.getAttribLocation( sp, "pos" );
		gl.vertexAttribPointer( posAttr, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( posAttr );

		return posAttr;
	}


	// TODO 
	renderTextureBasedVolume( 
		viewWidth,
		viewHeight, 
		cameraPosVec,
		cameraUpVec,	
		bboxCornersWorldSpace,	
		worldSpaceToClipSpace,
		worldSpaceToDataSpace,
		dims,
		doLighting,
		doCartoonShading,
		doPencilSketchShading, 
		sampleDistance,
		lightPos,
		lightColor )
	{

		var vector = this.generateVectorOfVolume(cameraPosVec, cameraUpVec);

		// vector pointing from (0,0,0) in world space to the camera position
		var translationDirection = vector.translationDirection;

		// up vector of the camera in world space
		var upVector = vector.upVector;
		
		// camera right vector
		var rightVec = vector.rightVec;


 		// follow the algorithm in the slides, or your own to create a base plane for the instanced rendering
		var polygon = this.generateBasedPolygonCoordinates(bboxCornersWorldSpace, upVector, rightVec);


		// the spacing between the planes in world space
		// divide by maxDim, as this is the way our world space is normalized
		var maxDim = Math.max( Math.max( dims[ 0 ], dims[ 1 ] ), dims[ 2 ] );
		var dt = sampleDistance / maxDim;

		// the data is centered at (0,0,0) in worldspace, so distance to the camera is the length its position vector
		var camDist = glMatrix.vec3.length( cameraPosVec );
		
		// wMax, wMin are the closest and furthest distances from the view aligned plane at the camera position
		// dw is the distance in world space between the closest and furtherest corner of the bounding box
		var distanceFromCornerToCamera = this.calculateDistanceFromCornerToCamera(bboxCornersWorldSpace, cameraPosVec);
		var wMax = distanceFromCornerToCamera.wMax;
		var wMin = distanceFromCornerToCamera.wMin;
		var dW = ( wMax - wMin );

		// the number of planes will be that distance divided by the spacing between planes
		var NSample = dW / dt;
		
		// the amount of translation for the furthest plane (we're rendering back to front)
		// wMax - camDist gives us the distance between the furthest point and the base plane
		// we want to start this far back, so it is negative
		var t0 = -( wMax - camDist );

		this.renderInstancedViewAlignedCuttingPlanes( 
			viewWidth,
			viewHeight,
			polygon,               // the view aligned polygone
			translationDirection,  // the normalized direction vector to translate the polygone in 
		    t0,                    // the amount of translation of the plane to start from
			dt,                    // the amount to translate each plane in world space
			NSample,               // the number of planes to render			
			worldSpaceToDataSpace, // worldSpaceToDataSpace  matrix
			worldSpaceToClipSpace, // worldSpaceToClipSpace  matrix
			dims,                  // data dimensions
			1.0,                   // unit opacity
			doLighting,
			doCartoonShading, 
			doPencilSketchShading, 
			cameraPosVec,
			lightPos,
			lightColor );          // whether to do lighting
	}

	generateVectorOfVolume(cameraPosVec, cameraUpVec){
		// vector pointing from (0,0,0) in world space to the camera position
		var normalVec = glMatrix.vec3.create();
		glMatrix.vec3.normalize( normalVec, cameraPosVec );
		glMatrix.vec3.scale( normalVec, normalVec, 1.0 );
		var translationDirection = normalVec;
		
		// up vector of the camera in world space
		var upVector = cameraUpVec;
		glMatrix.vec3.normalize( upVector, upVector );
		
		// camera right vector
		var rightVec = glMatrix.vec3.create();
		glMatrix.vec3.cross( rightVec, upVector, normalVec );
		glMatrix.vec3.normalize( rightVec, rightVec );

		return {
			translationDirection : translationDirection,
			upVector : upVector,
			rightVec : rightVec
		};
	}

	generateBasedPolygonCoordinates(bboxCornersWorldSpace, upVector, rightVec){
		var polygon = [];

		var length = Math.sqrt(bboxCornersWorldSpace[0][0] ** 2 + bboxCornersWorldSpace[1][1] ** 2 + bboxCornersWorldSpace[2][2] ** 2);
        var verticalPoint = glMatrix.vec3.create();
		var horizontalPoint = glMatrix.vec3.create();
		glMatrix.vec3.scale(verticalPoint,upVector, length);
		glMatrix.vec3.scale(horizontalPoint, rightVec, length);

		var topRight = [verticalPoint[0] + horizontalPoint[0], verticalPoint[1] + horizontalPoint[1], verticalPoint[2] + horizontalPoint[2]];
		var topLeft = [verticalPoint[0] - horizontalPoint[0], verticalPoint[1] - horizontalPoint[1], verticalPoint[2] - horizontalPoint[2]];
		var bottomRight = [-verticalPoint[0] + horizontalPoint[0], -verticalPoint[1] + horizontalPoint[1], -verticalPoint[2] + horizontalPoint[2]];
		var bottomLeft = [-verticalPoint[0] - horizontalPoint[0], -verticalPoint[1] - horizontalPoint[1], -verticalPoint[2] - horizontalPoint[2]];
		var bigQuad = [topRight,topLeft,bottomRight,bottomLeft];

		var bigQuadSequence = [0,1,3,0,2,3];
		for (let i = 0; i < bigQuadSequence.length; i++){
			polygon.push(bigQuad[bigQuadSequence[i]][0]);
			polygon.push(bigQuad[bigQuadSequence[i]][1]);
			polygon.push(bigQuad[bigQuadSequence[i]][2]);
		}

		polygon = new Float32Array(polygon);
		return polygon;
	}

	calculateDistanceFromCornerToCamera(bboxCornersWorldSpace, cameraPosVec){
		var wMax;
		var wMin;

		for (let i = 0; i < bboxCornersWorldSpace.length; i++){
			var distanceFromCornerToCamera = 0;
			for (let j = 0; j < bboxCornersWorldSpace[i].length; j++) {
				distanceFromCornerToCamera = distanceFromCornerToCamera + (bboxCornersWorldSpace[i][j] - cameraPosVec[j]) ** 2;
			}

			if(distanceFromCornerToCamera > wMax || i == 0){
				wMax = distanceFromCornerToCamera;
			}
			if(distanceFromCornerToCamera < wMin || i == 0){
				wMin = distanceFromCornerToCamera;
			}
		}

		wMax = Math.sqrt(wMax);
		wMin = Math.sqrt(wMin);

		return {
			wMax : wMax,
			wMin : wMin
		};
	}

	// --- A3


	// --- A4
	renderRayCastingVolume(
		viewWidth, 
		viewHeight, 
		dataSpaceToClipSpace, 
		dataSpaceToWorldSpace, 
		dataDims, 
		doLighting, 
		doPreIntegration,
		isoSurfaceMinimum,
		isoSurfaceMaximum,
		doCartoonShading,
		doPencilSketchShading,
		cameraPos,
		lightPos,
		lightColor)
	{
		var gl = this.gl;

		this.glCanvas.width = viewWidth;
		this.glCanvas.height = viewHeight;

		var cubeFace = this.generateCubeFace(dataDims);

		// Exit Shader
		this.rayCastingBindExitPointToTexture(gl, viewWidth, viewHeight, cubeFace, dataSpaceToClipSpace, dataDims);

		// Entry Shader
		this.rayCastingRenderFromEntryPointToExitPoint(gl, viewWidth, viewHeight, cubeFace, dataSpaceToClipSpace, 
			dataSpaceToWorldSpace, dataDims, isoSurfaceMinimum, isoSurfaceMaximum, cameraPos, doLighting, 
			doPreIntegration, doCartoonShading, doPencilSketchShading, lightPos, lightColor);
	}

	generateCubeFace( dims ){
		var points = new Float32Array( 3*6*6 );
		
		var corners = [
			[ [ 0,0,0 ], [ 1,0,0 ], [ 1,0,1 ], [ 0,0,1 ] ],
            [ [ 1,0,0 ], [ 1,1,0 ], [ 1,1,1 ], [ 1,0,1 ] ],
            [ [ 1,1,0 ], [ 0,1,0 ], [ 0,1,1 ], [ 1,1,1 ] ],
            [ [ 0,1,0 ], [ 0,0,0 ], [ 0,0,1 ], [ 0,1,1 ] ],
            [ [ 0,0,1 ], [ 1,0,1 ], [ 1,1,1 ], [ 0,1,1 ] ],
            [ [ 0,1,0 ], [ 1,1,0 ], [ 1,0,0 ], [ 0,0,0 ] ]
		];

		var cornerOrder = [0,1,2,0,2,3];

		for (var faceIndex = 0; faceIndex < corners.length; faceIndex++) {
			var faceOffset = faceIndex*18;

			for (var cornerOrderIndex = 0; cornerOrderIndex < 6; cornerOrderIndex++) {
				var cornerOffset = cornerOrderIndex*3;
				points[faceOffset + cornerOffset] = corners[faceIndex][cornerOrder[cornerOrderIndex]][0] * dims[0];
				points[faceOffset + cornerOffset + 1] = corners[faceIndex][cornerOrder[cornerOrderIndex]][1] * dims[1];
				points[faceOffset + cornerOffset + 2] = corners[faceIndex][cornerOrder[cornerOrderIndex]][2] * dims[2];
			}
		}
		
		return points;
	}

	rayCastingBindExitPointToTexture(gl, viewWidth, viewHeight, cubeFace, dataSpaceToClipSpace, dataDims){
		gl.viewport( 0, 0, viewWidth, viewHeight );

		this.createExitPointTexture(gl, viewWidth, viewHeight);
		this.bindFrameBufferToTexture(gl);

		this.initializeRayCastingExitShader(gl, cubeFace)
		this.assignUniformToRayCastingExitShader(gl, dataSpaceToClipSpace, dataDims);
		
		this.enablePosAttrOfRayCastingExitShader(gl);

		gl.drawArrays(gl.TRIANGLES, 0, cubeFace.length / 3 );
	}

	createExitPointTexture(gl, viewWidth, viewHeight){
		gl.bindTexture(gl.TEXTURE_2D, this.exitPointTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, viewWidth, viewHeight, 0, gl.RGBA, gl.FLOAT, null);	
		
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	}

	bindFrameBufferToTexture(gl){
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTextureFrameBuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.exitPointTexture, 0);

		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
			console.log("Frame buffer was incomplete");
		}
	}

	initializeRayCastingExitShader(gl, cubeFace){
		gl.enable( gl.CULL_FACE );
		gl.cullFace(gl.FRONT);

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, cubeFace, gl.DYNAMIC_DRAW, 0 );

		gl.useProgram(  this.rayCastingExitShader );
	}

	assignUniformToRayCastingExitShader(gl, dataSpaceToClipSpace, dataDims){
		gl.uniformMatrix4fv(
			gl.getUniformLocation(this.rayCastingExitShader, "dataSpaceToClipSpace"), 
			false, 
			dataSpaceToClipSpace);

		gl.uniform1f(gl.getUniformLocation(this.rayCastingExitShader, "xDim"), dataDims[0]);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingExitShader, "yDim"), dataDims[1]);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingExitShader, "zDim"), dataDims[2]);
	}

	enablePosAttrOfRayCastingExitShader(gl){
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
		var posAttr = gl.getAttribLocation( this.rayCastingExitShader, "pos" );
		gl.vertexAttribPointer( posAttr, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( posAttr );
	}


	rayCastingRenderFromEntryPointToExitPoint(gl, viewWidth, viewHeight, cubeFace, dataSpaceToClipSpace, 
		dataSpaceToWorldSpace, dataDims, isoSurfaceMinimum, isoSurfaceMaximum, cameraPos, doLighting, 
		doPreIntegration, doCartoonShading, doPencilSketchShading, lightPos, lightColor){

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		this.initializeRayCastingEntryShader(gl, viewWidth, viewHeight, cubeFace);
		
		this.assignUniformMatrixToRayCastingEntryShader(gl, dataSpaceToClipSpace, dataSpaceToWorldSpace);
		this.assignUniformFloatToRayCastingEntryShader(gl, dataDims, viewWidth, viewHeight, isoSurfaceMinimum, isoSurfaceMaximum);
		this.assignUniformVectorToRayCastingEntryShader(gl, cameraPos, lightPos, lightColor);
		this.assignUniformIntToRayCastingEntryShader(gl, doLighting, doPreIntegration, doCartoonShading, doPencilSketchShading);
		this.assignUniformSamplerToRayCastingEntryShader(gl);
		
		this.bindTextureForRayCastingEntryShader(gl);
		this.enablePosAttrOfRayCastingEntryShader(gl);

		gl.drawArrays(gl.TRIANGLES, 0, cubeFace.length / 3 );
	}

	initializeRayCastingEntryShader(gl, viewWidth, viewHeight, cubeFace){
		gl.viewport( 0, 0, viewWidth, viewHeight );

		gl.enable( gl.CULL_FACE );
		gl.cullFace(gl.BACK);

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, cubeFace, gl.DYNAMIC_DRAW, 0 );

		gl.useProgram(  this.rayCastingEntryShader );
	}

	assignUniformMatrixToRayCastingEntryShader(gl, dataSpaceToClipSpace, dataSpaceToWorldSpace){
		gl.uniformMatrix4fv(
			gl.getUniformLocation(this.rayCastingEntryShader, "dataSpaceToClipSpace"), 
			false, 
			dataSpaceToClipSpace);

		gl.uniformMatrix4fv(
			gl.getUniformLocation(this.rayCastingEntryShader, "dataSpaceToWorldSpace"), 
			false, 
			dataSpaceToWorldSpace);	
	}

	assignUniformFloatToRayCastingEntryShader(gl, dataDims, viewWidth, viewHeight, isoSurfaceMinimum, isoSurfaceMaximum){
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "xDim"), dataDims[0]);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "yDim"), dataDims[1]);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "zDim"), dataDims[2]);

		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "viewWidth"), viewWidth);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "viewHeight"), viewHeight);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "sampleDist"), 2.5);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "unitDist"), 1);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "dataMin"), this.dataMin);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "dataMax"), this.dataMax);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "isoSurfaceMinimum"), isoSurfaceMinimum);
		gl.uniform1f(gl.getUniformLocation(this.rayCastingEntryShader, "isoSurfaceMaximum"), isoSurfaceMaximum);

		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "normalLuminance"), 1.0);
		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "shadowLuminance"), 0.0);
		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "shadowBoundary"), 0.5);
		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "softenShadowDegree"), 0.1);

		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "specularLuminance"), 0.5);
		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "specularRange"), 0.1);
		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "softenSpecularDegree"), 0.05);

		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "hatchingWidth"), this.hatchingWidth);
		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "hatchingHeight"), this.hatchingHeight);
		gl.uniform1f( gl.getUniformLocation(this.rayCastingEntryShader, "hatchingNumber"), this.hatchingNumber);

	}

	assignUniformVectorToRayCastingEntryShader(gl, cameraPos, lightPos, lightColor){
		gl.uniform3fv( gl.getUniformLocation( this.rayCastingEntryShader, "lightPosition"), new Float32Array( [-lightPos.x, -lightPos.y, -lightPos.z] ));
		gl.uniform3fv( gl.getUniformLocation( this.rayCastingEntryShader, "cameraPosition"), new Float32Array( cameraPos ));
		gl.uniform3fv( gl.getUniformLocation( this.rayCastingEntryShader, "ambientColor"), new Float32Array( [lightColor.ambient.r, lightColor.ambient.g, lightColor.ambient.b] ));
		gl.uniform3fv( gl.getUniformLocation( this.rayCastingEntryShader, "diffuseColor"), new Float32Array( [lightColor.diffuse.r, lightColor.diffuse.g, lightColor.diffuse.b] ));
		gl.uniform3fv( gl.getUniformLocation( this.rayCastingEntryShader, "specularColor"), new Float32Array( [lightColor.specular.r, lightColor.specular.g, lightColor.specular.b] ));	
	}

	assignUniformIntToRayCastingEntryShader(gl, doLighting, doPreIntegration, doCartoonShading, doPencilSketchShading){
		gl.uniform1i( gl.getUniformLocation( this.rayCastingEntryShader, "doLighting" ), doLighting ? 1 : 0 );
		gl.uniform1i( gl.getUniformLocation( this.rayCastingEntryShader, "doPreIntegration" ), doPreIntegration ? 1 : 0 );
		gl.uniform1i( gl.getUniformLocation( this.rayCastingEntryShader, "doCartoonShading"), doCartoonShading ? 1 : 0);
		gl.uniform1i( gl.getUniformLocation( this.rayCastingEntryShader, "doPencilSketchShading"), doPencilSketchShading ? 1 : 0);
	}

	assignUniformSamplerToRayCastingEntryShader(gl){
		gl.uniform1i(gl.getUniformLocation(this.rayCastingEntryShader, "exitTextureCoordinates"), 0);
		gl.uniform1i(gl.getUniformLocation(this.rayCastingEntryShader, "volSampler"), 1);
		gl.uniform1i(gl.getUniformLocation(this.rayCastingEntryShader, "colSampler"), 2);
		gl.uniform1i(gl.getUniformLocation(this.rayCastingEntryShader, "opcSampler"), 3);
		gl.uniform1i(gl.getUniformLocation(this.rayCastingEntryShader, "preIntegrationSampler"), 4);
		gl.uniform1i(gl.getUniformLocation(this.rayCastingEntryShader, "hatchingSampler"), 5);
		gl.uniform1i(gl.getUniformLocation(this.rayCastingEntryShader, "paperSampler"), 6);
	}

	bindTextureForRayCastingEntryShader(gl){
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, this.exitPointTexture );

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_3D, this.volTex);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.colTex);
		
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, this.opcTex);

		gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D, this.preIntegrationTex);

		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, this.hatchingTexture);

		gl.activeTexture(gl.TEXTURE6);
		gl.bindTexture(gl.TEXTURE_2D, this.paperTexture);
	}

	enablePosAttrOfRayCastingEntryShader(gl){
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
		var posAttr = gl.getAttribLocation( this.rayCastingEntryShader, "pos" );
		gl.vertexAttribPointer( posAttr, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( posAttr );
	}


    clear( r, g, b, width, height )
    {
		this.glCanvas.width = width;
		this.glCanvas.height = height;
        var gl = this.gl;     
		gl.depthMask( true );            
        gl.clearColor( 
            r, 
            g, 
            b,             
            1.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		gl.depthMask( false );   
    }


	getContext()
	{
		return this.gl;
	}

	getCanvas()
	{
		return this.glCanvas;
	}

	setOpacityTF( opacityTF )
	{
		var gl = this.gl;
		
		gl.activeTexture( gl.TEXTURE2 );
		gl.bindTexture( gl.TEXTURE_2D, this.opcTex );
		gl.texImage2D(
			gl.TEXTURE_2D,     // texture type
		    0,                 // level
			gl.R32F,           // internalFormat
			opacityTF.length,  // width
			1,                 // height
			0,                 // border
			gl.RED,            // format
			gl.FLOAT,          // type
			new Float32Array( opacityTF ) );       // data

		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
        gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );

		return this;
	}

	setColorTF( colorTF )
	{
    	var gl = this.gl;
		gl.bindTexture( gl.TEXTURE_2D, this.colTex );
		gl.texImage2D(
			gl.TEXTURE_2D,       // texture type
		    0,                   // level
			gl.RGB32F,           // internalFormat
			colorTF.length / 3,  // width
			1,                   // height
			0,                   // border
			gl.RGB,              // format
			gl.FLOAT,            // type
			new Float32Array( colorTF ) );       // data

		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    	gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );

		return this;
	}

	setTF( colorTF, opacityTF )
	{
		this.setColorTF( colorTF );
		this.setOpacityTF( opacityTF );

		return this;
	}

	setData( data, dims, type, min, max )
	{
		var gl = this.gl;

		this.dims = dims;
		this.type = type;

		this.dataMax = max;
		this.dataMin = min;

		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_3D, this.volTex );

		// --- A2
		gl.texImage3D(
			gl.TEXTURE_3D, 					// target
			0,             					// level
			gl.R32F,       					// internalFormat
			dims[0],       					// width
			dims[1],       					// height
			dims[2],       					// depth
			0,             					// border
			gl.RED,        					// format
			gl.FLOAT,      					// type
			new Float32Array(data)          // data
		);
		// --- A2

		// only floating point textures currently support linear filtering/interpolation 
		if( type == "FLOAT" )
		{
	        gl.texParameterf( gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
	        gl.texParameterf( gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
	        gl.texParameterf( gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
	  		gl.texParameterf( gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
		}
		else
		{
			gl.texParameteri( gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
  			gl.texParameteri( gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
		}

		return this;
	}

	// --- A4
	setPreIntegrationTF(preIntegrationTable, opacityTF){
    	var gl = this.gl;
		gl.bindTexture( gl.TEXTURE_2D, this.preIntegrationTex );
		gl.texImage2D(
			gl.TEXTURE_2D,       		 // texture type
		    0,                   		 // level
			gl.RGBA32F,           		 // internalFormat
			opacityTF.length,  			 // width
			opacityTF.length,            // height
			0,                   		 // border
			gl.RGBA,              		 // format
			gl.FLOAT,            		 // type
			new Float32Array(preIntegrationTable) );       // data

		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    	gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
	}

	enableDepthTest()
	{
		var gl = this.gl;
		gl.enable( gl.DEPTH_TEST );
	}

	disableDepthTest()
	{
	    var gl = this.gl;
		gl.disable( gl.DEPTH_TEST );
	}

	setTransparent3DRenderState()
	{
		var gl = this.gl;
		gl.enable( gl.DEPTH_TEST );
		gl.depthFunc( gl.LESS );
		gl.depthMask( false );
		gl.enable( gl.BLEND );
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);	
	}

	setOpaque3DRenderState()
	{
		var gl = this.gl;
		gl.enable( gl.DEPTH_TEST );
		gl.depthFunc( gl.LESS );
		gl.disable( gl.BLEND );
		gl.depthMask( true );
	}

	// --- Final
	setHatching(hatching, width, height, textureNumber){
		this.hatchingWidth = width;
		this.hatchingHeight = height;
		this.hatchingNumber = textureNumber;

		var gl = this.gl;
		gl.bindTexture(gl.TEXTURE_2D, this.hatchingTexture);
		gl.texImage2D(
			gl.TEXTURE_2D, 
			0, 
			gl.RGBA32F, 
			width * textureNumber, 
			height, 
			0, 
			gl.RGBA, 
			gl.FLOAT, 
			new Float32Array(hatching)
		);	
		
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    	gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
	}

	setPaperBackground(paper){
		var gl = this.gl;
		gl.bindTexture(gl.TEXTURE_2D, this.paperTexture);
		gl.texImage2D(
			gl.TEXTURE_2D, 
			0, 
			gl.RGBA32F, 
			1024, 
			1024, 
			0, 
			gl.RGBA, 
			gl.FLOAT, 
			new Float32Array(paper)
		);	
		
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    	gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
		gl.texParameterf( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
	}
}
