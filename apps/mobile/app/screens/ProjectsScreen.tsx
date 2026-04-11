import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Card, Text, Button, FAB } from 'react-native-paper';

export default function ProjectsScreen({ navigation }) {
  const [projects, setProjects] = React.useState([
    { id: '1', name: 'Building A', status: 'Active', progress: 65 },
    { id: '2', name: 'Building B', status: 'Active', progress: 45 },
    { id: '3', name: 'Building C', status: 'Planning', progress: 20 },
  ]);

  const renderProjectCard = ({ item }) => (
    <Card style={styles.projectCard}>
      <Card.Content>
        <Text variant="titleMedium">{item.name}</Text>
        <Text variant="bodySmall" style={styles.status}>
          {item.status}
        </Text>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${item.progress}%` },
            ]}
          />
        </View>
        <Text variant="bodySmall" style={styles.progressText}>
          {item.progress}% Complete
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button
          onPress={() => navigation.navigate('ProjectDetail', { id: item.id })}
        >
          View
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
      <FAB
        icon="plus"
        label="New Project"
        style={styles.fab}
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  projectCard: {
    marginHorizontal: 0,
  },
  status: {
    marginTop: 4,
    marginBottom: 12,
    color: '#07a41e',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#07a41e',
  },
  progressText: {
    marginTop: 8,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
