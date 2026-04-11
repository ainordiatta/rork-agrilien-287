# 🚀 AfriMarket - Roadmap Stratégique & Plan d'Exécution

## 📋 Table des Matières
1. [Vision & Problématique](#vision--problématique)
2. [Roadmap Produit](#roadmap-produit)
3. [Architecture Technique](#architecture-technique)
4. [Monétisation & Croissance](#monétisation--croissance)
5. [Acquisition Utilisateurs](#acquisition-utilisateurs)
6. [KPIs & Métriques](#kpis--métriques)
7. [Spécifications UX](#spécifications-ux)
8. [Plan de Tests](#plan-de-tests)
9. [Pitch Deck](#pitch-deck)

---

## 🎯 Vision & Problématique

### Problème
- **Diaspora africaine** : Difficulté d'acheter pour leurs proches restés au pays
- **Boutiques locales** : Manque de visibilité digitale, clientèle limitée au quartier
- **Clients locaux** : Pas de plateforme unifiée pour comparer produits/prix, livraison peu fiable
- **Géolocalisation** : Impossible de trouver produits/boutiques à proximité

### Solution
Marketplace mobile-first connectant boutiques de quartier, grandes enseignes et diaspora avec :
- **Géolocalisation native** : "Près de moi", carte interactive, zones de livraison
- **Multi-pays** : Sénégal, Mali, France (diaspora)
- **Paiement sécurisé** : Escrow, Mobile Money, cartes
- **QR Code** : Retrait en boutique ou par tiers
- **Messagerie** : Négociation directe vendeur-acheteur

---

## 🗺️ Roadmap Produit

### **MVP (Mois 1-2)** - Effort: L
**Objectif** : Valider product-market fit avec fonctionnalités essentielles

#### Fonctionnalités
✅ **Déjà implémenté dans cette version** :
- Onboarding multi-pays (Sénégal/Mali/France)
- Inscription Client/Boutique
- Catalogue produits avec filtres (catégorie, prix)
- Fiche produit détaillée
- Panier & gestion quantités
- Profil boutique avec notation
- Profil utilisateur

🔨 **À développer** :
- [ ] Géolocalisation "Près de moi" (rayon 1/5/10km) - **Effort: M**
- [ ] Carte interactive boutiques/produits (Mapbox/Google Maps) - **Effort: M**
- [ ] Paiement Mobile Money (Orange Money, Wave) - **Effort: L**
- [ ] Génération QR code retrait - **Effort: S**
- [ ] Notifications push (produit dispo, commande) - **Effort: M**
- [ ] Backend API (Node.js/Express + PostgreSQL + PostGIS) - **Effort: L**

**Dépendances** :
- Backend → Géolocalisation → Paiements → QR Code
- Notifications indépendantes

---

### **V1 (Mois 3-4)** - Effort: L
**Objectif** : Améliorer expérience utilisateur et conversion

#### Fonctionnalités
- [ ] Messagerie in-app (texte, vocal, images) - **Effort: M**
- [ ] Négociation prix + génération lien paiement - **Effort: M**
- [ ] Zones de livraison paramétrables (rayon, quartiers, frais) - **Effort: M**
- [ ] Validation KYC adresses (Google Places API) - **Effort: S**
- [ ] Historique commandes & factures PDF - **Effort: M**
- [ ] Système de notation/avis boutiques - **Effort: M**
- [ ] Boost produits (sponsoring) - **Effort: S**
- [ ] Dashboard vendeur (ventes, revenus, stats) - **Effort: M**

**Dépendances** :
- Messagerie → Négociation
- Géolocalisation → Zones de livraison
- Paiements → Historique commandes

---

### **V2 (Mois 5-6)** - Effort: XL
**Objectif** : Scale & fonctionnalités avancées

#### Fonctionnalités
- [ ] Recherche avancée (texte, filtres combinés, tri distance) - **Effort: M**
- [ ] Favoris & listes d'arrivages - **Effort: S**
- [ ] Partage adresse livraison (deep links) - **Effort: S**
- [ ] Multilingue (Français, Wolof, Anglais) - **Effort: M**
- [ ] Promos géociblées (push notif rayon X km) - **Effort: M**
- [ ] Programme fidélité boutiques - **Effort: M**
- [ ] Gestion stock temps réel - **Effort: M**
- [ ] Analytics avancées (heatmaps, conversion funnels) - **Effort: M**
- [ ] Intégration WhatsApp Business - **Effort: S**
- [ ] Support client chatbot (IA) - **Effort: L**

**Dépendances** :
- V1 complète → Toutes fonctionnalités V2

---

## 🏗️ Architecture Technique

### **Stack Mobile (React Native + Expo)**
```
Frontend (Actuel)
├── React Native 0.79 + Expo 53
├── TypeScript (strict mode)
├── Expo Router (file-based routing)
├── React Query (server state)
├── AsyncStorage (persistence)
├── Lucide Icons
└── Context API (@nkzw/create-context-hook)
```

### **Backend (À développer)**
```
API REST
├── Node.js 20 + Express
├── PostgreSQL 16 (données relationnelles)
├── PostGIS (géolocalisation)
├── Redis (cache, sessions)
├── S3/Cloudinary (images)
└── JWT (authentification)

Services
├── Stripe/Flutterwave (paiements)
├── Twilio (SMS/WhatsApp)
├── Firebase Cloud Messaging (push notif)
├── Mapbox/Google Maps (cartographie)
└── Cloudflare (CDN, DDoS protection)
```

### **Base de Données**
```sql
-- Tables principales
users (id, role, name, email, phone, city, country, created_at)
shops (id, user_id, name, specialty, location GEOGRAPHY, rating, created_at)
products (id, shop_id, name, price, stock, category, location GEOGRAPHY)
orders (id, user_id, total, status, payment_method, qr_code, created_at)
order_items (id, order_id, product_id, quantity, price)
messages (id, sender_id, receiver_id, content, type, created_at)
reviews (id, shop_id, user_id, rating, comment, created_at)

-- Index géospatiaux
CREATE INDEX idx_shops_location ON shops USING GIST(location);
CREATE INDEX idx_products_location ON products USING GIST(location);
```

### **Géolocalisation**
- **PostGIS** : Requêtes spatiales (ST_DWithin, ST_Distance)
- **Mapbox GL** : Carte interactive, clustering markers
- **Expo Location** : GPS utilisateur (permission, background tracking)
- **Zones de livraison** : Polygones GeoJSON stockés en DB

### **Paiements & Escrow**
```
Flow Escrow
1. Client paie → Fonds bloqués (Stripe/Flutterwave)
2. Vendeur confirme commande → Prépare produit
3. Client confirme réception → Fonds libérés au vendeur
4. Litige → Admin arbitre (remboursement partiel/total)
```

### **Sécurité**
- HTTPS obligatoire (Let's Encrypt)
- Rate limiting (express-rate-limit)
- Validation inputs (Joi/Zod)
- Sanitization SQL (Parameterized queries)
- 2FA optionnel (SMS/TOTP)
- Chiffrement données sensibles (bcrypt, AES-256)

### **Performance**
- **CDN** : Images, assets statiques
- **Lazy loading** : Images (expo-image), listes (FlatList)
- **Pagination** : API (limit/offset), infinite scroll
- **Cache** : Redis (produits populaires, boutiques), React Query (5min TTL)
- **Compression** : Gzip/Brotli (API), WebP (images)

---

## 💰 Monétisation & Croissance

### **Modèles de Revenus**

#### 1. **Commission sur Ventes** (Principal)
- **Taux** : 5-10% par transaction
- **Cible** : Toutes boutiques
- **Projection** : 70% des revenus

#### 2. **Abonnements Boutiques** (Secondaire)
| Plan | Prix/mois | Produits | Boost | Commission |
|------|-----------|----------|-------|------------|
| **Gratuit** | 0 FCFA | 10 | 0 | 10% |
| **Starter** | 5,000 FCFA | 50 | 5/mois | 7% |
| **Pro** | 15,000 FCFA | 200 | 20/mois | 5% |
| **Enterprise** | 50,000 FCFA | Illimité | 100/mois | 3% |

**Projection** : 20% des revenus

#### 3. **Boost Produits** (Tertiaire)
- **Prix** : 500-2,000 FCFA/produit/jour
- **Placement** : Top feed, notifications géociblées
- **Projection** : 10% des revenus

### **Projections Financières (Année 1)**

| Mois | Boutiques | Clients | GMV (FCFA) | Revenus (FCFA) |
|------|-----------|---------|------------|----------------|
| M3 | 50 | 500 | 5M | 500K |
| M6 | 200 | 3K | 30M | 3M |
| M12 | 1,000 | 20K | 200M | 20M |

**Hypothèses** :
- Panier moyen : 25,000 FCFA
- Fréquence achat : 2x/mois
- Commission moyenne : 7%

---

## 📈 Acquisition Utilisateurs

### **Stratégie Boutiques (Supply)**

#### Phase 1 : Seed (M1-2)
- **Cible** : 50 boutiques pilotes (Dakar/Bamako)
- **Tactiques** :
  - Visite terrain (marchés Sandaga, Médina, Grand Marché)
  - Démo gratuite + onboarding assisté
  - 3 mois gratuits plan Pro
  - Formation WhatsApp/réseaux sociaux

#### Phase 2 : Growth (M3-6)
- **Cible** : 200 boutiques
- **Tactiques** :
  - Partenariats associations commerçants
  - Ambassadeurs (1 boutique recrute 5 → bonus)
  - Publicité Facebook/Instagram (ciblage géo)
  - Événements locaux (foires, salons)

#### Phase 3 : Scale (M7-12)
- **Cible** : 1,000 boutiques
- **Tactiques** :
  - API intégration grandes enseignes (Auchan, Casino)
  - Programme affiliation (influenceurs locaux)
  - SEO local (Google My Business)

### **Stratégie Clients (Demand)**

#### Phase 1 : Seed (M1-2)
- **Cible** : 500 early adopters
- **Tactiques** :
  - Friends & family boutiques pilotes
  - Groupes Facebook/WhatsApp communautaires
  - Flyers QR code dans boutiques partenaires

#### Phase 2 : Growth (M3-6)
- **Cible** : 3,000 clients
- **Tactiques** :
  - Publicité Facebook/Instagram (lookalike audiences)
  - Parrainage (10% réduction parrain + filleul)
  - Partenariats influenceurs (unboxing, codes promo)
  - Radio locale (spots 30s)

#### Phase 3 : Scale (M7-12)
- **Cible** : 20,000 clients
- **Tactiques** :
  - TV locale (spots prime time)
  - Partenariats opérateurs télécom (Orange, MTN)
  - Campagnes diaspora (Facebook France, UK, USA)
  - SEO/ASO (App Store, Google Play)

### **Diaspora (Niche Stratégique)**
- **Cible** : Sénégalais/Maliens France (500K+)
- **Tactiques** :
  - Publicité Facebook ciblée (expatriés)
  - Partenariats associations diaspora
  - Événements culturels (concerts, festivals)
  - Cashback 5% premiers achats

---

## 📊 KPIs & Métriques

### **KPIs MVP (M1-3)**

| Métrique | Cible | Mesure |
|----------|-------|--------|
| **GMV** | 5M FCFA/mois | Total ventes plateforme |
| **AOV** | 25K FCFA | Panier moyen |
| **Taux conversion** | 3% | Visiteurs → Acheteurs |
| **NPS** | 50+ | Satisfaction client |
| **Délai livraison** | <48h | Commande → Réception |
| **% retraits QR** | 40% | Retraits vs livraisons |
| **Litiges** | <5% | Commandes contestées |
| **Boutiques actives** | 70% | Ventes >1/semaine |
| **Rétention M1** | 40% | Clients achat M2 |

### **KPIs V1 (M4-6)**
- **GMV** : 30M FCFA/mois
- **Boutiques** : 200
- **Clients actifs** : 3,000
- **Taux boost** : 20% boutiques
- **Temps réponse messagerie** : <2h

### **KPIs V2 (M7-12)**
- **GMV** : 200M FCFA/mois
- **Boutiques** : 1,000
- **Clients actifs** : 20,000
- **Taux abonnement** : 30% boutiques
- **LTV/CAC** : >3

### **Dashboards**
- **Mixpanel** : Funnels, rétention, cohortes
- **Amplitude** : Comportement utilisateur
- **Metabase** : Business metrics (GMV, revenus)
- **Sentry** : Erreurs, crashes

---

## 🎨 Spécifications UX

### **Filtres "Près de moi"**
```
Interface
├── Toggle "Près de moi" (header)
├── Slider rayon (1/5/10/20 km)
├── Carte/Liste (toggle view)
└── Tri (distance, prix, note)

Comportement
├── Permission GPS → Demande au 1er clic
├── Refus → Fallback saisie ville manuelle
├── Background location → Notifications promos géo
└── Cache position 5min (économie batterie)
```

### **Carte Interactive**
```
Fonctionnalités
├── Markers boutiques (clustering >10)
├── Markers produits (icône catégorie)
├── Popup fiche rapide (nom, prix, note)
├── Itinéraire (Google Maps/Waze)
└── Filtres overlay (catégorie, prix)

Performance
├── Lazy load markers (viewport)
├── Debounce zoom/pan (300ms)
└── Cache tiles offline (Mapbox)
```

### **Fiche Boutique**
```
Sections
├── Header (photo, nom, note, distance)
├── Infos (adresse, horaires, téléphone)
├── Description
├── Produits (grid 2 colonnes)
├── Avis clients (pagination)
└── CTA (Contacter, Itinéraire)

Actions
├── Appel direct (tel:)
├── WhatsApp (wa.me)
├── Partage (deep link)
└── Signaler
```

### **Flow QR Code**
```
Achat
1. Client commande → Paiement
2. Génération QR unique (JWT signé)
3. Notification vendeur + client
4. Client présente QR en boutique
5. Vendeur scan → Validation commande
6. Fonds libérés

Partage Retrait
1. Client génère QR partageable
2. Envoi WhatsApp/SMS à tiers
3. Tiers présente QR
4. Vendeur vérifie ID tiers
5. Remise produit
```

### **Négociation/Paiement**
```
Flow
1. Client clique "Négocier" (fiche produit)
2. Ouverture chat vendeur
3. Discussion prix/quantité
4. Vendeur propose nouveau prix
5. Client accepte → Génération lien paiement
6. Paiement → Commande créée
```

---

## 🧪 Plan de Tests

### **Tests Fonctionnels** (Effort: M)

#### Onboarding
- [ ] Sélection pays persiste après redémarrage
- [ ] Inscription client/boutique valide données
- [ ] Erreurs affichées si champs manquants

#### Catalogue
- [ ] Filtres catégorie/pays fonctionnent
- [ ] Produits boostés en tête de liste
- [ ] Images chargent (fallback si erreur)

#### Panier
- [ ] Ajout/suppression produits
- [ ] Modification quantités (min 1, max stock)
- [ ] Total calculé correctement
- [ ] Persistance après fermeture app

#### Profil
- [ ] Affichage infos utilisateur
- [ ] Déconnexion redirige vers onboarding

### **Tests Géolocalisation** (Effort: M)

#### Permission GPS
- [ ] Demande permission au 1er clic "Près de moi"
- [ ] Refus → Fallback saisie ville
- [ ] Acceptation → Affichage produits proches

#### Calcul Distance
- [ ] Distance boutique/utilisateur correcte (±100m)
- [ ] Tri par distance fonctionne
- [ ] Filtres rayon (1/5/10km) appliqués

#### Carte
- [ ] Markers affichés (boutiques + produits)
- [ ] Clustering >10 markers
- [ ] Popup fiche rapide au clic
- [ ] Itinéraire ouvre Google Maps/Waze

### **Tests Paiement Escrow** (Effort: L)

#### Flow Nominal
- [ ] Paiement bloque fonds (Stripe test mode)
- [ ] Vendeur reçoit notification
- [ ] Client confirme réception → Fonds libérés
- [ ] Facture PDF générée

#### Flow Litige
- [ ] Client signale problème
- [ ] Admin notifié
- [ ] Remboursement partiel/total possible
- [ ] Historique traçable

### **Tests QR en Magasin** (Effort: S)

#### Génération
- [ ] QR unique par commande (JWT signé)
- [ ] Expiration 7 jours
- [ ] Affichage plein écran

#### Scan
- [ ] Vendeur scan QR → Validation commande
- [ ] QR invalide → Erreur explicite
- [ ] QR déjà utilisé → Erreur

#### Partage
- [ ] QR partageable WhatsApp/SMS
- [ ] Tiers présente QR → Remise produit
- [ ] Vérification ID tiers obligatoire

### **Tests Performance** (Effort: M)

#### Réseaux Faibles
- [ ] App fonctionne 2G (mode dégradé)
- [ ] Images compressées (WebP, lazy load)
- [ ] Timeout requêtes 10s → Retry 3x
- [ ] Cache offline (produits, boutiques)

#### Appareils Bas de Gamme
- [ ] Fluidité 60fps (Android 512MB RAM)
- [ ] Pas de memory leaks (Profiler)
- [ ] APK <50MB (code splitting)

### **Tests Sécurité** (Effort: M)

#### Authentification
- [ ] JWT expirent après 7j
- [ ] Refresh token rotation
- [ ] Brute force protection (rate limit)

#### Paiements
- [ ] Pas de données carte stockées
- [ ] 3D Secure obligatoire
- [ ] Logs transactions chiffrés

#### Données Personnelles
- [ ] RGPD : Export/suppression données
- [ ] Chiffrement AES-256 (téléphone, email)
- [ ] Pas de logs sensibles (Sentry)

---

## 🎤 Pitch Deck

### **Slide 1 : Problème**
**3 douleurs majeures**
1. **Diaspora** : "Je veux offrir un cadeau à ma mère à Dakar, mais c'est compliqué"
2. **Boutiques** : "J'ai 20 clients/jour, je pourrais en avoir 200 avec le digital"
3. **Clients locaux** : "Je ne sais pas où trouver ce produit près de chez moi"

### **Slide 2 : Solution**
**AfriMarket = Jumia + Uber Eats pour l'Afrique de l'Ouest**
- Marketplace mobile-first
- Géolocalisation native ("Près de moi")
- Paiement sécurisé (Escrow + Mobile Money)
- QR Code retrait (boutique ou tiers)

### **Slide 3 : Marché**
**Taille du marché**
- E-commerce Afrique : $29B (2024) → $75B (2030)
- Sénégal : 17M habitants, 70% <35 ans, 120% pénétration mobile
- Mali : 21M habitants, diaspora 3M (France, USA)
- Diaspora : 500K Sénégalais/Maliens France, €2B envois/an

**Opportunité**
- Jumia : Grandes villes, produits importés, livraison lente
- **AfriMarket** : Boutiques quartier, produits locaux, retrait immédiat

### **Slide 4 : Produit**
**Démo 30s** (vidéo/screenshots)
1. Onboarding pays (Sénégal)
2. Feed produits "Près de moi" (rayon 5km)
3. Fiche produit → Ajout panier
4. Paiement Orange Money
5. QR Code retrait boutique

### **Slide 5 : Modèle Économique**
**3 sources de revenus**
1. **Commission** : 5-10% par vente (70% revenus)
2. **Abonnements** : 5K-50K FCFA/mois (20% revenus)
3. **Boost produits** : 500-2K FCFA/jour (10% revenus)

**Unit Economics**
- AOV : 25K FCFA
- Commission : 7% = 1,750 FCFA
- CAC : 500 FCFA (organique)
- LTV : 50K FCFA (24 mois)
- **LTV/CAC : 100x**

### **Slide 6 : Go-to-Market**
**Phase 1 (M1-3)** : Seed
- 50 boutiques pilotes (Dakar/Bamako)
- 500 clients early adopters
- GMV : 5M FCFA/mois

**Phase 2 (M4-6)** : Growth
- 200 boutiques
- 3K clients
- GMV : 30M FCFA/mois

**Phase 3 (M7-12)** : Scale
- 1,000 boutiques
- 20K clients
- GMV : 200M FCFA/mois

### **Slide 7 : Traction**
**MVP Déployé** (cette version)
- ✅ Onboarding multi-pays
- ✅ Catalogue + filtres
- ✅ Panier + profils
- 🔨 Géolocalisation (M1)
- 🔨 Paiements (M2)
- 🔨 QR Code (M2)

**Pilotes Prévus**
- 10 boutiques Marché Sandaga (Dakar)
- 5 boutiques Grand Marché (Bamako)
- 100 clients testeurs (friends & family)

### **Slide 8 : Concurrence**
| | AfriMarket | Jumia | Glotelho |
|---|-----------|-------|----------|
| **Géolocalisation** | ✅ Native | ❌ | ❌ |
| **Boutiques quartier** | ✅ | ❌ | ✅ |
| **QR Code retrait** | ✅ | ❌ | ❌ |
| **Diaspora** | ✅ | ❌ | ❌ |
| **Mobile Money** | ✅ | ✅ | ✅ |

**Avantage compétitif** : Seule plateforme géolocalisée + diaspora

### **Slide 9 : Équipe**
**Fondateurs** (à compléter)
- CEO : Expert e-commerce Afrique
- CTO : Ex-Jumia, 10 ans mobile
- CMO : Growth hacker diaspora

**Advisors**
- Ex-VP Jumia Sénégal
- Fondateur Wave (fintech)

### **Slide 10 : Besoins Financiers**
**Levée Seed : $500K**

**Allocation**
- Tech (40%) : Backend, géoloc, paiements - $200K
- Marketing (30%) : Acquisition boutiques/clients - $150K
- Ops (20%) : Équipe (3 devs, 2 bizdev) - $100K
- Légal/Admin (10%) : Licences, comptabilité - $50K

**Milestones 12 mois**
- 1,000 boutiques
- 20K clients
- 200M FCFA GMV
- Break-even opérationnel

---

## 📝 Notes Finales

### **Risques & Mitigation**

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Adoption lente boutiques | Élevé | Moyen | Onboarding assisté, 3 mois gratuits |
| Fraude paiements | Élevé | Faible | Escrow, KYC, 3D Secure |
| Concurrence Jumia | Moyen | Élevé | Focus géoloc + diaspora (niche) |
| Réglementation | Moyen | Faible | Conformité RGPD, licences e-commerce |
| Instabilité réseau | Faible | Élevé | Mode offline, cache, retry logic |

### **Prochaines Étapes**

**Semaine 1-2**
- [ ] Finaliser backend API (Node.js + PostgreSQL)
- [ ] Intégrer géolocalisation (PostGIS + Mapbox)
- [ ] Tests utilisateurs (10 boutiques pilotes)

**Semaine 3-4**
- [ ] Intégrer paiements (Orange Money + Wave)
- [ ] Implémenter QR Code (génération + scan)
- [ ] Déployer MVP production (App Store + Google Play)

**Mois 2-3**
- [ ] Recruter 50 boutiques (Dakar/Bamako)
- [ ] Campagne marketing (Facebook/Instagram)
- [ ] Itérer sur feedback utilisateurs

---

**Document créé le** : 2025-01-03  
**Version** : 1.0  
**Auteur** : Rork AI Assistant
