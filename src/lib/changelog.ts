export type VersionEntry = {
  version: string;
  date: string;
  description: string;
  changes: string[];
};

export const CURRENT_VERSION = "1.3";

export const CHANGELOG: VersionEntry[] = [
  {
    version: "1.3",
    date: "2026-05-17",
    description: "Integração Slack — widget de canal, notificações de anúncios e mensagens diretas no diretório",
    changes: [
      "Novo widget 'Canal Slack' — mostra mensagens recentes de um canal com nomes reais e filtragem de mensagens de sistema",
      "Cada mensagem do widget é clicável e abre o Slack diretamente na mensagem correspondente",
      "Anúncios publicados no portal notificam automaticamente o canal Slack via webhook (Block Kit)",
      "Botão 'Mensagem no Slack' no drawer de cada pessoa do diretório — abre conversa direta na app Slack",
      "Drag & drop nativo na área de administração de widgets do dashboard",
    ],
  },
  {
    version: "1.2",
    date: "2026-05-17",
    description: "Correções de autenticação Slack e filtros de mensagens de sistema",
    changes: [
      "Corrigida resolução de nomes Slack — users.info e users.lookupByEmail passaram a usar GET (requisito da API)",
      "Mensagens de sistema do Slack (entrou no canal, etc.) filtradas do widget",
      "Widget Slack defensivo contra formato de cache legado",
    ],
  },
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
