import ChatInterface from '../ChatInterface';

export default function ChatPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1">
                <ChatInterface />
            </div>
        </div>
    );
}
