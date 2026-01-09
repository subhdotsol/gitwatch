import { PhoneFrame } from "./PhoneFrame";

export default function ProductVisual() {
    return (
        <section className="relative -mt-20 pb-20 z-20 pointer-events-none">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex flex-col lg:flex-row items-center justify-center lg:gap-48">
                    {/* Enhanced Light Bridge */}
                    {/* Enhanced Light Bridge - NEON GLOW (MAX INTENSITY) */}
                    <div className="hidden lg:block absolute top-[45%] left-1/2 -translate-x-1/2 w-[640px] h-[8px] z-10 mix-blend-screen pointer-events-none">
                        {/* Outer Glow / Halo - MAX OPACITY */}
                        <div className="absolute inset-0 bg-blue-500/40 blur-xl animate-pulse" />

                        {/* Main Beam - Solid Gradient */}
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[4px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-100 blur-[0.5px] shadow-[0_0_20px_#3b82f6]" />

                        {/* Core Neon Line - INTENSE */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[3px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#3b82f6,0_0_40px_#3b82f6,0_0_80px_#3b82f6] animate-[pulse_3s_ease-in-out_infinite]" />

                        {/* Moving Energy Packet - The "Flow" */}
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-full overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[4px] bg-white rounded-full blur-[1px] shadow-[0_0_20px_#fff,0_0_40px_#60a5fa,0_0_80px_#3b82f6] animate-[ping_3s_linear_infinite]" />
                        </div>

                        {/* Central Reactor / Connection Point */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-[0_0_20px_#fff,0_0_40px_#3b82f6,0_0_80px_#3b82f6] z-20 animate-[pulse_2s_ease-in-out_infinite]">
                            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-100" />
                        </div>
                    </div>

                    {/* Left: GitHub Mockup (Laptop) - LARGER */}
                    <div className="relative w-full max-w-xl lg:max-w-2xl group perspective-[1200px] z-20 scale-[1.25] lg:mr-[-40px]">
                        <div className="relative rounded-xl border border-white/10 bg-[#0d1117] shadow-2xl transition-transform duration-700 lg:group-hover:rotate-y-1 overflow-hidden">
                            {/* Window Controls */}
                            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-[#161b22]">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                <div className="flex-1 flex justify-center">
                                    <div className="px-3 py-0.5 rounded-md bg-[#0d1117] border border-white/5 text-[10px] text-gray-400 font-mono w-64 text-center truncate">
                                        https://github.com/txtx/surfpool/issues/459
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0d1117] min-h-[320px] overflow-hidden">
                                <img src="/githubmockup.png" alt="GitHub Interface Mockup" className="w-full h-auto object-cover" />
                            </div>
                        </div>

                        {/* Glow backing */}
                        <div className="absolute top-10 left-10 right-10 bottom-0 bg-blue-500/20 blur-[80px] -z-10" />
                    </div>

                    {/* Right: iPhone 16 Pro Max Mockup (User provided) */}
                    <div className="relative w-max group z-30 flex-shrink-0 lg:scale-[0.85] origin-center">
                        <PhoneFrame>
                            <img src="/telegrammock.png" alt="GitWatch Telegram Interface" className="w-full h-auto block" />
                        </PhoneFrame>
                    </div>
                </div>
            </div>
        </section>
    );
}
