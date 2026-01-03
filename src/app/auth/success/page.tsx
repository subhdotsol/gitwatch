export default function AuthSuccess() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">✅ Success!</h1>
                <p className="text-gray-400 mb-8">
                    Your GitHub account has been connected.
                    <br />
                    You can close this window and return to Telegram.
                </p>
                <a
                    href="https://t.me/gitwatch_bot"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Return to Telegram
                </a>
            </div>
        </div>
    );
}
