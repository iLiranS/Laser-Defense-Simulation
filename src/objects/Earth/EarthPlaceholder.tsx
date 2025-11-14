
type EarthPlaceholderProps = {
    radius: number
}

const EarthPlaceholder: React.FC<EarthPlaceholderProps> = ({ radius }) => {
    return (
        <mesh>
            <sphereGeometry args={[radius, 32, 16]} />
            <meshBasicMaterial wireframe />
        </mesh>
    )
}
export default EarthPlaceholder