import { ArrowRight, Send } from "lucide-react";
import Link from "next/link";
import { Cover } from "../ui/cover";

export default function Hero() {
    return (
        <section className="relative overflow-hidden pt-16 pb-4 lg:pt-20 lg:pb-0">
            {/* Background Effects Removed for CircuitBackground */}

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-200 mb-4 backdrop-blur-sm">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                    Now available for public beta
                </div>

                <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
                    <span className="block mb-2">GitWatch: Your GitHub</span>
                    <Cover className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                        <span className="text-white">Command Center in Telegram</span>
                    </Cover>
                </h1>

                <p className="mx-auto max-w-2xl text-lg text-gray-400 mb-8 leading-relaxed">
                    Stay connected to your repositories. Act on issues instantly.
                    Collaborate with your team without ever leaving your chat.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="https://t.me/Gitwtch_bot"
                        target="_blank"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                    >
                        <Send className="h-4 w-4" />
                        Add to Telegram
                    </Link>


                </div>
            </div>
        </section>
    );
}
