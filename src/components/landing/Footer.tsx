import { Github, Send, Zap } from "lucide-react";
import Link from "next/link";

const companyLogos = [
    { name: "fictitious", color: "text-blue-400" },
    { name: "fictitious", color: "text-purple-400" },
    { name: "fictitious", color: "text-green-400" },
];

export default function Footer() {
    return (
        <footer className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-black/80 backdrop-blur-md">
            <div className="container mx-auto px-4 py-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Trusted By Inline Section */}
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Trusted by &rarr;</span>
                        {companyLogos.map((logo, index) => (
                            <div key={index} className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                                <span className={`w-4 h-4 rounded ${logo.color.replace('text-', 'bg-')}/40`} />
                                <span className="font-bold text-sm text-white/80">{logo.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
                        <Link href="https://github.com/gitwatch-org" target="_blank">
                            <Github className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
                        </Link>
                        <Link href="https://t.me/Gitwtch_bot" target="_blank">
                            <Send className="h-5 w-5 text-white/60 hover:text-[#229ED9] transition-colors" />
                        </Link>
                        <p className="text-xs text-gray-500">
                            © 2024 GitWatch
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
