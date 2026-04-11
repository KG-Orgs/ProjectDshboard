import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Card, Text, FAB } from 'react-native-paper';
import { useAuthStore } from '@contractor/shared';

export default function DashboardScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.greeting}>
            Welcome, {user?.name || 'User'}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Your active projects and tasks
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="headlineSmall">5</Text>
              <Text variant="bodySmall">Active Projects</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="headlineSmall">12</Text>
              <Text variant="bodySmall">Pending Tasks</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Projects
          </Text>
          {/* Project list would go here */}
        </View>

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </ScrollView>

      <FAB
        icon="plus"
        label="New Project"
        style={styles.fab}
        onPress={() => navigation.navigate('Projects')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  logoutButton: {
    margin: 20,
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
