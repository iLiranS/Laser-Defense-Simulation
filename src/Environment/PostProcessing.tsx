import { EffectComposer, ToneMapping, Bloom } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { ToneMappingMode } from 'postprocessing'
const PostProcessingComponent = () => {
    const { enabled, bloom } = useControls('Post-Processing', { enabled: true, bloom: true }, { collapsed: true })


    return (
        <EffectComposer enabled={enabled} >
            {bloom === true ? <Bloom luminanceThreshold={1.0} intensity={1.5} /> : <></>}
            <ToneMapping mode={ToneMappingMode.LINEAR} />
        </EffectComposer>
    )
}
export default PostProcessingComponent