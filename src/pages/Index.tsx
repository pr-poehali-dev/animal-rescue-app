import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MessagesPanel, ContactDialog } from '@/components/Chat';

const ADS_URL = 'https://functions.poehali.dev/997c7674-175f-4ad6-9017-122608a22b1d';

type Ad = {
  id?: number;
  name: string;
  species: string;
  status: string;
  city: string;
  description?: string;
  contact?: string;
  image_url?: string;
  is_urgent?: boolean;
};

const DOG = 'https://cdn.poehali.dev/projects/9d0f550c-a7aa-4871-a597-3e402fdd88d3/files/d3395677-9e09-4ba0-b085-bb57a6cf2b8f.jpg';
const CAT = 'https://cdn.poehali.dev/projects/9d0f550c-a7aa-4871-a597-3e402fdd88d3/files/f82186d3-3e67-4de4-b5f9-c9fa9b2f9fcb.jpg';
const PUPPY = 'https://cdn.poehali.dev/projects/9d0f550c-a7aa-4871-a597-3e402fdd88d3/files/a63fa8a1-e39e-4c90-beae-ed32d4ba9677.jpg';

const NAV = [
  { id: 'home', label: 'Главная', icon: 'Home' },
  { id: 'urgent', label: 'Срочная помощь', icon: 'Siren' },
  { id: 'ads', label: 'Объявления', icon: 'Search' },
  { id: 'my', label: 'Мои объявления', icon: 'FileText' },
  { id: 'messages', label: 'Сообщения', icon: 'MessageCircle' },
  { id: 'profile', label: 'Профиль', icon: 'User' },
  { id: 'about', label: 'О приложении', icon: 'Info' },
  { id: 'contacts', label: 'Контакты', icon: 'Phone' },
];

const URGENT = [
  { name: 'Барон', type: 'Собака · травма лапы', img: PUPPY, city: 'Москва', desc: 'Сбит машиной, срочно нужны средства на операцию', tag: 'Нужна операция' },
  { name: 'Муся', type: 'Кошка · истощение', img: CAT, city: 'Казань', desc: 'Найдена на улице, требуется передержка и лечение', tag: 'Ищем передержку' },
];

const ADS = [
  { name: 'Рекс', type: 'Найден · овчарка', img: DOG, city: 'Санкт-Петербург', status: 'Найден' },
  { name: 'Симба', type: 'Пропал · рыжий кот', img: CAT, city: 'Москва', status: 'Пропал' },
  { name: 'Лучик', type: 'Ищет дом · щенок', img: PUPPY, city: 'Екатеринбург', status: 'Ищет дом' },
];

const SOCIALS = [
  { name: 'Telegram', icon: 'Send', handle: '@lapapomoshi' },
  { name: 'ВКонтакте', icon: 'Share2', handle: 'vk.com/lapapomoshi' },
  { name: 'WhatsApp', icon: 'MessageCircle', handle: '+7 900 000-00-00' },
];

const statusColor = (s: string) =>
  s === 'Пропал' ? 'bg-destructive text-destructive-foreground'
  : s === 'Найден' ? 'bg-primary text-primary-foreground'
  : 'bg-accent text-accent-foreground';

const MY_NAME_KEY = 'lapa_my_name';

