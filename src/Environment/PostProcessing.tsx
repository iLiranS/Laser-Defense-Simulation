import { EffectComposer, ToneMapping, Bloom } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { ToneMappingMode } from 'postprocessing'
const PostProcessingComponent = () => {
    const { enabled, bloom } = useControls('Post-Processing', { enabled: false, bloom: true }, { collapsed: true })


    return (
        <EffectComposer enabled={enabled} >
            {bloom === true ? <Bloom luminanceThreshold={0} intensity={0.1} /> : <></>}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    )
}
export default PostProcessingComponent