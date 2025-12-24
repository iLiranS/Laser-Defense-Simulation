const HtmlLayer = () => {
    // this is just a template
    // interceptors : effciency (% out of total missiles) , intercepts, misses, total count
    // more complex : average interception time, [shortest,longet] , interceptor individual stats (as Drei Html)
    // missiles : landed, intercepted, total count,
    // more complex : avverage flight duration

    return (
        <div
            className='absolute z-100 pointer-events-none
             bg-gray-900 
             right-4 bottom-4 rounded-md text-white'>

            <table className="text-sm">
                <tr>
                    <th className="border p-2 border-white/30"></th>
                    <th className="border p-2 border-white/30">Interceptors</th>
                    <th className="border p-2 border-white/30">Missiles</th>
                </tr>
                <tr className="even:bg-gray-600/20">
                    <td className="border p-2 border-white/30">Alive</td>
                    <td className="border p-2 border-white/30">0</td>
                    <td className="border p-2 border-white/30">0</td>
                </tr>
                <tr className="even:bg-gray-600/20">
                    <td className="border p-2 border-white/30">Dead</td>
                    <td className="border p-2 border-white/30">-</td>
                    <td className="border p-2 border-white/30">0</td>
                </tr>
                <tr className="even:bg-gray-600/20">
                    <td className="border p-2 border-white/30">kills</td>
                    <td className="border p-2 border-white/30">0</td>
                    <td className="border p-2 border-white/30">-</td>
                </tr>
            </table>

        </div>
    )
}
export default HtmlLayer