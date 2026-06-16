import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const CHAT_URL = 'https://functions.poehali.dev/830e4dc8-5543-4323-b064-4e4b62770d43';

type Msg = { id: number; sender: string; body: string; image_url: string; created_at: string };
type Chat = { id: number; ad_id: number | null; ad_name: string | null; user_a: string; user_b: string };

function timeStr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

function dateStr(iso: string) {
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
}

// ─── MessageBubble ────────────────────────────────────────────────────────────
function Bubble({ msg, mine }: { msg: Msg; mine: boolean }) {
  return (
    <div className={`flex gap-2 items-end ${mine ? 'flex-row-reverse' : 'flex-row'} mb-2`}>
      <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-700 shrink-0 ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {msg.sender.charAt(0).toUpperCase()}
      </div>
      <div className={`max-w-[72%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!mine && <span className="text-xs text-muted-foreground font-600 px-1">{msg.sender}</span>}
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'}`}>
          {msg.image_url && (
            <a href={msg.image_url} target="_blank" rel="noreferrer">
              <img src={msg.image_url} alt="фото" className="rounded-xl max-h-56 w-auto mb-2 cursor-zoom-in" />
            </a>
          )}
          {msg.body && <p>{msg.body}</p>}
        </div>
        <span className="text-xs text-muted-foreground px-1">{timeStr(msg.created_at)}</span>
      </div>
    </div>
  );
}

