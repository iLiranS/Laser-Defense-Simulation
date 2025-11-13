import { EffectComposer, ToneMapping, Bloom } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { ToneMappingMode } from 'postprocessing'
const PostProcessingComponent = () => {
    const { enabled, bloom } = useControls('Post-Processing', { enabled: true, bloom: true }, { collapsed: true })


    return (
        <EffectComposer enabled={enabled} >
            {bloom === true ? <Bloom luminanceThreshold={1.1} intensity={0.55} /> : <></>}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    )
}
export default PostProcessingComponent