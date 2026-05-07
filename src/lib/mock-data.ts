export type TeamMember = {
  id: number;
  name: string;
  role: string;
  dept: string;
  initials: string;
  color: string;
  office: string;
  status: "online" | "focus" | "remote" | "off";
};

export type Announcement = {
  id: number;
  kind: "milestone" | "launch" | "people" | "tech";
  title: string;
  author: string;
  time: string;
  body: string;
  reactions: number;
};

export type EventItem = {
  id: number;
  day: number;
  time: string;
  title: string;
  type: "company" | "team" | "social" | "workshop" | "ops" | "birthday";
  duration: number;
  attendees: number;
};

export type Tool = { name: string; desc: string; color: string; letter: string };
export type KPI = { label: string; value: string; delta: string; positive: boolean };
export type QuickLink = { label: string; icon: string };
export type Birthday = { name: string; day: string };

export const TEAM: TeamMember[] = [
  { id: 1, name: "Sofia Marques", role: "Head of Operations", dept: "Operations", initials: "SM", color: "#2E3C8F", office: "Lisboa", status: "online" },
  { id: 2, name: "Ricardo Antunes", role: "Frontend Lead", dept: "Engineering", initials: "RA", color: "#F29220", office: "Porto", status: "online" },
  { id: 3, name: "Inês Carvalho", role: "Brand Designer", dept: "Marketing", initials: "IC", color: "#FFC429", office: "Lisboa", status: "focus" },
  { id: 4, name: "Tiago Mendes", role: "Customer Lead", dept: "Customer", initials: "TM", color: "#2E3C8F", office: "Faro", status: "online" },
  { id: 5, name: "Maria Lopes", role: "People & Culture", dept: "People", initials: "ML", color: "#F29220", office: "Lisboa", status: "remote" },
  { id: 6, name: "André Silva", role: "Fleet Manager", dept: "Operations", initials: "AS", color: "#2E3C8F", office: "Porto", status: "online" },
  { id: 7, name: "Beatriz Nogueira", role: "Backend Engineer", dept: "Engineering", initials: "BN", color: "#FFC429", office: "Lisboa", status: "online" },
  { id: 8, name: "Diogo Pereira", role: "Growth Marketer", dept: "Marketing", initials: "DP", color: "#F29220", office: "Lisboa", status: "off" },
  { id: 9, name: "Joana Ribeiro", role: "Finance Analyst", dept: "Finance", initials: "JR", color: "#2E3C8F", office: "Lisboa", status: "online" },
  { id: 10, name: "Pedro Costa", role: "CTO", dept: "Engineering", initials: "PC", color: "#2E3C8F", office: "Porto", status: "focus" },
  { id: 11, name: "Carolina Dias", role: "Product Designer", dept: "Engineering", initials: "CD", color: "#F29220", office: "Remote", status: "remote" },
  { id: 12, name: "Hugo Ferreira", role: "Store Manager", dept: "Customer", initials: "HF", color: "#FFC429", office: "Faro", status: "online" },
];

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 1, kind: "milestone", title: "Atingimos 10.000 reservas este trimestre", author: "Sofia Marques", time: "há 2 horas", body: "Q1 fechado com 12% acima do target. Obrigada a todos pelo trabalho — em especial à equipa das lojas que aguentou o pico da Páscoa.", reactions: 47 },
  { id: 2, kind: "launch", title: "Nova frota Tesla Model 3 disponível em Lisboa", author: "André Silva", time: "ontem", body: "Mais 8 carros adicionados à categoria Premium. Já estão visíveis no booking flow desde as 09h.", reactions: 23 },
  { id: 3, kind: "people", title: "Damos as boas-vindas à Carolina Dias", author: "Maria Lopes", time: "há 2 dias", body: "A Carolina junta-se à equipa de Engineering como Product Designer. Vinda da Unbabel, vai liderar o redesign do app móvel.", reactions: 89 },
];

export const EVENTS: EventItem[] = [
  { id: 1, day: 4, time: "10:00", title: "All Hands Q2", type: "company", duration: 60, attendees: 42 },
  { id: 2, day: 4, time: "14:30", title: "Brand workshop", type: "workshop", duration: 90, attendees: 8 },
  { id: 3, day: 5, time: "09:30", title: "Sprint planning · Engineering", type: "team", duration: 60, attendees: 6 },
  { id: 4, day: 5, time: "12:00", title: "Almoço novos colaboradores", type: "social", duration: 90, attendees: 12 },
  { id: 5, day: 6, time: "11:00", title: "Customer review · Loja Lisboa", type: "ops", duration: 45, attendees: 4 },
  { id: 6, day: 7, time: "16:00", title: "Birthday · Tiago Mendes", type: "birthday", duration: 30, attendees: 24 },
  { id: 7, day: 8, time: "10:00", title: "Operações semanais", type: "team", duration: 45, attendees: 9 },
  { id: 8, day: 8, time: "15:30", title: "Demo Day · Engineering", type: "company", duration: 60, attendees: 38 },
];

export const TOOLS: Tool[] = [
  { name: "Slack", desc: "Comunicação", color: "#4A154B", letter: "S" },
  { name: "Notion", desc: "Wiki & docs", color: "#000000", letter: "N" },
  { name: "Linear", desc: "Engineering", color: "#5E6AD2", letter: "L" },
  { name: "Figma", desc: "Design", color: "#F24E1E", letter: "F" },
  { name: "GitHub", desc: "Código", color: "#181717", letter: "G" },
  { name: "HubSpot", desc: "CRM", color: "#FF7A59", letter: "H" },
  { name: "Xero", desc: "Faturação", color: "#13B5EA", letter: "X" },
  { name: "Personio", desc: "RH", color: "#1F8DED", letter: "P" },
];

export const KPIS: KPI[] = [
  { label: "Reservas semana", value: "1.284", delta: "+8,2%", positive: true },
  { label: "Frota ativa", value: "342", delta: "94% disp.", positive: true },
  { label: "NPS", value: "72", delta: "+4 pts", positive: true },
  { label: "Receita MTD", value: "€840K", delta: "+12%", positive: true },
];

export const QUICK_LINKS: QuickLink[] = [
  { label: "Pedir férias", icon: "calendar-plus" },
  { label: "Submeter despesa", icon: "receipt" },
  { label: "Reservar sala", icon: "door-open" },
  { label: "Reportar incidente", icon: "alert-triangle" },
  { label: "Diretório", icon: "users" },
  { label: "Wiki", icon: "book-open" },
];

export const BIRTHDAYS: Birthday[] = [
  { name: "Tiago Mendes", day: "Hoje" },
  { name: "Beatriz Nogueira", day: "Sex, 1 mai" },
  { name: "Joana Ribeiro", day: "Seg, 4 mai" },
];
