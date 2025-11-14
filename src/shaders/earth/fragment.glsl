varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform sampler2D uDayTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;


void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0, 0.0, 1.0);

    // Sun orientation
    float sunOrientation = dot(uSunDirection,normal);


    vec3 dayColor = texture(uDayTexture, vUv).rgb;
    color = dayColor;


    // Atmosphere
    float atmosphereDayMix = smoothstep(-0.5,1.0,sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor,uAtmosphereDayColor,atmosphereDayMix);
    
    // Fresnel - towards camrea 1 and perpendicular 0 and mix between them
    float fresnel = dot(viewDirection,normal) + 1.0;
    fresnel = pow(fresnel,2.0);

    float falloff = smoothstep(1.0,0.8,fresnel);


    color = mix(color,atmosphereColor,fresnel * atmosphereDayMix);



    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}