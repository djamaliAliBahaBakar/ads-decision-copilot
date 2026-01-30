import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Mentions Légales | AdsDecision',
  description: 'Mentions légales du site AdsDecision',
}

export default function MentionsLegalesPage() {
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

        <h1 className="text-3xl font-bold text-slate-950 mb-8">Mentions Légales</h1>

        <div className="prose prose-slate max-w-none">

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Éditeur du site</h2>
            <p className="text-slate-700 mb-2">
              Le site <strong>AdsDecision</strong> (accessible à l'adresse adsdecision.com) est édité par :
            </p>
            <ul className="list-none pl-0 text-slate-700 space-y-1">
              <li><strong>Nom :</strong> Djamali Ali baha bakar</li>
              <li><strong>Statut :</strong> Auto-entrepreneur</li>
              <li><strong>Email :</strong> contact@adsdecision.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Hébergement</h2>
            <p className="text-slate-700 mb-2">
              Le site est hébergé par :
            </p>
            <ul className="list-none pl-0 text-slate-700 space-y-1">
              <li><strong>Vercel Inc.</strong></li>
              <li>440 N Barranca Ave #4133</li>
              <li>Covina, CA 91723, États-Unis</li>
              <li>Site web : vercel.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Propriété intellectuelle</h2>
            <p className="text-slate-700">
              L'ensemble des contenus présents sur le site AdsDecision (textes, images, logos, graphismes,
              icônes, logiciels, base de données) sont la propriété exclusive de Djamali Ali baha bakar
              ou font l'objet d'une autorisation d'utilisation.
            </p>
            <p className="text-slate-700 mt-2">
              Toute reproduction, représentation, modification, publication, transmission ou dénaturation
              de tout ou partie du site ou de son contenu, par quelque procédé que ce soit, et sur quelque
              support que ce soit, est interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Protection des données personnelles</h2>
            <p className="text-slate-700">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
              Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression
              et de portabilité de vos données personnelles.
            </p>
            <p className="text-slate-700 mt-2">
              Les données collectées sur ce site sont :
            </p>
            <ul className="list-disc pl-6 text-slate-700 mt-2 space-y-1">
              <li>Adresse email (pour l'authentification et les communications)</li>
              <li>Données de campagnes publicitaires (importées par l'utilisateur)</li>
              <li>Décisions et règles créées par l'utilisateur</li>
            </ul>
            <p className="text-slate-700 mt-2">
              Ces données sont utilisées uniquement pour le fonctionnement du service et ne sont
              jamais vendues à des tiers.
            </p>
            <p className="text-slate-700 mt-2">
              Pour exercer vos droits, contactez-nous à : <strong>contact@adsdecision.com</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Cookies</h2>
            <p className="text-slate-700">
              Le site utilise des cookies nécessaires au bon fonctionnement du service :
            </p>
            <ul className="list-disc pl-6 text-slate-700 mt-2 space-y-1">
              <li>Cookies d'authentification (Clerk)</li>
              <li>Cookies de session</li>
            </ul>
            <p className="text-slate-700 mt-2">
              Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Responsabilité</h2>
            <p className="text-slate-700">
              L'éditeur s'efforce de fournir des informations aussi précises que possible. Toutefois,
              il ne pourra être tenu responsable des omissions, des inexactitudes et des carences
              dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires.
            </p>
            <p className="text-slate-700 mt-2">
              Les suggestions de décisions fournies par AdsDecision sont des recommandations basées
              sur les données importées et les règles définies par l'utilisateur. L'utilisateur reste
              seul responsable des décisions prises concernant ses campagnes publicitaires.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Droit applicable</h2>
            <p className="text-slate-700">
              Les présentes mentions légales sont régies par le droit français. En cas de litige,
              les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Contact</h2>
            <p className="text-slate-700">
              Pour toute question concernant ces mentions légales, vous pouvez nous contacter à
              l'adresse suivante : <strong>contact@adsdecision.com</strong>
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