// ─── MessageInput ─────────────────────────────────────────────────────────────
function MessageInput({ onSend, disabled }: { onSend: (text: string, imgB64: string) => Promise<void>; disabled?: boolean }) {
  const [text, setText] = useState('');
  const [imgB64, setImgB64] = useState('');
  const [imgPreview, setImgPreview] = useState('');
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImgB64(result);
      setImgPreview(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const send = async () => {
    if ((!text.trim() && !imgB64) || sending) return;
    setSending(true);
    try {
      await onSend(text.trim(), imgB64);
      setText('');
      setImgB64('');
      setImgPreview('');
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="border-t border-border p-3 bg-background">
      {imgPreview && (
        <div className="relative inline-block mb-2">
          <img src={imgPreview} alt="preview" className="h-20 w-auto rounded-xl border border-border" />
          <button onClick={() => { setImgB64(''); setImgPreview(''); }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs grid place-items-center">✕</button>
        </div>
      )}
      <div className="flex gap-2 items-end">
        <button onClick={() => fileRef.current?.click()} disabled={disabled}
          className="w-9 h-9 shrink-0 grid place-items-center rounded-xl bg-muted text-muted-foreground hover:bg-secondary transition-colors">
          <Icon name="Image" size={18} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey}
          placeholder="Написать сообщение…" className="rounded-xl flex-1" disabled={disabled} />
        <button onClick={send} disabled={disabled || sending || (!text.trim() && !imgB64)}
          className="w-9 h-9 shrink-0 grid place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-all hover:bg-primary/90">
          {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── CommunityChat ────────────────────────────────────────────────────────────
export function CommunityChat({ myName }: { myName: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${CHAT_URL}?section=community`);
      const data = await res.json();
      setMsgs(data.messages || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (text: string, imgB64: string) => {
    const res = await fetch(`${CHAT_URL}?section=community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: myName, body: text, image_b64: imgB64 || undefined }),
    });
    if (!res.ok) { toast.error('Не удалось отправить'); return; }
    const data = await res.json();
    setMsgs((p) => [...p, data.message]);
  };

  let lastDate = '';

  return (
    <div className="flex flex-col h-[calc(100vh-260px)] min-h-80">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading && (
          <div className="flex justify-center py-10"><Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" /></div>
        )}
        {!loading && msgs.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="MessageCircle" size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-600">Пока тишина</p>
            <p className="text-sm">Напишите первое сообщение в чат!</p>
          </div>
        )}
        {msgs.map((m) => {
          const d = dateStr(m.created_at);
          const showDate = d !== lastDate;
          lastDate = d;
          return (
            <div key={m.id}>
              {showDate && <div className="text-center my-3"><span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">{d}</span></div>}
              <Bubble msg={m} mine={m.sender === myName} />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={send} />
    </div>
  );
}

// ─── PrivateChat ──────────────────────────────────────────────────────────────
function PrivateChat({ chatId, myName, partnerName, onBack }: { chatId: number; myName: string; partnerName: string; onBack: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${CHAT_URL}?section=private&chat_id=${chatId}`);
      const data = await res.json();
      setMsgs(data.messages || []);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (text: string, imgB64: string) => {
    const res = await fetch(`${CHAT_URL}?section=private&chat_id=${chatId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: myName, body: text, image_b64: imgB64 || undefined }),
    });
    if (!res.ok) { toast.error('Не удалось отправить'); return; }
    const data = await res.json();
    setMsgs((p) => [...p, data.message]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
        <button onClick={onBack} className="w-8 h-8 grid place-items-center rounded-xl hover:bg-muted">
          <Icon name="ArrowLeft" size={18} />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-700">
          {partnerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-700 text-sm leading-tight">{partnerName}</p>
          <p className="text-xs text-muted-foreground">Личный чат</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && <div className="flex justify-center py-10"><Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" /></div>}
        {!loading && msgs.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <p className="font-600 text-sm">Начните разговор</p>
          </div>
        )}
        {msgs.map((m) => <Bubble key={m.id} msg={m} mine={m.sender === myName} />)}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={send} />
    </div>
  );
}

// ─── ChatsList ────────────────────────────────────────────────────────────────
function ChatsList({ myName, onOpen }: { myName: string; onOpen: (chat: Chat) => void }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${CHAT_URL}?section=chats&user=${encodeURIComponent(myName)}`)
      .then((r) => r.json())
      .then((d) => setChats(d.chats || []))
      .finally(() => setLoading(false));
  }, [myName]);

  if (loading) return <div className="flex justify-center py-10"><Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" /></div>;

  if (chats.length === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
      <p className="font-600">Нет личных чатов</p>
      <p className="text-sm mt-1">Напишите кому-нибудь через объявление</p>
    </div>
  );

  return (
    <div className="divide-y divide-border">
      {chats.map((c) => {
        const partner = c.user_a === myName ? c.user_b : c.user_a;
        return (
          <button key={c.id} onClick={() => onOpen(c)}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left">
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary grid place-items-center font-700 text-lg shrink-0">
              {partner.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-700 truncate">{partner}</p>
              {c.ad_name && <p className="text-xs text-muted-foreground truncate">По объявлению: {c.ad_name}</p>}
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

// ─── MessagesPanel (вкладки: общий / личные) ─────────────────────────────────
export function MessagesPanel({ myName }: { myName: string }) {
  const [tab, setTab] = useState<'community' | 'private'>('community');
  const [openChat, setOpenChat] = useState<Chat | null>(null);

  if (openChat) {
    const partner = openChat.user_a === myName ? openChat.user_b : openChat.user_a;
    return (
      <div className="bg-card border border-border rounded-3xl overflow-hidden" style={{ height: 560 }}>
        <PrivateChat chatId={openChat.id} myName={myName} partnerName={partner} onBack={() => setOpenChat(null)} />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden flex flex-col" style={{ height: 560 }}>
      <div className="flex border-b border-border shrink-0">
        {([['community', 'Общий чат', 'Users'], ['private', 'Личные', 'MessageSquare']] as const).map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-700 transition-colors ${tab === id ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <Icon name={icon} size={16} /> {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === 'community' ? <CommunityChat myName={myName} /> : <ChatsList myName={myName} onOpen={setOpenChat} />}
      </div>
    </div>
  );
}

// ─── ContactDialog — кнопка «Написать» на карточке объявления ─────────────────
export function ContactDialog({ open, onOpenChange, adId, adName, adContact, myName }:
  { open: boolean; onOpenChange: (v: boolean) => void; adId: number; adName: string; adContact?: string; myName: string }) {

  const [chatId, setChatId] = useState<number | null>(null);
  const [partner, setPartner] = useState('');
  const [nameInput, setNameInput] = useState(adContact || '');
  const [starting, setStarting] = useState(false);

  const startChat = async () => {
    const to = nameInput.trim();
    if (!to) { toast.error('Укажите имя/контакт автора'); return; }
    setStarting(true);
    try {
      const res = await fetch(`${CHAT_URL}?section=chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_a: myName, user_b: to, ad_id: adId }),
      });
      const data = await res.json();
      setPartner(to);
      setChatId(data.chat_id);
    } catch {
      toast.error('Не удалось открыть чат');
    } finally {
      setStarting(false);
    }
  };

  const reset = () => { setChatId(null); setPartner(''); setNameInput(adContact || ''); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden" style={{ height: chatId ? 540 : 'auto' }}>
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="font-display font-700 text-xl">
            {chatId ? `Чат с ${partner}` : `Написать по объявлению: ${adName}`}
          </DialogTitle>
        </DialogHeader>
        {!chatId ? (
          <div className="p-5 grid gap-4">
            <p className="text-muted-foreground text-sm">Укажи имя или контакт автора объявления для начала переписки.</p>
            <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
              placeholder="Имя автора или @username" className="rounded-xl" />
            <Button onClick={startChat} disabled={starting} className="rounded-full font-700 gap-2">
              {starting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="MessageCircle" size={16} />}
              Начать чат
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden" style={{ height: 460 }}>
            <PrivateChat chatId={chatId!} myName={myName} partnerName={partner} onBack={reset} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
