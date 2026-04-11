import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Conditions d'utilisation", headerShown: true }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Dernière mise à jour : Avril 2026</Text>

        <Text style={styles.sectionTitle}>1. Objet</Text>
        <Text style={styles.paragraph}>
          Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation
          de l'application mobile AgriLien, destinée à connecter les producteurs agricoles
          et les acheteurs au Sénégal et au Mali.
        </Text>

        <Text style={styles.sectionTitle}>2. Inscription</Text>
        <Text style={styles.paragraph}>
          L'utilisation d'AgriLien nécessite la création d'un compte. Vous devez fournir des
          informations exactes et à jour. Vous êtes responsable de la confidentialité de vos
          identifiants de connexion. Toute activité réalisée depuis votre compte est sous
          votre responsabilité.
        </Text>

        <Text style={styles.sectionTitle}>3. Services proposés</Text>
        <Text style={styles.paragraph}>AgriLien propose les services suivants :</Text>
        <Text style={styles.listItem}>• Publication et consultation de produits agricoles</Text>
        <Text style={styles.listItem}>• Mise en relation entre producteurs et acheteurs</Text>
        <Text style={styles.listItem}>• Messagerie intégrée entre utilisateurs</Text>
        <Text style={styles.listItem}>• Gestion de commandes et négociations</Text>
        <Text style={styles.listItem}>• Localisation de points de collecte</Text>
        <Text style={styles.listItem}>• Avis et évaluations des producteurs</Text>

        <Text style={styles.sectionTitle}>4. Obligations des utilisateurs</Text>
        <Text style={styles.paragraph}>En utilisant AgriLien, vous vous engagez à :</Text>
        <Text style={styles.listItem}>• Fournir des informations véridiques sur vos produits</Text>
        <Text style={styles.listItem}>• Respecter les autres utilisateurs dans vos échanges</Text>
        <Text style={styles.listItem}>• Ne pas publier de contenu illégal, offensant ou trompeur</Text>
        <Text style={styles.listItem}>• Ne pas utiliser l'application à des fins frauduleuses</Text>
        <Text style={styles.listItem}>• Respecter les lois en vigueur au Sénégal et au Mali</Text>

        <Text style={styles.sectionTitle}>5. Contenu utilisateur</Text>
        <Text style={styles.paragraph}>
          Vous êtes propriétaire du contenu que vous publiez (photos, descriptions, avis).
          En publiant du contenu sur AgriLien, vous nous accordez une licence non exclusive
          pour afficher ce contenu dans le cadre du fonctionnement de l'application.
          Nous nous réservons le droit de supprimer tout contenu inapproprié.
        </Text>

        <Text style={styles.sectionTitle}>6. Transactions</Text>
        <Text style={styles.paragraph}>
          AgriLien facilite la mise en relation entre producteurs et acheteurs.
          Les transactions financières sont effectuées directement entre les parties.
          AgriLien ne peut être tenu responsable des litiges commerciaux entre utilisateurs.
        </Text>

        <Text style={styles.sectionTitle}>7. Responsabilité</Text>
        <Text style={styles.paragraph}>
          AgriLien s'efforce de maintenir l'application disponible et fonctionnelle.
          Nous ne garantissons pas l'absence d'interruptions ou d'erreurs.
          Nous ne sommes pas responsables de la qualité des produits vendus via la plateforme
          ni des accords conclus entre utilisateurs.
        </Text>

        <Text style={styles.sectionTitle}>8. Suspension et résiliation</Text>
        <Text style={styles.paragraph}>
          Nous nous réservons le droit de suspendre ou supprimer tout compte en cas de
          violation des présentes CGU, d'activité frauduleuse ou de comportement nuisible
          envers les autres utilisateurs.
        </Text>

        <Text style={styles.sectionTitle}>9. Propriété intellectuelle</Text>
        <Text style={styles.paragraph}>
          L'application AgriLien, son design, son code et son contenu éditorial sont protégés
          par le droit de la propriété intellectuelle. Toute reproduction ou utilisation non
          autorisée est interdite.
        </Text>

        <Text style={styles.sectionTitle}>10. Modification des CGU</Text>
        <Text style={styles.paragraph}>
          Nous pouvons modifier ces conditions à tout moment. Les modifications prennent
          effet dès leur publication dans l'application. L'utilisation continue de
          l'application vaut acceptation des nouvelles conditions.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question concernant ces conditions, contactez-nous :
        </Text>
        <Text style={styles.listItem}>Email : contact@agrilien.sn</Text>
        <Text style={styles.listItem}>Application : AgriLien</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 26,
    paddingLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});
