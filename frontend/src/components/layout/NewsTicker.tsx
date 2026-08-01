
const newsItems = [
    "• PM-KISAN 17th Installment released. Check status now.",
    "• Apply for Soil Health Card at your nearest center.",
    "• New MSP rates announced for Kharif crops 2024-25.",
    "• Weather Alert: Heavy rainfall predicted in central region. Stay safe.",
    "• New Kisan Credit Card (KCC) limit increased for small farmers."
];

export default function NewsTicker() {
    return (
        <div className="bg-green-700 text-white h-10 overflow-hidden border-y border-green-800 shadow-inner flex items-center z-30 relative box-border">
            <div className="bg-green-900 px-4 h-full flex items-center font-bold text-xs uppercase tracking-tighter z-10 whitespace-nowrap shadow-xl">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
                LATEST UPDATES
            </div>
            <div className="flex-1 h-full overflow-hidden relative flex items-center">
                <div className="animate-marquee flex items-center gap-12">
                    <div className="flex gap-12 whitespace-nowrap py-2 items-center">
                        {newsItems.map((item, index) => (
                            <span key={index} className="text-sm font-bold cursor-default tracking-wide drop-shadow-sm">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
