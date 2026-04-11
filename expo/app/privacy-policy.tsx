import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Politique de confidentialité', headerShown: true }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Dernière mise à jour : Avril 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          AgriLien (« nous », « notre ») est une application mobile dédiée à la mise en relation
          des producteurs agricoles et des acheteurs au Sénégal et au Mali. La protection de vos
          données personnelles est une priorité. Cette politique explique quelles données nous
          collectons, pourquoi et comment nous les utilisons.
        </Text>

        <Text style={styles.sectionTitle}>2. Données collectées</Text>
        <Text style={styles.paragraph}>
          Nous collectons les données suivantes lors de votre inscription et utilisation de l'application :
        </Text>
        <Text style={styles.listItem}>• Nom, prénom et pseudo</Text>
        <Text style={styles.listItem}>• Adresse email</Text>
        <Text style={styles.listItem}>• Numéro de téléphone</Text>
        <Text style={styles.listItem}>• Ville et pays de résidence</Text>
        <Text style={styles.listItem}>• Rôle (producteur ou acheteur)</Text>
        <Text style={styles.listItem}>• Photos de profil et de boutique (optionnel)</Text>
        <Text style={styles.listItem}>• Informations sur l'exploitation agricole (pour les producteurs)</Text>
        <Text style={styles.listItem}>• Messages échangés sur la plateforme</Text>
        <Text style={styles.listItem}>• Données de localisation (avec votre autorisation)</Text>

        <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
        <Text style={styles.paragraph}>Vos données sont utilisées pour :</Text>
        <Text style={styles.listItem}>• Créer et gérer votre compte utilisateur</Text>
        <Text style={styles.listItem}>• Faciliter la mise en relation entre producteurs et acheteurs</Text>
        <Text style={styles.listItem}>• Afficher les produits et boutiques à proximité</Text>
        <Text style={styles.listItem}>• Permettre la messagerie entre utilisateurs</Text>
        <Text style={styles.listItem}>• Envoyer des notifications relatives à vos commandes</Text>
        <Text style={styles.listItem}>• Améliorer nos services et l'expérience utilisateur</Text>

        <Text style={styles.sectionTitle}>4. Partage des données</Text>
        <Text style={styles.paragraph}>
          Nous ne vendons jamais vos données personnelles. Vos informations de profil public
          (nom, ville, produits) sont visibles par les autres utilisateurs de la plateforme.
          Les messages privés ne sont accessibles qu'aux participants de la conversation.
        </Text>

        <Text style={styles.sectionTitle}>5. Stockage et sécurité</Text>
        <Text style={styles.paragraph}>
          Vos données sont stockées de manière sécurisée sur des serveurs protégés. Nous utilisons
          le chiffrement pour protéger vos informations sensibles, notamment vos mots de passe.
          L'accès aux données est limité au personnel autorisé.
        </Text>

        <Text style={styles.sectionTitle}>6. Vos droits</Text>
        <Text style={styles.paragraph}>Conformément à la réglementation, vous disposez des droits suivants :</Text>
        <Text style={styles.listItem}>• Droit d'accès à vos données personnelles</Text>
        <Text style={styles.listItem}>• Droit de rectification de vos données</Text>
        <Text style={styles.listItem}>• Droit de suppression de votre compte et données</Text>
        <Text style={styles.listItem}>• Droit de portabilité de vos données</Text>
        <Text style={styles.listItem}>• Droit d'opposition au traitement de vos données</Text>
        <Text style={styles.paragraph}>
          Pour exercer ces droits, vous pouvez supprimer votre compte depuis l'application
          ou nous contacter à l'adresse : contact@agrilien.sn
        </Text>

        <Text style={styles.sectionTitle}>7. Cookies et traceurs</Text>
        <Text style={styles.paragraph}>
          L'application n'utilise pas de cookies. Nous pouvons utiliser des identifiants
          techniques anonymes pour améliorer les performances de l'application.
        </Text>

        <Text style={styles.sectionTitle}>8. Modifications</Text>
        <Text style={styles.paragraph}>
          Nous nous réservons le droit de modifier cette politique de confidentialité.
          En cas de modification importante, vous serez informé via l'application.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question relative à la protection de vos données, contactez-nous :
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
