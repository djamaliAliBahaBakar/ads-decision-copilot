import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Conditions Générales de Vente | AdsDecision',
  description: 'Conditions générales de vente du service AdsDecision',
}

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <h1 className="text-3xl font-bold text-slate-950 mb-8">Conditions Générales de Vente</h1>

        <div className="prose prose-slate max-w-none">

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 1 - Objet</h2>
            <p className="text-slate-700">
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles
              entre <strong>Djamali Ali baha bakar</strong>, auto-entrepreneur, ci-après dénommé "le Prestataire",
              et toute personne effectuant un achat sur le site <strong>AdsDecision</strong>, ci-après dénommée "le Client".
            </p>
            <p className="text-slate-700 mt-2">
              Toute souscription à un abonnement implique l'acceptation sans réserve des présentes CGV.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 2 - Description du service</h2>
            <p className="text-slate-700">
              AdsDecision est un outil d'aide à la décision pour les campagnes publicitaires Meta (Facebook/Instagram Ads).
              Le service permet de :
            </p>
            <ul className="list-disc pl-6 text-slate-700 mt-2 space-y-1">
              <li>Importer et analyser les données de campagnes publicitaires</li>
              <li>Recevoir des suggestions de décisions (KILL, SCALE, HOLD) basées sur des règles personnalisées</li>
              <li>Suivre l'historique des décisions prises</li>
              <li>Mesurer la discipline via le système Tiltmeter</li>
              <li>Recevoir un digest email hebdomadaire (version payante)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 3 - Offres et tarifs</h2>

            <h3 className="text-lg font-medium text-slate-800 mt-4 mb-2">3.1 Offre gratuite</h3>
            <p className="text-slate-700">
              L'offre gratuite permet d'utiliser le service avec une limite de <strong>3 décisions</strong>.
              Cette offre est destinée à permettre au Client de tester le service avant de souscrire à un abonnement payant.
            </p>

            <h3 className="text-lg font-medium text-slate-800 mt-4 mb-2">3.2 Offre Pro (payante)</h3>
            <p className="text-slate-700">
              L'abonnement Pro donne accès à :
            </p>
            <ul className="list-disc pl-6 text-slate-700 mt-2 space-y-1">
              <li>Décisions illimitées</li>
              <li>Digest email hebdomadaire</li>
              <li>Suivi de la discipline (Tiltmeter)</li>
              <li>Support prioritaire</li>
            </ul>
            <p className="text-slate-700 mt-2">
              Les tarifs sont indiqués en euros (€) TTC. Le Prestataire se réserve le droit de modifier
              ses tarifs à tout moment. Les nouveaux tarifs s'appliquent aux nouvelles souscriptions
              et aux renouvellements suivant la modification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 4 - Modalités de paiement</h2>
            <p className="text-slate-700">
              Le paiement s'effectue en ligne par carte bancaire via la plateforme sécurisée <strong>Stripe</strong>.
            </p>
            <p className="text-slate-700 mt-2">
              L'abonnement est prélevé automatiquement selon la périodicité choisie (mensuelle ou trimestrielle)
              à la date anniversaire de la souscription.
            </p>
            <p className="text-slate-700 mt-2">
              Le Client peut consulter et gérer ses informations de paiement dans la section Paramètres de son compte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 5 - Droit de rétractation</h2>
            <p className="text-slate-700">
              Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation
              ne peut être exercé pour les services pleinement exécutés avant la fin du délai de rétractation
              et dont l'exécution a commencé après accord préalable exprès du consommateur.
            </p>
            <p className="text-slate-700 mt-2">
              En souscrivant à un abonnement, le Client reconnaît que le service est immédiatement
              accessible et utilisable, et renonce expressément à son droit de rétractation.
            </p>
            <p className="text-slate-700 mt-2">
              Toutefois, le Prestataire offre une <strong>garantie satisfait ou remboursé de 14 jours</strong>
              à compter de la date de souscription. Pour en bénéficier, le Client doit en faire la demande
              par email à contact@adsdecision.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 6 - Résiliation</h2>
            <p className="text-slate-700">
              Le Client peut résilier son abonnement à tout moment depuis la section Paramètres de son compte
              ou en contactant le support à contact@adsdecision.com.
            </p>
            <p className="text-slate-700 mt-2">
              La résiliation prend effet à la fin de la période en cours. Le Client conserve l'accès
              au service jusqu'à cette date.
            </p>
            <p className="text-slate-700 mt-2">
              Aucun remboursement prorata temporis ne sera effectué pour la période restante après la résiliation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 7 - Obligations du Client</h2>
            <p className="text-slate-700">
              Le Client s'engage à :
            </p>
            <ul className="list-disc pl-6 text-slate-700 mt-2 space-y-1">
              <li>Fournir des informations exactes lors de l'inscription</li>
              <li>Ne pas partager ses identifiants de connexion</li>
              <li>Utiliser le service conformément à sa destination</li>
              <li>Ne pas tenter de contourner les limitations techniques du service</li>
              <li>Respecter les droits de propriété intellectuelle du Prestataire</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 8 - Responsabilité</h2>
            <p className="text-slate-700">
              Le Prestataire s'engage à mettre en œuvre tous les moyens nécessaires pour assurer
              la disponibilité et la qualité du service. Cependant, il ne peut garantir une disponibilité
              de 100% et ne pourra être tenu responsable des interruptions temporaires.
            </p>
            <p className="text-slate-700 mt-2">
              <strong>Important :</strong> Les suggestions de décisions fournies par AdsDecision sont
              des recommandations basées sur les données importées par le Client et les règles qu'il a définies.
              Le Prestataire ne peut en aucun cas être tenu responsable des décisions prises par le Client
              concernant ses campagnes publicitaires, ni des conséquences financières qui en découlent.
            </p>
            <p className="text-slate-700 mt-2">
              Le Client reste seul responsable de l'interprétation des données et des décisions
              qu'il prend pour ses campagnes publicitaires.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 9 - Protection des données</h2>
            <p className="text-slate-700">
              Les données personnelles collectées sont traitées conformément au RGPD.
              Pour plus d'informations, consultez nos <Link href="/mentions-legales" className="text-blue-600 hover:underline">Mentions Légales</Link>.
            </p>
            <p className="text-slate-700 mt-2">
              Les données de campagnes publicitaires importées par le Client restent sa propriété exclusive.
              Le Prestataire s'engage à ne pas les utiliser à d'autres fins que le fonctionnement du service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 10 - Propriété intellectuelle</h2>
            <p className="text-slate-700">
              Le service AdsDecision, son interface, ses algorithmes et son code source sont la propriété
              exclusive du Prestataire. L'abonnement confère uniquement un droit d'utilisation personnel
              et non-exclusif du service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 11 - Modification des CGV</h2>
            <p className="text-slate-700">
              Le Prestataire se réserve le droit de modifier les présentes CGV à tout moment.
              Les modifications seront notifiées aux Clients par email au moins 30 jours avant leur entrée en vigueur.
            </p>
            <p className="text-slate-700 mt-2">
              La poursuite de l'utilisation du service après l'entrée en vigueur des nouvelles CGV
              vaut acceptation de celles-ci.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 12 - Litiges</h2>
            <p className="text-slate-700">
              Les présentes CGV sont soumises au droit français.
            </p>
            <p className="text-slate-700 mt-2">
              En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.
              Le Client peut recourir gratuitement à un médiateur de la consommation en cas de différend.
            </p>
            <p className="text-slate-700 mt-2">
              À défaut d'accord amiable, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Article 13 - Contact</h2>
            <p className="text-slate-700">
              Pour toute question concernant ces CGV ou le service, contactez-nous à :
              <strong> contact@adsdecision.com</strong>
            </p>
          </section>

          <p className="text-sm text-slate-500 mt-12">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

        </div>
      </div>
    </div>
  )
}
