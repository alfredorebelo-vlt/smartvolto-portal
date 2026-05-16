export type VersionEntry = {
  version: string;
  date: string;
  description: string;
  changes: string[];
};

export const CURRENT_VERSION = "1.1";

export const CHANGELOG: VersionEntry[] = [
  {
    version: "1.1",
    date: "2026-05-16",
    description: "Permissões por role em links rápidos, refresh automático de tokens Google e melhorias de administração",
    changes: [
      "Links rápidos do dashboard com controlo de visibilidade por role individual",
      "Refresh automático de tokens Google Workspace — elimina pedidos recorrentes de 'Renovar sessão'",
      "isAdmin derivado automaticamente da role 'Admin' — uma única fonte de verdade",
      "Coluna Admin removida da tabela de utilizadores; badge integrado na coluna Role",
      "Permissões de widgets removidas do editor de roles (geridas individualmente em cada widget)",
      "Diretório de equipa mostra bio, localização e LinkedIn do perfil do utilizador",
      "Placeholder em artigos do manual sem versão publicada",
    ],
  },
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
