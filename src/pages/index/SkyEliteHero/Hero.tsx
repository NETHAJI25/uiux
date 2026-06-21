export function Hero() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center -mt-80">
        <p className="text-sm font-semibold text-gray-600 tracking-wider mb-4">PRIVATE JETS</p>
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-normal text-gray-500 leading-none tracking-tighter">Premium.</h1>
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-normal leading-none tracking-tighter -mt-3" style={{ color: '#202A36' }}>Accessible.</h1>
        <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mt-4">Your dedication deserves recognition.</p>
        <div className="flex items-center justify-center gap-4">
          <button className="px-8 py-2.5 rounded-full bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 transition-colors">Discover</button>
          <button className="px-8 py-2.5 rounded-full text-white font-medium hover:bg-[#1a2229] transition-colors" style={{ backgroundColor: '#202A36' }}>Book Now</button>
        </div>
      </div>
    </div>
  );
}
