/**
 * French translations for Ads Decision
 * Prepared for future i18n implementation
 */

export const fr = {
  // App
  app: {
    name: 'Ads Decision',
    tagline: 'Un cadre clair pour décider quoi faire de tes Ads.',
  },

  // Navigation
  nav: {
    dashboard: 'Tableau de bord',
    dashboardDesc: 'Vue d\'ensemble et suggestions',
    journal: 'Journal',
    journalDesc: 'Historique des décisions',
    upload: 'Import CSV',
    uploadDesc: 'Importer des données',
    settings: 'Paramètres',
    settingsDesc: 'Configuration du compte',
  },

  // Pages
  pages: {
    dashboard: {
      title: 'Tableau de bord',
      subtitle: 'Vue d\'ensemble de vos campagnes cette semaine',
      noData: 'Pas de données',
      noDataDesc: 'Importez votre premier fichier CSV pour commencer à analyser vos campagnes Meta Ads',
      uploadCta: 'Importer un CSV',
    },
    journal: {
      title: 'Journal des décisions',
      subtitle: 'Historique complet de vos décisions marketing',
      noDecisions: 'Aucune décision pour le moment',
      filter: 'Filtrer',
      all: 'Toutes',
    },
    upload: {
      title: 'Import CSV',
      subtitle: 'Importez vos données Meta Ads pour analyse',
      dropzone: 'Glissez votre fichier CSV ici',
      dropzoneAlt: 'ou cliquez pour sélectionner un fichier',
      formatLabel: 'Format attendu',
      preview: 'Aperçu',
      importing: 'Import en cours...',
      import: 'Importer les données',
    },
    settings: {
      title: 'Paramètres',
      subtitle: 'Configuration et intégrations de votre compte',
    },
  },

  // Paywall
  paywall: {
    title: 'Accès complet à Ads Decision',
    subtitle: 'Tu as vu ce que l\'outil peut faire. Maintenant, utilise-le pour de vrai.',
    earlyAdopter: 'Tarif early adopter — valable jusqu\'au 28 février 2026',
    monthly: '/mois',
    quarterly: '/trimestre',
    savings: 'économise',
    included: 'Ce qui est inclus',
    notIncluded: 'Non inclus',
    cta: 'Débloquer l\'accès complet',
    reassurance: 'Paiement sécurisé. Annulable à tout moment depuis les paramètres.',
    features: {
      unlimitedSuggestions: 'Suggestions de décision illimitées',
      fullJournal: 'Journal de décisions complet',
      unlimitedImport: 'Import CSV sans limite',
      customRules: 'Règles personnalisées',
      weeklyDigest: 'Digest hebdomadaire par email',
      updates: 'Mises à jour produit incluses',
    },
    notFeatures: {
      metaSync: 'Sync automatique avec Meta (prévu plus tard)',
      api: 'Accès API',
      prioritySupport: 'Support prioritaire',
    },
    locked: {
      generic: 'Fonctionnalité réservée aux membres.',
      details: 'Détails disponibles avec l\'accès complet.',
      rules: 'Crée tes propres règles avec l\'accès complet.',
      export: 'Export disponible avec l\'accès complet.',
      tooltip: 'Débloque cette fonctionnalité →',
    },
    success: {
      title: 'C\'est bon, tu as accès.',
      message: 'Toutes les fonctionnalités sont maintenant débloquées. Tu peux commencer à utiliser Ads Decision normalement.',
      cta: 'Aller au Dashboard',
    },
    dismissed: 'Tu peux continuer à explorer. L\'accès complet sera là quand tu seras prêt.',
  },

  // Actions
  actions: {
    kill: 'KILL',
    scale: 'SCALE',
    hold: 'HOLD',
    test: 'TEST',
    fix: 'FIX',
  },

  // Common
  common: {
    retry: 'Réessayer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    success: 'Succès',
    week: 'Cette semaine',
  },

  // Metrics
  metrics: {
    spend: 'Dépenses',
    leads: 'Leads',
    cpl: 'CPL moyen',
    roas: 'ROAS moyen',
    conversions: 'Conversions',
    returnOnInvest: 'Retour investi',
  },
} as const

export type Translations = typeof fr
