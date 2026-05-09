export type VersionEntry = {
  version: string;
  date: string;
  description: string;
  changes: string[];
};

export const CURRENT_VERSION = "1.0";

export const CHANGELOG: VersionEntry[] = [
  {
    version: "1.0",
    date: "2026-05-09",
    description: "Lançamento inicial do Smart Volto Portal",
    changes: [
      "Autenticação com Google Workspace (OAuth)",
      "Dashboard personalizável com widgets dinâmicos",
      "Widget de anúncios da empresa (Newsroom)",
      "Widget de próximos aniversários",
      "Widget de eventos de calendário Google",
      "Widget de KPIs via n8n webhook",
      "Widget de acessos rápidos com editor visual",
      "Widget de ficheiros recentes do Google Drive",
      "Widget de iframe incorporado",
      "Diretório de pessoas (sincronização Google Workspace)",
      "Calendário da equipa",
      "Manual de operações com editor rich-text",
      "Repositório de documentos",
      "Ferramentas internas",
      "Perfil de utilizador com data de nascimento",
      "Painel de administração (utilizadores, roles, widgets, anúncios, calendários, documentos)",
      "Sistema de permissões por secção",
      "Auditoria de ações administrativas",
    ],
  },
];
