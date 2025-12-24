import { EffectComposer, ToneMapping, Bloom, Vignette, } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
const PostProcessingComponent = () => {
    const { enabled, bloom, tone, vingette, bloomBlending } = useControls('Post-Processing',
        {
            enabled: true,
            bloom: true,
            tone: { options: ToneMappingMode },
            bloomBlending: { options: BlendFunction, value: BlendFunction.ADD },
            vingette: true
        },
        { collapsed: true })


    return enabled ? (
        <EffectComposer enabled={enabled} >
            {bloom ? <Bloom blendFunction={bloomBlending} luminanceThreshold={1.0} intensity={1.5} /> : <></>}
            <ToneMapping mode={tone} />
            {vingette ? <Vignette
                offset={0.5} // vignette offset
                darkness={0.5} // vignette darkness
                eskil={false} // Eskil's vignette technique
                blendFunction={BlendFunction.NORMAL} // blend mode
            /> : <></>}


        </EffectComposer>
    ) : null
}
export default PostProcessingComponent