export default function Index() {
  const [active, setActive] = useState('home');
  const [menu, setMenu] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [myName, setMyName] = useState(() => localStorage.getItem(MY_NAME_KEY) || '');
  const [namePrompt, setNamePrompt] = useState(false);
  const [pendingSection, setPendingSection] = useState('');

  const loadAds = async () => {
    try {
      const res = await fetch(ADS_URL);
      const data = await res.json();
      setAds(data.items || []);
    } catch { /* тихо */ }
  };

  useEffect(() => { loadAds(); }, []);

  const go = (id: string) => {
    if ((id === 'messages') && !myName) {
      setPendingSection(id);
      setNamePrompt(true);
      return;
    }
    setActive(id); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveName = (name: string) => {
    const n = name.trim();
    if (!n) return;
    localStorage.setItem(MY_NAME_KEY, n);
    setMyName(n);
    setNamePrompt(false);
    if (pendingSection) { setActive(pendingSection); setPendingSection(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  return (
    <div className="min-h-screen bg-background grain">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <button onClick={() => go('home')} className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary grid place-items-center text-primary-foreground">
              <Icon name="PawPrint" size={22} />
            </div>
            <span className="font-display font-700 text-lg tracking-tight">Лапа<span className="text-accent">помощи</span></span>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => go(n.id)}
                className={`px-3.5 py-2 rounded-full text-sm font-600 transition-all ${active === n.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button onClick={() => go('urgent')} className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground rounded-full font-700 gap-2">
              <Icon name="Siren" size={16} /> Срочно
            </Button>
            <button onClick={() => setMenu(!menu)} className="lg:hidden w-10 h-10 grid place-items-center rounded-xl bg-muted">
              <Icon name={menu ? 'X' : 'Menu'} size={20} />
            </button>
          </div>
        </div>

        {menu && (
          <div className="lg:hidden border-t border-border bg-background animate-float-up">
            <div className="container py-3 grid gap-1">
              {NAV.map((n) => (
                <button key={n.id} onClick={() => go(n.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-600 ${active === n.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                  <Icon name={n.icon} size={18} /> {n.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="container py-10 md:py-16">
        {active === 'home' && <Home go={go} />}
        {active === 'urgent' && <Urgent ads={ads} />}
        {active === 'ads' && <Ads ads={ads} myName={myName} onCreate={() => setFormOpen(true)} />}
        {active === 'my' && <MyAds ads={ads} onCreate={() => setFormOpen(true)} />}
        {active === 'messages' && <Messages myName={myName} />}
        {active === 'profile' && <Profile myName={myName} />}
        {active === 'about' && <About />}
        {active === 'contacts' && <Contacts />}
      </main>

      <footer className="border-t border-border bg-primary text-primary-foreground">
        <div className="container py-12 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-accent grid place-items-center"><Icon name="PawPrint" size={20} /></div>
              <span className="font-display font-700 text-lg">Лапа помощи</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">Помогаем животным находить дом, а хозяевам — потерянных питомцев.</p>
          </div>
          <div>
            <h4 className="font-display font-600 mb-3">Мы в соцсетях</h4>
            <div className="grid gap-2">
              {SOCIALS.map((s) => (
                <a key={s.name} href="#" className="flex items-center gap-3 text-primary-foreground/80 hover:text-accent transition-colors text-sm">
                  <Icon name={s.icon} size={18} /> {s.name} · {s.handle}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-600 mb-3">Разделы</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {NAV.map((n) => (
                <button key={n.id} onClick={() => go(n.id)} className="text-left text-sm text-primary-foreground/70 hover:text-accent transition-colors">{n.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 py-5 text-center text-primary-foreground/50 text-sm">© 2026 Лапа помощи. Сделано с заботой о животных.</div>
      </footer>

      <AdForm open={formOpen} onOpenChange={setFormOpen} onCreated={loadAds} />
      <NameDialog open={namePrompt} onSave={saveName} />
    </div>
  );
}

function NameDialog({ open, onSave }: { open: boolean; onSave: (n: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display font-700 text-xl">Как тебя зовут?</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm -mt-1">Имя будет видно другим пользователям в чате</p>
        <div className="grid gap-3 mt-1">
          <Input value={val} onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSave(val)}
            placeholder="Введите имя или псевдоним" className="rounded-xl" autoFocus />
          <Button onClick={() => onSave(val)} disabled={!val.trim()} className="rounded-full font-700 gap-2">
            <Icon name="Check" size={16} /> Продолжить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdForm({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const empty: Ad = { name: '', species: '', status: 'Ищет дом', city: '', description: '', contact: '', image_url: '', is_urgent: false };
  const [form, setForm] = useState<Ad>(empty);
  const [saving, setSaving] = useState(false);
  const statuses = ['Пропал', 'Найден', 'Ищет дом'];

  const set = (k: keyof Ad, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.species.trim() || !form.city.trim()) {
      toast.error('Заполните имя, вид и город');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(ADS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success('Объявление опубликовано!');
      setForm(empty);
      onOpenChange(false);
      onCreated();
    } catch {
      toast.error('Не удалось сохранить. Попробуйте ещё раз');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-700 text-2xl">Новое объявление</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 mt-2">
          <div className="grid gap-1.5">
            <Label>Кличка / имя животного *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Например, Рекс" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Вид *</Label>
              <Input value={form.species} onChange={(e) => set('species', e.target.value)} placeholder="Собака, кошка…" className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label>Город *</Label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Москва" className="rounded-xl" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Статус</Label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button key={s} type="button" onClick={() => set('status', s)}
                  className={`px-4 py-2 rounded-full text-sm font-700 transition-all ${form.status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Описание</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Расскажите о животном, особых приметах, состоянии…" className="rounded-xl min-h-24" />
          </div>
          <div className="grid gap-1.5">
            <Label>Контакт для связи</Label>
            <Input value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="Телефон или @username" className="rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label>Ссылка на фото</Label>
            <Input value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" className="rounded-xl" />
          </div>
          <label className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-2xl p-3.5 cursor-pointer">
            <input type="checkbox" checked={!!form.is_urgent} onChange={(e) => set('is_urgent', e.target.checked)} className="w-5 h-5 accent-[hsl(4_78%_56%)]" />
            <span className="text-sm font-600 flex items-center gap-1.5"><Icon name="Siren" size={16} className="text-destructive" /> Срочная помощь — критическое состояние</span>
          </label>
          <Button onClick={submit} disabled={saving} className="rounded-full font-700 h-12 gap-2 bg-primary hover:bg-primary/90">
            {saving ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Send" size={18} />}
            {saving ? 'Публикуем…' : 'Опубликовать объявление'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 animate-float-up">
      <span className="inline-flex items-center gap-2 text-accent font-700 text-sm uppercase tracking-wider mb-2">
        <span className="w-6 h-px bg-accent" /> {kicker}
      </span>
      <h2 className="font-display font-700 text-3xl md:text-4xl tracking-tight">{title}</h2>
      {sub && <p className="text-muted-foreground mt-3 max-w-xl">{sub}</p>}
    </div>
  );
}

function Home({ go }: { go: (id: string) => void }) {
  return (
    <div className="space-y-20">
      <section className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="animate-float-up">
          <span className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-700 mb-5">
            <Icon name="Heart" size={15} /> Уже спасено 1 240 животных
          </span>
          <h1 className="font-display font-800 text-4xl md:text-6xl leading-[1.05] tracking-tight">
            Каждой лапе — <span className="text-accent">свой дом</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-5 max-w-md leading-relaxed">
            Платформа для поиска бездомных и пропавших животных. Найди питомца, помоги нуждающимся или подари дом тому, кто ждёт.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Button onClick={() => go('ads')} className="rounded-full font-700 h-12 px-6 gap-2 bg-primary hover:bg-primary/90">
              <Icon name="Search" size={18} /> Смотреть объявления
            </Button>
            <Button onClick={() => go('urgent')} variant="outline" className="rounded-full font-700 h-12 px-6 gap-2 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Icon name="Siren" size={18} /> Срочная помощь
            </Button>
          </div>
        </div>
        <div className="relative animate-float-up" style={{ animationDelay: '0.15s' }}>
          <div className="rounded-[2rem] overflow-hidden shadow-2xl aspect-square">
            <img src={DOG} alt="Собака" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-5 -left-5 bg-card rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-border">
            <div className="w-11 h-11 rounded-xl bg-primary/10 grid place-items-center text-primary"><Icon name="ShieldCheck" size={22} /></div>
            <div><p className="font-700 text-sm">Проверенные</p><p className="text-xs text-muted-foreground">объявления</p></div>
          </div>
          <div className="absolute -top-4 -right-2 bg-accent text-accent-foreground rounded-2xl shadow-xl px-4 py-3">
            <p className="font-display font-800 text-2xl">24/7</p><p className="text-xs font-600 opacity-90">помощь</p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle kicker="Что внутри" title="Всё для помощи животным" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: 'urgent', icon: 'Siren', t: 'Срочная помощь', d: 'Животные в критическом состоянии, которым нужна помощь прямо сейчас', c: 'destructive' },
            { id: 'ads', icon: 'Search', t: 'Объявления', d: 'Пропавшие, найденные и ищущие дом питомцы со всей страны', c: 'primary' },
            { id: 'my', icon: 'FileText', t: 'Мои объявления', d: 'Управляй своими публикациями и следи за откликами', c: 'accent' },
          ].map((card, i) => (
            <button key={card.id} onClick={() => go(card.id)}
              className="text-left bg-card border border-border rounded-3xl p-6 hover-lift animate-float-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-14 h-14 rounded-2xl grid place-items-center mb-4 ${card.c === 'destructive' ? 'bg-destructive/10 text-destructive' : card.c === 'accent' ? 'bg-accent/15 text-accent' : 'bg-primary/10 text-primary'}`}>
                <Icon name={card.icon} size={26} />
              </div>
              <h3 className="font-display font-700 text-xl mb-2">{card.t}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{card.d}</p>
              <span className="inline-flex items-center gap-1 text-sm font-700 mt-4 text-primary">Открыть <Icon name="ArrowRight" size={15} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground rounded-[2rem] p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[['1 240', 'Спасено'], ['3 580', 'Объявлений'], ['890', 'Воссоединений'], ['24/7', 'Поддержка']].map(([n, l]) => (
          <div key={l} className="text-center">
            <p className="font-display font-800 text-3xl md:text-4xl text-accent">{n}</p>
            <p className="text-primary-foreground/70 text-sm mt-1">{l}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Urgent({ ads }: { ads: Ad[] }) {
  const dbUrgent = ads.filter((a) => a.is_urgent).map((a) => ({
    name: a.name, type: a.species, img: a.image_url || PUPPY, city: a.city,
    desc: a.description || 'Срочно нужна помощь', tag: 'SOS', contact: a.contact,
  }));
  const list = [...dbUrgent, ...URGENT];
  return (
    <div>
      <SectionTitle kicker="Нужна помощь сейчас" title="Срочная помощь" sub="Эти животные находятся в критическом состоянии. Каждая минута на счету — отзовись, если можешь помочь." />
      <div className="grid md:grid-cols-2 gap-5">
        {list.map((a, i) => (
          <div key={`${a.name}-${i}`} className="bg-card border-2 border-destructive/20 rounded-3xl overflow-hidden hover-lift animate-float-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="relative">
              <img src={a.img} alt={a.name} className="w-full h-56 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = PUPPY; }} />
              <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-700 flex items-center gap-1.5 pulse-ring">
                <Icon name="Siren" size={14} /> SOS · {a.tag}
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-700 text-2xl">{a.name}</h3>
                <span className="text-muted-foreground text-sm flex items-center gap-1"><Icon name="MapPin" size={14} /> {a.city}</span>
              </div>
              <p className="text-accent font-600 text-sm mt-1">{a.type}</p>
              <p className="text-muted-foreground mt-3 leading-relaxed">{a.desc}</p>
              <div className="flex gap-2 mt-5">
                <Button className="flex-1 rounded-full font-700 bg-destructive hover:bg-destructive/90 gap-2"><Icon name="Heart" size={16} /> Помочь</Button>
                <Button variant="outline" className="rounded-full font-700 gap-2 border-2"><Icon name="Phone" size={16} /> Связаться</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FALLBACK = [PUPPY, CAT, DOG];

function AdCard({ a, i, myName }: { a: Ad; i: number; myName?: string }) {
  const [contactOpen, setContactOpen] = useState(false);
  const img = a.image_url && a.image_url.trim() ? a.image_url : FALLBACK[Math.abs((a.id ?? i)) % 3];
  const canChat = myName && (a.id ?? 0) > 0;
  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden hover-lift animate-float-up" style={{ animationDelay: `${i * 0.06}s` }}>
      <div className="relative">
        <img src={img} alt={a.name} className="w-full h-48 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK[i % 3]; }} />
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-700 ${statusColor(a.status)}`}>{a.status}</span>
        {a.is_urgent && <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-2.5 py-1 rounded-full text-xs font-700 flex items-center gap-1"><Icon name="Siren" size={12} /> SOS</span>}
      </div>
      <div className="p-5">
        <h3 className="font-display font-700 text-xl">{a.name}</h3>
        <p className="text-muted-foreground text-sm mt-0.5">{a.species}{a.description ? ` · ${a.description.slice(0, 40)}` : ''}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-muted-foreground text-sm flex items-center gap-1"><Icon name="MapPin" size={14} /> {a.city}</span>
          {canChat ? (
            <button onClick={() => setContactOpen(true)}
              className="flex items-center gap-1.5 text-sm font-700 text-primary hover:text-accent transition-colors">
              <Icon name="MessageCircle" size={15} /> Написать
            </button>
          ) : a.contact ? (
            <span className="text-primary text-sm font-700 flex items-center gap-1"><Icon name="Phone" size={13} /> {a.contact}</span>
          ) : null}
        </div>
      </div>
      {canChat && (
        <ContactDialog open={contactOpen} onOpenChange={setContactOpen}
          adId={a.id!} adName={a.name} adContact={a.contact} myName={myName!} />
      )}
    </div>
  );
}

function Ads({ ads, myName, onCreate }: { ads: Ad[]; myName?: string; onCreate: () => void }) {
  const filters = ['Все', 'Пропал', 'Найден', 'Ищет дом'];
  const [f, setF] = useState('Все');
  const seed: Ad[] = ADS.map((a, idx) => ({ id: -idx - 1, name: a.name, species: a.type, status: a.status, city: a.city, image_url: a.img }));
  const all = [...ads, ...seed];
  const list = f === 'Все' ? all : all.filter((a) => a.status === f);
  return (
    <div>
      <SectionTitle kicker="Лента" title="Объявления" sub="Пропавшие, найденные и ищущие дом животные. Используй фильтры, чтобы найти нужное." />
      <div className="flex flex-wrap items-center gap-2 mb-7">
        {filters.map((x) => (
          <button key={x} onClick={() => setF(x)}
            className={`px-4 py-2 rounded-full text-sm font-700 transition-all ${f === x ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}>{x}</button>
        ))}
        <Button onClick={onCreate} className="ml-auto rounded-full font-700 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"><Icon name="Plus" size={16} /> Добавить</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((a, i) => <AdCard key={a.id ?? i} a={a} i={i} myName={myName} />)}
      </div>
    </div>
  );
}

function MyAds({ ads, onCreate }: { ads: Ad[]; onCreate: () => void }) {
  const mine = ads.filter((a) => (a.id ?? 0) > 0);
  return (
    <div>
      <SectionTitle kicker="Личный кабинет" title="Мои объявления" sub="Здесь появляются твои публикации. Создай объявление, чтобы помочь животному найти дом." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
        {mine.map((a, i) => <AdCard key={a.id} a={a} i={i} />)}
      </div>
      <button onClick={onCreate} className="w-full border-2 border-dashed border-border rounded-3xl p-8 text-center hover:border-accent hover:bg-secondary/40 transition-all animate-float-up">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent grid place-items-center mx-auto mb-3"><Icon name="Plus" size={28} /></div>
        <p className="font-display font-700 text-lg">Создать объявление</p>
        <p className="text-muted-foreground text-sm mt-1">Расскажи о животном, которому нужна помощь</p>
      </button>
    </div>
  );
}

function Messages({ myName }: { myName: string }) {
  return (
    <div className="max-w-2xl mx-auto">
      <SectionTitle kicker="Чаты" title="Сообщения"
        sub="Общий чат сообщества и личные переписки с авторами объявлений." />
      <MessagesPanel myName={myName} />
    </div>
  );
}

function Profile({ myName }: { myName: string }) {
  const letter = myName ? myName.charAt(0).toUpperCase() : '?';
  return (
    <div className="max-w-2xl">
      <SectionTitle kicker="Аккаунт" title="Профиль" />
      <div className="bg-card border border-border rounded-3xl p-7 animate-float-up">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-primary text-primary-foreground grid place-items-center font-display font-800 text-3xl">{letter}</div>
          <div>
            <h3 className="font-display font-700 text-2xl">{myName || 'Имя не задано'}</h3>
            <p className="text-muted-foreground">Участник сообщества</p>
            <span className="inline-flex items-center gap-1.5 mt-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-700"><Icon name="Award" size={13} /> Участник платформы</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-7">
          <div className="flex items-center gap-3 bg-muted/60 rounded-2xl p-3.5">
            <Icon name="User" size={18} className="text-primary" />
            <span className="text-sm font-600">{myName || 'не задано'}</span>
          </div>
          <div className="flex items-center gap-3 bg-muted/60 rounded-2xl p-3.5">
            <Icon name="MessageCircle" size={18} className="text-primary" />
            <span className="text-sm font-600">Чат доступен</span>
          </div>
        </div>
        <Button onClick={() => { localStorage.removeItem(MY_NAME_KEY); window.location.reload(); }}
          variant="outline" className="w-full mt-4 rounded-full font-700 h-11 gap-2 border-2">
          <Icon name="RefreshCw" size={16} /> Сменить имя
        </Button>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="max-w-3xl">
      <SectionTitle kicker="Наша миссия" title="О приложении" sub="«Лапа помощи» — некоммерческий проект, объединяющий неравнодушных людей ради спасения животных." />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: 'Search', t: 'Найти', d: 'Помогаем воссоединить хозяев с пропавшими питомцами' },
          { icon: 'Heart', t: 'Помочь', d: 'Собираем сообщество для срочной помощи животным' },
          { icon: 'Home', t: 'Приютить', d: 'Находим новый дом для бездомных питомцев' },
        ].map((x, i) => (
          <div key={x.t} className="bg-card border border-border rounded-3xl p-6 hover-lift animate-float-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-3"><Icon name={x.icon} size={24} /></div>
            <h3 className="font-display font-700 text-lg mb-1">{x.t}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{x.d}</p>
          </div>
        ))}
      </div>
      <div className="bg-secondary/50 rounded-3xl p-7 animate-float-up">
        <Icon name="Quote" size={28} className="text-accent mb-3" />
        <p className="font-display font-600 text-xl leading-relaxed">Мы верим, что каждое животное заслуживает заботы, безопасности и любящего дома. Вместе мы делаем мир добрее.</p>
      </div>
    </div>
  );
}

function Contacts() {
  return (
    <div className="max-w-3xl">
      <SectionTitle kicker="Свяжитесь с нами" title="Контакты" sub="Есть вопрос или хочешь стать волонтёром? Напиши нам в любой удобной соцсети." />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {SOCIALS.map((s, i) => (
          <a key={s.name} href="#" className="bg-card border border-border rounded-3xl p-6 hover-lift animate-float-up block" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent grid place-items-center mb-3"><Icon name={s.icon} size={24} /></div>
            <h3 className="font-display font-700 text-lg">{s.name}</h3>
            <p className="text-muted-foreground text-sm mt-0.5">{s.handle}</p>
          </a>
        ))}
      </div>
      <div className="bg-primary text-primary-foreground rounded-3xl p-7 flex flex-col sm:flex-row items-center gap-5 justify-between animate-float-up">
        <div>
          <h3 className="font-display font-700 text-xl">Канал приложения</h3>
          <p className="text-primary-foreground/70 text-sm mt-1">Новости спасений, советы и истории со счастливым концом</p>
        </div>
        <Button className="rounded-full font-700 h-12 px-6 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground whitespace-nowrap shrink-0"><Icon name="Send" size={18} /> Подписаться</Button>
      </div>
    </div>
  );
}