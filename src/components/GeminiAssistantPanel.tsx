import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { sendAssistantChat } from '../lib/api.ts';
import type { ChatMessage } from '../types/cycling.ts';

interface GeminiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

const SAMPLE_QUESTIONS = [
  '¿Qué talleres registrados reparan neumáticos de bicicleta?',
  '¿Qué accesorios necesito para circular de forma segura?',
  '¿Qué bicicletas del catálogo se ajustan a mi presupuesto?',
];

function renderFormattedLines(text: string) {
  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={index} className="h-2" />;
    }

    // Safe inline bold parser without raw HTML injection
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={pIdx}>{part}</span>;
    });

    return (
      <p key={index} className="leading-relaxed">
        {renderedParts}
      </p>
    );
  });
}

export function GeminiAssistantPanel({
  open,
  onClose,
  initialPrompt,
  onClearInitialPrompt,
}: GeminiAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hola. Soy el asistente de RuedaLibre. Puedo consultar en tiempo real los locales, bicicletas, accesorios de seguridad y tarifas de reparación registrados en la base de datos. ¿En qué te ayudo hoy?',
      timestamp: new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && initialPrompt) {
      void submitQuestion(initialPrompt);
      onClearInitialPrompt?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPrompt]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submitQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendAssistantChat(trimmed, historyPayload);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        sources: data.toolsUsed,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible obtener respuesta del asistente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitQuestion(input);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"
      role="dialog"
      aria-modal="true"
      aria-label="Asistente inteligente Gemini"
    >
      <div className="w-full max-w-lg bg-white h-full flex flex-col border-l border-slate-200 shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Asistente Ciclista Gemini
              </h2>
              <p className="text-xs text-slate-500">
                Consultas dinámicas sobre registros reales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar asistente"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick prompts */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Consultas rápidas sugeridas
          </p>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => void submitQuestion(q)}
                className="text-left text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-emerald-600 hover:text-emerald-800 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="space-y-1">{renderFormattedLines(msg.content)}</div>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono tabular-nums">{msg.timestamp}</span>
                {msg.sources && msg.sources.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Consultó: {msg.sources.join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="bg-slate-100 text-slate-600 rounded-xl px-4 py-3 text-sm">
                Consultando base de datos y redactando respuesta...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-xs">
              {error}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-slate-200 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej. Tengo $600 USD, ¿qué bicicleta me conviene?"
            aria-label="Escribe tu consulta para el asistente"
            className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Enviar consulta"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
